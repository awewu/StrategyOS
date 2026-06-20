"use client";

import { useState } from "react";
import { StratSimPanel } from "@/components/decode/StratSimPanel";
import type { FeedbackLoop } from "@/lib/types/stratos";

type Tab = "bsc" | "hoshin" | "stratsim";

interface MatrixCell {
  row: string;
  col: string;
  items: string[];
  dot?: boolean;
}

const HOSHIN_GRID: MatrixCell[] = [
  { row: "长期突破", col: "指标", items: ["营收 CAGR", "NPS"], dot: true },
  { row: "长期突破", col: "改善项目", items: ["V4 平台化"], dot: true },
  { row: "年度突破", col: "指标", items: ["O1 增长", "O2 创新"], dot: true },
  { row: "年度突破", col: "改善项目", items: ["V1 渠道", "V4 热泵"], dot: true },
];

export function DecodeTabs({
  loops,
  initialTab,
}: {
  loops: FeedbackLoop[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "bsc");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-black/10">
        <TabBtn active={tab === "bsc"} onClick={() => setTab("bsc")}>
          BSC 战略地图
        </TabBtn>
        <TabBtn active={tab === "hoshin"} onClick={() => setTab("hoshin")}>
          Hoshin X-Matrix ★ Phase 2
        </TabBtn>
        <TabBtn active={tab === "stratsim"} onClick={() => setTab("stratsim")}>
          StratSim · 反馈环
        </TabBtn>
      </div>

      {tab === "bsc" ? (
        <section className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-6">
          <h2 className="mb-4 text-sm font-medium">BSC 四维度 → OKR 树</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { dim: "财务", o: "投资驱动增长 · 6000万", kr: ["营收+20%", "runway≥3月"] },
              { dim: "客户", o: "酒店1200家", kr: ["NPS≥45", "覆盖82%"] },
              { dim: "流程", o: "V4按时上市", kr: ["准时率85%", "Gate通过"] },
              { dim: "学习", o: "单王5人", kr: ["5/5到位", "流失≤10%"] },
            ].map((row) => (
              <div key={row.dim} className="rounded border border-black/10 p-4">
                <div className="text-xs text-[var(--color-accent-gold)]">{row.dim}</div>
                <div className="mt-1 font-medium">{row.o}</div>
                <ul className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {row.kr.map((k) => (
                    <li key={k}>· {k}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : tab === "hoshin" ? (
        <section className="rounded-lg border border-[var(--color-accent-gold)]/30 bg-[var(--color-bg-surface)] p-6">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-accent-gold)]">
            Hoshin X-Matrix · I7
          </h2>
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">
            南=长期突破 · 西=年度突破 · 北=改善项目 · 东=指标 · ● = correlation_dot
          </p>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-black/[0.06] text-sm">
            <div className="bg-[var(--color-bg-deep)] p-3" />
            <div className="bg-[var(--color-bg-deep)] p-3 text-center text-xs text-[var(--color-text-muted)]">
              东 · 指标
            </div>
            <div className="bg-[var(--color-bg-deep)] p-3 text-center text-xs text-[var(--color-text-muted)]">
              北 · Vx
            </div>
            <div className="bg-[var(--color-bg-deep)] p-3 text-xs text-[var(--color-text-muted)]">
              南 · 长期
            </div>
            <MatrixQuadrant cell={HOSHIN_GRID[0]} />
            <MatrixQuadrant cell={HOSHIN_GRID[1]} />
            <div className="bg-[var(--color-bg-deep)] p-3 text-xs text-[var(--color-text-muted)]">
              西 · 年度
            </div>
            <MatrixQuadrant cell={HOSHIN_GRID[2]} />
            <MatrixQuadrant cell={HOSHIN_GRID[3]} />
          </div>
        </section>
      ) : (
        <StratSimPanel loops={loops} />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm ${
        active
          ? "border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]"
          : "border-transparent text-[var(--color-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function MatrixQuadrant({ cell }: { cell: MatrixCell }) {
  return (
    <div className="relative bg-[var(--color-bg-deep)] p-3">
      {cell.items.map((item) => (
        <div key={item} className="text-xs">
          {cell.dot && (
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--color-accent-gold)]" />
          )}
          {item}
        </div>
      ))}
    </div>
  );
}
