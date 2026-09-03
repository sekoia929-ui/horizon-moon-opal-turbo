import { SentraMark } from "./mark";
import { formatClock } from "@/lib/sentra/format";
import type { PriceSource } from "@/lib/sentra/types";
import { useEffect, useState } from "react";

export function Header({
  source,
  generatedAt,
}: {
  source: PriceSource;
  generatedAt: string | null;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const sourceLabel =
    source === "binance"
      ? "Binance"
      : source === "kucoin"
        ? "KuCoin"
        : source === "coingecko"
          ? "CoinGecko"
          : "Cached tape";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <SentraMark className="size-8" />
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
              SENTRA
            </h1>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-subtle sm:inline">
              Sentiment × Impact
            </span>
          </div>
          <p className="text-xs text-muted">
            Live crypto voice weighted by reach, plotted against the tape.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs tabular-nums text-muted">
        <span className="inline-flex items-center gap-2 rounded-full bg-elevated px-2.5 py-1.5">
          <span className="relative flex size-2">
            <span className="live-dot absolute inset-0 rounded-full bg-bull" />
            <span className="relative size-2 rounded-full bg-bull" />
          </span>
          <span className="text-fg">Live</span>
          <span className="text-subtle">{sourceLabel}</span>
        </span>
        {now ? <span className="hidden sm:inline">{formatClock(now)} UTC</span> : null}
        {generatedAt ? (
          <span className="hidden text-subtle lg:inline">
            print {new Date(generatedAt).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        ) : null}
      </div>
    </header>
  );
}
