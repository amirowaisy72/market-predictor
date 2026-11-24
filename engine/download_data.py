"""Download historical market data from Binance Vision (data.binance.vision).

Downloads, for every coin in config.yaml:
  - Spot 5m klines        -> engine/data/spot_klines/{NAME}.parquet
  - Futures (UM) 5m klines -> engine/data/futures_klines/{NAME}.parquet
  - Funding rate           -> engine/data/funding/{NAME}.parquet
  - Futures metrics (daily files only) -> engine/data/metrics/{NAME}.parquet

Monthly zip files are used for full past months, daily zip files for the
current month. Raw zips are cached in engine/data/raw/ and are skipped on
re-runs, so the script can be stopped and restarted safely. Downloads run
in parallel, 16 files at a time (ThreadPoolExecutor).

Usage (Windows):
    venv\\Scripts\\python engine\\download_data.py              # everything
    venv\\Scripts\\python engine\\download_data.py --test       # BTC+PEPE, last 2 months
    venv\\Scripts\\python engine\\download_data.py --coins BTC,ETH
"""

from __future__ import annotations

import argparse
import io
import sys
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from pathlib import Path

import httpx
import pandas as pd
import yaml
from tqdm import tqdm

BASE_URL = "https://data.binance.vision"
MAX_WORKERS = 16  # files downloaded in parallel
ROOT = Path(__file__).resolve().parent.parent
ENGINE_DIR = Path(__file__).resolve().parent
DATA_DIR = ENGINE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"

KLINE_COLUMNS = [
    "open_time", "open", "high", "low", "close", "volume", "close_time",
    "quote_volume", "count", "taker_buy_volume", "taker_buy_quote_volume",
    "ignore",
]
FUNDING_COLUMNS = ["funding_time", "funding_interval_hours", "funding_rate"]


def load_config() -> dict:
    with open(ROOT / "config.yaml", "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def month_iter(start: date, end: date):
    """Yield (year, month) tuples from start's month to end's month."""
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        yield y, m
        m += 1
        if m > 12:
            y, m = y + 1, 1


def day_iter(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def download(url: str, dest: Path, client: httpx.Client) -> bool:
    """Download url to dest. Skip if it already exists. Retry 3 times.

    Returns True if a usable file is on disk, False if not available (404 etc.).
    """
    if dest.exists() and dest.stat().st_size > 0:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(3):
        try:
            resp = client.get(url, follow_redirects=True, timeout=60.0)
            if resp.status_code == 404:
                return False  # not listed yet / no data for that period
            resp.raise_for_status()
            dest.write_bytes(resp.content)
            return True
        except Exception:
            if attempt == 2:
                return False
            time.sleep(2 * (attempt + 1))
    return False


def read_zip_csv(path: Path, default_columns: list[str] | None) -> pd.DataFrame | None:
    """Read the (single) CSV inside a Binance Vision zip.

    Some CSVs have a header row, some don't -- detect and handle both.
    """
    try:
        with zipfile.ZipFile(path) as zf:
            names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
            if not names:
                return None
            raw = zf.read(names[0])
    except Exception:
        return None
    if not raw.strip():
        return None
    first_line = raw.split(b"\n", 1)[0].decode("utf-8", errors="replace")
    first_field = first_line.split(",", 1)[0].strip().strip('"')
    has_header = not first_field.lstrip("-").replace(".", "", 1).isdigit()
    try:
        if has_header:
            df = pd.read_csv(io.BytesIO(raw))
            df.columns = [str(c).strip() for c in df.columns]
        elif default_columns:
            df = pd.read_csv(io.BytesIO(raw), header=None, names=default_columns)
        else:
            df = pd.read_csv(io.BytesIO(raw), header=None)
            df.columns = [f"col_{i}" for i in range(len(df.columns))]
    except Exception:
        return None
    return df if not df.empty else None


def convert_timestamps(series: pd.Series) -> pd.Series:
    """Convert Binance epoch timestamps to UTC datetimes.

    Spot klines are in milliseconds before 2025 and microseconds from 2025
    onward. Rule: a value > 1e14 is microseconds, otherwise milliseconds.
    """
    values = pd.to_numeric(series, errors="coerce")
    out = pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns, UTC]")
    micros = values > 1e14
    millis = values.notna() & ~micros
    if micros.any():
        out.loc[micros] = pd.to_datetime(values[micros], unit="us", utc=True)
    if millis.any():
        out.loc[millis] = pd.to_datetime(values[millis], unit="ms", utc=True)
    return out


def normalise_klines(df: pd.DataFrame) -> pd.DataFrame:
    # Header variants use the same names; rename a few known alternatives.
    rename = {"open_time": "open_time", "close_time": "close_time"}
    df = df.rename(columns={c: rename.get(c, c) for c in df.columns})
    for col in ("open_time", "close_time"):
        if col in df.columns:
            df[col] = convert_timestamps(df[col])
    return df


def normalise_funding(df: pd.DataFrame) -> pd.DataFrame:
    rename = {
        "calc_time": "funding_time",
        "funding_time": "funding_time",
        "fundingTime": "funding_time",
        "funding_interval_hours": "funding_interval_hours",
        "fundingIntervalHours": "funding_interval_hours",
        "funding_rate": "funding_rate",
        "last_funding_rate": "funding_rate",
        "fundingRate": "funding_rate",
    }
    df = df.rename(columns={c: rename.get(c, c) for c in df.columns})
    if "funding_time" in df.columns:
        df["funding_time"] = convert_timestamps(df["funding_time"])
    return df


def normalise_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if "create_time" in df.columns:
        df["create_time"] = pd.to_datetime(df["create_time"], utc=True, errors="coerce")
    return df


def build_tasks(coin: dict, start: date, today: date) -> list[dict]:
    """Build the list of files to fetch for one coin."""
    name, spot, fut = coin["name"], coin["spot"], coin["futures"]
    tasks: list[dict] = []
    current_month_start = today.replace(day=1)
    last_full_month_end = current_month_start - timedelta(days=1)

    past_months = [
        (y, m) for (y, m) in month_iter(start, last_full_month_end)
        if date(y, m, 1) >= start.replace(day=1)
    ] if start < current_month_start else []
    current_days = list(day_iter(max(start, current_month_start), today - timedelta(days=1)))

    def add(kind, url, filename):
        tasks.append({"kind": kind, "name": name, "url": url,
                      "raw": RAW_DIR / kind / filename})

    for (y, m) in past_months:
        ym = f"{y:04d}-{m:02d}"
        add("spot_klines",
            f"{BASE_URL}/data/spot/monthly/klines/{spot}/5m/{spot}-5m-{ym}.zip",
            f"{spot}-5m-{ym}.zip")
        add("futures_klines",
            f"{BASE_URL}/data/futures/um/monthly/klines/{fut}/5m/{fut}-5m-{ym}.zip",
            f"{fut}-5m-{ym}.zip")
        add("funding",
            f"{BASE_URL}/data/futures/um/monthly/fundingRate/{fut}/{fut}-fundingRate-{ym}.zip",
            f"{fut}-fundingRate-{ym}.zip")
    for d in current_days:
        ymd = d.strftime("%Y-%m-%d")
        add("spot_klines",
            f"{BASE_URL}/data/spot/daily/klines/{spot}/5m/{spot}-5m-{ymd}.zip",
            f"{spot}-5m-{ymd}.zip")
        add("futures_klines",
            f"{BASE_URL}/data/futures/um/daily/klines/{fut}/5m/{fut}-5m-{ymd}.zip",
            f"{fut}-5m-{ymd}.zip")
        add("funding",
            f"{BASE_URL}/data/futures/um/daily/fundingRate/{fut}/{fut}-fundingRate-{ymd}.zip",
            f"{fut}-fundingRate-{ymd}.zip")
    # Futures metrics: daily files only, for the whole period.
    metrics_start = start
    for d in day_iter(metrics_start, today - timedelta(days=1)):
        ymd = d.strftime("%Y-%m-%d")
        add("metrics",
            f"{BASE_URL}/data/futures/um/daily/metrics/{fut}/{fut}-metrics-{ymd}.zip",
            f"{fut}-metrics-{ymd}.zip")
    return tasks


TIME_COLUMNS = {
    "spot_klines": "open_time",
    "futures_klines": "open_time",
    "funding": "funding_time",
    "metrics": "create_time",
}
DEFAULT_COLUMNS = {
    "spot_klines": KLINE_COLUMNS,
    "futures_klines": KLINE_COLUMNS,
    "funding": FUNDING_COLUMNS,
    "metrics": None,
}
NORMALISERS = {
    "spot_klines": normalise_klines,
    "futures_klines": normalise_klines,
    "funding": normalise_funding,
    "metrics": normalise_metrics,
}
OUT_DIRS = {
    "spot_klines": DATA_DIR / "spot_klines",
    "futures_klines": DATA_DIR / "futures_klines",
    "funding": DATA_DIR / "funding",
    "metrics": DATA_DIR / "metrics",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Download Binance Vision data.")
    parser.add_argument("--test", action="store_true",
                        help="Only BTC and PEPE, only the last 2 months.")
    parser.add_argument("--coins", type=str, default=None,
                        help="Comma-separated coin names, e.g. BTC,ETH")
    args = parser.parse_args()

    config = load_config()
    coins = config["coins"]
    if args.test:
        coins = [c for c in coins if c["name"] in ("BTC", "PEPE")]
    if args.coins:
        wanted = {c.strip().upper() for c in args.coins.split(",") if c.strip()}
        coins = [c for c in coins if c["name"].upper() in wanted]
    if not coins:
        print("No coins selected.")
        return 1

    today = date.today()
    if args.test:
        # First day of the previous month -> last 2 calendar months incl. current.
        first_this_month = today.replace(day=1)
        start = (first_this_month - timedelta(days=1)).replace(day=1)
    else:
        start = today.replace(year=today.year - int(config.get("history_years", 4)))

    print(f"Coins: {', '.join(c['name'] for c in coins)}")
    print(f"Period: {start} to {today - timedelta(days=1)}")

    frames: dict[tuple[str, str], list[pd.DataFrame]] = {}
    all_tasks: list[dict] = []
    for coin in coins:
        all_tasks.extend(build_tasks(coin, start, today))

    # Download the raw zips in parallel, MAX_WORKERS files at a time.
    # download() itself is unchanged: files that already exist are skipped
    # and failed downloads are retried 3 times. httpx.Client is thread-safe,
    # so a single client with a larger connection pool is shared.
    downloaded: list[bool] = [False] * len(all_tasks)
    limits = httpx.Limits(max_connections=MAX_WORKERS * 2,
                          max_keepalive_connections=MAX_WORKERS)
    with httpx.Client(limits=limits) as client:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_idx = {
                executor.submit(download, task["url"], task["raw"], client): i
                for i, task in enumerate(all_tasks)
            }
            for future in tqdm(as_completed(future_to_idx),
                               total=len(all_tasks), desc="Downloading"):
                downloaded[future_to_idx[future]] = future.result()

    # Parse the downloaded zips in the original (sorted) order.
    for task, ok in zip(all_tasks, downloaded):
        if not ok:
            continue
        df = read_zip_csv(task["raw"], DEFAULT_COLUMNS[task["kind"]])
        if df is None:
            continue
        df = NORMALISERS[task["kind"]](df)
        frames.setdefault((task["name"], task["kind"]), []).append(df)

    for (name, kind), parts in sorted(frames.items()):
        df = pd.concat(parts, ignore_index=True)
        time_col = TIME_COLUMNS[kind]
        if time_col in df.columns:
            df = df.dropna(subset=[time_col]).drop_duplicates(subset=[time_col])
            df = df.sort_values(time_col)
        else:
            df = df.drop_duplicates()
        out_dir = OUT_DIRS[kind]
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{name}.parquet"
        df.to_parquet(out_path, index=False)
        print(f"{name:5s} {kind:15s} rows={len(df):>8,} -> {out_path.relative_to(ROOT)}")

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
