import type { TrafficLight } from "@/lib/types/stratos";
import { typography } from "@/lib/brand/typography";

type Card = { key: string; label: string; satisfaction: string; target: string; light: TrafficLight };

const ORDER = ["learning", "process", "customer", "financial"] as const;
const DIM_COLOR: Record<string, string> = {
  financial: "var(--bsc-financial)",
  customer: "var(--bsc-customer)",
  process: "var(--bsc-process)",
  learning: "var(--bsc-learning)",
};
const SIGNAL_COLOR: Record<TrafficLight, string> = {
  green: "var(--signal-green)",
  yellow: "var(--signal-yellow)",
  red: "var(--signal-red)",
};
const CAUSAL_HINT: Record<string, string> = {
  learning: "组织能力 / 学习成长",
  process: "内部流程效率",
  customer: "客户价值主张",
  financial: "财务成果",
};

/**
 * BSC 因果链：学习成长 → 内部流程 → 客户 → 财务。
 * 任一环节亮红，向右传导风险；展示"为什么这一格变红、风险往哪里扩散"。
 */
export function BscCausalChain({ cards }: { cards: Card[] }) {
  const byKey = new Map(cards.map((c) => [c.key, c]));
  const chain = ORDER.map((k) => byKey.get(k)).filter(Boolean) as Card[];
  if (chain.length === 0) return null;

  // first non-green upstream node = root cause candidate; downstream inherits propagation
  const firstRiskIdx = chain.findIndex((c) => c.light !== "green");

  return (
    <section>
      <div className={`${typography.h3} mb-1`}>BSC 因果链 · 风险传导</div>
      <p className="mb-4 text-caption">
        卡普兰-诺顿因果逻辑：能力建设驱动流程，流程兑现客户价值，客户价值转化为财务成果。上游变红会向右传导。
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {chain.map((c, i) => {
          const color = DIM_COLOR[c.key];
          const sig = SIGNAL_COLOR[c.light];
          const isRoot = i === firstRiskIdx && c.light !== "green";
          const propagated = firstRiskIdx >= 0 && i > firstRiskIdx && c.light !== "green";
          return (
            <div key={c.key} className="flex flex-1 items-stretch gap-3">
              <div
                className="relative flex-1 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-4 border-l-[3px]"
                style={{
                  borderLeftColor: color,
                  boxShadow: c.light === "red" ? `inset 0 0 0 1px ${sig}59` : undefined,
                }}
              >
                {isRoot && (
                  <span className="absolute -top-2 left-3 rounded bg-[var(--signal-red)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    根因
                  </span>
                )}
                {propagated && (
                  <span className="absolute -top-2 left-3 rounded bg-[var(--signal-yellow)] px-1.5 py-0.5 text-[11px] font-semibold text-black">
                    受传导
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color }}>{c.label}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sig }} />
                </div>
                <div className="mt-1 text-[0.65rem] uppercase tracking-[0.08em]" style={{ color: color + "b0" }}>
                  {CAUSAL_HINT[c.key]}
                </div>
                <p className="mt-2.5 font-data text-[0.72rem] tabular-nums leading-tight text-[var(--color-text-muted)]">
                  {c.target}
                </p>
              </div>
              {i < chain.length - 1 && (
                <div className="flex items-center justify-center" aria-hidden>
                  <svg width="22" height="20" viewBox="0 0 22 20" className="hidden lg:block">
                    <path d="M2 10 H16 M11 5 L17 10 L11 15"
                      fill="none" stroke="var(--color-text-muted)" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="20" height="22" viewBox="0 0 20 22" className="block lg:hidden">
                    <path d="M10 2 V16 M5 11 L10 17 L15 11"
                      fill="none" stroke="var(--color-text-muted)" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
