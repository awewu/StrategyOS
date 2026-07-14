import Link from "next/link";
import type { PviBuGroup } from "@/lib/finance/ledger-queries";

const nf = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });

/**
 * 新品收入证据（PVI · 来自 OneStream 总账中台）——
 * 给创新底座的 H2/H3 赌注提供全事业部新品实际销售的市场证据锚。
 */
export function PviEvidenceCard({ groups }: { groups: PviBuGroup[] }) {
  if (groups.length === 0) return null;
  const divisionTotal = groups.reduce((s, g) => s + g.total, 0);
  const topProducts = groups
    .flatMap((g) => g.products.map((p) => ({ ...p, businessUnit: g.businessUnit })))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <section className="stratos-card stratos-card--padded">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">新品收入证据 · PVI（New Product Vitality）</h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted,#888)]">
            来自 OneStream 总账中台 · 全 Water Division 新品实际销售（$000s）——为「新品收入占比」假设 Hx 提供实际数锚点
          </p>
        </div>
        <Link href="/finance/ledger?tab=pvi" className="stratos-btn stratos-btn--ghost text-xs">
          查看全部 →
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span>
          事业部合计 <span className="font-mono font-semibold">{nf.format(divisionTotal)}</span>
        </span>
        {groups.map((g) => (
          <span key={g.businessUnit} className="text-[var(--color-text-muted,#888)]">
            {g.businessUnit} <span className="font-mono">{nf.format(g.total)}</span>（{g.productCount} 品）
          </span>
        ))}
      </div>

      <div className="stratos-table-wrap">
        <table className="stratos-table">
          <thead>
            <tr>
              <th>新品 Top 8</th>
              <th>事业部</th>
              <th>品类</th>
              <th>上市</th>
              <th className="text-right">全年销售（$000s）</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={`${p.businessUnit}-${p.productName}`}>
                <td className="max-w-[220px] truncate" title={p.productName}>{p.productName}</td>
                <td>{p.businessUnit}</td>
                <td className="max-w-[160px] truncate" title={p.category ?? undefined}>{p.category ?? "—"}</td>
                <td className="font-mono text-xs">{p.launchPeriod ?? "—"}</td>
                <td className="text-right font-mono text-xs">{nf.format(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
