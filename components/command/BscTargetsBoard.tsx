"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Modal";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import type { TrafficLight } from "@/lib/types/stratos";
import type { BscDimensionRow } from "@/lib/decode/bsc-map";
import type { BscComparison, BscDimKey, Pace } from "@/lib/command/bsc-comparison";
import { BSC_DIMENSIONS } from "@/lib/decode/bsc-dimensions";

type BscCardLike = {
  key: string;
  label: string;
  satisfaction: string;
  target?: string;
  light: TrafficLight;
};

// 维度分类学统一自 @/lib/decode/bsc-dimensions（单一真相）。
const DIMS: { key: BscDimKey; dim: string; color: string }[] = BSC_DIMENSIONS.map((d) => ({
  key: d.key,
  dim: d.label,
  color: d.color,
}));

const LIGHT_LABEL: Record<TrafficLight, string> = { green: "正常", yellow: "关注", red: "预警" };

const inp = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

const PACE_META: Record<Pace, { label: string; color: string }> = {
  ahead: { label: "超前", color: "var(--signal-green-text)" },
  on_track: { label: "在轨", color: "var(--color-accent)" },
  behind: { label: "滞后", color: "var(--signal-yellow-text)" },
  unknown: { label: "待测", color: "var(--color-text-muted)" },
};

export function BscTargetsBoard({
  lights,
  cards,
  rows,
  comparison,
  period,
  canEdit,
}: {
  lights: Record<BscDimKey, TrafficLight>;
  cards: BscCardLike[];
  rows: BscDimensionRow[];
  comparison?: BscComparison;
  period: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BscDimensionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const meta = DIMS.find((d) => d.key === openKey) ?? null;
  const card = cards.find((c) => c.key === openKey) ?? null;
  const row = meta ? rows.find((r) => r.dim === meta.dim) ?? null : null;
  const signal = meta ? lights[meta.key] : null;
  const dimCmp = meta && comparison ? comparison.dims.find((d) => d.key === (meta.key as BscDimKey)) ?? null : null;

  function close() {
    setOpenKey(null);
    setEditing(false);
    setForm(null);
    setErr("");
  }

  function startEdit() {
    if (!meta) return;
    setForm(
      row ?? {
        dim: meta.dim,
        objective: "",
        mustWin: "",
        operating: [],
        mustNotFail: "",
        mustWinStatus: "yellow",
        notFailStatus: "yellow",
      },
    );
    setEditing(true);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setErr("");
    try {
      const nextRows = rows.some((r) => r.dim === form.dim)
        ? rows.map((r) => (r.dim === form.dim ? form : r))
        : [...rows, form];
      const res = await fetch("/api/decode/bsc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: nextRows, period }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setForm(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="stratos-slot-grid lg:grid-cols-4">
        {DIMS.map((d) => {
          const c = cards.find((x) => x.key === d.key);
          const r = rows.find((x) => x.dim === d.dim);
          const sig = lights[d.key];
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setOpenKey(d.key)}
              className={`stratos-card stratos-card--padded text-left transition-shadow hover:shadow-md ${
                sig === "red" ? "ring-1 ring-[var(--signal-red)]/35" : ""
              }`}
              style={{ borderLeft: `3px solid ${d.color}` }}
            >
              <div className="label-xs text-[var(--color-text-muted)]">{c?.satisfaction ?? ""}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-subsection font-semibold text-[var(--color-text-primary)]">
                  {c?.label ?? d.dim}
                </span>
                <TrafficLightDot signal={sig} showLabel />
              </div>
              {r?.objective ? (
                <p className="mt-2 line-clamp-2 text-caption text-[var(--color-text-secondary)]">{r.objective}</p>
              ) : c?.target ? (
                <p className="mt-2 text-caption text-[var(--color-text-muted)]">{c.target}</p>
              ) : null}
              {r && r.operating.length > 0 && (
                <p className="mt-1.5 text-caption">
                  {r.operating.length} 项经营任务 · 详情 →
                </p>
              )}
            </button>
          );
        })}
      </div>

      {meta && (
        <Drawer onClose={close} size="md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="label-xs" style={{ color: meta.color }}>{card?.satisfaction}</span>
                {signal && <TrafficLightDot signal={signal} showLabel />}
              </div>
              <h3 className="mt-1 text-base font-semibold text-[var(--color-text-primary)]">
                {card?.label ?? meta.dim} · 年度目标交付
              </h3>
              <p className="mt-0.5 text-caption">{period} · BSC 战略地图同源</p>
            </div>
            {canEdit && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-md border border-[var(--surface-border)] px-3 py-1 text-xs hover:bg-black/[0.04]"
              >
                编辑
              </button>
            )}
          </div>

          {err && (
            <p className="mt-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red-text)]">{err}</p>
          )}

          {!editing && (
            <div className="mt-4 space-y-4">
              {dimCmp && (
                <div className="space-y-3 rounded-md border border-[var(--surface-border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                      目标 vs 实际
                      {comparison?.dataSource && (
                        <span
                          className={
                            "rounded px-1.5 py-0.5 text-[var(--type-label)] font-normal " +
                            (comparison.dataSource === "database"
                              ? "bg-[var(--signal-green)]/12 text-[var(--signal-green-text)]"
                              : "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow-text)]")
                          }
                        >
                          {comparison.dataSource === "database" ? "真实数据" : "演示数据"}
                        </span>
                      )}
                    </span>
                    {comparison?.hasBaseline && comparison?.baselineLabel ? (
                      <span className="text-[var(--type-label)] text-[var(--color-text-muted)]">目标基线：{comparison.baselineLabel}</span>
                    ) : (
                      <span className="text-[var(--type-label)] text-[var(--signal-yellow-text)]">无已提交/锁定基线 — 战略编制提交后才纳入对比</span>
                    )}
                  </div>

                  {dimCmp.thresholds.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[var(--type-label)] font-medium text-[var(--signal-red-text)]">红线 · KPI 经营底线（突破 → 预警 / 叫停 / 绩效）</div>
                      {dimCmp.thresholds.map((t, i) => (
                        <div
                          key={i}
                          className={"flex items-start gap-2 rounded px-2 py-1 text-xs " + (t.breached ? "bg-[var(--signal-red)]/10" : "bg-black/[0.03]")}
                        >
                          <TrafficLightDot signal={t.status} />
                          <span className="flex-1 text-[var(--color-text-secondary)]">{t.statement}</span>
                          {t.breached && <span className="font-semibold text-[var(--signal-red-text)]">突破·叫停</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="text-[var(--type-label)] font-medium text-[var(--color-accent)]">先导 · OKR 战略执行（推进进度，非红线告警）</div>
                    {dimCmp.leading.length === 0 ? (
                      <p className="text-[var(--type-label)] text-[var(--color-text-muted)]">锁定基线中本维度暂无 KR。</p>
                    ) : (
                      dimCmp.leading.map((l, i) => (
                        <div key={i} className="rounded bg-black/[0.03] px-2 py-1.5 text-xs">
                          <div className="font-medium text-[var(--color-text-secondary)]">{l.keyResult}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[var(--type-label)] text-[var(--color-text-muted)]">
                            <span>目标 {l.target}</span>
                            <span>实际 {l.actual ?? "—"}</span>
                            {l.attainmentPct != null && <span>达成 {l.attainmentPct}%</span>}
                            <span style={{ color: PACE_META[l.pace].color }}>{PACE_META[l.pace].label}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {dimCmp.finance && (
                    <div className="space-y-1">
                      <div className="text-[var(--type-label)] font-medium text-[var(--bsc-financial)]">财务实际 · FPA（预算 vs 实际 · 单位 万）</div>
                      <div className="grid grid-cols-3 gap-2 text-[var(--type-label)]">
                        <div className="rounded bg-black/[0.03] px-2 py-1.5">
                          <div className="text-[var(--color-text-muted)]">营收</div>
                          <div className="text-[var(--color-text-secondary)]">{dimCmp.finance.revenueActual} / {dimCmp.finance.revenueBudget}</div>
                          {dimCmp.finance.revenueAttainmentPct != null && (
                            <div className="text-[var(--color-text-muted)]">达成 {dimCmp.finance.revenueAttainmentPct}%</div>
                          )}
                        </div>
                        <div className="rounded bg-black/[0.03] px-2 py-1.5">
                          <div className="text-[var(--color-text-muted)]">经营利润</div>
                          <div className="text-[var(--color-text-secondary)]">{dimCmp.finance.profitActual} / {dimCmp.finance.profitBudget}</div>
                          {dimCmp.finance.profitAttainmentPct != null && (
                            <div className="text-[var(--color-text-muted)]">达成 {dimCmp.finance.profitAttainmentPct}%</div>
                          )}
                        </div>
                        <div className="rounded bg-black/[0.03] px-2 py-1.5">
                          <div className="text-[var(--color-text-muted)]">现金 Runway</div>
                          <div className="text-[var(--color-text-secondary)]">{dimCmp.finance.cashRunwayMonths} 月</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {card?.target && (
                <section>
                  <div className="text-xs font-medium text-[var(--color-text-primary)]">卡片目标</div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{card.target}</p>
                </section>
              )}
              <section>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">年度目标</div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {row?.objective || "未录入 — 点击「编辑」填写年度目标"}
                </p>
              </section>
              <section>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-[var(--color-text-primary)]">必赢之仗</div>
                  {row && <TrafficLightDot signal={row.mustWinStatus} showLabel />}
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{row?.mustWin || "—"}</p>
              </section>
              <section>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">经营任务规划</div>
                {row && row.operating.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {row.operating.map((t, i) => (
                      <li
                        key={i}
                        className="rounded-md bg-black/[0.03] px-2 py-1.5 text-xs text-[var(--color-text-secondary)]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">未录入</p>
                )}
              </section>
              <section>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-[var(--color-text-primary)]">不容有失</div>
                  {row && <TrafficLightDot signal={row.notFailStatus} showLabel />}
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{row?.mustNotFail || "—"}</p>
              </section>
            </div>
          )}

          {editing && form && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">年度目标</label>
                <textarea
                  rows={2}
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className={`${inp} resize-none`}
                  placeholder="如：投资驱动增长 · 营收 6000 万路径"
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">必赢之仗</label>
                  <input
                    value={form.mustWin}
                    onChange={(e) => setForm({ ...form, mustWin: e.target.value })}
                    className={inp}
                    placeholder="如：营收 CAGR ≥ 15%"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">状态</label>
                  <select
                    value={form.mustWinStatus}
                    onChange={(e) => setForm({ ...form, mustWinStatus: e.target.value as TrafficLight })}
                    className={inp}
                  >
                    {(["green", "yellow", "red"] as const).map((l) => (
                      <option key={l} value={l}>{LIGHT_LABEL[l]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">经营任务规划（每行一项）</label>
                <textarea
                  rows={4}
                  value={form.operating.join("\n")}
                  onChange={(e) =>
                    setForm({ ...form, operating: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
                  }
                  className={inp}
                  placeholder={"如：酒店签约 820/1200\n覆盖 82% P0 段"}
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">不容有失</label>
                  <input
                    value={form.mustNotFail}
                    onChange={(e) => setForm({ ...form, mustNotFail: e.target.value })}
                    className={inp}
                    placeholder="如：Runway < 3 月 → HardBlock"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">状态</label>
                  <select
                    value={form.notFailStatus}
                    onChange={(e) => setForm({ ...form, notFailStatus: e.target.value as TrafficLight })}
                    className={inp}
                  >
                    {(["green", "yellow", "red"] as const).map((l) => (
                      <option key={l} value={l}>{LIGHT_LABEL[l]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm(null); setErr(""); }}
                  className="rounded-md border border-[var(--surface-border)] px-4 py-1.5 text-sm hover:bg-black/[0.04]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "保存中…" : "保存"}
                </button>
              </div>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
