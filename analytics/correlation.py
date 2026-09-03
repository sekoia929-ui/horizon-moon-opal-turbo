"""Moving-average sentiment and lead-lag correlation vs price."""

from __future__ import annotations

import math
from statistics import mean


def moving_average(values: list[float], window: int) -> float:
    if not values:
        return 0.0
    slice_ = values[-window:] if window > 0 else values
    return float(mean(slice_))


def pearson(xs: list[float], ys: list[float]) -> float:
    n = min(len(xs), len(ys))
    if n < 4:
        return 0.0
    xs, ys = xs[:n], ys[:n]
    mx, my = mean(xs), mean(ys)
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    vx = sum((x - mx) ** 2 for x in xs)
    vy = sum((y - my) ** 2 for y in ys)
    den = math.sqrt(vx * vy)
    if den < 1e-12:
        return 0.0
    return max(-1.0, min(1.0, cov / den))


def returns(prices: list[float]) -> list[float]:
    out = []
    for prev, cur in zip(prices, prices[1:]):
        out.append(0.0 if prev <= 0 else (cur - prev) / prev)
    return out


def lead_lag(prices: list[float], sentiment: list[float], bar_minutes: int = 15) -> dict:
    r_price = returns(prices)
    r_sent = sentiment[1 : 1 + len(r_price)]
    n = min(len(r_price), len(r_sent))
    a, b = r_price[:n], r_sent[:n]
    best_lag, best_corr = 0, pearson(a, b)
    max_lag = min(8, n // 5)
    for lag in range(-max_lag, max_lag + 1):
        if lag == 0:
            continue
        if lag > 0:
            xs, ys = b[: n - lag], a[lag:]
        else:
            k = -lag
            xs, ys = b[k:], a[: n - k]
        c = pearson(xs, ys)
        if abs(c) > abs(best_corr):
            best_corr, best_lag = c, lag
    return {
        "pearson": best_corr,
        "lag_minutes": best_lag * bar_minutes,
    }
