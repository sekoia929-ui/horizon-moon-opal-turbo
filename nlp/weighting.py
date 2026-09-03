"""Aggregate reach-weighted sentiment for a cohort of posts."""

from __future__ import annotations

from nlp.sentiment import classify, weight


def aggregate(posts: list[dict]) -> dict:
    weighted: list[float] = []
    labels = {"Bullish": 0, "Bearish": 0, "Neutral": 0}
    for post in posts:
        raw = classify(post["text"])
        w = weight(
            raw["score"],
            int(post.get("followers") or 0),
            int(post.get("retweets") or 0),
            post.get("impressions"),
        )
        post["score"] = w
        post["label"] = raw["label"]
        post["engine"] = raw["engine"]
        weighted.append(w)
        labels[raw["label"]] = labels.get(raw["label"], 0) + 1
    n = max(len(weighted), 1)
    mean = sum(weighted) / n
    return {
        "score": mean,
        "count": len(posts),
        "bullish_share": labels["Bullish"] / n,
        "bearish_share": labels["Bearish"] / n,
        "posts": posts,
    }
