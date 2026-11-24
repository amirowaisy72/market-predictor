# Crypto Market Predictor

A dashboard that shows, for 12 Binance coins, the probability that the price
goes up or down over the next 60 minutes.

> Part 1 (this repo): project structure, historical data downloader and data
> check, and the dashboard UI with mock data. The prediction engine and the
> live API will be added later.

## Setup on Windows

1. Get the code:
   ```
   git pull
   ```
   (or `git clone <repo-url>` the first time)
2. Install [Node.js LTS](https://nodejs.org/) if it is not installed yet
   (check with `node --version`).
3. Create the Python virtual environment:
   ```
   python -m venv venv
   ```
4. Install the Python packages:
   ```
   venv\Scripts\pip install -r requirements.txt
   ```
5. Install the dashboard packages:
   ```
   cd dashboard && npm install
   cd ..
   ```
6. Download the historical data (this takes a long time for the full
   4 years; use `--test` for a quick 2-month check with BTC and PEPE only):
   ```
   venv\Scripts\python engine\download_data.py
   venv\Scripts\python engine\download_data.py --test
   ```
7. Check the downloaded data (writes `engine\reports\data_check.md`):
   ```
   venv\Scripts\python engine\check_data.py
   ```
8. Start the dashboard by double-clicking **`start.bat`**
   (or run `cd dashboard && npm run dev` and open http://localhost:3000).

## Layout

```
config.yaml            Coins, exchange and prediction settings
engine/
  download_data.py     Downloads data from data.binance.vision
  check_data.py        Coverage / gap report for the downloaded data
  data/                Downloaded parquet files (not in git)
  models/              Trained models (later part, not in git)
  reports/             Data check report
dashboard/             Next.js dashboard (mock data for now)
start.bat              Starts the dashboard on Windows
```

Predictions are probabilities, not guarantees.
