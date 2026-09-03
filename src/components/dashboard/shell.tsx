import { getSnapshot } from "@/lib/sentra/api";
import type { AssetId, Snapshot, SocialPost, WindowKey } from "@/lib/sentra/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertLog } from "./alert-log";
import { ChartPanel } from "./chart-panel";
import { Header } from "./header";
import { PostFeed } from "./post-feed";
import { SignalRail } from "./signal-rail";
import { Ticker } from "./ticker";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard({ initial }: { initial?: Snapshot }) {
  const [asset, setAsset] = useState<AssetId>(initial?.selected ?? "btc");
  const [window, setWindow] = useState<WindowKey>(initial?.window ?? "1h");
  const [overridePosts, setOverridePosts] = useState<SocialPost[] | null>(null);

  const query = useQuery({
    queryKey: ["snapshot", asset, window],
    queryFn: () => getSnapshot({ data: { asset, window } }),
    initialData:
      initial && asset === initial.selected && window === initial.window
        ? initial
        : undefined,
  });

  const snapshot: Snapshot | undefined = query.data;

  const posts = useMemo(() => {
    if (overridePosts) return overridePosts;
    return snapshot?.posts ?? [];
  }, [overridePosts, snapshot?.posts]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <Header
        source={snapshot?.sources.prices ?? "fallback"}
        generatedAt={snapshot?.generatedAt ?? null}
      />
      {snapshot ? (
        <Ticker
          assets={snapshot.assets}
          selected={asset}
          onSelect={(id) => {
            setAsset(id);
            setOverridePosts(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3 sm:px-6 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      <div className="grid gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {snapshot ? (
          <ChartPanel
            symbol={snapshot.assets.find((a) => a.id === asset)?.symbol ?? "BTC"}
            series={snapshot.series}
            window={window}
            onWindow={(w) => {
              setWindow(w);
              setOverridePosts(null);
            }}
          />
        ) : (
          <Skeleton className="h-80 rounded-2xl" />
        )}
        {snapshot ? (
          <SignalRail snapshot={snapshot} />
        ) : (
          <Skeleton className="h-80 rounded-2xl" />
        )}
      </div>

      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <PostFeed posts={posts} onRescore={(next) => setOverridePosts(next)} />
        <AlertLog alerts={snapshot?.alerts ?? []} />
      </div>

      <footer className="border-t border-border px-4 py-6 text-xs leading-relaxed text-subtle sm:px-6">
        <p>
          SENTRA scores market voice with a financial lexicon (FinBERT-style), weights
          by reach, then correlates against live Binance / CoinGecko prints. Native X
          firehose attaches when API keys are present in the Python plane; this desk
          uses live news wires plus derived desk notes so the tape never goes dark.
        </p>
        {query.error ? (
          <p className="mt-2 text-bear">
            {query.error instanceof Error ? query.error.message : "Feed interrupted"}
          </p>
        ) : null}
      </footer>
    </div>
  );
}
