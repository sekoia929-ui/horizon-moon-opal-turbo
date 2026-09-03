import type { AssetId } from "./types";

export type AssetMeta = {
  id: AssetId;
  symbol: string;
  name: string;
  geckoId: string;
  binance: string;
  tags: string[];
  color: string;
};

export const ASSETS: AssetMeta[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    geckoId: "bitcoin",
    binance: "BTCUSDT",
    tags: ["$btc", "bitcoin", "btc"],
    color: "#9aa7b4",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    geckoId: "ethereum",
    binance: "ETHUSDT",
    tags: ["$eth", "ethereum", "eth"],
    color: "#7d93a8",
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    geckoId: "solana",
    binance: "SOLUSDT",
    tags: ["$sol", "solana", "sol"],
    color: "#6f9b8a",
  },
  {
    id: "doge",
    symbol: "DOGE",
    name: "Dogecoin",
    geckoId: "dogecoin",
    binance: "DOGEUSDT",
    tags: ["$doge", "dogecoin", "doge"],
    color: "#b39b74",
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    geckoId: "ripple",
    binance: "XRPUSDT",
    tags: ["$xrp", "ripple", "xrp"],
    color: "#7f8aa0",
  },
  {
    id: "link",
    symbol: "LINK",
    name: "Chainlink",
    geckoId: "chainlink",
    binance: "LINKUSDT",
    tags: ["$link", "chainlink", "link"],
    color: "#6e8fb3",
  },
];

export const ASSET_MAP: Record<AssetId, AssetMeta> = Object.fromEntries(
  ASSETS.map((a) => [a.id, a]),
) as Record<AssetId, AssetMeta>;

export function isAssetId(value: string): value is AssetId {
  return ASSETS.some((a) => a.id === value);
}
