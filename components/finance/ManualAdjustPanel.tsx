"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/primitives";

type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: readonly string[];
  required?: boolean;
};

type Row = Record<string, unknown> & { id: string };

type EditOp =
  | { op: "update"; factId: string; before: Record<string, unknown>; after: Record<string, unknown> }
  | { op: "create"; after: Record<string, unknown> }
  | { op: "delete"; factId: string; before: Record<string, unknown> };

type Proposal = {
  id: string;
  target: "ops_metric" | "pvi_sales";
  period: string | null;
  title: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  ops: EditOp[];
  summary: { creates: number; updates: number; deletes: number };
  note: string | null;
  createdBy: string | null;
  submittedBy: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: string;
};

const TARGETS = [
  { kind: "ops_metric", label: "运营指标" },
  { kind: "pvi_sales", label: "PVI 新品销售" },
] as const;

type Target = (typeof TARGETS)[number]["kind"];

const STATUS_LABEL: Record<Proposal["status"], string> = {
  draft: "草稿",
  submitted: "待审批",
  approved: "已生效",
  rejected: "已退回",
};

const STATUS_COLOR: Record<Proposal["status"], string> = {
  draft: "var(--color-text-muted)",
  submitted: "var(--signal-yellow)",
  approved: "var(--signal-green)",
  rejected: "var(--signal-red)",
};

export type ManualAdjustInitial = {
  target: Target;
  fields: FieldSpec[];
  rows: Row[];
  proposals: Proposal[];
};

export function ManualAdjustPanel({ initial }: { initial: ManualAdjustInitial }) {
  const [target, setTarget] = useState<Target>(initial.target);
  const [period, setPeriod] = useState("");
  const [fields, setFields] = useState<FieldSpec[]>(initial.fields);
  const [rows, setRows] = useState<Row[]>(initial.rows);
  const [proposals, setProposals] = useState<Proposal[]>(initial.proposals);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newSeq, setNewSeq] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(nextTarget: Target = target, nextPeriod: string = period) {
    setError(null);
    const qs = new URLSearchParams({ target: nextTarget, rows: "1" });
    if (nextPeriod.trim()) qs.set("period", nextPeriod.trim());
    const res = await fetch(`/api/fpa/edit-proposals?${qs}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "加载失败");
      return;
    }
    setFields(data.fields ?? []);
    setRows((data.rows ?? []) as Row[]);
    setProposals((data.proposals ?? []) as Proposal[]);
  }

  const setCell = (id: string, key: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    const id = `new:${newSeq}`;
    setNewSeq((n) => n + 1);
    const blank: Row = { id };
    for (const f of fields) blank[f.key] = "";
    setRows((prev) => [...prev, blank]);
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  async function createDraft(thenSubmit: boolean) {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/edit-proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target,
          period: period.trim() || null,
          title: title.trim() || "手工调整",
          edited: rows,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成变更集失败");
      const id = data.proposal.id as string;
      if (thenSubmit) {
        const sres = await fetch("/api/fpa/edit-proposals", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, action: "submit" }),
        });
        const sdata = await sres.json();
        if (!sres.ok) throw new Error(sdata.error ?? "提交失败");
      }
      setTitle("");
      setMsg(thenSubmit ? "已提交审批" : "已存为草稿");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "submit" | "approve" | "reject" | "revise") {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const note = action === "reject" ? window.prompt("退回意见（可选）") ?? "" : "";
      const res = await fetch("/api/fpa/edit-proposals", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "操作失败");
      setMsg(`已${action === "approve" ? "批准生效" : action === "reject" ? "退回" : action === "revise" ? "转回草稿" : "提交"}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  const changedCount = rows.length;

  return (
    <div className="space-y-4">
      <div className="stratos-card stratos-card--padded space-y-4">
        <header className="stratos-section-header">
          <div>
            <h3 className="stratos-section-title">手工调整 · 编辑 → 变更集 → 审批（生效前双人复核）</h3>
            <p className="stratos-section-desc">编辑单元格后提交，审批通过才写入生效表；GL/TB 只读不在此列</p>
          </div>
        </header>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-caption text-[var(--color-text-muted)]">数据表</span>
            <Select
              selectSize="sm"
              wrapperClassName="w-40"
              className="text-caption"
              value={target}
              onChange={(e) => {
                const t = e.target.value as Target;
                setTarget(t);
                void load(t, period);
              }}
            >
              {TARGETS.map((t) => (
                <option key={t.kind} value={t.kind}>{t.label}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-[var(--color-text-muted)]">期间筛选（可空=全部）</span>
            <Input
              inputSize="sm"
              className="w-28 font-data text-caption"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              onBlur={() => void load(target, period)}
              placeholder="2025-01"
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void load()} className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption">加载</button>
          <button type="button" onClick={addRow} className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption">+ 新增行</button>
        </div>

        {error ? (
          <div className="rounded border border-[var(--signal-red)] px-3 py-2 text-caption text-[var(--signal-red)]">{error}</div>
        ) : null}
        {msg ? (
          <div className="rounded border border-[var(--signal-green)] px-3 py-2 text-caption text-[var(--signal-green)]">{msg}</div>
        ) : null}

        <div className="stratos-table-wrap max-h-[28rem] overflow-auto">
          <table className="stratos-table">
            <thead>
              <tr>
                {fields.map((f) => (
                  <th key={f.key} className="text-left">{f.label}{f.required ? " *" : ""}</th>
                ))}
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isNew = String(r.id).startsWith("new:");
                return (
                  <tr key={r.id} style={isNew ? { background: "color-mix(in srgb, var(--signal-green) 8%, transparent)" } : undefined}>
                    {fields.map((f) => (
                      <td key={f.key}>
                        {f.type === "select" ? (
                          <Select fullWidth selectSize="sm" className="text-caption" value={String(r[f.key] ?? "")} onChange={(e) => setCell(r.id, f.key, e.target.value)}>
                            <option value="">—</option>
                            {(f.options ?? []).map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            fullWidth
                            inputSize="sm"
                            value={String(r[f.key] ?? "")}
                            inputMode={f.type === "number" ? "decimal" : undefined}
                            onChange={(e) => setCell(r.id, f.key, e.target.value)}
                            className={`text-caption ${f.type === "number" ? "text-right font-data" : ""}`}
                          />
                        )}
                      </td>
                    ))}
                    <td className="text-right">
                      <button type="button" onClick={() => removeRow(r.id)} className="text-caption text-[var(--signal-red)]">删除</button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr><td colSpan={fields.length + 1} className="text-caption text-[var(--color-text-muted)]">暂无数据 — 点「新增行」添加</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input inputSize="sm" className="w-64 text-caption" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="变更标题（如：Q1 人头补录）" />
          <span className="text-caption text-[var(--color-text-muted)]">当前 {changedCount} 行；提交时按最新生效数据比对生成变更集</span>
          <div className="ml-auto flex gap-2">
            <button type="button" disabled={busy} onClick={() => void createDraft(false)} className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption">存草稿</button>
            <button type="button" disabled={busy} onClick={() => void createDraft(true)} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-caption">提交审批</button>
          </div>
        </div>
      </div>

      <div className="stratos-card stratos-card--padded space-y-3">
        <h3 className="stratos-section-title">变更集台账 · 审批</h3>
        {proposals.length === 0 ? (
          <p className="text-caption text-[var(--color-text-muted)]">暂无变更集</p>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={p.id} className="rounded border border-[var(--surface-border)] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-caption" style={{ color: STATUS_COLOR[p.status] }}>{STATUS_LABEL[p.status]}</span>
                  <span className="text-caption text-[var(--color-text-muted)]">
                    {TARGETS.find((t) => t.kind === p.target)?.label} · {p.period ?? "全期"} · 新增 {p.summary.creates} / 改 {p.summary.updates} / 删 {p.summary.deletes}
                  </span>
                  <button type="button" className="text-caption text-[var(--accent-sky)]" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    {expanded === p.id ? "收起 diff" : "查看 diff"}
                  </button>
                  <div className="ml-auto flex gap-2">
                    {p.status === "draft" ? (
                      <button type="button" disabled={busy} onClick={() => void act(p.id, "submit")} className="stratos-btn stratos-btn--ghost px-2.5 py-1 text-caption">提交审批</button>
                    ) : null}
                    {p.status === "submitted" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => void act(p.id, "approve")} className="stratos-btn stratos-btn--primary px-2.5 py-1 text-caption">批准生效</button>
                        <button type="button" disabled={busy} onClick={() => void act(p.id, "reject")} className="stratos-btn stratos-btn--ghost px-2.5 py-1 text-caption">退回</button>
                      </>
                    ) : null}
                    {p.status === "rejected" ? (
                      <button type="button" disabled={busy} onClick={() => void act(p.id, "revise")} className="stratos-btn stratos-btn--ghost px-2.5 py-1 text-caption">转回草稿</button>
                    ) : null}
                  </div>
                </div>
                {p.decisionNote ? <p className="mt-1 text-caption text-[var(--signal-red)]">退回意见：{p.decisionNote}</p> : null}
                {expanded === p.id ? <DiffView ops={p.ops} /> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiffView({ ops }: { ops: EditOp[] }) {
  return (
    <div className="mt-2 space-y-1 border-t border-[var(--surface-border)] pt-2">
      {ops.map((op, i) => {
        if (op.op === "create") {
          return (
            <p key={i} className="text-caption">
              <span className="text-[var(--signal-green)]">+ 新增</span>{" "}
              <span className="font-data">{fmtRow(op.after)}</span>
            </p>
          );
        }
        if (op.op === "delete") {
          return (
            <p key={i} className="text-caption">
              <span className="text-[var(--signal-red)]">− 删除</span>{" "}
              <span className="font-data line-through">{fmtRow(op.before)}</span>
            </p>
          );
        }
        const changes = Object.keys(op.after).filter((k) => op.before[k] !== op.after[k]);
        return (
          <p key={i} className="text-caption">
            <span className="text-[var(--signal-yellow)]">~ 改</span>{" "}
            {changes.map((k) => (
              <span key={k} className="font-data">
                {k}: {String(op.before[k] ?? "∅")} → {String(op.after[k] ?? "∅")}{" "}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function fmtRow(r: Record<string, unknown>): string {
  return Object.entries(r)
    .filter(([, v]) => v !== null && v !== "")
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(", ");
}
