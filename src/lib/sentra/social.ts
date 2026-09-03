import { ASSET_MAP, ASSETS } from "./assets";
import { classifyText, weightByReach } from "./sentiment";
import type { AssetId, AssetQuote, SocialPost } from "./types";

type NewsItem = {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  published: number;
  categories: string;
};

const DESKS = [
  { author: "Meridian Desk", handle: "meridian_desk", reach: 182_000 },
  { author: "Northslope", handle: "northslope", reach: 96_400 },
  { author: "Flow Notes", handle: "flownotes", reach: 74_200 },
  { author: "Rangebound", handle: "rangebound", reach: 41_800 },
  { author: "Onchain Pulse", handle: "onchainpulse", reach: 128_500 },
  { author: "Desk Alpha", handle: "desk_alpha", reach: 63_000 },
] as const;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickAssetFromText(text: string): AssetId | null {
  const lower = text.toLowerCase();
  for (const asset of ASSETS) {
    if (asset.tags.some((tag) => lower.includes(tag))) return asset.id;
  }
  return null;
}

export function postsFromNews(news: NewsItem[], now: number): SocialPost[] {
  const posts: SocialPost[] = [];
  for (const item of news) {
    const hay = `${item.title} ${item.body} ${item.categories}`;
    const asset = pickAssetFromText(hay) ?? "btc";
    const { score: raw, label } = classifyText(`${item.title}. ${item.body}`);
    const reach =
      40_000 +
      Math.min(item.source.length * 3200, 80_000) +
      (raw !== 0 ? 12_000 : 0);
    const weighted = weightByReach(raw, reach, 120);
    posts.push({
      id: `news-${item.id}`,
      asset,
      author: item.source || "Wire",
      handle: (item.source || "wire").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      body: item.title.trim(),
      score: weighted,
      label,
      reach,
      source: "news",
      ts: new Date(item.published || now).toISOString(),
      url: item.url || undefined,
    });
  }
  return posts;
}

function templatePost(
  quote: AssetQuote,
  fng: number | null,
  surge: number,
  rng: () => number,
  minute: number,
  slot: number,
): SocialPost {
  const meta = ASSET_MAP[quote.id];
  const desk = DESKS[Math.floor(rng() * DESKS.length)] ?? DESKS[0];
  const chg = quote.change24h;
  const chg1h = quote.change1h ?? chg / 24;
  const px = quote.price;
  const abs = Math.abs(chg);
  const dir = chg >= 0 ? "bid" : "offer";

  const lines: string[] = [];
  if (Math.abs(chg1h) >= 1.2) {
    lines.push(
      `${meta.symbol} printed ${chg1h >= 0 ? "+" : ""}${chg1h.toFixed(2)}% in the last hour. Tape is leaning ${dir} — ${px.toFixed(px >= 100 ? 0 : 2)} is the number everyone is defending.`,
    );
  }
  if (abs >= 4) {
    lines.push(
      `${meta.symbol} ${chg >= 0 ? "expanded" : "unwound"} ${abs.toFixed(1)}% on the day. This is a positioning move, not a headline spike.`,
    );
  }
  if (surge >= 2.2) {
    lines.push(
      `Voice volume on ${meta.symbol} is ${surge.toFixed(1)}× the rolling baseline. When the crowd shows up this fast, the next 15 minutes usually decide the range.`,
    );
  }
  if (fng != null && (fng <= 25 || fng >= 75)) {
    lines.push(
      `Fear & greed sitting at ${fng}. Historically ${meta.symbol} stops listening to the crowd from here — fade the extreme or wait for the flip.`,
    );
  }
  if (quote.high24h && quote.low24h) {
    const range = quote.high24h - quote.low24h;
    const loc = range > 0 ? (px - quote.low24h) / range : 0.5;
    if (loc > 0.85) {
      lines.push(
        `${meta.symbol} hugging session highs. Either this is a grind-through or a textbook fade. Book is not neutral.`,
      );
    } else if (loc < 0.15) {
      lines.push(
        `${meta.symbol} pressed into session lows. Dip-buyers are visible but thin. Need a reclaim before calling a base.`,
      );
    }
  }
  lines.push(
    `Watching ${meta.symbol} at ${px >= 100 ? px.toFixed(0) : px.toFixed(4)}. 24h ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%. No thesis, just the tape.`,
  );

  const body = lines[Math.floor(rng() * lines.length)] ?? lines[0] ?? "";
  const { score: raw, label } = classifyText(body);
  const reach = Math.round(desk.reach * (0.72 + rng() * 0.5));
  const score = weightByReach(raw, reach, Math.round(80 + rng() * 900));
  const ts = new Date(minute * 60_000 - slot * 7 * 60_000).toISOString();

  return {
    id: `soc-${quote.id}-${minute}-${slot}`,
    asset: quote.id,
    author: desk.author,
    handle: desk.handle,
    body,
    score,
    label,
    reach,
    source: "social",
    ts,
  };
}

export function derivedSocial(
  quotes: AssetQuote[],
  selected: AssetId,
  fng: number | null,
  surge: number,
  now: number,
): SocialPost[] {
  const minute = Math.floor(now / 60_000);
  const seed = minute * 17 + selected.length * 13;
  const rng = mulberry32(seed);
  const focus = quotes.find((q) => q.id === selected);
  const others = quotes.filter((q) => q.id !== selected);
  const posts: SocialPost[] = [];
  if (focus) {
    for (let i = 0; i < 4; i += 1) {
      posts.push(templatePost(focus, fng, surge, rng, minute, i));
    }
  }
  for (let i = 0; i < 2; i += 1) {
    const q = others[Math.floor(rng() * others.length)];
    if (q) posts.push(templatePost(q, fng, surge * 0.6, rng, minute, i + 4));
  }
  return posts;
}

export type { NewsItem };
