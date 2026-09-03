import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/sentra/format";
import type { AlertItem } from "@/lib/sentra/types";

const KIND: Record<AlertItem["kind"], string> = {
  volume_surge: "Volume surge",
  sentiment_flip: "Sentiment flip",
  extreme: "Extreme tape",
};

export function AlertLog({ alerts }: { alerts: AlertItem[] }) {
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-border sm:p-5">
      <h2 className="font-display text-lg text-fg">Anomaly alerts</h2>
      <p className="text-xs text-muted">
        Fires on 15-minute sentiment flips and voice volume above 3× baseline.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {alerts.length === 0 ? (
          <li className="rounded-lg bg-elevated px-3 py-4 text-sm text-muted">
            Quiet tape — no surge or flip in this window.
          </li>
        ) : (
          alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg bg-elevated px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  tone={
                    alert.severity === "critical"
                      ? "bear"
                      : alert.severity === "warn"
                        ? "warn"
                        : "accent"
                  }
                >
                  {KIND[alert.kind]}
                </Badge>
                <span className="font-mono text-xs tabular-nums text-subtle">
                  {formatTime(alert.ts)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg/90">{alert.message}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
