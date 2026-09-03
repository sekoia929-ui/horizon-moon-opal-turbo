from alerting.discord import send as send_discord
from alerting.telegram import send as send_telegram


def fanout(text: str) -> dict[str, bool]:
    return {
        "telegram": send_telegram(text),
        "discord": send_discord(text),
    }
