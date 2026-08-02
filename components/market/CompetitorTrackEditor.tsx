"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui/primitives";

interface TrackRow {
  competitor: string;
  product: string;
  gtm: string;
  brand: string;
  strategy: string;
  momentum: string;
  momentumNote: string;
}

export function CompetitorTrackEditor({ initial }: { initial: TrackRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<TrackRow[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (i: number, patch: Partial<TrackRow>) =>
    setRows(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/market/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存失败");
      setMsg("已保存");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-caption">
          每行一个竞品 · 产品/GTM/品牌/战略四栏 + 动能（up/flat/down）{msg ? ` · ${msg}` : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="stratos-btn stratos-btn--ghost text-xs"
            onClick={() =>
              setRows([...rows, { competitor: "", product: "", gtm: "", brand: "", strategy: "", momentum: "flat", momentumNote: "" }])
            }
          >
            + 竞品
          </button>
          <button type="button" className="stratos-btn text-xs" disabled={busy} onClick={save}>
            {busy ? "保存中…" : "保存矩阵"}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-[var(--surface-border)] p-3 sm:grid-cols-[8rem_1fr_1fr_5rem_2rem]">
            <Input fullWidth inputSize="sm" placeholder="竞品名" value={r.competitor} onChange={(e) => set(i, { competitor: e.target.value })} />
            <Input fullWidth inputSize="sm" placeholder="产品动向" value={r.product} onChange={(e) => set(i, { product: e.target.value })} />
            <Input fullWidth inputSize="sm" placeholder="GTM 动向" value={r.gtm} onChange={(e) => set(i, { gtm: e.target.value })} />
            <Select fullWidth selectSize="sm" value={r.momentum} onChange={(e) => set(i, { momentum: e.target.value })}>
              <option value="up">up</option>
              <option value="flat">flat</option>
              <option value="down">down</option>
            </Select>
            <button type="button" className="text-[var(--signal-red)]" aria-label="删除行" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
            <Input fullWidth inputSize="sm" className="sm:col-span-2" placeholder="品牌动向" value={r.brand} onChange={(e) => set(i, { brand: e.target.value })} />
            <Input fullWidth inputSize="sm" className="sm:col-span-2" placeholder="战略判断" value={r.strategy} onChange={(e) => set(i, { strategy: e.target.value })} />
            <Input fullWidth inputSize="sm" className="sm:col-span-5" placeholder="动能备注" value={r.momentumNote} onChange={(e) => set(i, { momentumNote: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}
