export const WINDOWS = ["15m", "1h", "24h"] as const;
export type WindowKey = (typeof WINDOWS)[number];

export const ASSET_IDS = ["btc", "eth", "sol", "doge", "xrp", "link"] as const;
export type AssetId = (typeof ASSET_IDS)[number];

export type SentimentLabel = "Bullish" | "Bearish" | "Neutral";

export type SignalLabel =
  | "Strong bullish"
  | "Bullish"
  | "Neutral"
  | "Bearish"
  | "Strong bearish";

export type PriceSource = "binance" | "kucoin" | "coingecko" | "fallback";

export type SeriesPoint = {
  t: number;
  price: number;
  sentiment: number;
  volume: number;
};

export type AssetQuote = {
  id: AssetId;
  symbol: string;
  name: string;
  price: number;
  change1h: number | null;
  change24h: number;
  volume24h: number;
  sentiment: number;
  high24h: number | null;
  low24h: number | null;
};

export type SocialPost = {
  id: string;
  asset: AssetId;
  author: string;
  handle: string;
  body: string;
  score: number;
  label: SentimentLabel;
  reach: number;
  source: "news" | "social";
  ts: string;
  url?: string;
};

export type AlertItem = {
  id: string;
  asset: AssetId;
  kind: "volume_surge" | "sentiment_flip" | "extreme";
  message: string;
  severity: "info" | "warn" | "critical";
  ts: string;
};

export type Snapshot = {
  generatedAt: string;
  sources: {
    prices: PriceSource;
    news: boolean;
    fearGreed: boolean;
  };
  fearGreed: { value: number; classification: string } | null;
  assets: AssetQuote[];
  selected: AssetId;
  window: WindowKey;
  series: SeriesPoint[];
  signal: {
    label: SignalLabel;
    score: number;
    ma15: number;
    ma1h: number;
    ma24h: number;
    bullishShare: number;
    socialVolume: number;
    volumeSurge: number;
  };
  correlation: {
    pearson: number;
    lagMinutes: number;
    interpretation: string;
  };
  posts: SocialPost[];
  alerts: AlertItem[];
};
