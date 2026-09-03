"""CoinGecko REST + Binance REST/WebSocket market adapters."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any

import requests

BINANCE_HOSTS = (
    "https://api.binance.us",
    "https://api.binance.com",
)
GECKO = "https://api.coingecko.com/api/v3"

SYMBOLS = {
    "btc": "BTCUSDT",
    "eth": "ETHUSDT",
    "sol": "SOLUSDT",
    "doge": "DOGEUSDT",
    "xrp": "XRPUSDT",
    "link": "LINKUSDT",
}

GECKO_IDS = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "sol": "solana",
    "doge": "dogecoin",
    "xrp": "ripple",
    "link": "chainlink",
}


class MarketClient:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["user-agent"] = "SENTRA/1.0"

    def _binance(self, path: str, params: dict | None = None) -> Any:
        last_error: Exception | None = None
        for host in BINANCE_HOSTS:
            try:
                res = self.session.get(f"{host}{path}", params=params, timeout=10)
                res.raise_for_status()
                return res.json()
            except Exception as exc:  # noqa: BLE001
                last_error = exc
        raise last_error or RuntimeError("binance unavailable")

    def tickers(self) -> list[dict[str, Any]]:
        symbols = json.dumps(list(SYMBOLS.values()))
        payload = self._binance("/api/v3/ticker/24hr", {"symbols": symbols})
        inv = {v: k for k, v in SYMBOLS.items()}
        out = []
        for row in payload:
            asset = inv.get(row["symbol"])
            if not asset:
                continue
            out.append(
                {
                    "asset": asset,
                    "price": float(row["lastPrice"]),
                    "change_24h": float(row["priceChangePercent"]),
                    "volume": float(row["quoteVolume"]),
                    "high": float(row["highPrice"]),
                    "low": float(row["lowPrice"]),
                }
            )
        return out

    def klines(self, asset: str, interval: str = "5m", limit: int = 288) -> list[dict]:
        symbol = SYMBOLS[asset]
        rows = self._binance(
            "/api/v3/klines",
            {"symbol": symbol, "interval": interval, "limit": limit},
        )
        return [
            {
                "t": row[0],
                "open": float(row[1]),
                "high": float(row[2]),
                "low": float(row[3]),
                "close": float(row[4]),
                "volume": float(row[5]),
            }
            for row in rows
        ]

    def gecko_markets(self) -> list[dict[str, Any]]:
        ids = ",".join(GECKO_IDS.values())
        res = self.session.get(
            f"{GECKO}/coins/markets",
            params={
                "vs_currency": "usd",
                "ids": ids,
                "price_change_percentage": "1h,24h",
            },
            timeout=10,
        )
        res.raise_for_status()
        return res.json()

    def stream_trades(self, asset: str, on_message: Callable[[dict], None]) -> None:
        import websocket

        symbol = SYMBOLS[asset].lower()
        url = f"wss://stream.binance.com:9443/ws/{symbol}@trade"

        def _on_message(_ws, message: str) -> None:
            on_message(json.loads(message))

        ws = websocket.WebSocketApp(url, on_message=_on_message)
        ws.run_forever()
