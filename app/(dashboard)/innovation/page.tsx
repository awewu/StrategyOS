import { logUsageEvent } from "@/lib/audit/log-event";
import { requireRouteAccess } from "@/lib/auth/guard";
import { InnovationClient } from "@/components/innovation/InnovationClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiTile } from "@/components/ui/KpiTile";
import { getInnovationBundle } from "@/lib/innovation/data-access";
import { PviEvidenceCard } from "@/components/innovation/PviEvidenceCard";
import { getPviGroups } from "@/lib/finance/ledger-queries";
import { dbAvailable } from "@/lib/db";

export default async function InnovationPage() {
  await requireRouteAccess("/innovation");
  await logUsageEvent({ action: "innovation_view", resource: "/innovation" });
  const bundle = await getInnovationBundle();
  const pviGroups = (await dbAvailable()) ? await getPviGroups() : [];

  const bets = bundle.lines.flatMap((l) => l.bets);
  const go = bets.filter((b) => b.gate.verdict === "go").length;
  const hold = bets.filter((b) => b.gate.verdict === "hold").length;
  const kill = bets.filter((b) => b.gate.verdict === "kill").length;
  const committed = bets.reduce((s, b) => s + (b.nextCommitAmount ?? 0), 0);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="Innovation Engine"
        title="创新底座"
        subtitle="想要 × 能做 × 划算——方法论内核不变,产品线画像可配;举证过关,分段下注,错了止损。"
      />
      <div className="stratos-slot-grid">
        <KpiTile
          label="在注产品赌注"
          value={String(bets.length)}
          tone="neutral"
          sub={`${bundle.lines.length} 条产品线`}
        />
        <KpiTile
          label="Gate 放行"
          value={String(go)}
          tone={go > 0 ? "green" : "neutral"}
          sub={`hold ${hold} · kill ${kill}`}
        />
        <KpiTile
          label="下期 commit"
          value={`${committed.toLocaleString("zh-CN")} 万`}
          tone="teal"
          sub="分段下注 · 错了止损"
        />
        <KpiTile
          label="Gate 阻断"
          value={String(kill + hold)}
          tone={kill > 0 ? "red" : hold > 0 ? "teal" : "green"}
          sub="举证不足则拦截"
        />
      </div>
      <InnovationClient bundle={bundle} />
      <PviEvidenceCard groups={pviGroups} />
    </div>
  );
}
