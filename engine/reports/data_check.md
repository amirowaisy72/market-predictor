# Data check

| Coin | Data | First | Last | Rows | Missing 5m candles | Notes |
|---|---|---|---|---:|---:|---|
| BTC | spot_klines | 2026-10-01 00:00 | 2026-11-23 23:55 | 15,552 | 0 |  |
| BTC | futures_klines | 2026-10-01 00:00 | 2026-11-23 23:55 | 15,552 | 0 |  |
| BTC | funding | 2026-10-01 00:00 | 2026-10-31 16:00 | 93 | n/a | 8h series: 0 missing 8h intervals |
| BTC | metrics | 2026-10-01 00:00 | 2026-11-23 23:55 | 15,552 | n/a | daily files: 0 missing days |
| ETH | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| ETH | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| ETH | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| ETH | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| BNB | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| BNB | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| BNB | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| BNB | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| SOL | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| SOL | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| SOL | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| SOL | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| XRP | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| XRP | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| XRP | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| XRP | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| DOGE | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| DOGE | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| DOGE | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| DOGE | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| ADA | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| ADA | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| ADA | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| ADA | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| AVAX | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| AVAX | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| AVAX | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| AVAX | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| LINK | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| LINK | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| LINK | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| LINK | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| LTC | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| LTC | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| LTC | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| LTC | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |
| PEPE | spot_klines | 2026-10-01 00:00 | 2026-11-23 23:55 | 15,552 | 0 |  |
| PEPE | futures_klines | 2026-10-01 00:00 | 2026-11-23 23:55 | 15,552 | 0 |  |
| PEPE | funding | 2026-10-01 00:00 | 2026-10-31 16:00 | 93 | n/a | 8h series: 0 missing 8h intervals |
| PEPE | metrics | 2026-10-01 00:00 | 2026-11-23 23:55 | 15,552 | n/a | daily files: 0 missing days |
| SHIB | spot_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| SHIB | futures_klines | - | - | 0 | n/a | file not found (not downloaded yet) |
| SHIB | funding | - | - | 0 | n/a | file not found (not downloaded yet) |
| SHIB | metrics | - | - | 0 | n/a | file not found (not downloaded yet) |

Notes on gap counting: kline series are 5m, so missing 5m candles are
counted exactly. Funding rate is an 8h series and futures metrics are
delivered in daily files, so for those the 5m column is n/a and the
missing intervals at their own frequency are given in the Notes column.
