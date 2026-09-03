"""X API v2 ingestion — filtered stream + recent search fallback."""

from __future__ import annotations

import os
from collections.abc import Iterator
from datetime import UTC, datetime

import requests

from ingestion.filters import Post, is_noise, unique_texts

DEFAULT_RULES = [
    {"value": "($BTC OR $ETH OR $SOL OR $DOGE OR $XRP OR $LINK) -is:retweet lang:en", "tag": "cashtags"},
    {"value": "from:whale_alert OR from:lookonchain OR from:cobie", "tag": "desks"},
]


class XClient:
    def __init__(self, bearer_token: str | None = None) -> None:
        self.token = bearer_token or os.getenv("X_BEARER_TOKEN", "")
        self.session = requests.Session()
        if self.token:
            self.session.headers["Authorization"] = f"Bearer {self.token}"

    def _get(self, path: str, params: dict | None = None) -> dict:
        if not self.token:
            raise RuntimeError("X_BEARER_TOKEN is not configured")
        url = f"https://api.twitter.com/2{path}"
        res = self.session.get(url, params=params, timeout=20)
        res.raise_for_status()
        return res.json()

    def recent_search(self, query: str, max_results: int = 50) -> list[Post]:
        data = self._get(
            "/tweets/search/recent",
            {
                "query": query,
                "max_results": max(10, min(max_results, 100)),
                "tweet.fields": "created_at,public_metrics,lang,referenced_tweets",
                "expansions": "author_id",
                "user.fields": "username,public_metrics",
            },
        )
        users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
        posts: list[Post] = []
        for row in data.get("data", []):
            user = users.get(row.get("author_id"), {})
            metrics = row.get("public_metrics", {})
            umetrics = user.get("public_metrics", {})
            refs = row.get("referenced_tweets") or []
            posts.append(
                Post(
                    id=row["id"],
                    text=row.get("text", ""),
                    author_id=row.get("author_id", ""),
                    username=user.get("username", "unknown"),
                    followers=int(umetrics.get("followers_count") or 0),
                    retweets=int(metrics.get("retweet_count") or 0),
                    likes=int(metrics.get("like_count") or 0),
                    impressions=metrics.get("impression_count"),
                    created_at=row.get("created_at") or datetime.now(UTC).isoformat(),
                    lang=row.get("lang"),
                    is_retweet=any(r.get("type") == "retweeted" for r in refs),
                )
            )
        clean = [p for p in unique_texts(posts) if not is_noise(p)]
        return clean

    def filtered_stream(self) -> Iterator[dict]:
        if not self.token:
            raise RuntimeError("X_BEARER_TOKEN is not configured")
        with self.session.get(
            "https://api.twitter.com/2/tweets/search/stream",
            params={
                "tweet.fields": "created_at,public_metrics,lang",
                "expansions": "author_id",
                "user.fields": "username,public_metrics",
            },
            stream=True,
            timeout=90,
        ) as res:
            res.raise_for_status()
            for line in res.iter_lines():
                if line:
                    yield line
