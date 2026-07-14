"use client";

import { useEffect, useState } from "react";
import type { CellDetail } from "@/lib/market-intel/workbench-data";

const DIM_LABEL: Record<string, string> = { product: "产品", gtm: "GTM", brand: "品牌", strategy: "战略模式" };
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  todo: { label: "待研究", cls: "bg-black/[0.06] text-[var(--color-text-muted)]" },
  in_progress: { label: "进行中", cls: "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow)]" },
  current: { label: "现行", cls: "bg-[var(--signal-green)]/15 text-[var(--signal-green)]" },
  stale: { label: "需复研", cls: "bg-[var(--signal-red)]/15 text-[var(--signal-red)]" },
  archived: { label: "已归档", cls: "bg-black/[0.06] text-[var(--color-text-muted)]" },
};
const POS_LABEL: Record<string, { label: string; cls: string }> = {
  lead: { label: "领先", cls: "text-[var(--signal-green)]" },
  parity: { label: "持平", cls: "text-[var(--color-text-muted)]" },
  lag: { label: "落后", cls: "text-[var(--signal-red)]" },
};

const inputCls = "rounded border border-[var(--surface-border)] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

export function CellDetailPanel({
  productLineId, regionId, competitorId,
  productLineName, regionName, competitorName, summary, onClose, onSaved,
}: {
  productLineId: string; regionId: string; competitorId: string;
  productLineName: string; regionName: string; competitorName: string;
  summary: string | null; onClose: () => void;
  onSaved?: () => void;
}) {
  const [detail, setDetail] = useState<CellDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"compare" | "research" | "winloss" | "trend" | "edit">("compare");

  function reload() {
    setLoading(true);
    const q = new URLSearchParams({ productLineId, regionId, competitorId });
    fetch("/api/market/cell?" + q.toString())
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDetail(d))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const q = new URLSearchParams({ productLineId, regionId, competitorId });
    fetch("/api/market/cell?" + q.toString())
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setDetail(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productLineId, regionId, competitorId]);

  const ours = detail?.products.find((p) => p.isOurs);
  const comp = detail?.products.find((p) => !p.isOurs);
  const cell = detail?.cell;

  return (
    <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--surface-panel)] p-5">
      <div className="flex items-start justify-between border-b border-[var(--surface-border)] pb-3">
        <div>
          <h3 className="text-base font-semibold">{productLineName} · {regionName} · {competitorName}</h3>
          {summary && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{summary}</p>}
          {!cell && !loading && <p className="mt-1 text-xs text-[var(--color-accent)]">该战场尚未建档 — 切换到「评估」录入</p>}
        </div>
        <button onClick={onClose} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">关闭 ✕</button>
      </div>

      <div className="mt-3 flex gap-2 border-b border-[var(--surface-border)]">
        {[
          { id: "compare", label: "产品对比" },
          { id: "research", label: "四维研究" },
          { id: "winloss", label: "赢丢单" },
          { id: "trend", label: "趋势" },
          { id: "edit", label: "✎ 评估" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={"border-b-2 px-3 py-2 text-sm transition-colors " + (
              tab === t.id
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">加载中…</div>
      ) : (
        <div className="pt-4">
          {tab === "compare" && (
            ours && comp ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
                    <th className="px-3 py-2 text-left font-medium">规格维度</th>
                    <th className="px-3 py-2 text-right font-medium">{ours.name}</th>
                    <th className="px-3 py-2 text-right font-medium">{comp.name}</th>
                    <th className="px-3 py-2 text-center font-medium">我方</th>
                  </tr>
                </thead>
                <tbody>
                  {ours.specs.map((s) => {
                    const c = comp.specs.find((x) => x.key === s.key);
                    return (
                      <tr key={s.key} className="border-b border-[var(--surface-border)] last:border-0">
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                          {s.label}{s.unit ? " (" + s.unit + ")" : ""}
                          {s.weight >= 3 && <span className="ml-1 text-[11px] text-[var(--color-accent)]">核心</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-data tabular-nums">{s.valueNum ?? s.valueText ?? "—"}</td>
                        <td className="px-3 py-2 text-right font-data tabular-nums">{c?.valueNum ?? c?.valueText ?? "—"}</td>
                        <td className={"px-3 py-2 text-center text-xs font-medium " + (POS_LABEL[s.position ?? "parity"]?.cls ?? "")}>
                          {POS_LABEL[s.position ?? "parity"]?.label ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">该战场暂无产品规格对比数据。</p>
            )
          )}

          {tab === "research" && (
            (detail?.research.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {detail!.research.map((r) => (
                  <div key={r.id} className="rounded-md border border-[var(--surface-border)] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[var(--color-accent-dim)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">{DIM_LABEL[r.dimension]}</span>
                      <span className="text-sm font-medium">{r.subtopic}</span>
                      <span className={"rounded px-1.5 py-0.5 text-[11px] " + STATUS_LABEL[r.status].cls}>{STATUS_LABEL[r.status].label}</span>
                      {r.editedManually && <span className="rounded bg-[var(--signal-green)]/15 px-1.5 py-0.5 text-[11px] text-[var(--signal-green)]">人工确认</span>}
                      {r.origin === "hermes" && !r.editedManually && <span className="rounded bg-[var(--color-accent-dim)] px-1.5 py-0.5 text-[11px] text-[var(--color-accent)]">Hermes 草稿</span>}
                      <span className="ml-auto text-[11px] text-[var(--color-text-muted)]">置信 {r.confidence}</span>
                    </div>
                    {r.findings && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{r.findings}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">暂无研究画布，待事业部录入基线。</p>
            )
          )}

          {tab === "winloss" && (
            <WinLossTab
              regionId={regionId} competitorId={competitorId} productLineId={productLineId}
              records={detail?.winLoss ?? []}
              onAdded={reload}
            />
          )}

          {tab === "trend" && (
            <div className="space-y-5">
              {(detail?.dealerHistory.length ?? 0) > 0 && (
                <Sparkline title="对手渠道签约数（家）" points={detail!.dealerHistory} />
              )}
              {(detail?.priceHistory.length ?? 0) > 0 && (
                <Sparkline title="对手终端价（万元）" points={detail!.priceHistory} />
              )}
              {!(detail?.dealerHistory.length) && !(detail?.priceHistory.length) && (
                <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">暂无时间序列数据。</p>
              )}
            </div>
          )}

          {tab === "edit" && (
            <CellEditForm
              productLineId={productLineId} regionId={regionId} competitorId={competitorId}
              existing={cell ?? null}
              onSaved={() => { reload(); onSaved?.(); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── 战场评估编辑 ──────────────────────────────────────────────────────────────

function CellEditForm({ productLineId, regionId, competitorId, existing, onSaved }: {
  productLineId: string; regionId: string; competitorId: string;
  existing: CellDetail["cell"] | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    threatLevel: existing?.threatLevel ?? "medium",
    ourPosition: existing?.ourPosition ?? "parity",
    marketShareEst: existing?.marketShareEst?.toString() ?? "",
    priceIndexUs: existing?.priceIndexUs?.toString() ?? "",
    dealerCountComp: existing?.dealerCountComp?.toString() ?? "",
    dealerCountUs: existing?.dealerCountUs?.toString() ?? "",
    summary: existing?.summary ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/market/cell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productLineId, regionId, competitorId,
          threatLevel: form.threatLevel, ourPosition: form.ourPosition,
          marketShareEst: form.marketShareEst ? +form.marketShareEst : null,
          priceIndexUs: form.priceIndexUs ? +form.priceIndexUs : null,
          dealerCountComp: form.dealerCountComp ? +form.dealerCountComp : null,
          dealerCountUs: form.dealerCountUs ? +form.dealerCountUs : null,
          summary: form.summary || null,
        }),
      });
      if (!r.ok) { setErr((await r.json()).error ?? "保存失败"); return; }
      onSaved();
    } catch { setErr("网络错误"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-caption">人工录入或修订该战场评估，保存后标记为&ldquo;人工确认&rdquo;。</p>
      {err && <p className="rounded bg-[var(--signal-red)]/10 px-3 py-1.5 text-xs text-[var(--signal-red)]">{err}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">威胁等级</label>
          <select value={form.threatLevel} onChange={(e) => setForm({ ...form, threatLevel: e.target.value })} className={inputCls + " w-full"}>
            <option value="critical">极高</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">我方态势</label>
          <select value={form.ourPosition} onChange={(e) => setForm({ ...form, ourPosition: e.target.value })} className={inputCls + " w-full"}>
            <option value="lead">领先</option>
            <option value="parity">持平</option>
            <option value="lag">落后</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">对手市占率估算 (%)</label>
          <input type="number" value={form.marketShareEst} onChange={(e) => setForm({ ...form, marketShareEst: e.target.value })} placeholder="如 18.5" className={inputCls + " w-full"} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">价格指数（我方=100）</label>
          <input type="number" value={form.priceIndexUs} onChange={(e) => setForm({ ...form, priceIndexUs: e.target.value })} placeholder="如 89" className={inputCls + " w-full"} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">对手渠道数（家）</label>
          <input type="number" value={form.dealerCountComp} onChange={(e) => setForm({ ...form, dealerCountComp: e.target.value })} className={inputCls + " w-full"} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">我方渠道数（家）</label>
          <input type="number" value={form.dealerCountUs} onChange={(e) => setForm({ ...form, dealerCountUs: e.target.value })} className={inputCls + " w-full"} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">一句话战场结论</label>
        <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
          rows={2} placeholder="如：华东热泵战场史密斯处于绝对优势…"
          className={inputCls + " w-full resize-none"} />
      </div>
      <button onClick={save} disabled={saving}
        className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
        {saving ? "保存中…" : "保存战场评估"}
      </button>
    </div>
  );
}

// ── 赢丢单录入 ────────────────────────────────────────────────────────────────

function WinLossTab({ regionId, competitorId, productLineId, records, onAdded }: {
  regionId: string; competitorId: string; productLineId: string;
  records: NonNullable<CellDetail["winLoss"]>;
  onAdded: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ outcome: "loss", projectName: "", dealSizeCny: "", customerType: "", reason: "", recordedAt: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setSaving(true); setErr("");
    try {
      const isWin = form.outcome === "win";
      const r = await fetch("/api/market/winloss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: form.outcome, regionId, competitorId, productLineId,
          projectName: form.projectName || null,
          dealSizeCny: form.dealSizeCny ? +form.dealSizeCny * 10000 : null,
          customerType: form.customerType || null,
          winReason: isWin ? form.reason || null : null,
          lossReason: !isWin ? form.reason || null : null,
          recordedAt: form.recordedAt,
        }),
      });
      if (!r.ok) { setErr((await r.json()).error ?? "保存失败"); return; }
      setShowForm(false);
      setForm({ outcome: "loss", projectName: "", dealSizeCny: "", customerType: "", reason: "", recordedAt: new Date().toISOString().slice(0, 10) });
      onAdded();
    } catch { setErr("网络错误"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-caption">{records.length} 条记录</span>
        <button onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs text-white hover:opacity-90">
          + 录入赢丢单
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-[var(--surface-border)] p-4 space-y-3">
          {err && <p className="text-xs text-[var(--signal-red)]">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">结果</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className={inputCls + " w-full"}>
                <option value="win">赢单</option>
                <option value="loss">丢单</option>
                <option value="no_decision">未决</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">客户类型</label>
              <input value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })} placeholder="如酒店工程/精装楼盘" className={inputCls + " w-full"} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">项目名称</label>
              <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className={inputCls + " w-full"} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">合同金额（万元）</label>
              <input type="number" value={form.dealSizeCny} onChange={(e) => setForm({ ...form, dealSizeCny: e.target.value })} className={inputCls + " w-full"} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">{form.outcome === "win" ? "赢单原因" : "丢单原因"}</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2} className={inputCls + " w-full resize-none"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">日期</label>
            <input type="date" value={form.recordedAt} onChange={(e) => setForm({ ...form, recordedAt: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving}
              className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "保存中…" : "提交"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-md border border-[var(--surface-border)] px-4 py-1.5 text-sm hover:bg-black/[0.04]">取消</button>
          </div>
        </div>
      )}

      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((w) => (
            <div key={w.id} className={"rounded-md border-l-[3px] border border-[var(--surface-border)] p-3 " + (w.outcome === "win" ? "border-l-[var(--signal-green)]" : "border-l-[var(--signal-red)]")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={"rounded px-1.5 py-0.5 text-xs font-medium " + (w.outcome === "win" ? "bg-[var(--signal-green)]/15 text-[var(--signal-green)]" : "bg-[var(--signal-red)]/15 text-[var(--signal-red)]")}>
                  {w.outcome === "win" ? "赢单" : w.outcome === "loss" ? "丢单" : "未决"}
                </span>
                <span className="text-sm font-medium">{w.projectName}</span>
                {w.customerType && <span className="text-[11px] text-[var(--color-text-muted)]">{w.customerType}</span>}
                {w.dealSizeCny && <span className="ml-auto font-data text-caption">¥{(w.dealSizeCny / 10000).toFixed(0)}万</span>}
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{w.winReason ?? w.lossReason}</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{w.recordedAt}</p>
            </div>
          ))}
        </div>
      ) : (
        !showForm && <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">暂无赢丢单记录</p>
      )}
    </div>
  );
}

function Sparkline({ title, points }: { title: string; points: { period: string; value: number }[] }) {
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const first = vals[0], last = vals[vals.length - 1];
  const delta = first ? (((last - first) / first) * 100).toFixed(0) : "0";
  const w = 280, h = 48;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p.value - min) / range) * h;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">{title}</span>
        <span className={"font-data text-xs " + (Number(delta) > 0 ? "text-[var(--signal-red)]" : "text-[var(--signal-green)]")}>
          {Number(delta) > 0 ? "+" : ""}{delta}% · {first} → {last}
        </span>
      </div>
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={pts} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
      </svg>
    </div>
  );
}
