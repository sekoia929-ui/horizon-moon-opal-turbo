# SENTRA

Live crypto sentiment × market impact terminal. The web desk scores market voice (news wires + reach-weighted notes, native X when keys are present), plots it against live prices, and fires on volume surges and 15-minute sentiment flips.

## What you get

- Interactive dual-axis desk (price vs weighted sentiment) for BTC, ETH, SOL, DOGE, XRP, LINK
- 15-minute / 1-hour / 24-hour moving averages, Pearson r, and lead-lag
- Influential posts ranked by `|score| × log(reach)`
- Anomaly alerts when voice volume exceeds 3× baseline or sentiment flips
- Optional Grok re-score on the post stack
- Python data plane: `/ingestion`, `/nlp`, `/analytics`, `/dashboard` plus Telegram/Discord fan-out

## Web terminal (this app)

The live product is the SENTRA desk in this repository. It pulls Binance (fallback CoinGecko) prices, CryptoCompare wires, and Alternative.me Fear & Greed, then runs the lexicon engine in-process. Snapshots land in Postgres when a database is provisioned.

No API keys are required for the desk to run. Native X firehose and FinBERT attach in the Docker worker when configured below.

## Docker data plane

```bash
cp .env.example .env
# fill X_BEARER_TOKEN, Telegram, Discord as needed
docker compose up --build
```

Services:

| Service    | Role                                      |
|------------|-------------------------------------------|
| postgres   | Time-series snapshots and post log        |
| redis      | Latest snapshot cache + previous MA state |
| worker     | Ingest → score → correlate → alert        |
| dashboard  | Streamlit operator view on port 8501      |

The worker searches X recent posts per cashtag when `X_BEARER_TOKEN` is set, classifies with FinBERT (or the lexicon fallback), weights by followers/retweets/impressions, writes 15m/1h/24h aggregates, and fans alerts to Telegram/Discord.

To enable FinBERT inside the worker, set `SENTRA_DISABLE_FINBERT=0` (downloads `ProsusAI/finbert`).

## Layout

```
ingestion/     X API v2 + CoinGecko/Binance REST & WebSocket
nlp/           FinBERT / lexicon classifier + reach weighting
analytics/     moving averages, lead-lag, alert triggers
dashboard/     Streamlit operator view
alerting/      Telegram Bot API + Discord webhooks
src/           SENTRA web terminal (TanStack Start)
```

## Configuration

See `.env.example`. Do not commit a populated `.env`.
