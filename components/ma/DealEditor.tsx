"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { DealType } from "@/lib/ma/types";
import type { DealTypeProfileView, DealView } from "@/lib/ma/views";
import { DEAL_STAGE_LABEL, DEAL_STAGE_ORDER, DEAL_TYPE_LABEL } from "@/lib/ma/views";

const inp =
  "w-full rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none";
const sectionCls = "rounded-lg border border-[var(--surface-border)] p-3";
const addBtn = "text-xs text-[var(--color-accent)]";
const delBtn = "rounded px-2 py-1 text-xs text-[var(--signal-red)]";

const WORKSTREAMS = ["financial", "legal", "tax", "hr", "tech", "commercial", "supply", "esg", "other"];
const METHODS = [
  { value: "dcf", label: "DCF" },
  { value: "comps", label: "可比公司" },
  { value: "precedent", label: "先例交易" },
];

type ValRow = { method: string; low: string; base: string; high: string; note: string };
type SynRow = { type: string; title: string; runRate: string; ramp: string; oneTimeCost: string; evidenceLevel: number };
type FindRow = { workstream: string; finding: string; severity: string; dealBreaker: boolean; status: string };
type CpRow = { item: string; owner: string; dueDate: string; status: string };
type ScrRow = { dimension: string; judgment: string; evidenceLevel: number };

export interface DealPrefill {
  name?: string;
  thesis?: string;
  direction?: string;
  dealType?: DealType;
  linkedCrux?: string;
}

export function DealEditor({
  deal,
  profiles,
  prefill,
  onClose,
  onSaved,
}: {
  deal: DealView | null;
  profiles: DealTypeProfileView[];
  prefill?: DealPrefill | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(deal?.name ?? prefill?.name ?? "");
  const [dealType, setDealType] = useState<DealType>(deal?.dealType ?? prefill?.dealType ?? "acquisition");
  const [direction, setDirection] = useState(deal?.direction ?? prefill?.direction ?? "tech");
  const [stage, setStage] = useState<string>(deal?.stage ?? "sourcing");
  const [thesis, setThesis] = useState(deal?.thesis ?? prefill?.thesis ?? "");
  const [linkedCrux, setLinkedCrux] = useState(deal?.linkedCrux ?? prefill?.linkedCrux ?? "");
  const [dealLead, setDealLead] = useState(deal?.dealLead ?? "");
  const [budgetTag, setBudgetTag] = useState(deal?.budgetTag ?? "");
  const [price, setPrice] = useState(deal?.price?.toString() ?? "");
  const [walkAway, setWalkAway] = useState(deal?.walkAwayPrice?.toString() ?? "");
  const [discountRate, setDiscountRate] = useState(deal?.discountRate?.toString() ?? "0.12");
  const [roic, setRoic] = useState(deal?.economicsInput.roic?.toString() ?? "");
  const [wacc, setWacc] = useState(deal?.economicsInput.wacc?.toString() ?? "");
  const [payback, setPayback] = useState(deal?.economicsInput.paybackYears?.toString() ?? "");
  const [cashPct, setCashPct] = useState(deal?.dealStructure.cashPct?.toString() ?? "");
  const [stockPct, setStockPct] = useState(deal?.dealStructure.stockPct?.toString() ?? "");
  const [earnoutPct, setEarnoutPct] = useState(deal?.dealStructure.earnoutPct?.toString() ?? "");
  const [earnoutTerms, setEarnoutTerms] = useState(deal?.dealStructure.earnoutTerms ?? "");
  const [flags, setFlags] = useState<Record<string, boolean>>(deal?.flags ?? {});
  const [screening, setScreening] = useState<ScrRow[]>(
    (deal?.screening ?? []).map((s) => ({ dimension: s.dimension, judgment: s.judgment, evidenceLevel: s.evidenceLevel })),
  );
  const [valuations, setValuations] = useState<ValRow[]>(
    (deal?.valuations ?? []).map((v) => ({ method: v.method, low: String(v.low), base: String(v.base), high: String(v.high), note: v.note ?? "" })),
  );
  const [synergies, setSynergies] = useState<SynRow[]>(
    (deal?.synergies ?? []).map((s) => ({
      type: s.type, title: s.title, runRate: String(s.runRate),
      ramp: s.ramp.map((r) => Math.round(r * 100)).join("/"),
      oneTimeCost: String(s.oneTimeCost), evidenceLevel: s.evidenceLevel,
    })),
  );
  const [findings, setFindings] = useState<FindRow[]>(
    (deal?.findings ?? []).map((f) => ({ workstream: f.workstream, finding: f.finding, severity: f.severity, dealBreaker: f.dealBreaker, status: f.status })),
  );
  const [conditions, setConditions] = useState<CpRow[]>(
    (deal?.conditions ?? []).map((c) => ({ item: c.item, owner: c.owner ?? "", dueDate: c.dueDate ?? "", status: c.status })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = useMemo(() => profiles.find((p) => p.dealType === dealType), [profiles, dealType]);

  async function save() {
    if (!name.trim() || !thesis.trim()) { setError("名称与论点必填——没有论点不立项"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/ma/deal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deal?.id,
        name: name.trim(),
        dealType,
        direction: direction.trim() || "tech",
        stage,
        thesis: thesis.trim(),
        linkedCrux: linkedCrux.trim() || null,
        dealLead: dealLead.trim() || null,
        budgetTag: budgetTag.trim() || null,
        price: price.trim() === "" ? null : Number(price),
        walkAwayPrice: walkAway.trim() === "" ? null : Number(walkAway),
        discountRate: Number(discountRate) || 0.12,
        economics: {
          ...(roic.trim() !== "" ? { roic: Number(roic) } : {}),
          ...(wacc.trim() !== "" ? { wacc: Number(wacc) } : {}),
          ...(payback.trim() !== "" ? { paybackYears: Number(payback) } : {}),
        },
        dealStructure: {
          ...(cashPct.trim() !== "" ? { cashPct: Number(cashPct) / 100 } : {}),
          ...(stockPct.trim() !== "" ? { stockPct: Number(stockPct) / 100 } : {}),
          ...(earnoutPct.trim() !== "" ? { earnoutPct: Number(earnoutPct) / 100 } : {}),
          ...(earnoutTerms.trim() ? { earnoutTerms: earnoutTerms.trim() } : {}),
        },
        flags,
        screening: screening.filter((s) => s.dimension.trim()),
        valuations: valuations.map((v) => ({ method: v.method, low: Number(v.low) || 0, base: Number(v.base) || 0, high: Number(v.high) || 0, note: v.note || null })),
        synergies: synergies.filter((s) => s.title.trim()).map((s) => ({
          type: s.type, title: s.title, runRate: Number(s.runRate) || 0,
          ramp: s.ramp.split("/").map((x) => (Number(x.trim()) || 0) / 100).filter((x) => Number.isFinite(x)),
          oneTimeCost: Number(s.oneTimeCost) || 0, evidenceLevel: s.evidenceLevel,
        })),
        findings: findings.filter((f) => f.finding.trim()),
        conditions: conditions.filter((c) => c.item.trim()).map((c) => ({ ...c, dueDate: c.dueDate || null, owner: c.owner || null })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `保存失败(${res.status})`);
      return;
    }
    onSaved();
  }

  return (
    <Modal onClose={onClose} size="xl" title={deal ? "编辑交易" : "新建交易"} subtitle="收购/并购/投资/合资同一模型——形态画像决定阈值与必备条款">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_130px_130px]">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">交易名称</label>
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">形态</label>
              <select className={inp} value={dealType} onChange={(e) => setDealType(e.target.value as DealType)}>
                {(Object.keys(DEAL_TYPE_LABEL) as DealType[]).map((t) => <option key={t} value={t}>{DEAL_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">阶段</label>
              <select className={inp} value={stage} onChange={(e) => setStage(e.target.value)}>
                {DEAL_STAGE_ORDER.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABEL[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">并购论点(为什么做)</label>
            <input className={inp} value={thesis} onChange={(e) => setThesis(e.target.value)} placeholder="例:收购材料能力,解产品线死穴,锁供应+降 BOM" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">挂靠 Crux(可选)</label>
              <input className={inp} value={linkedCrux} onChange={(e) => setLinkedCrux(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">能力方向</label>
                <input className={inp} value={direction} onChange={(e) => setDirection(e.target.value)} placeholder="tech/channel/brand/material" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">交易主责人</label>
                <input className={inp} value={dealLead} onChange={(e) => setDealLead(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">对价与经济性</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                ["对价", price, setPrice],
                ["walk-away 上限", walkAway, setWalkAway],
                ["折现率", discountRate, setDiscountRate],
                ["ROIC", roic, setRoic],
                ["WACC", wacc, setWacc],
                ["回收期(年)", payback, setPayback],
              ] as const).map(([label, val, set]) => (
                <div key={label}>
                  <label className="text-[11px] text-[var(--color-text-muted)]">{label}</label>
                  <input className={inp} type="number" step="any" value={val} onChange={(e) => set(e.target.value)} />
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {([
                ["现金 %", cashPct, setCashPct],
                ["股份 %", stockPct, setStockPct],
                ["earnout %", earnoutPct, setEarnoutPct],
              ] as const).map(([label, val, set]) => (
                <div key={label}>
                  <label className="text-[11px] text-[var(--color-text-muted)]">{label}</label>
                  <input className={inp} type="number" value={val} onChange={(e) => set(e.target.value)} />
                </div>
              ))}
              <div>
                <label className="text-[11px] text-[var(--color-text-muted)]">earnout 条件</label>
                <input className={inp} value={earnoutTerms} onChange={(e) => setEarnoutTerms(e.target.value)} placeholder="挂协同兑现" />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[11px] text-[var(--color-text-muted)]">预算标签(budget_tag → FPA)</label>
              <input className={inp} value={budgetTag} onChange={(e) => setBudgetTag(e.target.value)} />
            </div>
          </div>

          {profile && profile.requiredFlags.length > 0 && (
            <div className={sectionCls}>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">{profile.name} · 必备条款(缺一即否决)</div>
              <div className="mt-2 space-y-1.5">
                {profile.requiredFlags.map((rf) => (
                  <label key={rf.key} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <input type="checkbox" checked={flags[rf.key] === true} onChange={(e) => setFlags((f) => ({ ...f, [rf.key]: e.target.checked }))} />
                    {rf.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">筛选评分卡(判断+证据级,不合成假分)</div>
              <button type="button" className={addBtn} onClick={() => setScreening((c) => [...c, { dimension: "", judgment: "", evidenceLevel: 2 }])}>+ 维度</button>
            </div>
            {screening.map((s, i) => (
              <div key={i} className="mt-2 grid grid-cols-[140px_1fr_70px_40px] items-center gap-2">
                <input className={inp} placeholder="维度" value={s.dimension} onChange={(e) => setScreening((c) => c.map((x, j) => j === i ? { ...x, dimension: e.target.value } : x))} />
                <input className={inp} placeholder="判断" value={s.judgment} onChange={(e) => setScreening((c) => c.map((x, j) => j === i ? { ...x, judgment: e.target.value } : x))} />
                <select className={inp} value={s.evidenceLevel} onChange={(e) => setScreening((c) => c.map((x, j) => j === i ? { ...x, evidenceLevel: Number(e.target.value) } : x))}>
                  {[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>L{l}</option>)}
                </select>
                <button type="button" className={delBtn} onClick={() => setScreening((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">估值三角(低-基-高)</div>
              <button type="button" className={addBtn} onClick={() => setValuations((c) => [...c, { method: "dcf", low: "", base: "", high: "", note: "" }])}>+ 方法</button>
            </div>
            {valuations.map((v, i) => (
              <div key={i} className="mt-2 grid grid-cols-[110px_1fr_1fr_1fr_40px] items-center gap-2">
                <select className={inp} value={v.method} onChange={(e) => setValuations((c) => c.map((x, j) => j === i ? { ...x, method: e.target.value } : x))}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input className={inp} type="number" placeholder="低" value={v.low} onChange={(e) => setValuations((c) => c.map((x, j) => j === i ? { ...x, low: e.target.value } : x))} />
                <input className={inp} type="number" placeholder="基准" value={v.base} onChange={(e) => setValuations((c) => c.map((x, j) => j === i ? { ...x, base: e.target.value } : x))} />
                <input className={inp} type="number" placeholder="高" value={v.high} onChange={(e) => setValuations((c) => c.map((x, j) => j === i ? { ...x, high: e.target.value } : x))} />
                <button type="button" className={delBtn} onClick={() => setValuations((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">协同量化(爬坡如 30/70/100,证据级逐条挂)</div>
              <button type="button" className={addBtn} onClick={() => setSynergies((c) => [...c, { type: "cost", title: "", runRate: "", ramp: "30/70/100", oneTimeCost: "0", evidenceLevel: 2 }])}>+ 协同</button>
            </div>
            {synergies.map((s, i) => (
              <div key={i} className="mt-2 grid grid-cols-[70px_1fr_90px_90px_80px_60px_40px] items-center gap-2">
                <select className={inp} value={s.type} onChange={(e) => setSynergies((c) => c.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
                  <option value="cost">成本</option><option value="revenue">收入</option>
                </select>
                <input className={inp} placeholder="协同项" value={s.title} onChange={(e) => setSynergies((c) => c.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                <input className={inp} type="number" title="run-rate/年" placeholder="run-rate" value={s.runRate} onChange={(e) => setSynergies((c) => c.map((x, j) => j === i ? { ...x, runRate: e.target.value } : x))} />
                <input className={inp} title="爬坡 %/年" placeholder="30/70/100" value={s.ramp} onChange={(e) => setSynergies((c) => c.map((x, j) => j === i ? { ...x, ramp: e.target.value } : x))} />
                <input className={inp} type="number" title="一次性成本" placeholder="一次性" value={s.oneTimeCost} onChange={(e) => setSynergies((c) => c.map((x, j) => j === i ? { ...x, oneTimeCost: e.target.value } : x))} />
                <select className={inp} value={s.evidenceLevel} onChange={(e) => setSynergies((c) => c.map((x, j) => j === i ? { ...x, evidenceLevel: Number(e.target.value) } : x))}>
                  {[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>L{l}</option>)}
                </select>
                <button type="button" className={delBtn} onClick={() => setSynergies((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">尽调红旗</div>
              <button type="button" className={addBtn} onClick={() => setFindings((c) => [...c, { workstream: "legal", finding: "", severity: "medium", dealBreaker: false, status: "open" }])}>+ 红旗</button>
            </div>
            {findings.map((f, i) => (
              <div key={i} className="mt-2 grid grid-cols-[100px_1fr_80px_90px_40px] items-center gap-2">
                <select className={inp} value={f.workstream} onChange={(e) => setFindings((c) => c.map((x, j) => j === i ? { ...x, workstream: e.target.value } : x))}>
                  {WORKSTREAMS.map((w) => <option key={w}>{w}</option>)}
                </select>
                <input className={inp} placeholder="发现" value={f.finding} onChange={(e) => setFindings((c) => c.map((x, j) => j === i ? { ...x, finding: e.target.value } : x))} />
                <select className={inp} value={f.status} onChange={(e) => setFindings((c) => c.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>
                  <option value="open">未解</option><option value="mitigated">已缓解</option><option value="closed">已关</option>
                </select>
                <label className="flex items-center gap-1 text-[11px] text-[var(--signal-red)]">
                  <input type="checkbox" checked={f.dealBreaker} onChange={(e) => setFindings((c) => c.map((x, j) => j === i ? { ...x, dealBreaker: e.target.checked } : x))} />
                  breaker
                </label>
                <button type="button" className={delBtn} onClick={() => setFindings((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">先决条件 CP(不关不 GO)</div>
              <button type="button" className={addBtn} onClick={() => setConditions((c) => [...c, { item: "", owner: "", dueDate: "", status: "open" }])}>+ CP</button>
            </div>
            {conditions.map((c0, i) => (
              <div key={i} className="mt-2 grid grid-cols-[1fr_100px_120px_80px_40px] items-center gap-2">
                <input className={inp} placeholder="条件" value={c0.item} onChange={(e) => setConditions((c) => c.map((x, j) => j === i ? { ...x, item: e.target.value } : x))} />
                <input className={inp} placeholder="负责人" value={c0.owner} onChange={(e) => setConditions((c) => c.map((x, j) => j === i ? { ...x, owner: e.target.value } : x))} />
                <input className={inp} type="date" value={c0.dueDate} onChange={(e) => setConditions((c) => c.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))} />
                <select className={inp} value={c0.status} onChange={(e) => setConditions((c) => c.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>
                  <option value="open">未关</option><option value="closed">已关</option>
                </select>
                <button type="button" className={delBtn} onClick={() => setConditions((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-[var(--signal-red)]">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">取消</button>
            <button type="button" onClick={save} disabled={saving} className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50">
              {saving ? "保存中…" : "保存并重算"}
            </button>
          </div>
        </div>
    </Modal>
  );
}
