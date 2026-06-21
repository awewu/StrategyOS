import Link from "next/link";
import { FiveYearForecast, SensitivityPanel } from "@/components/finance/FiveYearForecast";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFinanceBundle } from "@/lib/data/strategy-data";

export default async function OutlookPage() {
  const data = await getFinanceBundle();

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="战略态势 · 前瞻"
        title="战略展望"
        subtitle={`5 年轨迹摘要 · 完整模型与敏感性分析在 FPA · 数据源 ${data.source === "database" ? "DB" : "Demo"}`}
        actions={
          <>
            <Link
              href="/finance?tab=forecast"
              className="rounded-xl border border-[var(--color-accent-gold)]/35 bg-[var(--color-accent-gold)]/8 px-4 py-2.5 text-sm text-[var(--color-accent-gold)] transition-colors hover:bg-[var(--color-accent-gold)]/15"
            >
              FPA 5 年全模型 →
            </Link>
            <Link
              href="/finance?tab=scenarios"
              className="rounded-xl border border-black/[0.06] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-black/10 hover:text-[var(--color-text-primary)]"
            >
              SPBP 情景 →
            </Link>
          </>
        }
      />
      <FiveYearForecast rows={data.fiveYearForecast} />
      <SensitivityPanel drivers={data.sensitivityDrivers} />
    </div>
  );
}
