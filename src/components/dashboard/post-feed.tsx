import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompact, formatScore, formatTime } from "@/lib/sentra/format";
import { rescoreWithGrok } from "@/lib/sentra/api";
import type { SocialPost } from "@/lib/sentra/types";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function toneFor(label: SocialPost["label"]) {
  if (label === "Bullish") return "bull" as const;
  if (label === "Bearish") return "bear" as const;
  return "default" as const;
}

export function PostFeed({
  posts,
  onRescore,
}: {
  posts: SocialPost[];
  onRescore?: (next: SocialPost[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function runGrok() {
    setBusy(true);
    try {
      const result = await rescoreWithGrok({
        data: {
          posts: posts.slice(0, 8).map((p) => ({ id: p.id, body: p.body })),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const byId = new Map(result.scores.map((s) => [s.id, s]));
      const next = posts.map((p) => {
        const hit = byId.get(p.id);
        if (!hit) return p;
        const label =
          hit.label === "Bullish" || hit.label === "Bearish" || hit.label === "Neutral"
            ? hit.label
            : p.label;
        return { ...p, score: Math.max(-1, Math.min(1, hit.score)), label };
      });
      onRescore?.(next);
      toast.success("Posts re-scored with Grok");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-score failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-border sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-fg">Influential voice</h2>
          <p className="text-xs text-muted">
            News wires plus reach-weighted desk notes. Ranked by |score| × log(reach).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runGrok} disabled={busy || posts.length === 0}>
          {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
          Re-score
        </Button>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {posts.length === 0 ? (
          <li className="rounded-lg bg-elevated px-3 py-4 text-sm text-muted">
            Waiting on the first print of market voice.
          </li>
        ) : (
          posts.map((post) => (
            <li
              key={post.id}
              className="rounded-lg bg-elevated px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-[0.65rem] font-medium text-accent">
                    {post.author.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">{post.author}</p>
                    <p className="truncate text-xs text-subtle">
                      @{post.handle} · {formatTime(post.ts)} · {formatCompact(post.reach)} reach
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      post.score >= 0.12 ? "text-bull" : post.score <= -0.12 ? "text-bear" : "text-muted",
                    )}
                  >
                    {formatScore(post.score)}
                  </span>
                  <Badge tone={toneFor(post.label)}>{post.label}</Badge>
                </div>
              </div>
              {post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-sm leading-relaxed text-fg/90 hover:text-accent"
                >
                  {post.body}
                </a>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-fg/90">{post.body}</p>
              )}
              <p className="mt-1.5 text-xs uppercase tracking-wider text-subtle">
                {post.source === "news" ? "Wire" : "Desk"} · {post.asset.toUpperCase()}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
