"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BscCard } from "@/lib/fpa/bsc-config-access";
import { BscLights } from "@/components/health/BscLights";
import type { TrafficLight } from "@/lib/types/stratos";

export function BscConfigEditor({
  initialCards,
  lights,
  source,
}: {
  initialCards: BscCard[];
  lights: Record<"financial" | "customer" | "process" | "learning", TrafficLight>;
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patch(index: number, field: keyof BscCard, value: string) {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/bsc-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("BSC 卡片已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  const merged = cards.map((c) => ({
    ...c,
    light: lights[c.key as keyof typeof lights] ?? c.light,
  }));

  return (
    <section className="stratos-card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">BSC 四满意</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            文案可编辑 · 灯色来自健康信号 · 数据源 {source === "database" ? "DB" : "Demo"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--signal-green)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => { setCards(initialCards); setEditing(false); }}>
                取消
              </button>
              <button type="button" disabled={busy} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs" onClick={() => void save()}>
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
              编辑 BSC 文案
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {cards.map((c, i) => (
            <div key={c.key} className="rounded-lg border border-[var(--surface-border)] p-4 space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">{c.key}</p>
              <input className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm" value={c.label} onChange={(e) => patch(i, "label", e.target.value)} placeholder="维度" />
              <input className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm" value={c.satisfaction} onChange={(e) => patch(i, "satisfaction", e.target.value)} placeholder="满意维度" />
              <input className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm" value={c.target} onChange={(e) => patch(i, "target", e.target.value)} placeholder="目标" />
            </div>
          ))}
        </div>
      ) : (
        <BscLights lights={lights} cards={merged} />
      )}
    </section>
  );
}
