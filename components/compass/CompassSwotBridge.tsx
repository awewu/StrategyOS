import Link from "next/link";
import { internalSwotFromPremises, SWOT_CATEGORY_LABEL } from "@/lib/market-intel/swot";
import type { PremiseAudit } from "@/lib/compass/types";
import { SectionCard } from "@/components/ui/KpiTile";

/**
 * 战略罗盘 → SWOT 桥：把战略前提审计派生为内部 S/W，作为「市场洞察 · SWOT 推演」的 S/W 数据源。
 */
export function CompassSwotBridge({ premises }: { premises: PremiseAudit[] }) {
  const items = internalSwotFromPremises(premises);
  const strengths = items.filter((i) => i.category === "strength");
  const weaknesses = items.filter((i) => i.category === "weakness");

  return (
    <SectionCard
      title="前提 → SWOT · 内部 S/W 数据源"
      subtitle="由战略前提的信心/脆弱/失效信号派生 · 喂给市场洞察 SWOT 推演（O/T 来自 Hermes）"
      dense
      action={
        <Link
          href="/market?tab=swot"
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          生成 SWOT →
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div style={{ borderLeft: "3px solid var(--signal-green)" }} className="rounded-lg border border-[var(--surface-border)] p-3">
          <h4 className="mb-2 text-xs font-semibold" style={{ color: "var(--signal-green)" }}>
            {SWOT_CATEGORY_LABEL.strength} · {strengths.length}
          </h4>
          {strengths.length === 0 ? (
            <p className="text-caption">暂无（无高信心·低脆弱前提）</p>
          ) : (
            <ul className="space-y-1">
              {strengths.slice(0, 4).map((i) => (
                <li key={i.id} className="text-xs text-[var(--color-text-secondary)]">{i.title}</li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ borderLeft: "3px solid var(--signal-red)" }} className="rounded-lg border border-[var(--surface-border)] p-3">
          <h4 className="mb-2 text-xs font-semibold" style={{ color: "var(--signal-red)" }}>
            {SWOT_CATEGORY_LABEL.weakness} · {weaknesses.length}
          </h4>
          {weaknesses.length === 0 ? (
            <p className="text-caption">暂无</p>
          ) : (
            <ul className="space-y-1">
              {weaknesses.slice(0, 4).map((i) => (
                <li key={i.id} className="text-xs text-[var(--color-text-secondary)]">{i.title}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
