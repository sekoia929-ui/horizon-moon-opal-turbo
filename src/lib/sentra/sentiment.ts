import type { SentimentLabel } from "./types";

const BULLISH: Record<string, number> = {
  moon: 0.9,
  mooning: 0.85,
  breakout: 0.75,
  accumulation: 0.55,
  accumulate: 0.5,
  long: 0.35,
  longs: 0.35,
  buy: 0.45,
  buying: 0.5,
  rally: 0.7,
  ath: 0.65,
  squeeze: 0.55,
  undervalued: 0.6,
  bullish: 0.85,
  bull: 0.55,
  pump: 0.45,
  green: 0.3,
  support: 0.35,
  rebound: 0.5,
  recovery: 0.5,
  upside: 0.45,
  bid: 0.25,
  bids: 0.3,
  demand: 0.35,
  inflow: 0.5,
  inflows: 0.55,
  etf: 0.25,
  approval: 0.4,
  partnership: 0.35,
  upgrade: 0.4,
  adoption: 0.45,
  strong: 0.25,
  strength: 0.3,
  hold: 0.15,
  holding: 0.2,
  higher: 0.3,
  highs: 0.35,
  surge: 0.55,
  rip: 0.4,
  ripped: 0.45,
  rocket: 0.5,
  reclaim: 0.45,
  flip: 0.2,
  whale: 0.15,
  whales: 0.15,
};

const BEARISH: Record<string, number> = {
  dump: 0.85,
  dumping: 0.8,
  crash: 0.9,
  crashing: 0.85,
  sell: 0.45,
  selling: 0.55,
  sold: 0.4,
  short: 0.4,
  shorts: 0.4,
  rug: 0.95,
  rugged: 0.95,
  liquidation: 0.75,
  liquidated: 0.8,
  liquidations: 0.7,
  breakdown: 0.7,
  overvalued: 0.55,
  bearish: 0.85,
  bear: 0.5,
  red: 0.3,
  resistance: 0.25,
  rejected: 0.5,
  rejection: 0.5,
  downside: 0.45,
  outflow: 0.5,
  outflows: 0.55,
  hack: 0.8,
  exploit: 0.75,
  lawsuit: 0.55,
  ban: 0.5,
  delay: 0.3,
  delayed: 0.3,
  fear: 0.45,
  panic: 0.7,
  weak: 0.3,
  weakness: 0.4,
  lower: 0.25,
  lows: 0.3,
  bleed: 0.55,
  bleeding: 0.6,
  unwind: 0.4,
  capitulation: 0.8,
  cascade: 0.65,
  risk: 0.2,
  off: 0.1,
};

const NEGATIONS = new Set([
  "not",
  "no",
  "never",
  "without",
  "dont",
  "don't",
  "isn't",
  "isnt",
  "wasn't",
  "wasnt",
  "hardly",
  "barely",
]);

const INTENSIFIERS: Record<string, number> = {
  extremely: 1.45,
  very: 1.25,
  hugely: 1.4,
  massively: 1.4,
  seriously: 1.2,
  really: 1.15,
  highly: 1.25,
  sharply: 1.3,
  aggressively: 1.3,
  slightly: 0.7,
  somewhat: 0.75,
  maybe: 0.6,
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9$'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function classifyText(text: string): {
  score: number;
  label: SentimentLabel;
} {
  const tokens = tokenize(text);
  if (tokens.length === 0) return { score: 0, label: "Neutral" };

  let acc = 0;
  let hits = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i] ?? "";
    const bare = tok.replace(/^\$/, "");
    const bull = BULLISH[bare];
    const bear = BEARISH[bare];
    if (!bull && !bear) continue;
    const prev = tokens[i - 1] ?? "";
    const prev2 = tokens[i - 2] ?? "";
    const negated = NEGATIONS.has(prev) || NEGATIONS.has(prev2);
    const intensity = INTENSIFIERS[prev] ?? 1;
    let w = (bull ?? 0) - (bear ?? 0);
    w *= intensity;
    if (negated) w *= -0.85;
    acc += w;
    hits += 1;
  }

  const density = hits / Math.max(tokens.length, 1);
  let score = hits === 0 ? 0 : acc / (hits + 0.65);
  score *= 0.72 + Math.min(density * 2.2, 0.28);
  score = Math.max(-1, Math.min(1, score));

  const label: SentimentLabel =
    score >= 0.12 ? "Bullish" : score <= -0.12 ? "Bearish" : "Neutral";
  return { score, label };
}

export function weightByReach(score: number, reach: number, engagements = 0): number {
  const reachW = Math.log10(1 + Math.max(reach, 0)) / 6;
  const engW = 1 + Math.min(engagements / 800, 1.6);
  return Math.max(-1, Math.min(1, score * (0.35 + reachW) * engW));
}

export function signalFromScore(score: number): {
  label: "Strong bullish" | "Bullish" | "Neutral" | "Bearish" | "Strong bearish";
} {
  if (score >= 0.55) return { label: "Strong bullish" };
  if (score >= 0.15) return { label: "Bullish" };
  if (score <= -0.55) return { label: "Strong bearish" };
  if (score <= -0.15) return { label: "Bearish" };
  return { label: "Neutral" };
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function movingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  return mean(values.slice(-window));
}

export function clip(n: number, lo = -1, hi = 1): number {
  return Math.max(lo, Math.min(hi, n));
}

export function tanh(n: number): number {
  const e = Math.exp(-2 * Math.max(-20, Math.min(20, n)));
  return (1 - e) / (1 + e);
}
