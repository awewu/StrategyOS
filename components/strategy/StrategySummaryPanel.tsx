"use client";

import { useState } from "react";
import type { StrategicDiagnosis, InvestmentCase, FpaSummary } from "@/lib/types/stratos";
import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

const BSC_COLOR: Record<string, string> = {
  financial: "var(--bsc-financial)",
  customer: "var(--bsc-customer)",
  process: "var(--bsc-process)",
  learning: "var(--bsc-learning)",
};

type TimeFrame = "month" | "quarter" | "ytd" | "yoy";

const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  month: "月度",
  quarter: "季度",
  ytd: "YTD",
  yoy: "同期对比",
};

function formatCurrency(n: number): string {
  return `¥${(n / 10000).toFixed(0)}万`;
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function achievementRate(actual: number, budget: number): number {
  return budget > 0 ? (actual / budget) * 100 : 0;
}

function KpiCard({ label, actual, budget, unit }: {
  label: string; actual: number; budget: number; unit: "currency" | "percent" | "months";
}) {
  const rate = achievementRate(actual, budget);
  const format = unit === "currency" ? formatCurrency : unit === "percent" ? formatPercent : (n: number) => `${n.toFixed(1)} 个月`;
  const color = rate >= 100 ? "var(--color-success)" : rate >= 80 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-data text-lg font-semibold tabular-nums text-[var(--color-text-primary)]">{format(actual)}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">预算 {format(budget)}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.04]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }} />
      </div>
      <div className="mt-1 text-[10px] tabular-nums" style={{ color }}>达成率 {formatPercent(rate)}</div>
    </div>
  );
}

function BscCard({ card }: { card: { key: string; label: string; satisfaction: string; target: string; light: TrafficLight } }) {
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3"
      style={{ borderLeftColor: BSC_COLOR[card.key], borderLeftWidth: 3 }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: BSC_COLOR[card.key] + "b0" }}>{card.satisfaction}</div>
          <div className="mt-0.5 text-sm font-semibold" style={{ color: BSC_COLOR[card.key] }}>{card.label}</div>
        </div>
        <TrafficLightDot signal={card.light} />
      </div>
      <div className="mt-2 font-data text-xs tabular-nums text-[var(--color-text-secondary)]">{card.target}</div>
    </div>
  );
}

function OkrList({ investmentCases }: { investmentCases: InvestmentCase[] }) {
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">目标达成 · 投资主题 OKR</div>
      <ul className="space-y-2">
        {investmentCases.slice(0, 4).map((ic) => (
          <li key={ic.id} className="flex items-start justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="truncate text-[var(--color-text-primary)]">{ic.title}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{ic.horizon} · {ic.gateStatus}</div>
            </div>
            <div className="flex-shrink-0 text-right font-data tabular-nums">
              {ic.expectedIrr ? `${ic.expectedIrr.toFixed(0)}% IRR` : "—"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiagnosisCard({ diagnosis }: { diagnosis: StrategicDiagnosis }) {
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">市场驱动力</div>
      <p className="text-sm font-medium leading-snug text-[var(--color-text-primary)]">{diagnosis.challengeStatement}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)]">
        <span className="rounded bg-black/[0.04] px-2 py-0.5">瓶颈·{diagnosis.bottleneckType}</span>
        <span className="rounded bg-black/[0.04] px-2 py-0.5">枢纽·{diagnosis.crux}</span>
      </div>
    </div>
  );
}

function BrandCards({ brandCards }: { brandCards: { brandCode: string; whereToPlay: string; howToWin: string }[] }) {
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">品牌优势</div>
      <div className="space-y-2">
        {brandCards.map((b) => (
          <div key={b.brandCode} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 flex-shrink-0 rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
              {b.brandCode}
            </span>
            <div className="min-w-0">
              <div className="text-[var(--color-text-secondary)]">{b.whereToPlay}</div>
              <div className="text-[var(--color-text-muted)]">{b.howToWin}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StrategySummaryPanel({
  diagnosis,
  brandCards,
  bscCards,
  investmentCases,
  fpa,
  period,
}: {
  diagnosis: StrategicDiagnosis;
  brandCards: { brandCode: string; whereToPlay: string; howToWin: string }[];
  bscCards: { key: string; label: string; satisfaction: string; target: string; light: TrafficLight }[];
  investmentCases: InvestmentCase[];
  fpa: FpaSummary;
  period: string;
}) {
  const [frame, setFrame] = useState<TimeFrame>("ytd");

  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">战略总览</h2>
        <span className="text-xs text-[var(--color-text-muted)]">{period}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <DiagnosisCard diagnosis={diagnosis} />
          <BrandCards brandCards={brandCards} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">关键指标</div>
              <div className="flex gap-1">
                {(Object.keys(TIME_FRAME_LABELS) as TimeFrame[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFrame(key)}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      frame === key
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-black/[0.04] text-[var(--color-text-muted)] hover:bg-black/[0.08]"
                    }`}
                  >
                    {TIME_FRAME_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
            {frame === "yoy" ? (
              <div className="text-xs text-[var(--color-text-muted)]">
                同期对比数据需接入历史同期口径，当前展示 YTD 对比。
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KpiCard label="营收" actual={fpa.revenueActual} budget={fpa.revenueBudget} unit="currency" />
                  <KpiCard label="利润" actual={fpa.profitActual} budget={fpa.profitBudget} unit="currency" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KpiCard label="营收" actual={fpa.revenueActual} budget={fpa.revenueBudget} unit="currency" />
                  <KpiCard label="利润" actual={fpa.profitActual} budget={fpa.profitBudget} unit="currency" />
                  <KpiCard label="现金流跑道" actual={fpa.cashRunwayMonths} budget={12} unit="months" />
                  <KpiCard label="营收预测达成" actual={fpa.revenueForecast} budget={fpa.revenueBudget} unit="currency" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {bscCards.map((c) => <BscCard key={c.key} card={c} />)}
                </div>
                <div className="mt-3">
                  <OkrList investmentCases={investmentCases} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
