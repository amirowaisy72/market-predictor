"""Check the downloaded data and report coverage / gaps.

For each coin and each data type, prints a table with the first date, last
date, number of rows and the number of missing 5m candles, and saves the
same report to engine/reports/data_check.md.

Gap counting:
  - Kline data (spot / futures, 5m): "Missing 5m candles" is exact --
    expected candles between first and last timestamp minus actual rows.
  - Funding rate: the series is every 8 hours, not 5m, so the 5m column is
    marked n/a and the missing 8h intervals are reported in the notes.
  - Futures metrics: provided as daily files, so the 5m column is marked
    n/a and the number of missing days is reported in the notes.

Usage (Windows):
    venv\\Scripts\\python engine\\check_data.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parent.parent
ENGINE_DIR = Path(__file__).resolve().parent
DATA_DIR = ENGINE_DIR / "data"
REPORT_PATH = ENGINE_DIR / "reports" / "data_check.md"

SERIES = [
    # (label, sub-directory, time column, kind)
    ("spot_klines", "spot_klines", "open_time", "kline"),
    ("futures_klines", "futures_klines", "open_time", "kline"),
    ("funding", "funding", "funding_time", "funding"),
    ("metrics", "metrics", "create_time", "metrics"),
]


def fmt(ts) -> str:
    if ts is None or pd.isna(ts):
        return "-"
    return pd.Timestamp(ts).strftime("%Y-%m-%d %H:%M")


def check_one(path: Path, time_col: str, kind: str) -> dict:
    result = {"first": None, "last": None, "rows": 0, "missing_5m": "n/a",
              "note": ""}
    if not path.exists():
        result["note"] = "file not found (not downloaded yet)"
        return result
    try:
        df = pd.read_parquet(path)
    except Exception as exc:  # unreadable file
        result["note"] = f"could not read parquet: {exc}"
        return result
    result["rows"] = len(df)
    if df.empty or time_col not in df.columns:
        result["note"] = "no rows / no time column"
        return result
    times = pd.to_datetime(df[time_col], utc=True, errors="coerce").dropna().sort_values()
    if times.empty:
        result["note"] = "no valid timestamps"
        return result
    result["first"], result["last"] = times.iloc[0], times.iloc[-1]
    unique = times.nunique()
    if kind == "kline":
        expected = int((result["last"] - result["first"]).total_seconds() // 300) + 1
        result["missing_5m"] = max(expected - unique, 0)
    elif kind == "funding":
        expected = int((result["last"] - result["first"]).total_seconds() // (8 * 3600)) + 1
        missing = max(expected - unique, 0)
        result["note"] = f"8h series: {missing} missing 8h intervals"
    elif kind == "metrics":
        days = pd.date_range(result["first"].normalize(), result["last"].normalize(), freq="D")
        have_days = times.dt.normalize().nunique()
        missing_days = max(len(days) - have_days, 0)
        result["note"] = f"daily files: {missing_days} missing days"
    return result


def main() -> int:
    with open(ROOT / "config.yaml", "r", encoding="utf-8") as fh:
        config = yaml.safe_load(fh)

    rows = []
    for coin in config["coins"]:
        name = coin["name"]
        for label, sub_dir, time_col, kind in SERIES:
            info = check_one(DATA_DIR / sub_dir / f"{name}.parquet", time_col, kind)
            rows.append({"coin": name, "data": label, **info})

    header = (f"{'Coin':<6} {'Data':<15} {'First':<17} {'Last':<17} "
              f"{'Rows':>9}  Missing 5m candles")
    lines = [header, "-" * len(header)]
    for r in rows:
        lines.append(
            f"{r['coin']:<6} {r['data']:<15} {fmt(r['first']):<17} {fmt(r['last']):<17} "
            f"{r['rows']:>9,}  {r['missing_5m']}"
            + (f"   ({r['note']})" if r["note"] else "")
        )
    table_text = "\n".join(lines)
    print(table_text)

    md = ["# Data check", "",
          "| Coin | Data | First | Last | Rows | Missing 5m candles | Notes |",
          "|---|---|---|---|---:|---:|---|"]
    for r in rows:
        md.append(f"| {r['coin']} | {r['data']} | {fmt(r['first'])} | {fmt(r['last'])} "
                  f"| {r['rows']:,} | {r['missing_5m']} | {r['note']} |")
    md += ["",
           "Notes on gap counting: kline series are 5m, so missing 5m candles are",
           "counted exactly. Funding rate is an 8h series and futures metrics are",
           "delivered in daily files, so for those the 5m column is n/a and the",
           "missing intervals at their own frequency are given in the Notes column.",
           ""]
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(md), encoding="utf-8")
    print(f"\nSaved report to {REPORT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
