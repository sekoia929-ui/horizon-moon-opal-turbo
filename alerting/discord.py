"""Discord webhook alerts."""

from __future__ import annotations

import os

import requests


def send(text: str, username: str = "SENTRA") -> bool:
    url = os.getenv("DISCORD_WEBHOOK_URL")
    if not url:
        return False
    res = requests.post(
        url,
        json={"username": username, "content": text},
        timeout=15,
    )
    return res.ok
