"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded border border-[var(--surface-border)] bg-transparent px-2 py-1 text-sm";

export function CapacityEditor() {
  const router = useRouter();
  const [form, setForm] = useState({
    demandUnits: "",
    capacityUnits: "",
    gapAction: "invest",
    bottleneckAsset: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/execution/capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存失败");
      setMsg("已记录本期产能快照");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_10rem_1fr_6rem]">
        <input
          className={inputCls}
          placeholder="需求量（units）"
          inputMode="decimal"
          value={form.demandUnits}
          onChange={(e) => setForm({ ...form, demandUnits: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="产能量（units）"
          inputMode="decimal"
          value={form.capacityUnits}
          onChange={(e) => setForm({ ...form, capacityUnits: e.target.value })}
        />
        <select
          className={inputCls}
          value={form.gapAction}
          onChange={(e) => setForm({ ...form, gapAction: e.target.value })}
        >
          <option value="invest">缺口对策：投资扩产</option>
          <option value="outsource">缺口对策：外包</option>
          <option value="defer_demand">缺口对策：延后需求</option>
        </select>
        <input
          className={inputCls}
          placeholder="瓶颈资产（可选）"
          value={form.bottleneckAsset}
          onChange={(e) => setForm({ ...form, bottleneckAsset: e.target.value })}
        />
        <button type="button" className="stratos-btn text-xs" disabled={busy} onClick={save}>
          {busy ? "保存中…" : "记录快照"}
        </button>
      </div>
      <p className="text-caption">
        利用率与缺口自动推导（需求/产能）· 每次保存新增一条本期快照，页面取最新一条
        {msg ? ` · ${msg}` : ""}
      </p>
    </div>
  );
}
