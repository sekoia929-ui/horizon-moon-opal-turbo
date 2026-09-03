import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/shell";
import { getSnapshot } from "@/lib/sentra/api";

export const Route = createFileRoute("/")({
  loader: () => getSnapshot({ data: { asset: "btc", window: "1h" } }),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  return <Dashboard initial={initial} />;
}
