import Link from "next/link";
import type { DecisionReviewCard } from "@/lib/council/decision-review";

function pct(v: number | null): string {
  if (v == null) return "—";
  const s = (v * 100).toFixed(1);
  return v > 0 ? `+${s}%` : `${s}%`;
}

function toneFor(v: number | null): string {
  if (v == null) return "var(--color-text-muted)";
  if (v >= 0) return "var(--signal-green)";
  if (v >= -0.05) return "var(--signal-yellow)";
  return "var(--signal-red)";
}

/** 决策复盘卡："当初决了什么 vs 实际落点如何" — GRAI 的 G 和 R */
export function DecisionReviewPanel({ cards }: { cards: DecisionReviewCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="stratos-card stratos-card--padded text-sm text-[var(--color-text-muted)]">
        暂无历史期次的决策记录可复盘。决策在
        <Link href="/command" className="mx-1 text-[var(--color-accent)] hover:underline">指挥舱</Link>
        落账后，期次切换即自动进入本页。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cards.map((card) => (
        <section key={card.period} className="stratos-card stratos-card--padded">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-subsection text-[var(--color-text-primary)]">{card.period} 期决策</h3>
            {card.actuals ? (
              <div className="flex gap-4 text-xs">
                <span>
                  营收 B-A{" "}
                  <span className="font-data" style={{ color: toneFor(card.actuals.revenueVariancePct) }}>
                    {pct(card.actuals.revenueVariancePct)}
                  </span>
                </span>
                <span>
                  利润 B-A{" "}
                  <span className="font-data" style={{ color: toneFor(card.actuals.profitVariancePct) }}>
                    {pct(card.actuals.profitVariancePct)}
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-caption">该期无 FPA 落点数据</span>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {card.decisions.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--surface-border)] p-3 text-sm"
              >
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: d.status === "open" ? "var(--signal-yellow)" : "var(--signal-green)" }}
                />
                <span className="flex-1">{d.title}</span>
                {d.owner ? <span className="text-caption">{d.owner}</span> : null}
                {d.deadline ? <span className="text-caption">{d.deadline}</span> : null}
                <span className="text-xs" style={{ color: d.status === "open" ? "var(--signal-yellow)" : "var(--signal-green)" }}>
                  {d.status === "open" ? "未决/未闭环" : "已决"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-caption">
            复盘问题：这些决策与该期 B-A 落点是否一致？未决项是否已成为本期议题？
          </p>
        </section>
      ))}
    </div>
  );
}
