import Link from "next/link";
import { AgentOrchestrationPanel } from "@/components/reports/AgentOrchestrationPanel";
import { MonthlyPulseForm } from "@/components/reports/MonthlyPulseForm";
import { ReportsArchive } from "@/components/reports/ReportsArchive";
import { ReportsPanorama } from "@/components/reports/ReportsPanorama";
import { PageHeader } from "@/components/ui/PageHeader";
import { dbAvailable, prisma } from "@/lib/db";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { getManagementReport, getFpaSummary } from "@/lib/data/strategy-data";
import { getOrgScope } from "@/lib/auth/scope";

async function getOrgUnits() {
  if (!(await dbAvailable())) return [];
  const units = await prisma.orgUnit.findMany({
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, level: true },
  });
  return units;
}

export default async function ReportsPage() {
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();
  const orgScope = getOrgScope(role, session);
  const [orgUnits, mgmt, fpa] = await Promise.all([
    getOrgUnits(),
    getManagementReport(),
    getFpaSummary(),
  ]);
  const visibleOrgUnits =
    orgScope != null && orgScope.length > 0
      ? orgUnits.filter((u) => orgScope.includes(u.id))
      : orgUnits;

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="经营档案 · AI 解析 · 反哺执行审计"
        title="OPS 运营"
        subtitle="经营档案 · AI 解析 · 反哺执行审计与指挥舱 · 各部门/体系/事业部月报与会议纪要"
      />

      <MonthlyPulseForm orgUnits={visibleOrgUnits} />

      <ReportsArchive orgUnits={visibleOrgUnits} />

      <section className="surface-elevated rounded-2xl border border-black/[0.06] p-6 md:p-8">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
          AI 解析管道与经营全景
        </h2>
        <div className="space-y-6">
          <AgentOrchestrationPanel />
          <ReportsPanorama fpa={fpa} kpis={mgmt.kpis} />
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/monitor/bu" className="text-[var(--color-accent)] hover:underline">
          事业部监测 →
        </Link>
        <Link href="/command" className="text-[var(--color-text-muted)] hover:underline">
          指挥舱 SCR →
        </Link>
      </div>
    </div>
  );
}
