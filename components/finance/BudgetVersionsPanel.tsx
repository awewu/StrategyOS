"use client";

import { useState, useTransition } from "react";
import type { BudgetVersionView, BudgetAction } from "@/lib/finance/budget-versions";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  draft: { text: "草案", cls: "bg-black/[0.06] text-[var(--color-text-secondary)]" },
  submitted: { text: "已上报", cls: "bg-[color-mix(in_srgb,var(--signal-yellow)_14%,white)] text-[var(--signal-yellow)]" },
  approved: { text: "已批准", cls: "bg-[color-mix(in_srgb,var(--signal-green)_14%,white)] text-[var(--signal-green)]" },
  rejected: { text: "已退回", cls: "bg-[color-mix(in_srgb,var(--signal-red)_14%,white)] text-[var(--signal-red)]" },
};

const ACTIONS_BY_STATUS: Record<string, { action: BudgetAction; label: string; needNote?: boolean }[]> = {
  draft: [{ action: "submit", label: "上报" }],
  submitted: [
    { action: "approve", label: "批准", needNote: true },
    { action: "reject", label: "退回", needNote: true },
  ],
  rejected: [{ action: "revise", label: "修订（回到草案）" }],
  approved: [],
};

function fmt(iso: string | null) {
  return iso ? iso.slice(0, 16).replace("T", " ") : "—";
}

export function BudgetVersionsPanel({ initial }: { initial: BudgetVersionView[] }) {
  const [versions, setVersions] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fiscalYear: "2025", name: "", scenarioCode: "Budget", notes: "" });
  const [pending, startTransition] = useTransition();

  async function callApi(init: RequestInit): Promise<BudgetVersionView | null> {
    setError(null);
    const res = await fetch("/api/fpa/budget-versions", {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = (await res.json()) as { version?: BudgetVersionView; error?: string };
    if (!res.ok || !data.version) {
      setError(data.error ?? "操作失败");
      return null;
    }
    return data.version;
  }

  function create() {
    startTransition(async () => {
      const version = await callApi({ method: "POST", body: JSON.stringify(form) });
      if (version) {
        setVersions((v) => [version, ...v]);
        setForm((f) => ({ ...f, name: "", notes: "" }));
      }
    });
  }

  function transition(id: string, action: BudgetAction, needNote?: boolean) {
    const note = needNote ? window.prompt(action === "approve" ? "批准意见（可留空）" : "退回原因（可留空）") ?? "" : "";
    startTransition(async () => {
      const version = await callApi({ method: "PATCH", body: JSON.stringify({ id, action, note }) });
      if (version) setVersions((list) => list.map((v) => (v.id === version.id ? version : v)));
    });
  }

  return (
    <div className="space-y-4">
      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">新建预算版本</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs">
            财年
            <input
              className="stratos-input mt-1 block w-24"
              value={form.fiscalYear}
              onChange={(e) => setForm((f) => ({ ...f, fiscalYear: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            版本名称
            <input
              className="stratos-input mt-1 block w-64"
              placeholder="如：2025 年度预算 V1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            关联情景
            <input
              className="stratos-input mt-1 block w-40"
              value={form.scenarioCode}
              onChange={(e) => setForm((f) => ({ ...f, scenarioCode: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            备注
            <input
              className="stratos-input mt-1 block w-72"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <button
            type="button"
            className="stratos-btn stratos-btn--primary"
            disabled={pending || !form.name.trim()}
            onClick={create}
          >
            创建草案
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-[var(--signal-red)]">{error}</p> : null}
      </div>

      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">版本台账（草案 → 上报 → 批准 / 退回）</h3>
        <div className="stratos-table-wrap">
          <table className="stratos-table">
            <thead>
              <tr>
                <th>财年</th>
                <th>版本</th>
                <th>情景</th>
                <th>状态</th>
                <th>上报</th>
                <th>裁决</th>
                <th>意见</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => {
                const st = STATUS_LABEL[v.status] ?? { text: v.status, cls: "" };
                return (
                  <tr key={v.id}>
                    <td className="font-mono text-xs">{v.fiscalYear}</td>
                    <td className="max-w-[220px] truncate" title={v.notes ?? undefined}>{v.name}</td>
                    <td className="font-mono text-xs">{v.scenarioCode ?? "—"}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>{st.text}</span>
                    </td>
                    <td className="text-xs">
                      {fmt(v.submittedAt)}
                      {v.submittedBy ? <span className="block text-[10px] text-[var(--color-text-muted,#888)]">{v.submittedBy}</span> : null}
                    </td>
                    <td className="text-xs">
                      {fmt(v.decidedAt)}
                      {v.decidedBy ? <span className="block text-[10px] text-[var(--color-text-muted,#888)]">{v.decidedBy}</span> : null}
                    </td>
                    <td className="max-w-[160px] truncate text-xs" title={v.decisionNote ?? undefined}>{v.decisionNote ?? "—"}</td>
                    <td className="text-right">
                      {(ACTIONS_BY_STATUS[v.status] ?? []).map((a) => (
                        <button
                          key={a.action}
                          type="button"
                          className="stratos-btn stratos-btn--ghost ml-1 text-xs"
                          disabled={pending}
                          onClick={() => transition(v.id, a.action, a.needNote)}
                        >
                          {a.label}
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs text-[var(--color-text-muted,#888)]">
                    暂无预算版本——用上方表单创建第一个草案。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-text-muted,#888)]">
          批准为终态；退回后可修订回草案重新上报。全部流转写入审计日志（预算版本流转）。
        </p>
      </div>
    </div>
  );
}
