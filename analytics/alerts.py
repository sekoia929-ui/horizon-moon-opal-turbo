"""Real-time anomaly triggers."""

from __future__ import annotations


def volume_surge(current: float, baseline: float, threshold: float = 3.0) -> bool:
    if baseline <= 0:
        return False
    return (current / baseline) >= threshold


def sentiment_flip(prev: float, current: float, min_abs: float = 0.12) -> bool:
    return prev * current < 0 and abs(prev) >= min_abs and abs(current) >= min_abs


def evaluate(asset: str, ma15: float, prev_ma15: float, surge: float) -> list[dict]:
    events: list[dict] = []
    if volume_surge(surge, 1.0, 3.0) and surge >= 3:
        events.append(
            {
                "asset": asset,
                "kind": "volume_surge",
                "severity": "critical" if surge >= 4.5 else "warn",
                "message": f"{asset.upper()} sentiment volume is {surge:.1f}× baseline (>300%).",
            }
        )
    if sentiment_flip(prev_ma15, ma15):
        direction = "bearish → bullish" if ma15 > 0 else "bullish → bearish"
        events.append(
            {
                "asset": asset,
                "kind": "sentiment_flip",
                "severity": "warn",
                "message": f"{asset.upper()} 15m sentiment flipped {direction}.",
            }
        )
    return events
