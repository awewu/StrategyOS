import Link from "next/link";
import { AgentOrchestrationPanel } from "@/components/reports/AgentOrchestrationPanel";
import { ReportsCenter } from "@/components/reports/ReportsCenter";
import { PageHeader } from "@/components/ui/PageHeader";
import { mckinseyCadence } from "@/lib/brand/apple-mckinsey";
import { getDataSource, getReports } from "@/lib/data/strategy-data";

export default async function ReportsPage() {
  const [reports, source] = await Promise.all([getReports(), getDataSource()]);

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="McKinsey 预读 · Apple 简洁导入"
        title="报告中心"
        subtitle="MON-RPT 七章 + 可选 SCR/MECE 叙事头 → Agent 解析 → 指挥舱 SCR"
      />

      <nav className="surface-glass flex flex-wrap gap-2 rounded-xl border border-black/[0.06] p-3 text-xs">
        {Object.values(mckinseyCadence).map((step) => (
          <Link
            key={step.route}
            href={step.route}
            className="rounded-lg px-3 py-2 text-[var(--color-text-muted)] transition-colors hover:bg-black/[0.03] hover:text-[var(--color-text-primary)]"
          >
            {step.labelZh}
          </Link>
        ))}
      </nav>

      <AgentOrchestrationPanel />
      <ReportsCenter reports={reports} source={source} />
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/rehearsal" className="text-[var(--color-accent-gold)] hover:underline">
          Q3 战略会彩排 →
        </Link>
        <Link href="/command" className="text-[var(--color-text-muted)] hover:underline">
          指挥舱 SCR →
        </Link>
      </div>
    </div>
  );
}
