"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { BetView } from "@/lib/innovation/views";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/innovation/views";

const inp =
  "w-full rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none";
const sectionCls = "rounded-lg border border-[var(--surface-border)] p-3";
const addBtn = "text-xs text-[var(--color-accent)]";
const delBtn = "rounded px-2 py-1 text-xs text-[var(--signal-red)]";

type EvidenceRow = { level: number; source: string; artifactRef: string; note: string };
type ClaimRow = { axis: string; claim: string; warrant: string; rebuttal: string; evidence: EvidenceRow[] };
type AssumptionRow = { code: string; statement: string; status: string; testPlan: string };
type DimRow = { key: string; score: number; evidenceLevel: number };
type OdiRow = { importance: number; satisfaction: number };
type GapRow = { capability: string; internalReadiness: number; windowMonths: number; buildMonths: number };

export function BetEditor({
  lineId,
  bet,
  onClose,
  onSaved,
}: {
  lineId: string;
  bet: BetView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(bet?.title ?? "");
  const [horizon, setHorizon] = useState(bet?.horizon ?? "H2");
  const [stageGate, setStageGate] = useState<string>(bet?.stageGate ?? "discovery");
  const [nextCommit, setNextCommit] = useState<string>(bet?.nextCommitAmount?.toString() ?? "");
  const [abandonRight, setAbandonRight] = useState(bet?.abandonRight ?? true);
  const [wtpFactor, setWtpFactor] = useState(bet?.wtpFactor ?? 1);
  const [econ, setEcon] = useState<Record<string, string>>(() => {
    const e = bet?.economics ?? {};
    const out: Record<string, string> = {};
    for (const k of ["costPremium", "annualSaving", "dailyShiftedKwh", "activeDays", "priceSpread", "roundTripEff", "paybackYears", "roic", "wacc"]) {
      const v = (e as Record<string, number | undefined>)[k];
      out[k] = v === undefined ? "" : String(v);
    }
    return out;
  });
  const [dims, setDims] = useState<DimRow[]>(
    (bet?.feasibilityDims ?? []).map((d) => ({ key: d.key, score: d.score, evidenceLevel: d.evidenceLevel })),
  );
  const [odi, setOdi] = useState<OdiRow[]>(bet?.odi ?? []);
  const [gaps, setGaps] = useState<GapRow[]>(bet?.capabilityGaps ?? []);
  const [claims, setClaims] = useState<ClaimRow[]>(
    (bet?.claims ?? []).map((c) => ({
      axis: c.axis,
      claim: c.claim,
      warrant: c.warrant ?? "",
      rebuttal: c.rebuttal ?? "",
      evidence: c.evidence.map((e) => ({ level: e.level, source: e.source, artifactRef: e.artifactRef ?? "", note: e.note ?? "" })),
    })),
  );
  const [assumptions, setAssumptions] = useState<AssumptionRow[]>(
    (bet?.assumptions ?? []).map((a) => ({ code: a.code, statement: a.statement, status: a.status, testPlan: a.testPlan ?? "" })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setError("标题必填"); return; }
    setSaving(true);
    setError(null);
    const economics: Record<string, number> = {};
    for (const [k, v] of Object.entries(econ)) {
      if (v.trim() !== "" && Number.isFinite(Number(v))) economics[k] = Number(v);
    }
    const res = await fetch("/api/innovation/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: bet?.id,
        lineId,
        title: title.trim(),
        horizon,
        stageGate,
        nextCommitAmount: nextCommit.trim() === "" ? null : Number(nextCommit),
        abandonRight,
        wtpFactor,
        economics,
        feasibilityDims: dims.filter((d) => d.key.trim()),
        odi,
        capabilityGaps: gaps.filter((g) => g.capability.trim()),
        claims: claims.filter((c) => c.claim.trim()).map((c) => ({
          ...c,
          evidence: c.evidence.filter((e) => e.source.trim()),
        })),
        assumptions: assumptions.filter((a) => a.code.trim() && a.statement.trim()),
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
    <Modal onClose={onClose} size="xl" title={bet ? "编辑创新下注" : "新建创新下注"} subtitle="所有因素皆为数据——改了立即重算 D×F×V 与 Gate">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_90px_150px]">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">标题</label>
              <input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">层面</label>
              <select className={inp} value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                {["H1", "H2", "H3"].map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">门径阶段</label>
              <select className={inp} value={stageGate} onChange={(e) => setStageGate(e.target.value)}>
                {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">下一笔承诺金额</label>
              <input className={inp} type="number" value={nextCommit} onChange={(e) => setNextCommit(e.target.value)} placeholder="实物期权:只押下一笔" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">WTP 因子(0–1)</label>
              <input className={inp} type="number" step="0.05" min="0" max="1" value={wtpFactor} onChange={(e) => setWtpFactor(Number(e.target.value))} />
            </div>
            <label className="mt-5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input type="checkbox" checked={abandonRight} onChange={(e) => setAbandonRight(e.target.checked)} />
              保留放弃权
            </label>
          </div>

          <div className={sectionCls}>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">经济性(V 轴)</div>
            <p className="text-caption">填「回收期」或「溢价+年节省」或「溢价+套利参数」任一组;ROIC/WACC 必填才计 V</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                ["costPremium", "初装溢价"],
                ["annualSaving", "年节省"],
                ["paybackYears", "回收期(年)"],
                ["dailyShiftedKwh", "日转移量"],
                ["activeDays", "年运行天数"],
                ["priceSpread", "峰谷价差"],
                ["roundTripEff", "往返效率"],
                ["roic", "ROIC"],
                ["wacc", "WACC"],
              ] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="text-caption">{label}</label>
                  <input className={inp} type="number" step="any" value={econ[k]} onChange={(e) => setEcon((c) => ({ ...c, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">可行性维度(F 轴 · 按画像权重加权)</div>
              <button type="button" className={addBtn} onClick={() => setDims((c) => [...c, { key: "", score: 50, evidenceLevel: 2 }])}>+ 维度</button>
            </div>
            {dims.map((d, i) => (
              <div key={i} className="mt-2 flex items-center gap-2">
                <input className={inp} placeholder="key(如 material/mrl/cost)" value={d.key} onChange={(e) => setDims((c) => c.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
                <input className={`${inp} w-20`} type="number" min="0" max="100" title="得分" value={d.score} onChange={(e) => setDims((c) => c.map((x, j) => j === i ? { ...x, score: Number(e.target.value) } : x))} />
                <select className={`${inp} w-20`} title="证据级" value={d.evidenceLevel} onChange={(e) => setDims((c) => c.map((x, j) => j === i ? { ...x, evidenceLevel: Number(e.target.value) } : x))}>
                  {[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>L{l}</option>)}
                </select>
                <button type="button" className={delBtn} onClick={() => setDims((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">ODI 机会(D 轴 · 重要度/满意度 0–10)</div>
              <button type="button" className={addBtn} onClick={() => setOdi((c) => [...c, { importance: 8, satisfaction: 4 }])}>+ JTBD</button>
            </div>
            {odi.map((o, i) => (
              <div key={i} className="mt-2 flex items-center gap-2">
                <label className="text-caption">重要度</label>
                <input className={`${inp} w-20`} type="number" min="0" max="10" value={o.importance} onChange={(e) => setOdi((c) => c.map((x, j) => j === i ? { ...x, importance: Number(e.target.value) } : x))} />
                <label className="text-caption">满意度</label>
                <input className={`${inp} w-20`} type="number" min="0" max="10" value={o.satisfaction} onChange={(e) => setOdi((c) => c.map((x, j) => j === i ? { ...x, satisfaction: Number(e.target.value) } : x))} />
                <button type="button" className={delBtn} onClick={() => setOdi((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">能力缺口(build/buy/partner 由引擎判)</div>
              <button type="button" className={addBtn} onClick={() => setGaps((c) => [...c, { capability: "", internalReadiness: 0.5, windowMonths: 12, buildMonths: 12 }])}>+ 缺口</button>
            </div>
            {gaps.map((g, i) => (
              <div key={i} className="mt-2 grid grid-cols-[1fr_70px_70px_70px_40px] items-center gap-2">
                <input className={inp} placeholder="能力" value={g.capability} onChange={(e) => setGaps((c) => c.map((x, j) => j === i ? { ...x, capability: e.target.value } : x))} />
                <input className={inp} type="number" step="0.1" min="0" max="1" title="内部就绪 0-1" value={g.internalReadiness} onChange={(e) => setGaps((c) => c.map((x, j) => j === i ? { ...x, internalReadiness: Number(e.target.value) } : x))} />
                <input className={inp} type="number" title="时间窗(月)" value={g.windowMonths} onChange={(e) => setGaps((c) => c.map((x, j) => j === i ? { ...x, windowMonths: Number(e.target.value) } : x))} />
                <input className={inp} type="number" title="自研需时(月)" value={g.buildMonths} onChange={(e) => setGaps((c) => c.map((x, j) => j === i ? { ...x, buildMonths: Number(e.target.value) } : x))} />
                <button type="button" className={delBtn} onClick={() => setGaps((c) => c.filter((_, j) => j !== i))}>删</button>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">论证(Toulmin)与证据(L1–L6)</div>
              <button type="button" className={addBtn} onClick={() => setClaims((c) => [...c, { axis: "f", claim: "", warrant: "", rebuttal: "", evidence: [] }])}>+ 论断</button>
            </div>
            {claims.map((c, i) => (
              <div key={i} className="mt-2 rounded-md border border-[var(--surface-border)] p-2">
                <div className="flex items-center gap-2">
                  <select className={`${inp} w-16`} value={c.axis} onChange={(e) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, axis: e.target.value } : x))}>
                    <option value="d">D</option><option value="f">F</option><option value="v">V</option>
                  </select>
                  <input className={inp} placeholder="论点 Claim" value={c.claim} onChange={(e) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, claim: e.target.value } : x))} />
                  <button type="button" className={delBtn} onClick={() => setClaims((cur) => cur.filter((_, j) => j !== i))}>删</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="推理 Warrant" value={c.warrant} onChange={(e) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, warrant: e.target.value } : x))} />
                  <input className={inp} placeholder="反证 Rebuttal(什么条件下不成立)" value={c.rebuttal} onChange={(e) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, rebuttal: e.target.value } : x))} />
                </div>
                <div className="mt-2">
                  <button type="button" className={addBtn} onClick={() => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, evidence: [...x.evidence, { level: 2, source: "", artifactRef: "", note: "" }] } : x))}>+ 证据</button>
                  {c.evidence.map((e, k) => (
                    <div key={k} className="mt-1 flex items-center gap-2">
                      <select className={`${inp} w-20`} value={e.level} onChange={(ev) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, evidence: x.evidence.map((y, m) => m === k ? { ...y, level: Number(ev.target.value) } : y) } : x))}>
                        {[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>L{l}</option>)}
                      </select>
                      <input className={inp} placeholder="来源/引用(必须可溯源)" value={e.source} onChange={(ev) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, evidence: x.evidence.map((y, m) => m === k ? { ...y, source: ev.target.value } : y) } : x))} />
                      <input
                        className={`${inp} ${e.level >= 3 && !e.artifactRef.trim() ? "border-[var(--signal-yellow)]" : ""}`}
                        placeholder={e.level >= 3 ? "物证 URL/文件号(L3+必填,否则按 L2 计)" : "物证 URL/文件号(可选)"}
                        value={e.artifactRef}
                        onChange={(ev) => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, evidence: x.evidence.map((y, m) => m === k ? { ...y, artifactRef: ev.target.value } : y) } : x))}
                      />
                      <button type="button" className={delBtn} onClick={() => setClaims((cur) => cur.map((x, j) => j === i ? { ...x, evidence: x.evidence.filter((_, m) => m !== k) } : x))}>删</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">杀手假设(错了就全垮)</div>
              <button type="button" className={addBtn} onClick={() => setAssumptions((c) => [...c, { code: "", statement: "", status: "pending", testPlan: "" }])}>+ 假设</button>
            </div>
            {assumptions.map((a, i) => (
              <div key={i} className="mt-2 grid grid-cols-[90px_1fr_100px_40px] items-center gap-2">
                <input className={inp} placeholder="编号" value={a.code} onChange={(e) => setAssumptions((c) => c.map((x, j) => j === i ? { ...x, code: e.target.value } : x))} />
                <input className={inp} placeholder="假设陈述" value={a.statement} onChange={(e) => setAssumptions((c) => c.map((x, j) => j === i ? { ...x, statement: e.target.value } : x))} />
                <select className={inp} value={a.status} onChange={(e) => setAssumptions((c) => c.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>
                  <option value="pending">待证伪</option>
                  <option value="validated">已验证</option>
                  <option value="failed">已证伪</option>
                </select>
                <button type="button" className={delBtn} onClick={() => setAssumptions((c) => c.filter((_, j) => j !== i))}>删</button>
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
