"use client";

import { useState } from "react";
import { FeedbackLoopPanel } from "@/components/decode/FeedbackLoopPanel";
import { StratSimPanel } from "@/components/decode/StratSimPanel";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { BSC_MAP } from "@/lib/decode/bsc-map";
import { HOSHIN_QUADRANTS } from "@/lib/decode/hoshin-data";
import type { FeedbackLoop } from "@/lib/types/stratos";

type Tab = "bsc" | "hoshin" | "stratsim";

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
      <div className="flex gap-2 border-b border-[var(--surface-border)]">
        <TabBtn active={tab === "bsc"} onClick={() => setTab("bsc")}>
          BSC 战略地图
        </TabBtn>
        <TabBtn active={tab === "hoshin"} onClick={() => setTab("hoshin")}>
          Hoshin X-Matrix
        </TabBtn>
        <TabBtn active={tab === "stratsim"} onClick={() => setTab("stratsim")}>
          反馈环 · StratSim
        </TabBtn>
      </div>

      {tab === "bsc" ? (
        <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
          <h2 className="mb-4 text-sm font-medium">BSC 四维度 · Must-Win / Must-Not-Fail</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {BSC_MAP.map((row) => (
              <div key={row.dim} className="rounded border border-[var(--surface-border)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-[var(--color-accent)]">{row.dim}</div>
                </div>
                <div className="mt-1 font-medium">{row.objective}</div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2 rounded bg-black/[0.03] p-2">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Must-Win · </span>
                      {row.mustWin}
                    </div>
                    <TrafficLightDot signal={row.mustWinStatus} />
                  </div>
                  <ul className="space-y-1 text-[var(--color-text-muted)]">
                    {row.operating.map((op) => (
                      <li key={op}>· {op}</li>
                    ))}
                  </ul>
                  <div className="flex items-start justify-between gap-2 rounded bg-black/[0.03] p-2">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Must-Not-Fail · </span>
                      {row.mustNotFail}
                    </div>
                    <TrafficLightDot signal={row.notFailStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : tab === "hoshin" ? (
        <section className="space-y-6">
          <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-bg-surface)] p-6">
            <h2 className="mb-2 text-sm font-medium text-[var(--color-accent)]">
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
              <MatrixQuadrant entries={HOSHIN_QUADRANTS[0]!.entries} />
              <MatrixQuadrant entries={HOSHIN_QUADRANTS[1]!.entries} />
              <div className="bg-[var(--color-bg-deep)] p-3 text-xs text-[var(--color-text-muted)]">
                西 · 年度
              </div>
              <MatrixQuadrant entries={HOSHIN_QUADRANTS[2]!.entries} />
              <MatrixQuadrant entries={HOSHIN_QUADRANTS[3]!.entries} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[var(--surface-border)] text-xs text-[var(--color-text-muted)]">
                <tr>
                  <th className="p-3">象限</th>
                  <th className="p-3">条目</th>
                  <th className="p-3">TTI</th>
                  <th className="p-3">OKR</th>
                  <th className="p-3">行动</th>
                  <th className="p-3">Owner</th>
                </tr>
              </thead>
              <tbody>
                {HOSHIN_QUADRANTS.flatMap((q) =>
                  q.entries.map((e) => (
                    <tr key={e.id} className="border-t border-[var(--surface-border)]">
                      <td className="p-3 text-xs text-[var(--color-text-muted)]">
                        {q.rowLabel}
                        <br />
                        {q.colLabel}
                      </td>
                      <td className="p-3 font-medium">
                        {e.correlated && (
                          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                        )}
                        {e.label}
                      </td>
                      <td className="p-3 font-data text-xs">{e.tti}</td>
                      <td className="p-3 text-xs">{e.okr}</td>
                      <td className="p-3 text-xs text-[var(--color-text-secondary)]">{e.action}</td>
                      <td className="p-3 text-xs">{e.owner}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <FeedbackLoopPanel loops={loops} />
          <StratSimPanel loops={loops} />
        </div>
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
          ? "border-[var(--color-accent)] text-[var(--color-accent)]"
          : "border-transparent text-[var(--color-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function MatrixQuadrant({
  entries,
}: {
  entries: (typeof HOSHIN_QUADRANTS)[number]["entries"];
}) {
  return (
    <div className="relative bg-[var(--color-bg-deep)] p-3">
      {entries.map((entry) => (
        <div key={entry.id} className="text-xs">
          {entry.correlated && (
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          )}
          {entry.label}
        </div>
      ))}
    </div>
  );
}
