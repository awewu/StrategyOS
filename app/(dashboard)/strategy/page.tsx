import { DiagnosisBar } from "@/components/strategy/DiagnosisBar";
import { ThreeStackPanel } from "@/components/strategy/ThreeStackPanel";
import { BscCards } from "@/components/strategy/BscCards";
import { ProdStackPanel } from "@/components/strategy/ProdStackPanel";
import { GtmStackPanel } from "@/components/strategy/GtmStackPanel";
import { AARRRFunnel } from "@/components/growth/AARRRFunnel";
import { KellerBrandPyramid } from "@/components/growth/KellerBrandPyramid";
import { getStrategyBundle } from "@/lib/data/strategy-data";
import { getCapitalSummaryLine } from "@/lib/data/entity-getters";

export default async function StrategyPage() {
  const [data, capSummary] = await Promise.all([getStrategyBundle(), getCapitalSummaryLine()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">看战略</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Rumelt 诊断 + 三栈资源配置 + BSC · 数据源 {data.source === "database" ? "DB" : "Demo"}
        </p>
      </div>

      <DiagnosisBar diagnosis={data.diagnosis} />
      <ThreeStackPanel
        ics={data.investmentCases}
        productBets={data.productBets}
        gtmBets={data.gtmBets}
        capSummary={capSummary}
      />
      <ProdStackPanel
        horizon={data.capStack.byHorizon}
        roadmap={data.productRoadmap}
        jtbd={data.jtbdCards}
        gaps={data.productGaps}
      />
      <GtmStackPanel segments={data.gtmSegments} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AARRRFunnel stages={data.aarrrFunnel} />
        <KellerBrandPyramid layers={data.kellerBrandLayers} />
      </div>
      <BscCards cards={data.bscCards} />

      <section>
        <h2 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">
          Playing to Win · 四品牌
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.brandCards.map((b) => (
            <div
              key={b.brandCode}
              className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-4"
            >
              <div className="text-xs text-[var(--color-accent-gold)]">{b.brandCode}</div>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-[var(--color-text-muted)]">WTP</div>
                  <p className="text-sm">{b.whereToPlay}</p>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-text-muted)]">HTW</div>
                  <p className="text-sm">{b.howToWin}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
