import { DecodeTabs } from "@/components/decode/DecodeTabs";
import { FeedbackLoopPanel } from "@/components/decode/FeedbackLoopPanel";
import { getDecodeBundle } from "@/lib/data/strategy-data";

export default async function DecodePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const { loops, source } = await getDecodeBundle();
  const initialTab = tab === "stratsim" ? ("stratsim" as const) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">StratDecode</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          BSC 战略地图 ↔ Hoshin X-Matrix · 反馈环 R/B/D · StratSim 推演 · 数据源{" "}
          {source === "database" ? "DB" : "Demo"}
        </p>
      </div>
      <DecodeTabs loops={loops} initialTab={initialTab} />
      <FeedbackLoopPanel loops={loops} />
    </div>
  );
}
