import type { GtmBet, InvestmentCase, ProductBet } from "@/lib/types/stratos";

function StackItemChip({
  label,
  title,
  tag,
  toggle,
  status,
}: {
  label: string;
  title: string;
  tag?: string;
  toggle: string;
  status: string;
}) {
  return (
    <div className="rounded border border-[var(--surface-border)] bg-[var(--surface-raised)] p-3">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 font-medium">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-black/[0.04] px-2 py-0.5">{status}</span>
        {tag && <span className="font-data text-[var(--color-accent)]">{tag}</span>}
        <span className={toggle === "on" ? "text-[#1f8a45]" : "text-[var(--color-text-muted)]"}>
          FPA {toggle.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export function ThreeStackPanel({
  ics,
  productBets,
  gtmBets,
  capSummary,
}: {
  ics: InvestmentCase[];
  productBets: ProductBet[];
  gtmBets: GtmBet[];
  capSummary: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-[var(--color-text-primary)]">三栈资源配置</h2>
        <p className="text-xs text-[var(--color-text-muted)]">资本 · 产品 · 渠道 — 每项可挂 budget_tag 联动 FPA</p>
      </div>
      <div className="rounded-md bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
        CapStack · {capSummary}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-sm font-medium text-[var(--color-accent)]">资本栈 CapStack</h3>
          <div className="space-y-2">
            {ics.map((ic) => (
              <StackItemChip
                key={ic.id}
                label="资本投向"
                title={ic.title}
                tag={ic.budgetTag}
                toggle={ic.fpaToggle}
                status={ic.gateStatus}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-[#60a5fa]">产品栈 ProdStack</h3>
          <div className="space-y-2">
            {productBets.map((pb) => (
              <StackItemChip
                key={pb.id}
                label="产品战略项"
                title={pb.title}
                tag={pb.budgetTag}
                toggle={pb.fpaToggle}
                status={pb.gateStatus}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-[#1f8a45]">渠道栈 GtmStack</h3>
          <div className="space-y-2">
            {gtmBets.map((gb) => (
              <StackItemChip
                key={gb.id}
                label="市场战略项"
                title={gb.title}
                tag={gb.budgetTag}
                toggle={gb.fpaToggle}
                status={gb.gateStatus}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
