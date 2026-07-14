"use client";

import { useEffect, useMemo, useState } from "react";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

type OrgUnitOption = {
  id: string;
  name: string;
  level: string;
  snapshotCount: number;
};

type PlanSnapshotOption = {
  id: string;
  version: number;
  label: string;
  status: string;
  submittedAt: string;
};

type PlanDiff = {
  category: string;
  severity: "info" | "warning" | "high";
  title: string;
  detail?: string;
  before?: string;
  after?: string;
};

type SnapshotListResponse = {
  selectedOrgId?: string | null;
  orgUnits?: OrgUnitOption[];
  snapshots?: PlanSnapshotOption[];
  source?: string;
  error?: string;
};

type CompareResponse = {
  ok?: boolean;
  count?: number;
  source?: string;
  diffs?: PlanDiff[];
  error?: string;
  fromVersion?: number;
  toVersion?: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  STRATEGIC_INTENT: "战略意图",
  NORTH_STAR: "北极星指标",
  MARKET_INSIGHT: "市场洞察",
  SWOT: "SWOT",
  BSC_OBJECTIVE: "BSC 目标/KPI",
  INITIATIVE: "OKR/关键举措",
  ACTION_PLAN: "作战计划",
  ORGANIZATION: "组织规划",
  RESOURCE_BUDGET: "资源预算",
  ASSUMPTION: "关键假设",
  ROADMAP: "路线图",
};

function severitySignal(severity: string): "red" | "yellow" | "green" {
  if (severity === "high") return "red";
  if (severity === "warning") return "yellow";
  return "green";
}

function severityLabel(severity: PlanDiff["severity"]): string {
  if (severity === "high") return "高";
  if (severity === "warning") return "中";
  return "低";
}

export function SnapshotComparePanel() {
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [snapshots, setSnapshots] = useState<PlanSnapshotOption[]>([]);
  const [orgUnitId, setOrgUnitId] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [diffs, setDiffs] = useState<PlanDiff[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparedPair, setComparedPair] = useState<{ from: string; to: string } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, PlanDiff[]>();
    for (const diff of diffs) {
      const label = CATEGORY_LABELS[diff.category] ?? diff.category;
      map.set(label, [...(map.get(label) ?? []), diff]);
    }
    return Array.from(map.entries());
  }, [diffs]);

  useEffect(() => {
    void loadSnapshots("");
  }, []);

  async function loadSnapshots(nextOrgUnitId: string) {
    setLoadingList(true);
    setError(null);
    try {
      const qs = nextOrgUnitId ? `?orgUnitId=${encodeURIComponent(nextOrgUnitId)}` : "";
      const res = await fetch(`/api/strategy/plan/snapshots${qs}`);
      const data = (await res.json()) as SnapshotListResponse;
      if (!res.ok) {
        setError(data.error ?? "加载组织版本失败");
        return;
      }
      const nextOrgUnits = data.orgUnits ?? [];
      const nextSnapshots = data.snapshots ?? [];
      const selectedOrg = data.selectedOrgId ?? nextOrgUnitId ?? nextOrgUnits[0]?.id ?? "";
      setOrgUnits(nextOrgUnits);
      setOrgUnitId(selectedOrg);
      setSnapshots(nextSnapshots);
      setSource(data.source ?? null);
      setDiffs([]);
      setComparedPair(null);
      if (nextSnapshots.length >= 2) {
        setFromId(nextSnapshots[nextSnapshots.length - 2].id);
        setToId(nextSnapshots[nextSnapshots.length - 1].id);
      } else {
        setFromId(nextSnapshots[0]?.id ?? "");
        setToId(nextSnapshots[0]?.id ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载组织版本失败");
    } finally {
      setLoadingList(false);
    }
  }

  async function runCompare() {
    if (!fromId || !toId) {
      setError("请先选择两个版本");
      return;
    }
    if (fromId === toId) {
      setError("请选择两个不同版本");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strategy/plan/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId, toId }),
      });
      const data = (await res.json()) as CompareResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "对比失败");
        return;
      }
      setDiffs(data.diffs ?? []);
      setSource(data.source ?? null);
      const from = snapshots.find((snapshot) => snapshot.id === fromId);
      const to = snapshots.find((snapshot) => snapshot.id === toId);
      setComparedPair({ from: from?.label ?? `V${data.fromVersion ?? ""}`, to: to?.label ?? `V${data.toVersion ?? ""}` });
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
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">组织战略版本对比</h2>
          <p className="mt-1 text-caption">
            先选择组织，再选择该组织的两个提交版本；对比结果只预览，不写入公司级 StratDiff
          </p>
        </div>
        {comparedPair ? (
          <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs text-[var(--color-accent)]">
            {comparedPair.from} → {comparedPair.to}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
        <label className="text-caption">
          组织
          <select
            value={orgUnitId}
            onChange={(e) => void loadSnapshots(e.target.value)}
            className="mt-1 block w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {orgUnits.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} · {org.snapshotCount} 个版本
              </option>
            ))}
          </select>
        </label>
        <label className="text-caption">
          旧版本
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="mt-1 block w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {snapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-caption">
          新版本
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="mt-1 block w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {snapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={loading || loadingList || snapshots.length < 2}
          onClick={runCompare}
          className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-bg-deep)] disabled:opacity-50"
        >
          {loading ? "对比中…" : loadingList ? "加载中…" : "开始对比"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--signal-red)]">{error}</p> : null}

      <div className="mt-5 border-t border-[var(--surface-border)] pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-caption">
          <span>差异 {diffs.length} 条</span>
          {source ? <span>数据源 {source}</span> : null}
          {snapshots.length < 2 ? <span>该组织至少需要两个提交版本才能对比</span> : null}
        </div>
        {grouped.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            {snapshots.length < 2 ? "提交两次审核后，这里会出现可对比版本。" : "选择两个版本后点击开始对比。"}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)]">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead className="bg-black/[0.03] text-caption">
                <tr>
                  <th className="w-32 px-3 py-2 font-medium">模块</th>
                  <th className="w-20 px-3 py-2 font-medium">级别</th>
                  <th className="w-48 px-3 py-2 font-medium">变化项</th>
                  <th className="px-3 py-2 font-medium">变更前</th>
                  <th className="px-3 py-2 font-medium">变更后</th>
                  <th className="w-40 px-3 py-2 font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {grouped.flatMap(([group, rows]) =>
                  rows.map((diff, index) => (
                    <tr
                      key={`${diff.category}-${index}`}
                      className="border-t border-[var(--surface-border)] align-top"
                    >
                      <td className="px-3 py-3 text-xs font-medium text-[var(--color-accent)]">
                        {group}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap text-caption">
                          <TrafficLightDot signal={severitySignal(diff.severity)} />
                          {severityLabel(diff.severity)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-[var(--color-text-primary)]">{diff.title}</div>
                        <div className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
                          {diff.category}
                        </div>
                      </td>
                      <td className="max-w-md px-3 py-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                        <div className="max-h-32 overflow-auto whitespace-pre-wrap break-words">
                          {diff.before ?? "-"}
                        </div>
                      </td>
                      <td className="max-w-md px-3 py-3 text-xs leading-relaxed text-[var(--color-text-primary)]">
                        <div className="max-h-32 overflow-auto whitespace-pre-wrap break-words">
                          {diff.after ?? "-"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-caption">
                        {diff.detail ?? "-"}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
