"use client";

import { useState } from "react";
import { objectiveProgress, ttiScore, ttiTone, type OkrObjective } from "@/lib/decode/okr";
import type { SaveOkrPayload } from "@/lib/decode/okr-access";

const TONE_COLOR: Record<string, string> = {
  green: "var(--signal-green)",
  yellow: "var(--signal-yellow)",
  red: "var(--signal-red)",
  neutral: "var(--color-text-muted)",
};

const inputCls =
  "w-full rounded-md border border-[var(--surface-border)] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function ProgressBar({ progress }: { progress: number | null }) {
  const tone = ttiTone(progress);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round(Math.min(1, progress ?? 0) * 100)}%`,
            backgroundColor: TONE_COLOR[tone],
          }}
        />
      </div>
      <span className="w-12 text-right font-mono text-xs" style={{ color: TONE_COLOR[tone] }}>
        {progress == null ? "—" : `${Math.round(progress * 100)}%`}
      </span>
    </div>
  );
}

export function OkrEditor({
  objectives: initial,
  source,
  canEdit,
}: {
  objectives: OkrObjective[];
  source: "database" | "demo";
  canEdit: boolean;
}) {
  const [objectives, setObjectives] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function flash(kind: "ok" | "err", text: string) {
    setMsg({ kind, text });
    window.setTimeout(() => setMsg(null), 4000);
  }

  function patchObjective(i: number, patch: Partial<OkrObjective>) {
    setObjectives((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  }

  function patchKr(oi: number, ki: number, patch: Partial<OkrObjective["keyResults"][number]>) {
    setObjectives((prev) =>
      prev.map((o, j) =>
        j === oi
          ? { ...o, keyResults: o.keyResults.map((kr, k) => (k === ki ? { ...kr, ...patch } : kr)) }
          : o,
      ),
    );
  }

  function newKr(): OkrObjective["keyResults"][number] {
    return {
      id: "",
      title: "",
      baselineValue: null,
      targetValue: null,
      currentValue: null,
      unit: null,
      confidence: null,
      isLeadingIndicator: true,
      commitmentCount: 0,
    };
  }

  async function save() {
    setBusy(true);
    try {
      const payload: SaveOkrPayload = {
        objectives: objectives.map((o) => ({
          id: o.id || undefined,
          title: o.title,
          intent: o.intent,
          ownerName: o.ownerName,
          hoshinEntryId: o.hoshinEntryId,
          keyResults: o.keyResults.map((kr) => ({
            id: kr.id || undefined,
            title: kr.title,
            baselineValue: kr.baselineValue,
            targetValue: kr.targetValue,
            currentValue: kr.currentValue,
            unit: kr.unit,
            isLeadingIndicator: kr.isLeadingIndicator,
          })),
        })),
      };
      const res = await fetch("/api/decode/okr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as { error?: string; objectives?: OkrObjective[] };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.objectives) setObjectives(j.objectives);
      setEditing(false);
      flash("ok", "OKR 已保存");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function loadHoshinDraft() {
    if (objectives.length > 0 && !confirm("从 X-Matrix 年度突破生成草稿会替换当前未保存内容，继续？")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/decode/okr?draft=hoshin");
      const j = (await res.json()) as { draft?: SaveOkrPayload; error?: string };
      if (!res.ok || !j.draft) throw new Error(j.error ?? "生成失败");
      if (j.draft.objectives.length === 0) {
        flash("err", "X-Matrix 无「年度突破」条目，无可承接");
        return;
      }
      setObjectives(
        j.draft.objectives.map((o, i) => ({
          id: "",
          title: o.title,
          intent: o.intent ?? null,
          ownerName: o.ownerName ?? null,
          hoshinEntryId: o.hoshinEntryId ?? null,
          hoshinLabel: null,
          sortOrder: i,
          keyResults: o.keyResults.map((kr) => ({
            id: "",
            title: kr.title,
            baselineValue: kr.baselineValue ?? null,
            targetValue: kr.targetValue ?? null,
            currentValue: kr.currentValue ?? null,
            unit: kr.unit ?? null,
            confidence: null,
            isLeadingIndicator: kr.isLeadingIndicator ?? true,
            commitmentCount: 0,
          })),
        })),
      );
      setEditing(true);
      flash("ok", `已从 X-Matrix 承接 ${j.draft.objectives.length} 个年度突破 — 补齐 TTI 三元组后保存`);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-caption">
        OKR 记<b>改进量</b>不记状态：KR = 基线 → 靶值，当前值打分 · 0.7 即成功 · 行动挂承诺账本，此处只存结果
      </p>

      {msg ? (
        <p
          className="rounded-md px-3 py-2 text-sm"
          style={{
            color: msg.kind === "ok" ? "var(--signal-green)" : "var(--signal-red)",
            backgroundColor:
              msg.kind === "ok"
                ? "color-mix(in srgb, var(--signal-green) 8%, white)"
                : "color-mix(in srgb, var(--signal-red) 8%, white)",
          }}
        >
          {msg.text}
        </p>
      ) : null}

      {objectives.map((o, oi) => {
        const oProgress = objectiveProgress(o);
        return (
          <section key={o.id || `new-${oi}`} className="stratos-card stratos-card--padded">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="space-y-2">
                    <input
                      className={inputCls}
                      value={o.title}
                      onChange={(e) => patchObjective(oi, { title: e.target.value })}
                      placeholder="O：本周期战略主攻方向（指向战场，不求平衡）"
                    />
                    <input
                      className={inputCls}
                      value={o.intent ?? ""}
                      onChange={(e) => patchObjective(oi, { intent: e.target.value || null })}
                      placeholder="意图说明（可选）"
                    />
                    <input
                      className={inputCls + " max-w-56"}
                      value={o.ownerName ?? ""}
                      onChange={(e) => patchObjective(oi, { ownerName: e.target.value || null })}
                      placeholder="Owner"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                      O{oi + 1} · {o.title}
                    </h3>
                    {o.intent ? (
                      <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{o.intent}</p>
                    ) : null}
                    <p className="mt-1 flex flex-wrap gap-3 text-caption">
                      {o.ownerName ? <span>Owner {o.ownerName}</span> : null}
                      {o.hoshinLabel ? (
                        <span className="text-[var(--color-accent)]" title="承接自 X-Matrix">
                          ↰ {o.hoshinLabel}
                        </span>
                      ) : (
                        <span className="text-[var(--signal-yellow)]">未挂 Hoshin 承接链</span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ProgressBar progress={oProgress} />
                {editing ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--signal-red)] hover:underline"
                    onClick={() => setObjectives((prev) => prev.filter((_, j) => j !== oi))}
                  >
                    删 O
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {o.keyResults.map((kr, ki) => {
                const s = ttiScore(kr.baselineValue, kr.targetValue, kr.currentValue);
                return (
                  <div
                    key={kr.id || `new-kr-${ki}`}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--surface-border)] p-3 text-sm"
                  >
                    {editing ? (
                      <>
                        <input
                          className={inputCls + " min-w-48 flex-1"}
                          value={kr.title}
                          onChange={(e) => patchKr(oi, ki, { title: e.target.value })}
                          placeholder="KR：可证伪的关键成果"
                        />
                        <input
                          className={inputCls + " w-20"}
                          value={kr.baselineValue ?? ""}
                          onChange={(e) => patchKr(oi, ki, { baselineValue: e.target.value || null })}
                          placeholder="基线"
                        />
                        <span className="text-[var(--color-text-muted)]">→</span>
                        <input
                          className={inputCls + " w-20"}
                          value={kr.targetValue ?? ""}
                          onChange={(e) => patchKr(oi, ki, { targetValue: e.target.value || null })}
                          placeholder="靶值"
                        />
                        <input
                          className={inputCls + " w-20"}
                          value={kr.currentValue ?? ""}
                          onChange={(e) => patchKr(oi, ki, { currentValue: e.target.value || null })}
                          placeholder="当前"
                        />
                        <input
                          className={inputCls + " w-16"}
                          value={kr.unit ?? ""}
                          onChange={(e) => patchKr(oi, ki, { unit: e.target.value || null })}
                          placeholder="单位"
                        />
                        <button
                          type="button"
                          className="text-xs text-[var(--signal-red)] hover:underline"
                          onClick={() =>
                            patchObjective(oi, { keyResults: o.keyResults.filter((_, k) => k !== ki) })
                          }
                        >
                          删
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1">{kr.title}</span>
                        <span className="font-mono text-caption">
                          {kr.baselineValue ?? "0"} → {kr.targetValue ?? "?"}
                          {kr.unit ? ` ${kr.unit}` : ""} · 当前 {kr.currentValue ?? "—"}
                        </span>
                        {kr.commitmentCount > 0 ? (
                          <a
                            href="/cockpit"
                            className="text-xs text-[var(--color-accent)] hover:underline"
                            title="挂接的承诺（行动在承诺账本）"
                          >
                            ↓ {kr.commitmentCount} 承诺
                          </a>
                        ) : null}
                        <ProgressBar progress={s.progress} />
                      </>
                    )}
                  </div>
                );
              })}
              {editing ? (
                <button
                  type="button"
                  className="text-xs text-[var(--color-accent)] hover:underline"
                  onClick={() => patchObjective(oi, { keyResults: [...o.keyResults, newKr()] })}
                >
                  + KR
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      {objectives.length === 0 ? (
        <div className="stratos-card stratos-card--padded text-sm text-[var(--color-text-muted)]">
          当期暂无 OKR。从 X-Matrix 年度突破一键承接，或手动新增 O。
        </div>
      ) : null}

      <div className="stratos-card stratos-card--padded flex flex-wrap items-center gap-3">
        <span className="text-caption">
          数据源 {source === "database" ? "DB" : "Demo"} · O ≤ 5（聚焦） · 先导指标 · 与 BSC 各看各的
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && !editing ? (
            <>
              <button
                type="button"
                disabled={busy}
                className="stratos-btn px-3 py-1.5 text-xs"
                onClick={() => void loadHoshinDraft()}
              >
                从 X-Matrix 承接
              </button>
              <button
                type="button"
                className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
                onClick={() => setEditing(true)}
              >
                编辑
              </button>
            </>
          ) : null}
          {canEdit && editing ? (
            <>
              <button
                type="button"
                disabled={objectives.length >= 5}
                className="stratos-btn px-3 py-1.5 text-xs disabled:opacity-50"
                onClick={() =>
                  setObjectives((prev) => [
                    ...prev,
                    {
                      id: "",
                      title: "",
                      intent: null,
                      ownerName: null,
                      hoshinEntryId: null,
                      hoshinLabel: null,
                      sortOrder: prev.length,
                      keyResults: [newKr()],
                    },
                  ])
                }
              >
                + O
              </button>
              <button
                type="button"
                disabled={busy}
                className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
                onClick={() => void save()}
              >
                {busy ? "保存中…" : "保存"}
              </button>
              <button
                type="button"
                className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs"
                onClick={() => {
                  setObjectives(initial);
                  setEditing(false);
                }}
              >
                取消
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
