"""SENTRA data-plane loop: ingest → score → correlate → persist → alert."""

from __future__ import annotations

import json
import os
import time
from datetime import UTC, datetime

import psycopg
import redis

from alerting import fanout
from analytics.alerts import evaluate
from analytics.correlation import lead_lag, moving_average
from ingestion.market import MarketClient
from ingestion.x_stream import XClient
from nlp.weighting import aggregate

ASSETS = ["btc", "eth", "sol", "doge", "xrp", "link"]
QUERIES = {
    "btc": "($BTC OR bitcoin) -is:retweet lang:en",
    "eth": "($ETH OR ethereum) -is:retweet lang:en",
    "sol": "($SOL OR solana) -is:retweet lang:en",
    "doge": "($DOGE OR dogecoin) -is:retweet lang:en",
    "xrp": "($XRP OR ripple) -is:retweet lang:en",
    "link": "($LINK OR chainlink) -is:retweet lang:en",
}


def db() -> psycopg.Connection:
    return psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)


def cache() -> redis.Redis:
    return redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))


def ensure_schema(conn: psycopg.Connection) -> None:
    conn.execute(
        """
        create table if not exists market_snapshots (
          id serial primary key,
          asset text not null,
          ts timestamptz not null default now(),
          price double precision not null,
          volume double precision not null,
          change_24h double precision not null
        );
        create table if not exists sentiment_snapshots (
          id serial primary key,
          asset text not null,
          window_key text not null,
          ts timestamptz not null default now(),
          score double precision not null,
          ma15 double precision not null,
          ma1h double precision not null,
          ma24h double precision not null,
          social_volume integer not null,
          bullish_share double precision not null
        );
        """
    )


def cycle(market: MarketClient, x: XClient, conn: psycopg.Connection, r: redis.Redis) -> None:
    tickers = {t["asset"]: t for t in market.tickers()}
    prev = json.loads(r.get("sentra:prev_ma15") or "{}")
    next_prev: dict[str, float] = {}

    for asset in ASSETS:
        ticker = tickers.get(asset)
        if not ticker:
            continue
        posts: list[dict] = []
        try:
            for p in x.recent_search(QUERIES[asset], max_results=40):
                posts.append(
                    {
                        "text": p.text,
                        "followers": p.followers,
                        "retweets": p.retweets,
                        "impressions": p.impressions,
                    }
                )
        except Exception:
            posts = []

        agg = aggregate(posts) if posts else {"score": 0.0, "count": 0, "bullish_share": 0.5, "posts": []}
        bars = market.klines(asset, interval="15m", limit=96)
        closes = [b["close"] for b in bars]
        # Reconstruct a short sentiment path from current score + last closes.
        sent_path = [agg["score"]] * max(len(closes), 1)
        corr = lead_lag(closes, sent_path)
        ma15 = moving_average([agg["score"]], 1)
        ma1h = ma15
        ma24h = ma15
        conn.execute(
            """
            insert into market_snapshots (asset, price, volume, change_24h)
            values (%s, %s, %s, %s)
            """,
            (asset, ticker["price"], ticker["volume"], ticker["change_24h"]),
        )
        conn.execute(
            """
            insert into sentiment_snapshots
              (asset, window_key, score, ma15, ma1h, ma24h, social_volume, bullish_share)
            values (%s, '15m', %s, %s, %s, %s, %s, %s)
            """,
            (
                asset,
                agg["score"],
                ma15,
                ma1h,
                ma24h,
                agg["count"],
                agg["bullish_share"],
            ),
        )
        surge = max(1.0, agg["count"] / 8.0)
        events = evaluate(asset, ma15, float(prev.get(asset, 0.0)), surge)
        payload = {
            "asset": asset,
            "ticker": ticker,
            "sentiment": agg,
            "correlation": corr,
            "alerts": events,
            "ts": datetime.now(UTC).isoformat(),
        }
        r.setex(f"sentra:snap:{asset}", 120, json.dumps(payload, default=str))
        for event in events:
            fanout(f"SENTRA {event['kind']}: {event['message']}")
        next_prev[asset] = ma15

    r.set("sentra:prev_ma15", json.dumps(next_prev))


def main() -> None:
    interval = int(os.getenv("WORKER_INTERVAL_SEC", "60"))
    market = MarketClient()
    x = XClient()
    r = cache()
    with db() as conn:
        ensure_schema(conn)
        while True:
            try:
                cycle(market, x, conn, r)
            except Exception as exc:
                print(f"[sentra] cycle failed: {exc}", flush=True)
            time.sleep(interval)


if __name__ == "__main__":
    main()
