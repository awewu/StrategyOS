import Link from "next/link";
import { AgentOrchestrationPanel } from "@/components/reports/AgentOrchestrationPanel";
import { MonthlyPulseForm } from "@/components/reports/MonthlyPulseForm";
import { PulseOpsPanel } from "@/components/reports/PulseOpsPanel";
import { ReportsArchive } from "@/components/reports/ReportsArchive";
import { ReportReceipts } from "@/components/reports/ReportReceipts";
import { ReportsPanorama } from "@/components/reports/ReportsPanorama";
import { GemPanel } from "@/components/gems/GemPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrgUnitsSummary } from "@/lib/data/org-units-access";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { getManagementReport, getFpaSummary } from "@/lib/data/strategy-data";
import { getOrgScope } from "@/lib/auth/scope";
import { getReportReceipts } from "@/lib/reports/receipts";

export default async function ReportsPage() {
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();
  const orgScope = getOrgScope(role, session);
  const [orgUnits, mgmt, fpa, receipts] = await Promise.all([
    getOrgUnitsSummary(),
    getManagementReport(),
    getFpaSummary(),
    getReportReceipts(orgScope),
  ]);
  const visibleOrgUnits =
    orgScope != null && orgScope.length > 0
      ? orgUnits.filter((u) => orgScope.includes(u.id))
      : orgUnits;

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="经营档案 · AI 解析 · 反哺执行"
        title="OPS 运营"
        subtitle="部门/体系/事业部月报、MON_PULSE 与会议纪要"
      />

      <GemPanel />

      <div className="grid gap-6 xl:grid-cols-2">
        <MonthlyPulseForm orgUnits={visibleOrgUnits} />
        <PulseOpsPanel />
      </div>

      <ReportsArchive orgUnits={visibleOrgUnits} />

      <ReportReceipts receipts={receipts} />

      <section className="stratos-card stratos-card--padded">
        <h2 className="text-title text-[var(--color-text-primary)]">AI 解析与经营全景</h2>
        <p className="text-caption mt-1 mb-5">管道编排 · FPA 快照 · 跨模块反哺</p>
        <div className="space-y-6">
          <AgentOrchestrationPanel />
          <ReportsPanorama fpa={fpa} kpis={mgmt.kpis} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/monitor/bu" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs">
          事业部监测
        </Link>
        <Link href="/command" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs">
          指挥舱 SCR
        </Link>
      </div>
    </div>
  );
}
