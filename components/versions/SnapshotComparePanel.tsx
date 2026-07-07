"use client";

import { useMemo, useState } from "react";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import type { DiffRecord } from "@/lib/types/stratos";

type SnapshotOption = {
  code: string;
  period: string;
  status: "FROZEN" | "WORKING";
  rate: number;
};

type CompareResponse = {
  ok?: boolean;
  count?: number;
  source?: string;
  diffs?: DiffRecord[];
  error?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  INTENT_CHANGE: "战略意图",
  BSC_TARGET: "BSC / 目标",
  COMMITMENT_DROP: "BSC / 目标",
  OKR_REPLACE: "OKR / 举措",
  PROJECT_MIGRATE: "执行项目",
  ROADMAP_SLIP: "路线图",
  FPA_FORECAST: "财务预测",
  CASH_RUNWAY: "现金安全线",
  RESOURCE_REALLOC: "资源配置",
  IC_CHANGE: "投资案",
  IC_ROI_DEVIATION: "投资案",
  CAPSTACK_CHANGE: "资本栈",
  CAPACITY_GAP: "产能",
  ASSUMPTION_FAILED: "关键假设",
  ASSUMPTION_NEW: "关键假设",
  HEALTH_LIGHT: "健康断言",
  PRODUCT_BET_CHANGE: "产品赌注",
  EMERGENT_PATTERN: "涌现模式",
  UNREALIZED: "未实现",
  SERENDIPITOUS: "偶成结果",
  DELIBERATE_RATE_DROP: "刻意实现率",
};

function severitySignal(severity: string): "red" | "yellow" | "green" {
  if (severity === "critical" || severity === "high") return "red";
  if (severity === "warning" || severity === "medium") return "yellow";
  return "green";
}

function defaultPair(snapshots: SnapshotOption[]): { fromCode: string; toCode: string } {
  if (snapshots.length >= 2) {
    return {
      fromCode: snapshots[snapshots.length - 2].code,
      toCode: snapshots[snapshots.length - 1].code,
    };
  }
  return { fromCode: snapshots[0]?.code ?? "", toCode: snapshots[0]?.code ?? "" };
}

export function SnapshotComparePanel({ snapshots }: { snapshots: SnapshotOption[] }) {
  const initial = useMemo(() => defaultPair(snapshots), [snapshots]);
  const [fromCode, setFromCode] = useState(initial.fromCode);
  const [toCode, setToCode] = useState(initial.toCode);
  const [diffs, setDiffs] = useState<DiffRecord[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparedPair, setComparedPair] = useState<{ fromCode: string; toCode: string } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, DiffRecord[]>();
    for (const diff of diffs) {
      const label = CATEGORY_LABELS[diff.category] ?? diff.category;
      map.set(label, [...(map.get(label) ?? []), diff]);
    }
    return Array.from(map.entries());
  }, [diffs]);

  async function runCompare() {
    if (!fromCode || !toCode) {
      setError("请先选择两个版本");
      return;
    }
    if (fromCode === toCode) {
      setError("请选择两个不同版本");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diffs/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromCode, toCode, persist: false }),
      });
      const data = (await res.json()) as CompareResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "对比失败");
        return;
      }
      setDiffs(data.diffs ?? []);
      setSource(data.source ?? null);
      setComparedPair({ fromCode, toCode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "对比失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">版本选择 · 快照对比</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            选择旧版本与新版本，实时生成 StratDiff 预览，不写入正式差异记录
          </p>
        </div>
        {comparedPair ? (
          <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs text-[var(--color-accent)]">
            {comparedPair.fromCode} → {comparedPair.toCode}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-xs text-[var(--color-text-muted)]">
          旧版本
          <select
            value={fromCode}
            onChange={(e) => setFromCode(e.target.value)}
            className="mt-1 block w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {snapshots.map((snapshot) => (
              <option key={snapshot.code} value={snapshot.code}>
                {snapshot.code} · {snapshot.status} · {snapshot.rate}%
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          新版本
          <select
            value={toCode}
            onChange={(e) => setToCode(e.target.value)}
            className="mt-1 block w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {snapshots.map((snapshot) => (
              <option key={snapshot.code} value={snapshot.code}>
                {snapshot.code} · {snapshot.status} · {snapshot.rate}%
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={loading || snapshots.length < 2}
          onClick={runCompare}
          className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-bg-deep)] disabled:opacity-50"
        >
          {loading ? "对比中…" : "开始对比"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--signal-red)]">{error}</p> : null}

      <div className="mt-5 border-t border-[var(--surface-border)] pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span>差异 {diffs.length} 条</span>
          {source ? <span>数据源 {source}</span> : null}
          {snapshots.length < 2 ? <span>至少需要两个快照才能对比</span> : null}
        </div>
        {grouped.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">选择两个版本后点击开始对比。</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([group, rows]) => (
              <div key={group} className="border-l border-[var(--surface-border)] pl-4">
                <h3 className="mb-2 text-xs font-medium text-[var(--color-accent)]">
                  {group} · {rows.length}
                </h3>
                <ul className="space-y-2">
                  {rows.map((diff, index) => (
                    <li key={`${diff.category}-${index}`} className="flex gap-3 text-sm">
                      <TrafficLightDot signal={severitySignal(diff.severity)} />
                      <div>
                        <span className="text-[var(--color-text-muted)]">
                          [{diff.category}] [{diff.severity}]{" "}
                        </span>
                        {diff.title}
                        {diff.detail ? (
                          <span className="block text-xs text-[var(--color-text-muted)]">{diff.detail}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
