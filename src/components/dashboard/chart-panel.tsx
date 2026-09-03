import { WINDOWS, type SeriesPoint, type WindowKey } from "@/lib/sentra/types";
import { formatAxisPrice, formatPrice } from "@/lib/sentra/format";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function tickTime(t: number, window: WindowKey) {
  const d = new Date(t);
  if (window === "24h") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: window === "15m" ? "2-digit" : undefined,
    hour12: false,
  });
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SeriesPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-elevated px-3 py-2 text-xs shadow-border">
      <div className="text-subtle">{new Date(p.t).toLocaleString("en-US", { hour12: false })}</div>
      <div className="mt-1 tabular-nums text-fg">Price {formatPrice(p.price)}</div>
      <div
        className={cn(
          "tabular-nums",
          p.sentiment >= 0 ? "text-bull" : "text-bear",
        )}
      >
        Sentiment {p.sentiment >= 0 ? "+" : ""}
        {p.sentiment.toFixed(2)}
      </div>
    </div>
  );
}

export function ChartPanel({
  symbol,
  series,
  window,
  onWindow,
}: {
  symbol: string;
  series: SeriesPoint[];
  window: WindowKey;
  onWindow: (w: WindowKey) => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-border sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-fg">{symbol} vs weighted voice</h2>
          <p className="text-xs text-muted">
            Dual axis — price (line) against reach-weighted sentiment (fill).
          </p>
        </div>
        <div className="flex rounded-full bg-elevated p-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWindow(w)}
              className={cn(
                "min-h-10 rounded-full px-3 text-xs font-medium transition-[background-color,color] duration-150 ease-out",
                window === w ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64 overflow-hidden sm:h-80">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9aa7b4" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#9aa7b4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(230,232,236,0.06)" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t) => tickTime(Number(t), window)}
                tick={{ fill: "#8d939e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                yAxisId="price"
                orientation="left"
                tickFormatter={(v) => formatAxisPrice(Number(v))}
                tick={{ fill: "#8d939e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={["auto", "auto"]}
              />
              <YAxis
                yAxisId="sent"
                orientation="right"
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tick={{ fill: "#8d939e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                yAxisId="sent"
                type="monotone"
                dataKey="sentiment"
                stroke="#9aa7b4"
                strokeWidth={1.4}
                fill="url(#sentFill)"
                isAnimationActive={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#e6e8ec"
                strokeWidth={1.7}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-elevated shimmer" />
        )}
      </div>
    </section>
  );
}
