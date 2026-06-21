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
      {/* ── ROOF ── */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rounded-tl-lg p-4 text-white" style={{ background: "#2e7d32" }}>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-80">使 命</div>
          <p className="text-sm leading-snug font-medium">{mission}</p>
        </div>
        <div className="rounded-tr-lg p-4 text-white" style={{ background: "#1565c0" }}>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-80">愿 景</div>
          <p className="text-sm leading-snug font-medium">{vision}</p>
        </div>
      </div>

      {/* ── 3-YEAR TARGETS ── */}
      <div className="flex items-center px-3 py-2 text-white" style={{ background: "#1565c0" }}>
        <span className="text-xs font-semibold tracking-wider">三年战略目标</span>
      </div>
      <div className="grid border-b border-black/10" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
        {COLS.map((k, i) => {
          const card = bscCards.find(c => c.key === k);
          const items = threeYearItems[k] ?? (card ? [card.target] : []);
          return (
            <div key={k} className={`flex flex-col p-3 bg-[#e3f0fb] ${i < n-1 ? "border-r border-black/10" : ""}`}>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#1565c0" }}>
                {COL_LABEL[k]}
              </div>
              <ul className="space-y-1">
                {items.map((it, j) => (
                  <li key={j} className="flex items-start gap-1 text-xs text-gray-700">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: "#1565c0" }}>·</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── ANNUAL PRIORITIES ── */}
      <div className="flex items-center px-3 py-2 text-white" style={{ background: "#e65100" }}>
        <span className="text-xs font-semibold tracking-wider">年度重点工作</span>
      </div>
      <div className="grid border-b border-black/10" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
        {COLS.map((k, i) => {
          const items = annualItems[k] ?? [];
          return (
            <div key={k} className={`flex flex-col p-3 bg-[#fff8f3] ${i < n-1 ? "border-r border-black/10" : ""}`}>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#e65100" }}>
                {COL_LABEL[k]}
              </div>
              <ol className="space-y-1 list-none">
                {items.length > 0
                  ? items.map((it, j) => (
                    <li key={j} className="flex items-start gap-1 text-xs text-gray-700">
                      <span className="flex-shrink-0 font-semibold" style={{ color: "#e65100" }}>{j+1}.</span>{it}
                    </li>
                  ))
                  : <li className="text-xs italic text-gray-400">—</li>}
              </ol>
            </div>
          );
        })}
      </div>

      {/* ── FOUNDATION ── */}
      <div className="grid rounded-b-lg overflow-hidden" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
        {["组织保障","人才发展","企业文化","数字化赋能"].map((p, i) => (
          <div key={i}
            className={`flex items-center justify-center py-3 text-white text-xs font-semibold text-center px-2 ${i < n-1 ? "border-r border-white/20" : ""}`}
            style={{ background: "#1a2e3b" }}>
            {p}
          </div>
        ))}
      </div>
    </section>
  );
}
