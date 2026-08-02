"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaPipelinePanel } from "@/components/finance/MaPipelinePanel";
import { Input, Select, Textarea } from "@/components/ui/primitives";
import type { MaPipelineItem } from "@/lib/types/stratos";

const STAGES = ["watch", "screen", "dd", "signed", "integrating"] as const;
const DIRS = ["channel", "tech", "jv", "brand"] as const;

export function MaPipelineEditor({
  initialItems,
  source,
}: {
  initialItems: MaPipelineItem[];
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchItem(index: number, patch: Partial<MaPipelineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/ma-pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const j = (await res.json()) as { items?: MaPipelineItem[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.items) setItems(j.items);
      setEditing(false);
      setMsg("M&A 管道已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stratos-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">数据源 {source === "database" ? "DB" : "Demo"}</p>
        <div className="flex flex-wrap items-center gap-2">
          {msg ? <span className="text-caption text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" className="stratos-btn stratos-btn--ghost" onClick={() => setEditing(false)} disabled={busy}>
                取消
              </button>
              <button type="button" className="stratos-btn stratos-btn--primary" onClick={() => void save()} disabled={busy}>
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button type="button" className="stratos-btn stratos-btn--primary" onClick={() => setEditing(true)}>
              编辑管道
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="stratos-page">
          {items.map((item, i) => (
            <div key={item.id} className="stratos-card stratos-card--padded space-y-3">
              <Input fullWidth value={item.name} onChange={(e) => patchItem(i, { name: e.target.value })} placeholder="项目名称" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label-xs">阶段</span>
                  <Select fullWidth value={item.stage} onChange={(e) => patchItem(i, { stage: e.target.value as MaPipelineItem["stage"] })}>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="label-xs">方向</span>
                  <Select fullWidth value={item.direction} onChange={(e) => patchItem(i, { direction: e.target.value as MaPipelineItem["direction"] })}>
                    {DIRS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <Input fullWidth value={item.valuationRange} onChange={(e) => patchItem(i, { valuationRange: e.target.value })} placeholder="估值区间" />
              <Textarea fullWidth rows={2} value={item.synergyThesis} onChange={(e) => patchItem(i, { synergyThesis: e.target.value })} placeholder="协同逻辑" />
              <Input fullWidth value={item.integrationMilestone100d ?? ""} onChange={(e) => patchItem(i, { integrationMilestone100d: e.target.value || undefined })} placeholder="D100 里程碑（可选）" />
            </div>
          ))}
        </div>
      ) : (
        <MaPipelinePanel items={items} />
      )}
    </div>
  );
}
