"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Modal";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import type { TrafficLight } from "@/lib/types/stratos";
import type { BscDimensionRow } from "@/lib/decode/bsc-map";

type BscCardLike = {
  key: string;
  label: string;
  satisfaction: string;
  target?: string;
  light: TrafficLight;
};

const DIMS = [
  { key: "financial", dim: "财务", color: "var(--bsc-financial)" },
  { key: "customer", dim: "客户", color: "var(--bsc-customer)" },
  { key: "process", dim: "流程", color: "var(--bsc-process)" },
  { key: "learning", dim: "学习", color: "var(--bsc-learning)" },
] as const;

const LIGHT_LABEL: Record<TrafficLight, string> = { green: "正常", yellow: "关注", red: "预警" };

const inp = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

export function BscTargetsBoard({
  lights,
  cards,
  rows,
  period,
  canEdit,
}: {
  lights: Record<(typeof DIMS)[number]["key"], TrafficLight>;
  cards: BscCardLike[];
  rows: BscDimensionRow[];
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
                <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
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
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{period} · BSC 战略地图同源</p>
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
            <p className="mt-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{err}</p>
          )}

          {!editing && (
            <div className="mt-4 space-y-4">
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
