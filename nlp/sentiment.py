"""Fine-grained financial sentiment. Prefers FinBERT, falls back to lexicon."""

from __future__ import annotations

import math
import os
import re
from functools import lru_cache

BULLISH = {
    "moon": 0.9, "breakout": 0.75, "accumulation": 0.55, "buy": 0.45,
    "rally": 0.7, "ath": 0.65, "bullish": 0.85, "inflow": 0.5,
    "support": 0.35, "undervalued": 0.6, "squeeze": 0.55, "pump": 0.4,
}
BEARISH = {
    "dump": 0.85, "crash": 0.9, "sell": 0.45, "short": 0.4, "rug": 0.95,
    "liquidation": 0.75, "breakdown": 0.7, "bearish": 0.85, "outflow": 0.5,
    "hack": 0.8, "capitulation": 0.8, "panic": 0.7, "rejected": 0.5,
}
NEGATIONS = {"not", "no", "never", "don't", "dont", "isn't", "hardly"}
TOKEN_RE = re.compile(r"[a-z0-9$']+")


def lexicon_score(text: str) -> tuple[float, str]:
    tokens = TOKEN_RE.findall(text.lower())
    acc = 0.0
    hits = 0
    for i, tok in enumerate(tokens):
        bare = tok.lstrip("$")
        w = BULLISH.get(bare, 0.0) - BEARISH.get(bare, 0.0)
        if w == 0:
            continue
        prev = tokens[i - 1] if i else ""
        if prev in NEGATIONS:
            w *= -0.85
        acc += w
        hits += 1
    if not hits:
        return 0.0, "Neutral"
    score = max(-1.0, min(1.0, acc / (hits + 0.65)))
    label = "Bullish" if score >= 0.12 else "Bearish" if score <= -0.12 else "Neutral"
    return score, label


@lru_cache(maxsize=1)
def _finbert():
    if os.getenv("SENTRA_DISABLE_FINBERT") == "1":
        return None
    try:
        from transformers import pipeline
        return pipeline(
            "text-classification",
            model=os.getenv("FINBERT_MODEL", "ProsusAI/finbert"),
            top_k=None,
        )
    except Exception:
        return None


def classify(text: str) -> dict:
    pipe = _finbert()
    if pipe is not None:
        raw = pipe(text[:512])
        rows = raw[0] if raw and isinstance(raw[0], list) else raw
        weights = {r["label"].lower(): float(r["score"]) for r in rows}
        pos = weights.get("positive", 0.0)
        neg = weights.get("negative", 0.0)
        score = max(-1.0, min(1.0, pos - neg))
        label = "Bullish" if score >= 0.12 else "Bearish" if score <= -0.12 else "Neutral"
        return {"score": score, "label": label, "engine": "finbert", "probs": weights}
    score, label = lexicon_score(text)
    return {"score": score, "label": label, "engine": "lexicon", "probs": {}}


def weight(score: float, followers: int, retweets: int = 0, impressions: int | None = None) -> float:
    reach = impressions if impressions else followers
    reach_w = math.log10(1 + max(reach, 0)) / 6.0
    eng_w = 1.0 + min(retweets / 800.0, 1.6)
    return max(-1.0, min(1.0, score * (0.35 + reach_w) * eng_w))
