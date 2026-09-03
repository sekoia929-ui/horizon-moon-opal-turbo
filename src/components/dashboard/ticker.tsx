import { cn } from "@/lib/utils";
import { formatPct, formatPrice, signedClass } from "@/lib/sentra/format";
import type { AssetId, AssetQuote } from "@/lib/sentra/types";

export function Ticker({
  assets,
  selected,
  onSelect,
}: {
  assets: AssetQuote[];
  selected: AssetId;
  onSelect: (id: AssetId) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:grid lg:grid-cols-6 lg:overflow-visible">
      {assets.map((asset) => {
        const active = asset.id === selected;
        const sent = asset.sentiment;
        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset.id)}
            className={cn(
              "min-w-36 shrink-0 flex-1 rounded-xl bg-surface p-3 text-left shadow-border transition-[background-color,box-shadow] duration-150 ease-out hover:bg-elevated lg:min-w-0",
              active ? "bg-elevated shadow-focus" : null,
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium tracking-wide text-muted">
                {asset.symbol}
              </span>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  sent >= 0.12 ? "text-bull" : sent <= -0.12 ? "text-bear" : "text-subtle",
                )}
              >
                {sent >= 0 ? "+" : ""}
                {sent.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 font-mono text-sm tabular-nums text-fg">
              {formatPrice(asset.price)}
            </div>
            <div className={cn("mt-0.5 text-xs tabular-nums", signedClass(asset.change24h))}>
              {formatPct(asset.change24h)} 24h
            </div>
          </button>
        );
      })}
    </div>
  );
}
