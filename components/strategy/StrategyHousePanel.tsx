"use client";
import type { TrafficLight } from "@/lib/types/stratos";

interface BscCard { key: string; label: string; target: string; satisfaction: string; light: TrafficLight; }
interface HouseProps {
  mission: string;
  vision: string;
  bscCards: BscCard[];
  threeYearItems: Record<string, string[]>;
  annualItems: Record<string, string[]>;
}

const COLS = ["financial", "customer", "process", "learning"];
const COL_LABEL: Record<string, string> = {
  financial: "财务", customer: "客户", process: "内部运营", learning: "学习成长",
};

export function StrategyHousePanel({ mission, vision, bscCards, threeYearItems, annualItems }: HouseProps) {
  const n = COLS.length;
  return (
    <section className="w-full overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rounded-tl-lg bg-[var(--house-mission)] p-4 text-white">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-80">使 命</div>
          <p className="text-sm leading-snug font-medium">{mission}</p>
        </div>
        <div className="rounded-tr-lg bg-[var(--house-vision)] p-4 text-white">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-80">愿 景</div>
          <p className="text-sm leading-snug font-medium">{vision}</p>
        </div>
      </div>

      <div className="flex items-center bg-[var(--house-vision)] px-3 py-2 text-white">
        <span className="text-xs font-semibold tracking-wider">三年战略目标</span>
      </div>
      <div className="grid border-b border-[var(--surface-border)]" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
        {COLS.map((k, i) => {
          const card = bscCards.find(c => c.key === k);
          const items = threeYearItems[k] ?? (card ? [card.target] : []);
          return (
            <div
              key={k}
              className={`flex flex-col bg-[var(--house-vision-tint)] p-3 ${i < n - 1 ? "border-r border-[var(--surface-border)]" : ""}`}
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--house-vision)]">
                {COL_LABEL[k]}
              </div>
              <ul className="space-y-1">
                {items.map((it, j) => (
                  <li key={j} className="flex items-start gap-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="mt-0.5 flex-shrink-0 text-[var(--house-vision)]">·</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex items-center bg-[var(--house-annual)] px-3 py-2 text-white">
        <span className="text-xs font-semibold tracking-wider">年度重点工作</span>
      </div>
      <div className="grid border-b border-[var(--surface-border)]" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
        {COLS.map((k, i) => {
          const items = annualItems[k] ?? [];
          return (
            <div
              key={k}
              className={`flex flex-col bg-[var(--house-annual-tint)] p-3 ${i < n - 1 ? "border-r border-[var(--surface-border)]" : ""}`}
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--house-annual)]">
                {COL_LABEL[k]}
              </div>
              <ol className="list-none space-y-1">
                {items.length > 0
                  ? items.map((it, j) => (
                    <li key={j} className="flex items-start gap-1 text-xs text-[var(--color-text-secondary)]">
                      <span className="flex-shrink-0 font-semibold text-[var(--house-annual)]">{j + 1}.</span>{it}
                    </li>
                  ))
                  : <li className="text-xs italic text-[var(--color-text-muted)]">—</li>}
              </ol>
            </div>
          );
        })}
      </div>

      <div className="grid overflow-hidden rounded-b-lg" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
        {["组织保障", "人才发展", "企业文化", "数字化赋能"].map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-center bg-[var(--house-foundation)] px-2 py-3 text-center text-xs font-semibold text-white ${i < n - 1 ? "border-r border-white/20" : ""}`}
          >
            {p}
          </div>
        ))}
      </div>
    </section>
  );
}
