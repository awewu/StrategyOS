"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CompassBundle, CompassMilestone, PremiseAudit } from "@/lib/compass/types";
import {
  NorthStarEditModal,
  saveNorthStarToApi,
  type NorthStarForm,
} from "@/components/compass/NorthStarEditModal";
import { riskVerdict } from "@/lib/compass/risk-engine";

const CATEGORY_LABEL: Record<string, string> = {
  market: "市场", technology: "技术", regulation: "政策", competition: "竞争", capability: "能力",
};

function pct(v: number) { return `${Math.round(v * 100)}%`; }
function wan(v: number) { return v >= 10000 ? `${(v / 10000).toFixed(1)}亿` : `${Math.round(v)}万`; }

function RiskBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-caption">—</span>;
  const v = riskVerdict(score);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-black/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: v.color }} />
      </div>
      <span className="text-xs font-medium" style={{ color: v.color }}>{score} · {v.label}</span>
    </div>
  );
}

function ConfidenceFragilityDot({ confidence, fragility }: { confidence: number; fragility: number }) {
  // High fragility + low confidence = danger zone
  const danger = fragility >= 70 && confidence < 60;
  const warn = fragility >= 50 && confidence < 70;
  return (
    <span
      className="inline-flex h-2 w-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: danger ? "var(--signal-red)" : warn ? "var(--signal-yellow)" : "var(--signal-green)" }}
      title={`置信度 ${confidence}% · 脆弱性 ${fragility}%`}
    />
  );
}

export function CompassClient({ bundle }: { bundle: CompassBundle }) {
  const { northStar, milestones, premises, currentRevenue, planBsc, planSource, planId } = bundle;
  const [tab, setTab] = useState<"path" | "premises">("path");
  const [editPremise, setEditPremise] = useState<PremiseAudit | null>(null);
  const [editMilestone, setEditMilestone] = useState<CompassMilestone | null>(null);
  const [editNorthStar, setEditNorthStar] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const persistedNorthStar = Boolean(planId) || (northStar?.id && !northStar.id.startsWith("demo"));

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  async function syncCompassAudit(mode: "assumptions" | "signals" | "all") {
    if (!persistedNorthStar) {
      flash("Demo 模式：请先保存使命愿景后再同步");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/compass/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, planId: planId ?? undefined }),
      });
      if (!res.ok) throw new Error();
      flash(mode === "assumptions" ? "已从战略假设同步" : mode === "signals" ? "已刷新自动审计" : "同步完成");
      window.location.reload();
    } catch { flash("同步失败"); }
    finally { setSaving(false); }
  }

  async function saveMilestone(form: CompassMilestone) {
    if (!persistedNorthStar || !northStar) {
      flash("请先保存使命愿景后再编辑里程碑");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/compass/milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id && form.id.includes("-") ? form.id : undefined,
          planId: planId ?? undefined,
          northStarId: planId ? undefined : northStar.id,
          year: form.year,
          label: form.label,
          revenueTarget: form.revenueTarget,
          profitMarginTarget: form.profitMarginTarget,
          keyConditions: form.keyConditions,
          revenueActual: form.revenueActual,
          progressNote: form.progressNote,
        }),
      });
      if (!res.ok) throw new Error();
      flash("里程碑已保存");
      setEditMilestone(null);
      window.location.reload();
    } catch { flash("保存失败"); }
    finally { setSaving(false); }
  }

  async function seedCompassPath() {
    setSaving(true);
    try {
      const res = await fetch("/api/compass/seed", { method: "POST" });
      if (!res.ok) throw new Error();
      flash("已生成路径与前提模板");
      window.location.reload();
    } catch { flash("生成失败"); }
    finally { setSaving(false); }
  }

  async function savePremise(form: Partial<PremiseAudit> & { northStarId?: string }) {
    setSaving(true);
    try {
      const res = await fetch("/api/compass/premise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          planId: planId ?? undefined,
          northStarId: planId ? undefined : northStar?.id,
        }),
      });
      if (!res.ok) throw new Error();
      flash("已保存");
      setEditPremise(null);
      window.location.reload();
    } catch { flash("保存失败"); }
    finally { setSaving(false); }
  }

  async function saveNorthStar(form: NorthStarForm) {
    setSaving(true);
    try {
      await saveNorthStarToApi(form, northStar);
      flash("已保存");
      setEditNorthStar(false);
      window.location.reload();
    } catch (e) {
      flash(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (!northStar) {
    return (
      <div className="space-y-4">
        {toast && (
          <div className="fixed right-6 top-6 z-50 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--surface-border)] px-4 py-2 text-sm shadow-lg">
            {toast}
          </div>
        )}
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--surface-border-strong)] text-sm text-[var(--color-text-muted)]">
          <span>尚未设定使命愿景。请先录入企业5年终极目标。</span>
          <button onClick={() => setEditNorthStar(true)}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white">
            录入使命愿景
          </button>
        </div>
        {editNorthStar && (
          <NorthStarEditModal northStar={null} saving={saving}
            onClose={() => setEditNorthStar(false)} onSave={saveNorthStar} />
        )}
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const yearsToTarget = northStar.targetYear - currentYear;
  const requiredCagr = Math.pow(northStar.revenueTarget / Math.max(currentRevenue, 1), 1 / Math.max(yearsToTarget, 1)) - 1;
  const failCount = premises.filter(p => p.failSignal).length;
  const fragileCount = premises.filter(p => p.fragility >= 70 && p.confidence < 60).length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--surface-border)] px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* North Star card */}
      <section className="rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-bg-surface)] p-6">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-wide text-[var(--color-accent)]">使命</div>
          <button onClick={() => setEditNorthStar(true)}
            className="text-xs text-[var(--color-accent)] hover:underline">编辑使命愿景</button>
        </div>
        <p className="text-base font-medium text-[var(--color-text-primary)]">{northStar.mission}</p>
        <div className="mt-4 mb-1 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">愿景 · {northStar.targetYear}</div>
        <p className="text-sm text-[var(--color-text-secondary)]">{northStar.vision}</p>

        {planBsc && planBsc.length > 0 ? (
          <div className="mt-5 rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-[var(--color-accent)]">
                BSC 目标 · 战略计划同源
              </span>
              <span className="text-caption">
                {planSource === "database" ? "数据库" : "Demo"}
              </span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {planBsc.map((row) => (
                <li key={row.dim} className="text-xs">
                  <span className="text-[var(--color-text-muted)]">{row.dim} · </span>
                  <span className="text-[var(--color-text-primary)]">{row.objective}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "终点营收", value: wan(northStar.revenueTarget) },
            { label: "目标利润率", value: pct(northStar.profitMarginTarget) },
            { label: "当前营收", value: wan(currentRevenue) },
            { label: "所需年复合增速", value: pct(requiredCagr), warn: requiredCagr > 0.25 },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-black/[0.025] px-3 py-2.5">
              <div className="text-[11px] tracking-wide text-[var(--color-text-muted)]">{item.label}</div>
              <div className={`mt-1 font-data text-lg font-semibold ${item.warn ? "text-[var(--signal-red)]" : "text-[var(--color-text-primary)]"}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {(northStar.marketPositionDesc || northStar.geographyDesc || northStar.brandDesc) && (
          <div className="mt-4 grid gap-2 text-xs text-[var(--color-text-secondary)] sm:grid-cols-3">
            {northStar.marketPositionDesc && <div><span className="text-[var(--color-text-muted)]">市场地位 · </span>{northStar.marketPositionDesc}</div>}
            {northStar.geographyDesc && <div><span className="text-[var(--color-text-muted)]">地理覆盖 · </span>{northStar.geographyDesc}</div>}
            {northStar.brandDesc && <div><span className="text-[var(--color-text-muted)]">品牌格局 · </span>{northStar.brandDesc}</div>}
          </div>
        )}
      </section>

      {/* Alert bar */}
      {(failCount > 0 || fragileCount > 0) && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5 px-4 py-3 text-sm">
          {failCount > 0 && (
            <span className="text-[var(--signal-red)] font-medium">⚠ {failCount} 条战略前提已出现失效信号</span>
          )}
          {fragileCount > 0 && (
            <span className="text-[var(--signal-yellow)] font-medium">△ {fragileCount} 条高脆弱性假设置信度不足</span>
          )}
          <span className="text-caption ml-auto">点击下方「前提审计」查看详情</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-1 w-fit">
        {([["path", "路径风险反推"], ["premises", "战略前提审计"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${tab === id ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Path tab */}
      {tab === "path" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption">从终点目标逐年反推所需增速和关键条件，系统自动计算路径风险分。</p>
            {persistedNorthStar ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditMilestone({
                  id: "",
                  year: currentYear + 1,
                  label: "",
                  revenueTarget: null,
                  profitMarginTarget: null,
                  keyConditions: [],
                  revenueActual: null,
                  progressNote: null,
                  riskScore: null,
                  riskFactors: [],
                })}
                className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-60"
              >
                + 添加里程碑
              </button>
            ) : null}
          </div>
          {milestones.length === 0 ? (
            <EmptyState
              title="尚未生成路径里程碑"
              hint="保存使命愿景后应自动生成；若仍为空可手动触发"
              action={
                <button
                  type="button"
                  disabled={saving}
                  onClick={seedCompassPath}
                  className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  生成路径反推
                </button>
              }
            />
          ) : milestones.map((m) => {
            const v = riskVerdict(m.riskScore);
            const progressPct = m.revenueTarget && currentRevenue
              ? Math.min(100, Math.round((m.revenueActual ?? (m.year <= currentYear ? currentRevenue : 0)) / m.revenueTarget * 100))
              : null;
            return (
              <div key={m.id} className="rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5"
                style={{ borderLeftColor: v.color, borderLeftWidth: 3 }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-data text-lg font-semibold text-[var(--color-text-primary)]">{m.year}</span>
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">{m.label}</span>
                      {persistedNorthStar ? (
                        <button
                          type="button"
                          onClick={() => setEditMilestone(m)}
                          className="text-xs text-[var(--color-accent)] hover:underline"
                        >
                          编辑
                        </button>
                      ) : null}
                    </div>
                    {m.revenueTarget && (
                      <div className="mt-1 text-caption">
                        目标营收 <span className="font-data font-medium text-[var(--color-text-secondary)]">{wan(m.revenueTarget)}</span>
                        {m.profitMarginTarget && <span> · 利润率 {pct(m.profitMarginTarget)}</span>}
                      </div>
                    )}
                  </div>
                  <RiskBar score={m.riskScore} />
                </div>

                {progressPct !== null && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-caption">
                      <span>进度</span>
                      <span>{progressPct}% · {wan(m.revenueActual ?? currentRevenue)} / {wan(m.revenueTarget!)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                )}

                {m.progressNote && (
                  <p className="mt-2 text-caption">{m.progressNote}</p>
                )}

                {m.riskFactors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {m.riskFactors.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: v.color }}>
                        <span className="mt-0.5 shrink-0">›</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {m.keyConditions.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] tracking-wide text-[var(--color-text-muted)]">必要条件</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.keyConditions.map((c, i) => (
                        <span key={i} className="rounded bg-black/[0.04] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Premises tab */}
      {tab === "premises" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption">战略成立的核心前提假设。置信度低或出现失效信号时，整个路径需要重新检验。</p>
            {persistedNorthStar ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => syncCompassAudit("assumptions")}
                  className="rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-black/[0.04] disabled:opacity-60"
                >
                  从战略假设同步
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => syncCompassAudit("signals")}
                  className="rounded-md border border-[var(--color-accent)]/40 px-3 py-1.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 disabled:opacity-60"
                >
                  刷新 FPA / Hermes 审计
                </button>
              </div>
            ) : null}
          </div>
          {premises.length === 0 ? (
            <EmptyState
              title="尚未录入战略前提"
              hint="系统将生成 P1–P6 模板，可逐条更新置信度与失效信号"
              action={
                <button
                  type="button"
                  disabled={saving}
                  onClick={seedCompassPath}
                  className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  生成前提审计模板
                </button>
              }
            />
          ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)]">
                  {["", "编号", "假设内容", "类别", "置信度", "脆弱性", "最近验证", "失效信号", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {premises.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--surface-border)] last:border-0 hover:bg-black/[0.015]">
                    <td className="px-3 py-3">
                      <ConfidenceFragilityDot confidence={p.confidence} fragility={p.fragility} />
                    </td>
                    <td className="px-3 py-3 font-data text-xs text-[var(--color-accent)]">{p.code}</td>
                    <td className="px-3 py-3 text-sm max-w-xs">
                      <div>{p.premise}</div>
                      {p.validationNote && <div className="mt-0.5 text-caption">{p.validationNote}</div>}
                    </td>
                    <td className="px-3 py-3 text-caption">{CATEGORY_LABEL[p.category] ?? p.category}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-14 rounded-full bg-black/[0.06] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.confidence}%`, backgroundColor: p.confidence >= 70 ? "var(--signal-green)" : p.confidence >= 50 ? "var(--signal-yellow)" : "var(--signal-red)" }} />
                        </div>
                        <span className="text-xs font-data">{p.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-14 rounded-full bg-black/[0.06] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.fragility}%`, backgroundColor: p.fragility >= 70 ? "var(--signal-red)" : p.fragility >= 50 ? "var(--signal-yellow)" : "var(--signal-green)" }} />
                        </div>
                        <span className="text-xs font-data">{p.fragility}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-caption">{p.lastValidatedAt ?? "—"}</td>
                    <td className="px-3 py-3 max-w-xs">
                      {p.failSignal ? (
                        <div>
                          {p.signalSource?.startsWith("自动·") ? (
                            <span className="mb-1 inline-block rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[11px] text-[var(--color-accent)]">
                              {p.signalSource}
                            </span>
                          ) : null}
                          <span className="inline-block rounded bg-[var(--signal-red)]/10 px-1.5 py-0.5 text-xs text-[var(--signal-red)]">⚠ 失效信号</span>
                          <div className="mt-0.5 text-caption">{p.failSignal}</div>
                          {p.signalSource && !p.signalSource.startsWith("自动·") ? (
                            <div className="text-caption">{p.signalSource}</div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-caption">无</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => setEditPremise(p)}
                        className="text-xs text-[var(--color-accent)] hover:underline">
                        更新
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      )}

      {/* Edit modal */}
      {editMilestone && northStar ? (
        <MilestoneEditModal
          milestone={editMilestone}
          saving={saving}
          onClose={() => setEditMilestone(null)}
          onSave={saveMilestone}
        />
      ) : null}

      {editPremise && (
        <PremiseEditModal
          premise={editPremise}
          saving={saving}
          onClose={() => setEditPremise(null)}
          onSave={savePremise}
        />
      )}

      {editNorthStar && (
        <NorthStarEditModal northStar={northStar} saving={saving}
          onClose={() => setEditNorthStar(false)} onSave={saveNorthStar} />
      )}
    </div>
  );
}

function MilestoneEditModal({ milestone, saving, onClose, onSave }: {
  milestone: CompassMilestone;
  saving: boolean;
  onClose: () => void;
  onSave: (data: CompassMilestone) => void;
}) {
  const [form, setForm] = useState({ ...milestone });
  const inp = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";
  const isNew = !form.id || !form.id.includes("-");

  return (
    <Modal onClose={onClose} size="lg" title={isNew ? "添加路径里程碑" : `${form.year} 里程碑编辑`}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">年份</label>
              <input type="number" className={inp} value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: +e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">标签</label>
              <input className={inp} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="如：站稳1亿" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">目标营收（万元）</label>
              <input type="number" className={inp} value={form.revenueTarget ?? ""} onChange={(e) => setForm((f) => ({ ...f, revenueTarget: e.target.value ? +e.target.value : null }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">目标利润率 {form.profitMarginTarget != null ? Math.round(form.profitMarginTarget * 100) : 0}%</label>
              <input type="range" min={0} max={50} value={Math.round((form.profitMarginTarget ?? 0) * 100)} onChange={(e) => setForm((f) => ({ ...f, profitMarginTarget: +e.target.value / 100 }))} className="mt-2 w-full accent-[var(--color-accent)]" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">实际营收（万元，可选）</label>
            <input type="number" className={inp} value={form.revenueActual ?? ""} onChange={(e) => setForm((f) => ({ ...f, revenueActual: e.target.value ? +e.target.value : null }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">必要条件（逗号分隔）</label>
            <input className={inp} value={form.keyConditions.join("，")} onChange={(e) => setForm((f) => ({ ...f, keyConditions: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) }))} />
          </div>
          <textarea rows={2} className={inp} value={form.progressNote ?? ""} onChange={(e) => setForm((f) => ({ ...f, progressNote: e.target.value || null }))} placeholder="进度说明（可选）" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-[var(--surface-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-black/[0.04]">取消</button>
          <button type="button" disabled={saving || !form.label.trim()} onClick={() => onSave(form)}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
    </Modal>
  );
}

function PremiseEditModal({ premise, saving, onClose, onSave }: {
  premise: PremiseAudit;
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<PremiseAudit>) => void;
}) {
  const [form, setForm] = useState({ ...premise });
  const inp = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

  return (
    <Modal onClose={onClose} size="lg" title={`${form.code} 前提假设更新`}>
        <div className="space-y-3">
          <textarea rows={3} className={inp} value={form.premise} onChange={e => setForm(f => ({ ...f, premise: e.target.value }))} placeholder="假设内容" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">置信度 {form.confidence}%</label>
              <input type="range" min={0} max={100} value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: +e.target.value }))} className="w-full accent-[var(--color-accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">脆弱性 {form.fragility}%</label>
              <input type="range" min={0} max={100} value={form.fragility} onChange={e => setForm(f => ({ ...f, fragility: +e.target.value }))} className="w-full accent-[var(--color-accent)]" />
            </div>
          </div>
          <textarea rows={2} className={inp} value={form.validationNote ?? ""} onChange={e => setForm(f => ({ ...f, validationNote: e.target.value }))} placeholder="验证说明（可选）" />
          <input className={inp} value={form.failSignal ?? ""} onChange={e => setForm(f => ({ ...f, failSignal: e.target.value || null }))} placeholder="失效信号（如有，留空清除）" />
          <input className={inp} value={form.signalSource ?? ""} onChange={e => setForm(f => ({ ...f, signalSource: e.target.value || null }))} placeholder="信号来源（如有）" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[var(--surface-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-black/[0.04]">取消</button>
          <button disabled={saving} onClick={() => onSave(form)}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
    </Modal>
  );
}
