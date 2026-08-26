import Link from "next/link";
import { DecodeWorkspace } from "@/components/decode/DecodeWorkspace";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { getDecodeBundle } from "@/lib/data/strategy-data";
import { getOkrBundle } from "@/lib/decode/okr-access";
import { getStrategyOnePager } from "@/lib/strategy/one-pager-store";

export default async function DecodePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRouteAccess("/decode");
  const { tab } = await searchParams;
  const [{ source, bsc, hoshinFlat }, okr, onePager] = await Promise.all([
    getDecodeBundle(),
    getOkrBundle(),
    getStrategyOnePager().catch(() => null),
  ]);
  const initialTab =
    tab === "hoshin" ? ("hoshin" as const) : tab === "okr" ? ("okr" as const) : undefined;
  const strategyApproved = onePager?.status === "APPROVED";

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="制定 ② 发布 → ③ 解码 · BSC · X-Matrix · OKR"
        title="战略解码"
        subtitle="战略地图与执行对齐 · 在线录入 / Excel 导入"
      />
      {!strategyApproved ? (
        <div className="rounded-xl border border-[var(--signal-yellow)]/35 bg-[color-mix(in_srgb,var(--signal-yellow)_7%,white)] p-4 text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--signal-yellow-text)]">时序提示：</span>
          战略一页纸尚未发布（当前为草案）。解码应基于已批准的战略主张，否则 BSC/OKR 对齐的是移动靶。建议先在{" "}
          <Link href="/strategy/input" className="text-[var(--color-accent)] hover:underline">编制战略</Link>
          {" "}完成发布，再回到本页解码。
        </div>
      ) : null}
      <DecodeWorkspace
        initial={{ bsc, hoshinFlat, source, okr }}
        initialTab={initialTab}
      />
      <ConceptGuide ids={["bsc", "okr", "hoshin"]} />
    </div>
  );
}
