import { getSql } from "@/lib/db";
import { ASSETS, ASSET_MAP, isAssetId } from "./assets";
import { leadLag } from "./correlation";
import {
  classifyText,
  clip,
  mean,
  movingAverage,
  signalFromScore,
  tanh,
} from "./sentiment";
import { derivedSocial, postsFromNews, type NewsItem } from "./social";
import type {
  AlertItem,
  AssetId,
  AssetQuote,
  PriceSource,
  SeriesPoint,
  Snapshot,
  SocialPost,
  WindowKey,
} from "./types";

type Cache = {
  tickersAt: number;
  tickers: AssetQuote[] | null;
  tickerSource: PriceSource;
  klines: Record<string, { at: number; bars: Bar[] }>;
  newsAt: number;
  news: NewsItem[];
  fngAt: number;
  fng: { value: number; classification: string } | null;
};

type Bar = { t: number; close: number; volume: number; high: number; low: number };

const g = globalThis as typeof globalThis & { __sentraCacheV2__?: Cache };

function cache(): Cache {
  g.__sentraCacheV2__ ??= {
    tickersAt: 0,
    tickers: null,
    tickerSource: "fallback",
    klines: {},
    newsAt: 0,
    news: [],
    fngAt: 0,
    fng: null,
  };
  return g.__sentraCache__;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/xml, application/rss+xml, */*",
      "user-agent": "Mozilla/5.0 (compatible; SENTRA/1.0)",
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      accept: "application/rss+xml, application/xml, text/xml, */*",
      "user-agent": "Mozilla/5.0 (compatible; SENTRA/1.0)",
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const FALLBACK_PX: Record<AssetId, number> = {
  btc: 81_500,
  eth: 2_508,
  sol: 105,
  doge: 0.089,
  xrp: 1.48,
  link: 11.87,
};

function seededJitter(id: AssetId, now: number): number {
  const minute = Math.floor(now / 15_000);
  const n = (minute * 2654435761 + id.charCodeAt(0) * 97) >>> 0;
  return ((n % 1000) / 1000 - 0.5) * 0.003;
}

function fallbackQuotes(now: number): AssetQuote[] {
  return ASSETS.map((a) => {
    const j = seededJitter(a.id, now);
    const price = FALLBACK_PX[a.id] * (1 + j);
    const change24h = (j * 40 + (a.id === "btc" ? 0.4 : -0.2)) * 3;
    return {
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      price,
      change1h: change24h / 18,
      change24h,
      volume24h: 1.2e9 * (1 + Math.abs(j) * 8),
      sentiment: clip(tanh(change24h / 6)),
      high24h: price * 1.012,
      low24h: price * 0.988,
    };
  });
}

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

async function fetchBinanceTickers(): Promise<AssetQuote[]> {
  const symbols = encodeURIComponent(JSON.stringify(ASSETS.map((a) => a.binance)));
  const hosts = ["https://api.binance.us", "https://api.binance.com"];
  let lastError: unknown;
  for (const host of hosts) {
    try {
      const rows = await fetchJson<BinanceTicker[]>(
        `${host}/api/v3/ticker/24hr?symbols=${symbols}`,
      );
      const bySym = new Map(rows.map((r) => [r.symbol, r]));
      return ASSETS.map((a) => {
        const row = bySym.get(a.binance);
        if (!row) throw new Error("missing ticker");
        const price = Number(row.lastPrice);
        const change24h = Number(row.priceChangePercent);
        return {
          id: a.id,
          symbol: a.symbol,
          name: a.name,
          price,
          change1h: null,
          change24h,
          volume24h: Number(row.quoteVolume),
          sentiment: clip(tanh(change24h / 7)),
          high24h: Number(row.highPrice),
          low24h: Number(row.lowPrice),
        };
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("binance failed");
}

type KucoinTicker = {
  symbol: string;
  last: string;
  changeRate: string;
  volValue: string;
  high: string;
  low: string;
};

async function fetchKucoinTickers(): Promise<AssetQuote[]> {
  const body = await fetchJson<{ data: { ticker: KucoinTicker[] } }>(
    "https://api.kucoin.com/api/v1/market/allTickers",
  );
  const bySym = new Map(body.data.ticker.map((r) => [r.symbol, r]));
  return ASSETS.map((a) => {
    const row = bySym.get(`${a.symbol}-USDT`);
    if (!row) throw new Error("missing kucoin ticker");
    const price = Number(row.last);
    const change24h = Number(row.changeRate) * 100;
    return {
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      price,
      change1h: null,
      change24h,
      volume24h: Number(row.volValue),
      sentiment: clip(tanh(change24h / 7)),
      high24h: Number(row.high),
      low24h: Number(row.low),
    };
  });
}

type GeckoMarket = {
  id: string;
  current_price: number;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h?: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
};

async function fetchGeckoTickers(): Promise<AssetQuote[]> {
  const ids = ASSETS.map((a) => a.geckoId).join(",");
  const rows = await fetchJson<GeckoMarket[]>(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&price_change_percentage=1h,24h`,
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ASSETS.map((a) => {
    const row = byId.get(a.geckoId);
    if (!row) throw new Error("missing gecko");
    const change24h = row.price_change_percentage_24h ?? 0;
    const change1h = row.price_change_percentage_1h_in_currency ?? null;
    return {
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      price: row.current_price,
      change1h,
      change24h,
      volume24h: row.total_volume,
      sentiment: clip(tanh(((change1h ?? change24h / 8) + change24h / 4) / 4)),
      high24h: row.high_24h,
      low24h: row.low_24h,
    };
  });
}

async function getTickers(now: number): Promise<{ quotes: AssetQuote[]; source: PriceSource }> {
  const c = cache();
  if (c.tickers && now - c.tickersAt < 12_000) {
    return { quotes: c.tickers, source: c.tickerSource };
  }
  try {
    const quotes = await fetchBinanceTickers();
    c.tickers = quotes;
    c.tickersAt = now;
    c.tickerSource = "binance";
    return { quotes, source: "binance" };
  } catch {
    try {
      const quotes = await fetchKucoinTickers();
      c.tickers = quotes;
      c.tickersAt = now;
      c.tickerSource = "kucoin";
      return { quotes, source: "kucoin" };
    } catch {
      try {
        const quotes = await fetchGeckoTickers();
        c.tickers = quotes;
        c.tickersAt = now;
        c.tickerSource = "coingecko";
        return { quotes, source: "coingecko" };
      } catch {
        const quotes = c.tickers ?? fallbackQuotes(now);
        return { quotes, source: c.tickers ? c.tickerSource : "fallback" };
      }
    }
  }
}

type KlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  ...unknown[],
];

async function fetchKlines(symbol: string, interval: string, limit: number): Promise<Bar[]> {
  const hosts = ["https://api.binance.us", "https://api.binance.com"];
  let lastError: unknown;
  for (const host of hosts) {
    try {
      const rows = await fetchJson<KlineRow[]>(
        `${host}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      );
      return rows.map((r) => ({
        t: r[0],
        close: Number(r[4]),
        volume: Number(r[5]),
        high: Number(r[2]),
        low: Number(r[3]),
      }));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("klines failed");
}

const YAHOO_SYM: Record<AssetId, string> = {
  btc: "BTC-USD",
  eth: "ETH-USD",
  sol: "SOL-USD",
  doge: "DOGE-USD",
  xrp: "XRP-USD",
  link: "LINK-USD",
};

async function fetchYahooBars(asset: AssetId, interval: string, limit: number): Promise<Bar[]> {
  const yInterval = interval === "1m" ? "1m" : interval === "5m" ? "5m" : "15m";
  const range = interval === "1m" ? "1d" : "5d";
  const body = await fetchJson<{
    chart: {
      result: {
        timestamp: number[];
        indicators: {
          quote: { close: (number | null)[]; volume: (number | null)[]; high: (number | null)[]; low: (number | null)[] }[];
        };
      }[];
    };
  }>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${YAHOO_SYM[asset]}?interval=${yInterval}&range=${range}`,
  );
  const result = body.chart.result[0];
  if (!result) throw new Error("yahoo empty");
  const quote = result.indicators.quote[0];
  if (!quote) throw new Error("yahoo quote empty");
  const bars: Bar[] = [];
  for (let i = 0; i < result.timestamp.length; i += 1) {
    const close = quote.close[i];
    if (close == null) continue;
    bars.push({
      t: (result.timestamp[i] ?? 0) * 1000,
      close,
      volume: quote.volume[i] ?? 0,
      high: quote.high[i] ?? close,
      low: quote.low[i] ?? close,
    });
  }
  return bars.slice(-limit);
}

function fallbackBars(price: number, now: number, count: number, stepMs: number): Bar[] {
  const bars: Bar[] = [];
  let px = price * 0.992;
  for (let i = count; i >= 0; i -= 1) {
    const t = now - i * stepMs;
    const wave = Math.sin(i / 9) * 0.003 + Math.cos(i / 17) * 0.002;
    px = px * (1 + wave * 0.15);
    bars.push({
      t,
      close: px,
      volume: 40 + Math.abs(Math.sin(i / 5)) * 80,
      high: px * 1.002,
      low: px * 0.998,
    });
  }
  if (bars.length) bars[bars.length - 1]!.close = price;
  return bars;
}

async function getBars(asset: AssetId, window: WindowKey, price: number, now: number): Promise<{ bars: Bar[]; barMinutes: number }> {
  const c = cache();
  const spec =
    window === "15m"
      ? { interval: "1m", limit: 30, minutes: 1 }
      : window === "1h"
        ? { interval: "1m", limit: 60, minutes: 1 }
        : { interval: "15m", limit: 96, minutes: 15 };
  const key = `${asset}:${spec.interval}:${spec.limit}`;
  const hit = c.klines[key];
  if (hit && now - hit.at < 15_000) {
    return { bars: hit.bars, barMinutes: spec.minutes };
  }
  try {
    const bars = await fetchKlines(ASSET_MAP[asset].binance, spec.interval, spec.limit);
    c.klines[key] = { at: now, bars };
    return { bars, barMinutes: spec.minutes };
  } catch {
    try {
      const bars = await fetchYahooBars(asset, spec.interval, spec.limit);
      c.klines[key] = { at: now, bars };
      return { bars, barMinutes: spec.minutes };
    } catch {
      if (hit) return { bars: hit.bars, barMinutes: spec.minutes };
      const bars = fallbackBars(price, now, spec.limit, spec.minutes * 60_000);
      return { bars, barMinutes: spec.minutes };
    }
  }
}

type FngResponse = {
  data?: { value: string; value_classification: string }[];
};

async function getFng(now: number) {
  const c = cache();
  if (now - c.fngAt < 5 * 60_000 && c.fng) return c.fng;
  try {
    const body = await fetchJson<FngResponse>("https://api.alternative.me/fng/?limit=1");
    const row = body.data?.[0];
    if (!row) return c.fng;
    c.fng = { value: Number(row.value), classification: row.value_classification };
    c.fngAt = now;
    return c.fng;
  } catch {
    return c.fng;
  }
}

function stripXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? stripXml(match[1] ?? "") : "";
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  for (const chunk of chunks.slice(0, 18)) {
    const title = tagValue(chunk, "title");
    if (!title) continue;
    const url = tagValue(chunk, "link") || tagValue(chunk, "guid");
    const pub = tagValue(chunk, "pubDate");
    const body = tagValue(chunk, "description");
    const published = pub ? Date.parse(pub) || Date.now() : Date.now();
    items.push({
      id: `${source}-${url || title}`.slice(0, 120),
      title,
      body,
      source,
      url,
      published,
      categories: title,
    });
  }
  return items;
}

async function getNews(now: number): Promise<NewsItem[]> {
  const c = cache();
  if (now - c.newsAt < 60_000 && c.news.length) return c.news;
  const feeds = [
    ["CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss"],
    ["Cointelegraph", "https://cointelegraph.com/rss"],
  ] as const;
  const settled = await Promise.allSettled(
    feeds.map(async ([source, url]) => parseRss(await fetchText(url), source)),
  );
  const items = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  if (items.length) {
    c.news = items;
    c.newsAt = now;
  }
  return c.news;
}

function newsImpulse(news: NewsItem[], t: number, asset: AssetId): number {
  let acc = 0;
  for (const n of news) {
    const dt = t - n.published;
    if (dt < 0 || dt > 3 * 60 * 60 * 1000) continue;
    const hay = `${n.title} ${n.categories}`.toLowerCase();
    const match = ASSET_MAP[asset].tags.some((tag) => hay.includes(tag));
    if (!match && asset !== "btc") continue;
    const decay = Math.exp(-dt / (55 * 60 * 1000));
    const { score } = classifyText(`${n.title} ${n.body}`);
    acc += score * decay * (match ? 1 : 0.25);
  }
  return clip(acc, -1, 1);
}

function buildSeries(
  bars: Bar[],
  news: NewsItem[],
  asset: AssetId,
  fng: number | null,
): SeriesPoint[] {
  const vols = bars.map((b) => b.volume);
  const vMean = mean(vols) || 1;
  const fngBias = fng != null ? (fng - 50) / 50 : 0;
  let ema = 0;
  return bars.map((bar, i) => {
    const prev = bars[i - 1]?.close ?? bar.close;
    const ret = prev > 0 ? (bar.close - prev) / prev : 0;
    const vz = (bar.volume - vMean) / (vMean * 0.8);
    const impulse = newsImpulse(news, bar.t, asset);
    const raw =
      0.34 * tanh(ret / 0.008) +
      0.28 * tanh(vz) +
      0.22 * impulse +
      0.16 * fngBias;
    ema = i === 0 ? raw : ema * 0.72 + raw * 0.28;
    return {
      t: bar.t,
      price: bar.close,
      sentiment: clip(ema),
      volume: bar.volume,
    };
  });
}

function volumeSurge(series: SeriesPoint[], barMinutes: number): number {
  const window = Math.max(1, Math.round(15 / barMinutes));
  const recent = mean(series.slice(-window).map((p) => Math.abs(p.sentiment) * 4 + 1));
  const base = mean(series.slice(0, -window).map((p) => Math.abs(p.sentiment) * 4 + 1)) || recent;
  return base > 0 ? recent / base : 1;
}

function buildAlerts(
  asset: AssetId,
  series: SeriesPoint[],
  surge: number,
  ma15: number,
  ma1h: number,
  now: number,
): AlertItem[] {
  const alerts: AlertItem[] = [];
  if (surge >= 3) {
    alerts.push({
      id: `surge-${asset}-${Math.floor(now / 60_000)}`,
      asset,
      kind: "volume_surge",
      message: `Sentiment volume on ${ASSET_MAP[asset].symbol} is ${surge.toFixed(1)}× the rolling baseline — 300% surge threshold breached.`,
      severity: surge >= 4.5 ? "critical" : "warn",
      ts: new Date(now).toISOString(),
    });
  }
  if (ma15 * ma1h < 0 && Math.abs(ma15) >= 0.12 && Math.abs(ma1h) >= 0.08) {
    alerts.push({
      id: `flip-${asset}-${Math.floor(now / 180_000)}`,
      asset,
      kind: "sentiment_flip",
      message: `${ASSET_MAP[asset].symbol} 15-minute sentiment flipped ${ma15 > 0 ? "bearish → bullish" : "bullish → bearish"} against the hourly trend.`,
      severity: "warn",
      ts: new Date(now).toISOString(),
    });
  }
  const last = series[series.length - 1]?.sentiment ?? 0;
  if (Math.abs(last) >= 0.62) {
    alerts.push({
      id: `ext-${asset}-${Math.floor(now / 300_000)}`,
      asset,
      kind: "extreme",
      message: `${ASSET_MAP[asset].symbol} tape is at ${last > 0 ? "euphoric" : "capitulative"} extreme (${last > 0 ? "+" : ""}${last.toFixed(2)}). Mean reversion risk is elevated.`,
      severity: "info",
      ts: new Date(now).toISOString(),
    });
  }
  return alerts;
}

async function persist(snapshot: Snapshot) {
  try {
    const sql = await getSql();
    const quote = snapshot.assets.find((a) => a.id === snapshot.selected);
    if (quote) {
      await sql`
        insert into market_snapshots (asset, price, volume, change_24h)
        values (${quote.id}, ${quote.price}, ${quote.volume24h}, ${quote.change24h})
      `;
      await sql`
        insert into sentiment_snapshots
          (asset, window_key, score, ma15, ma1h, ma24h, social_volume, bullish_share)
        values (
          ${snapshot.selected},
          ${snapshot.window},
          ${snapshot.signal.score},
          ${snapshot.signal.ma15},
          ${snapshot.signal.ma1h},
          ${snapshot.signal.ma24h},
          ${snapshot.signal.socialVolume},
          ${snapshot.signal.bullishShare}
        )
      `;
    }
    for (const post of snapshot.posts.slice(0, 12)) {
      await sql`
        insert into social_posts (id, asset, author, handle, body, score, label, reach, source, ts)
        values (
          ${post.id}, ${post.asset}, ${post.author}, ${post.handle}, ${post.body},
          ${post.score}, ${post.label}, ${post.reach}, ${post.source}, ${post.ts}
        )
        on conflict (id) do nothing
      `;
    }
    for (const alert of snapshot.alerts) {
      await sql`
        insert into alert_events (id, asset, kind, message, severity, ts)
        values (${alert.id}, ${alert.asset}, ${alert.kind}, ${alert.message}, ${alert.severity}, ${alert.ts})
        on conflict (id) do nothing
      `;
    }
  } catch {
    // Preview still works if persistence is mid-migration.
  }
}

export async function buildSnapshot(assetRaw: string, windowRaw: string): Promise<Snapshot> {
  const selected: AssetId = isAssetId(assetRaw) ? assetRaw : "btc";
  const window: WindowKey =
    windowRaw === "15m" || windowRaw === "1h" || windowRaw === "24h" ? windowRaw : "1h";
  const now = Date.now();

  const [{ quotes, source }, fng, news] = await Promise.all([
    getTickers(now),
    getFng(now),
    getNews(now),
  ]);

  const focus = quotes.find((q) => q.id === selected) ?? quotes[0]!;
  const { bars, barMinutes } = await getBars(selected, window, focus.price, now);
  const series = buildSeries(bars, news, selected, fng?.value ?? null);

  const sentVals = series.map((p) => p.sentiment);
  const ma15 = movingAverage(sentVals, Math.max(1, Math.round(15 / barMinutes)));
  const ma1h = movingAverage(sentVals, Math.max(1, Math.round(60 / barMinutes)));
  const ma24h = movingAverage(sentVals, sentVals.length);
  const score = sentVals[sentVals.length - 1] ?? 0;
  const surge = volumeSurge(series, barMinutes);

  const newsPosts = postsFromNews(news, now);
  const social = derivedSocial(quotes, selected, fng?.value ?? null, surge, now);
  const posts: SocialPost[] = [...newsPosts, ...social]
    .filter((p) => p.asset === selected || p.source === "news")
    .sort((a, b) => Math.abs(b.score) * Math.log10(2 + b.reach) - Math.abs(a.score) * Math.log10(2 + a.reach))
    .slice(0, 10);

  const relevant = posts.filter((p) => p.asset === selected);
  const scored = relevant.length ? relevant : posts;
  const bullishShare =
    scored.length === 0
      ? 0.5
      : scored.filter((p) => p.score > 0.08).length / scored.length;
  const socialVolume = scored.reduce((acc, p) => acc + Math.log10(2 + p.reach), 0);

  const quotesWithSent: AssetQuote[] = quotes.map((q) =>
    q.id === selected ? { ...q, sentiment: score } : q,
  );

  const alerts = buildAlerts(selected, series, surge, ma15, ma1h, now);
  const snapshot: Snapshot = {
    generatedAt: new Date(now).toISOString(),
    sources: {
      prices: source,
      news: news.length > 0,
      fearGreed: Boolean(fng),
    },
    fearGreed: fng,
    assets: quotesWithSent,
    selected,
    window,
    series,
    signal: {
      label: signalFromScore(score).label,
      score,
      ma15,
      ma1h,
      ma24h,
      bullishShare,
      socialVolume: Math.round(socialVolume),
      volumeSurge: surge,
    },
    correlation: leadLag(series, barMinutes),
    posts,
    alerts,
  };

  void persist(snapshot);
  return snapshot;
}
