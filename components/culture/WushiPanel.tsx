"use client";

import { useMemo, useState } from "react";
import {
  buildWushiRiskList,
  QIJI_VERDICT_LABEL,
  READINESS_LABEL,
  qijiTally,
  wushiReadiness,
  type QijiVerdict,
  type ReadinessStatus,
  type WushiAssessment,
  type WushiFactor,
} from "@/lib/culture/wushi";

const STATUS_COLOR: Record<ReadinessStatus, string> = {
  ready: "var(--signal-green)",
  partial: "var(--signal-yellow)",
  gap: "var(--signal-red)",
};

const VERDICT_COLOR: Record<QijiVerdict, string> = {
  we_lead: "var(--signal-green)",
  tie: "var(--color-text-muted)",
  rival_lead: "var(--signal-red)",
  unknown: "var(--signal-yellow)",
};

export function WushiPanel({ assessment, source }: { assessment: WushiAssessment; source?: "database" | "demo" }) {
  const [rival, setRival] = useState(assessment.rival ?? "");
  const [factors, setFactors] = useState<WushiFactor[]>(assessment.factors);
  const [qiji] = useState(assessment.qiji);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  const currentAssessment: WushiAssessment = useMemo(
    () => ({ rival: rival.trim() || undefined, factors, qiji }),
    [rival, factors, qiji],
  );
  const readiness = useMemo(() => wushiReadiness(factors), [factors]);
  const tally = useMemo(() => qijiTally(qiji), [qiji]);
  const risks = useMemo(() => buildWushiRiskList(currentAssessment), [currentAssessment]);

  async function save() {
    setSaving(true);
    setSaveNote("");
    try {
      const r = await fetch("/api/culture/wushi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment: currentAssessment }),
      });
      const d = await r.json();
      if (d.ok) {
        setSaveNote("已保存");
      } else {
        setSaveNote(d.error ?? "保存失败");
      }
    } catch {
      setSaveNote("网络错误");
    } finally {
      setSaving(false);
    }
  }

  function updateFactor(key: string, patch: Partial<WushiFactor>) {
    setFactors((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">五事七计 · 组织战略就绪度</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            《孙子兵法 · 始计篇》· 基于战略规划评估组织准备度（非打分，输出风险清单）·
            道/将/法 组织原生 · 天/地 引用市场洞察/战略罗盘 · 七计对标{rival.trim() || "主要对手"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-text-muted)]">对手：</span>
            <input
              type="text"
              value={rival}
              placeholder="主要对手"
              onChange={(e) => setRival(e.target.value)}
              className="rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
            {source === "database" ? "已持久化" : "Demo"}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
      {saveNote && <p className="text-xs text-[var(--color-text-muted)]">{saveNote}</p>}

      {/* 五事 */}
      <div>
        <div className="mb-2 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text-secondary)]">五事</span>
          <span style={{ color: STATUS_COLOR.ready }}>就绪 {readiness.ready}</span>
          <span style={{ color: STATUS_COLOR.partial }}>部分 {readiness.partial}</span>
          <span style={{ color: STATUS_COLOR.gap }}>缺口 {readiness.gap}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {factors.map((f) => {
            const editable = f.origin === "internal";
            return (
              <div key={f.key} className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3"
                style={{ borderTop: `3px solid ${STATUS_COLOR[f.status]}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-[var(--color-text-primary)]">{f.label}</span>
                  {editable ? (
                    <select
                      value={f.status}
                      onChange={(e) => updateFactor(f.key, { status: e.target.value as ReadinessStatus })}
                      className="rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-primary)]"
                    >
                      <option value="ready">{READINESS_LABEL.ready}</option>
                      <option value="partial">{READINESS_LABEL.partial}</option>
                      <option value="gap">{READINESS_LABEL.gap}</option>
                    </select>
                  ) : (
                    <span className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{ background: STATUS_COLOR[f.status], color: "white" }}>
                      {READINESS_LABEL[f.status]}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">{f.question}</p>
                {editable ? (
                  <input
                    type="text"
                    value={f.note ?? ""}
                    placeholder="备注（可编辑）"
                    onChange={(e) => updateFactor(f.key, { note: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-[10px] text-[var(--color-text-primary)]"
                  />
                ) : (
                  <>
                    {f.origin === "external" && (
                      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                        外部 · 引用 {f.sourceModule}
                      </p>
                    )}
                    {f.note && <p className="mt-1 text-[10px] text-[var(--signal-red)]">{f.note}</p>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 七计 */}
      <div>
        <div className="mb-2 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text-secondary)]">七计 · 敌我对比</span>
          <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px]">由 Hermes 信号自动推导</span>
          <span style={{ color: VERDICT_COLOR.we_lead }}>我优 {tally.weLead}</span>
          <span style={{ color: VERDICT_COLOR.rival_lead }}>对手优 {tally.rivalLead}</span>
          <span style={{ color: VERDICT_COLOR.unknown }}>盲区 {tally.unknown}</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--surface-border)]">
          <table className="w-full text-xs">
            <tbody>
              {assessment.qiji.map((q, i) => (
                <tr key={q.key} className={i % 2 ? "bg-[var(--color-bg-surface)]" : ""}>
                  <td className="px-3 py-2 font-medium text-[var(--color-text-primary)]">{q.label}</td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)]">
                    <div>{q.plain}</div>
                    {q.note && <div className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{q.note}</div>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded px-1.5 py-0.5 text-[10px] text-white"
                      style={{ background: VERDICT_COLOR[q.verdict] }}>
                      {QIJI_VERDICT_LABEL[q.verdict]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 风险清单 */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
          组织战略适配风险清单 <span className="text-[var(--color-text-muted)]">· {risks.length}</span>
        </h3>
        {risks.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">无风险项 —— 组织就绪</p>
        ) : (
          <ul className="space-y-1.5">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-xs">
                <span className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] text-white"
                  style={{ background: r.severity === "high" ? "var(--signal-red)" : "var(--signal-yellow)" }}>
                  {r.severity === "high" ? "高" : "中"}
                </span>
                <span className="text-[var(--color-text-secondary)]">{r.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
