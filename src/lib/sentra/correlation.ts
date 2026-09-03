import type { SeriesPoint } from "./types";

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 4) return 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    const x = xs[i] ?? 0;
    const y = ys[i] ?? 0;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const cov = sxy - (sx * sy) / n;
  const vx = sxx - (sx * sx) / n;
  const vy = syy - (sy * sy) / n;
  const den = Math.sqrt(vx * vy);
  if (den < 1e-12) return 0;
  return Math.max(-1, Math.min(1, cov / den));
}

function returns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1] ?? 0;
    const cur = values[i] ?? 0;
    if (prev <= 0) {
      out.push(0);
      continue;
    }
    out.push((cur - prev) / prev);
  }
  return out;
}

export function leadLag(series: SeriesPoint[], barMinutes: number) {
  const prices = series.map((p) => p.price);
  const sents = series.map((p) => p.sentiment);
  const rPrice = returns(prices);
  const rSent = sents.slice(1);
  const n = Math.min(rPrice.length, rSent.length);
  const a = rPrice.slice(0, n);
  const b = rSent.slice(0, n);

  const maxLag = Math.min(8, Math.floor(n / 5));
  let bestLag = 0;
  let bestCorr = pearson(a, b);

  for (let lag = -maxLag; lag <= maxLag; lag += 1) {
    if (lag === 0) continue;
    let xs: number[];
    let ys: number[];
    if (lag > 0) {
      xs = b.slice(0, n - lag);
      ys = a.slice(lag);
    } else {
      const k = -lag;
      xs = b.slice(k);
      ys = a.slice(0, n - k);
    }
    const c = pearson(xs, ys);
    if (Math.abs(c) > Math.abs(bestCorr)) {
      bestCorr = c;
      bestLag = lag;
    }
  }

  const lagMinutes = bestLag * barMinutes;
  let interpretation: string;
  if (Math.abs(bestCorr) < 0.12) {
    interpretation =
      "No reliable link this window — sentiment and price are moving independently.";
  } else if (lagMinutes < 0) {
    interpretation = `Sentiment leads price by ${Math.abs(lagMinutes)}m (r=${bestCorr.toFixed(2)}). Voice is arriving before the print.`;
  } else if (lagMinutes > 0) {
    interpretation = `Price leads sentiment by ${lagMinutes}m (r=${bestCorr.toFixed(2)}). The tape is setting the conversation.`;
  } else {
    interpretation = `Contemporaneous move (r=${bestCorr.toFixed(2)}). Sentiment and price are printing together.`;
  }

  return {
    pearson: bestCorr,
    lagMinutes,
    interpretation,
  };
}
