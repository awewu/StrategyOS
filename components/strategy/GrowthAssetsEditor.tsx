"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BrandCardRowInput,
  GrowthAssetsBundle,
  JtbdRowInput,
  RoadmapRowInput,
} from "@/lib/strategy/growth-assets";

const LANES = [
  { value: "now", label: "Now" },
  { value: "next", label: "Next" },
  { value: "later", label: "Later" },
] as const;
const STATUSES = [
  { value: "planned", label: "计划" },
  { value: "in_progress", label: "进行中" },
  { value: "shipped", label: "已交付" },
  { value: "deferred", label: "推迟" },
] as const;
const BRANDS = ["RHEEM", "EVERHOT", "RUUD", "AUQAHART"] as const;

const inputCls =
  "w-full rounded border border-[var(--surface-border)] bg-transparent px-2 py-1 text-sm";

export function GrowthAssetsEditor({ initial }: { initial: GrowthAssetsBundle }) {
  const router = useRouter();
  const [lines, setLines] = useState(initial.productLines);
  const [roadmap, setRoadmap] = useState<RoadmapRowInput[]>(initial.roadmap);
  const [jtbd, setJtbd] = useState<JtbdRowInput[]>(initial.jtbd);
  const [brandCards, setBrandCards] = useState<BrandCardRowInput[]>(initial.brandCards);
  const [newLine, setNewLine] = useState({ code: "", name: "", brandCode: "RHEEM" });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function post(kind: string, body: Record<string, unknown>) {
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch("/api/strategy/growth-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存失败");
      if (json.bundle?.productLines) setLines(json.bundle.productLines);
      setMsg("已保存");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(null);
    }
  }

  const lineSelect = (value: string, onChange: (v: string) => void) => (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">选择产品线</option>
      {lines.map((l) => (
        <option key={l.id} value={l.id}>
          {l.code} · {l.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-8">
      {msg ? <p className="text-caption">{msg}</p> : null}

      {/* 产品线 */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">
          产品线（{lines.length}）— 路线图与 JTBD 的挂靠对象
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} max-w-28`}
            placeholder="Code"
            value={newLine.code}
            onChange={(e) => setNewLine({ ...newLine, code: e.target.value })}
          />
          <input
            className={`${inputCls} max-w-48`}
            placeholder="名称"
            value={newLine.name}
            onChange={(e) => setNewLine({ ...newLine, name: e.target.value })}
          />
          <select
            className={`${inputCls} max-w-32`}
            value={newLine.brandCode}
            onChange={(e) => setNewLine({ ...newLine, brandCode: e.target.value })}
          >
            {BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            type="button"
            className="stratos-btn stratos-btn--ghost text-xs"
            disabled={busy !== null}
            onClick={() => post("productLine", { row: newLine }).then(() => setNewLine({ code: "", name: "", brandCode: "RHEEM" }))}
          >
            + 新建产品线
          </button>
        </div>
      </section>

      {/* 品牌策略卡 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">品牌策略卡（{initial.period}）</h3>
          <div className="flex gap-2">
            <button
              type="button"
              className="stratos-btn stratos-btn--ghost text-xs"
              onClick={() =>
                setBrandCards([...brandCards, { brandCode: "RHEEM", winningAspiration: "", whereToPlay: "", howToWin: "" }])
              }
            >
              + 行
            </button>
            <button
              type="button"
              className="stratos-btn text-xs"
              disabled={busy !== null}
              onClick={() => post("brandCards", { rows: brandCards })}
            >
              {busy === "brandCards" ? "保存中…" : "保存品牌卡"}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {brandCards.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[7rem_1fr_1fr_1fr_2rem]">
              <select
                className={inputCls}
                value={r.brandCode}
                onChange={(e) => setBrandCards(brandCards.map((x, j) => (j === i ? { ...x, brandCode: e.target.value as BrandCardRowInput["brandCode"] } : x)))}
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <input className={inputCls} placeholder="制胜愿景 ≤60" value={r.winningAspiration}
                onChange={(e) => setBrandCards(brandCards.map((x, j) => (j === i ? { ...x, winningAspiration: e.target.value } : x)))} />
              <input className={inputCls} placeholder="在哪竞争 Where to Play" value={r.whereToPlay}
                onChange={(e) => setBrandCards(brandCards.map((x, j) => (j === i ? { ...x, whereToPlay: e.target.value } : x)))} />
              <input className={inputCls} placeholder="如何取胜 How to Win" value={r.howToWin}
                onChange={(e) => setBrandCards(brandCards.map((x, j) => (j === i ? { ...x, howToWin: e.target.value } : x)))} />
              <button type="button" className="text-[var(--signal-red)]" aria-label="删除行"
                onClick={() => setBrandCards(brandCards.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      </section>

      {/* 产品路线图 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">产品路线图（Now/Next/Later）</h3>
          <div className="flex gap-2">
            <button type="button" className="stratos-btn stratos-btn--ghost text-xs"
              onClick={() => setRoadmap([...roadmap, { productLineId: "", lane: "now", milestone: "", targetQuarter: "", status: "planned" }])}>
              + 行
            </button>
            <button type="button" className="stratos-btn text-xs" disabled={busy !== null}
              onClick={() => post("roadmap", { rows: roadmap })}>
              {busy === "roadmap" ? "保存中…" : "保存路线图"}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {roadmap.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_6rem_1fr_6rem_6rem_2rem]">
              {lineSelect(r.productLineId, (v) => setRoadmap(roadmap.map((x, j) => (j === i ? { ...x, productLineId: v } : x))))}
              <select className={inputCls} value={r.lane}
                onChange={(e) => setRoadmap(roadmap.map((x, j) => (j === i ? { ...x, lane: e.target.value as RoadmapRowInput["lane"] } : x)))}>
                {LANES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <input className={inputCls} placeholder="里程碑" value={r.milestone}
                onChange={(e) => setRoadmap(roadmap.map((x, j) => (j === i ? { ...x, milestone: e.target.value } : x)))} />
              <input className={inputCls} placeholder="2026-Q3" value={r.targetQuarter}
                onChange={(e) => setRoadmap(roadmap.map((x, j) => (j === i ? { ...x, targetQuarter: e.target.value } : x)))} />
              <select className={inputCls} value={r.status}
                onChange={(e) => setRoadmap(roadmap.map((x, j) => (j === i ? { ...x, status: e.target.value as RoadmapRowInput["status"] } : x)))}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button type="button" className="text-[var(--signal-red)]" aria-label="删除行"
                onClick={() => setRoadmap(roadmap.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      </section>

      {/* JTBD */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">JTBD 卡</h3>
          <div className="flex gap-2">
            <button type="button" className="stratos-btn stratos-btn--ghost text-xs"
              onClick={() => setJtbd([...jtbd, { productLineId: "", statement: "", primarySegment: "" }])}>
              + 行
            </button>
            <button type="button" className="stratos-btn text-xs" disabled={busy !== null}
              onClick={() => post("jtbd", { rows: jtbd })}>
              {busy === "jtbd" ? "保存中…" : "保存 JTBD"}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {jtbd.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_2rem]">
              {lineSelect(r.productLineId, (v) => setJtbd(jtbd.map((x, j) => (j === i ? { ...x, productLineId: v } : x))))}
              <input className={inputCls} placeholder="任务陈述：当…时，我想…以便…" value={r.statement}
                onChange={(e) => setJtbd(jtbd.map((x, j) => (j === i ? { ...x, statement: e.target.value } : x)))} />
              <input className={inputCls} placeholder="主客群" value={r.primarySegment}
                onChange={(e) => setJtbd(jtbd.map((x, j) => (j === i ? { ...x, primarySegment: e.target.value } : x)))} />
              <button type="button" className="text-[var(--signal-red)]" aria-label="删除行"
                onClick={() => setJtbd(jtbd.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
