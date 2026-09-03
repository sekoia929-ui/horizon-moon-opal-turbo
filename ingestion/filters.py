"""Bot, spam, and low-signal filters for X posts."""

from __future__ import annotations

import re
from dataclasses import dataclass

URL_RE = re.compile(r"https?://\S+", re.I)
CASHTAG_RE = re.compile(r"\$[A-Z]{2,6}")
REPEAT_RE = re.compile(r"(.)\1{4,}")


@dataclass(frozen=True)
class Post:
    id: str
    text: str
    author_id: str
    username: str
    followers: int
    retweets: int
    likes: int
    impressions: int | None
    created_at: str
    lang: str | None = None
    is_retweet: bool = False


def is_noise(post: Post, min_followers: int = 150, min_engagement: int = 2) -> bool:
    text = post.text.strip()
    if post.is_retweet:
        return True
    if post.lang and post.lang not in {"en", "und"}:
        return True
    if post.followers < min_followers:
        return True
    if (post.likes + post.retweets) < min_engagement and post.followers < 5_000:
        return True
    if len(text) < 24:
        return True
    if REPEAT_RE.search(text):
        return True
    urls = URL_RE.findall(text)
    if len(urls) >= 3:
        return True
    cashtags = CASHTAG_RE.findall(text.upper())
    if len(set(cashtags)) >= 6:
        return True
    lowered = text.lower()
    spam_hits = ("airdrop", "giveaway", "dm me", "100x", "guaranteed", "nfa dyor pump")
    if sum(1 for s in spam_hits if s in lowered) >= 2:
        return True
    return False


def unique_texts(posts: list[Post]) -> list[Post]:
    seen: set[str] = set()
    out: list[Post] = []
    for post in posts:
        key = URL_RE.sub("", post.text).lower().strip()
        if key in seen:
            continue
        seen.add(key)
        out.append(post)
    return out
