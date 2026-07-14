"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AARRRFunnel } from "@/components/growth/AARRRFunnel";
import { KellerBrandPyramid } from "@/components/growth/KellerBrandPyramid";
import type { AarrrFunnelStage, KellerBrandLayer } from "@/lib/types/stratos";

export function GrowthAnalyticsEditor({
  initialAarrr,
  initialKeller,
  source,
}: {
  initialAarrr: AarrrFunnelStage[];
  initialKeller: KellerBrandLayer[];
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [aarrr, setAarrr] = useState(initialAarrr);
  const [keller, setKeller] = useState(initialKeller);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchAarrr(index: number, field: keyof AarrrFunnelStage, value: string | number) {
    setAarrr((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function patchKeller(index: number, field: keyof KellerBrandLayer, value: string | number) {
    setKeller((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/growth-analytics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aarrrFunnel: aarrr, kellerBrandLayers: keller }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("增长分析已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stratos-card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            增长诊断 · 漏斗与品牌（参考）
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            市场侧参考视图 · 左：客户漏在哪一段（AARRR 漏斗）· 右：品牌心智短板在哪一层（Keller 金字塔）· 数据源 {source === "database" ? "DB" : "Demo"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--signal-green)]">{msg}</span> : null}
          {editing ? (
            <>
              <button
                type="button"
                className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs"
                onClick={() => {
                  setAarrr(initialAarrr);
                  setKeller(initialKeller);
                  setEditing(false);
                }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
                onClick={() => void save()}
              >
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs"
              onClick={() => setEditing(true)}
            >
              编辑增长分析
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">AARRR 漏斗</p>
            <div className="hidden gap-1 px-2 text-[11px] text-[var(--color-text-muted)] sm:grid sm:grid-cols-4">
              <span>阶段</span><span>人数</span><span>转化 %</span><span>行业基准 %</span>
            </div>
            {aarrr.map((s, i) => (
              <div key={s.stage} className="grid gap-1 rounded border border-[var(--surface-border)] p-2 text-xs sm:grid-cols-4">
                <input className="rounded border px-2 py-1" value={s.label} onChange={(e) => patchAarrr(i, "label", e.target.value)} />
                <input type="number" className="rounded border px-2 py-1 font-data" value={s.count} onChange={(e) => patchAarrr(i, "count", Number(e.target.value))} />
                <input type="number" className="rounded border px-2 py-1 font-data" value={s.conversionPct} onChange={(e) => patchAarrr(i, "conversionPct", Number(e.target.value))} />
                <input type="number" className="rounded border px-2 py-1 font-data" value={s.benchmarkPct} onChange={(e) => patchAarrr(i, "benchmarkPct", Number(e.target.value))} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">Keller 品牌心智四层</p>
            <div className="hidden gap-1 px-2 text-[11px] text-[var(--color-text-muted)] sm:grid sm:grid-cols-4">
              <span className="sm:col-span-2">层级名称</span><span>调研得分</span><span>目标</span>
            </div>
            {keller.map((l, i) => (
              <div key={l.layer} className="grid gap-1 rounded border border-[var(--surface-border)] p-2 text-xs sm:grid-cols-4">
                <input className="rounded border px-2 py-1 sm:col-span-2" value={l.name} onChange={(e) => patchKeller(i, "name", e.target.value)} />
                <input type="number" className="rounded border px-2 py-1 font-data" value={l.score} onChange={(e) => patchKeller(i, "score", Number(e.target.value))} />
                <input type="number" className="rounded border px-2 py-1 font-data" value={l.target} onChange={(e) => patchKeller(i, "target", Number(e.target.value))} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <AARRRFunnel stages={aarrr} />
          <KellerBrandPyramid layers={keller} />
        </div>
      )}
    </section>
  );
}
