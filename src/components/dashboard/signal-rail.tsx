import { formatPct, formatScore } from "@/lib/sentra/format";
import { cn } from "@/lib/utils";
import type { Snapshot } from "@/lib/sentra/types";

function Meter({ value }: { value: number }) {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = ((clamped + 1) / 2) * 100;
  return (
    <div className="relative mt-3 h-2 rounded-full bg-elevated">
      <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
      <div
        className={cn(
          "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_rgba(9,10,12,0.9)]",
          clamped >= 0.12 ? "bg-bull" : clamped <= -0.12 ? "bg-bear" : "bg-accent",
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

export function SignalRail({ snapshot }: { snapshot: Snapshot }) {
  const s = snapshot.signal;
  const tone =
    s.score >= 0.15 ? "text-bull" : s.score <= -0.15 ? "text-bear" : "text-fg";
  const fng = snapshot.fearGreed;

  return (
    <aside className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-border sm:p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-subtle">Signal</p>
        <p className={cn("mt-1 font-display text-3xl leading-none", tone)}>{s.label}</p>
        <p className="mt-2 font-mono text-sm tabular-nums text-muted">
          {formatScore(s.score)} weighted score
        </p>
        <Meter value={s.score} />
        <div className="mt-2 flex justify-between text-xs uppercase tracking-wider text-subtle">
          <span>Bear</span>
          <span>Neutral</span>
          <span>Bull</span>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {[
          ["15m", s.ma15],
          ["1h", s.ma1h],
          ["24h", s.ma24h],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg bg-elevated px-2.5 py-2">
            <dt className="text-xs uppercase tracking-wider text-subtle">{label} MA</dt>
            <dd
              className={cn(
                "font-mono text-sm tabular-nums",
                Number(value) >= 0.08 ? "text-bull" : Number(value) <= -0.08 ? "text-bear" : "text-fg",
              )}
            >
              {formatScore(Number(value))}
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg bg-elevated p-3">
        <p className="text-xs uppercase tracking-wider text-subtle">Lead / lag</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-fg">
          r {snapshot.correlation.pearson.toFixed(2)} · {snapshot.correlation.lagMinutes}m
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {snapshot.correlation.interpretation}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-elevated p-3">
          <p className="text-xs uppercase tracking-wider text-subtle">Bullish share</p>
          <p className="mt-1 font-mono tabular-nums text-fg">{formatPct(s.bullishShare * 100, 0)}</p>
        </div>
        <div className="rounded-lg bg-elevated p-3">
          <p className="text-xs uppercase tracking-wider text-subtle">Voice surge</p>
          <p
            className={cn(
              "mt-1 font-mono tabular-nums",
              s.volumeSurge >= 3 ? "text-warn" : "text-fg",
            )}
          >
            {s.volumeSurge.toFixed(1)}×
          </p>
        </div>
      </div>

      {fng ? (
        <div className="rounded-lg bg-elevated p-3">
          <p className="text-xs uppercase tracking-wider text-subtle">Fear & greed</p>
          <p className="mt-1 font-mono text-sm tabular-nums text-fg">
            {fng.value} · {fng.classification}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
