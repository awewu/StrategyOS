"use client";

import { useState } from "react";
import { ThreeStackPanel } from "@/components/strategy/ThreeStackPanel";
import type {
  CapStackPeriod,
  GtmBet,
  InvestmentCase,
  ProductBet,
} from "@/lib/types/stratos";

export function StacksEditor({
  initialCapStack,
  initialIcs,
  initialProductBets,
  initialGtmBets,
  source,
}: {
  initialCapStack: CapStackPeriod;
  initialIcs: InvestmentCase[];
  initialProductBets: ProductBet[];
  initialGtmBets: GtmBet[];
  source: "database" | "demo";
}) {
  const [capStack, setCapStack] = useState(initialCapStack);
  const [ics, setIcs] = useState(initialIcs);
  const [productBets, setProductBets] = useState(initialProductBets);
  const [gtmBets, setGtmBets] = useState(initialGtmBets);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const capSummary = `CAPEX B ${capStack.capexBudget} / A ${capStack.capexActual} / F ${capStack.capexForecast} 万 · 波峰后 runway ${capStack.runwayAfterPeak} 月`;

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/stacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capStack, investmentCases: ics, productBets, gtmBets }),
      });
      const j = (await res.json()) as {
        capStack?: CapStackPeriod;
        investmentCases?: InvestmentCase[];
        productBets?: ProductBet[];
        gtmBets?: GtmBet[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.capStack) setCapStack(j.capStack);
      if (j.investmentCases) setIcs(j.investmentCases);
      if (j.productBets) setProductBets(j.productBets);
      if (j.gtmBets) setGtmBets(j.gtmBets);
      setEditing(false);
      setMsg("三栈已保存");
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-text-muted)]">数据源 {source === "database" ? "DB" : "Demo"}</p>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="text-xs">
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded bg-[var(--color-accent)] px-2 py-1 text-xs text-white"
              >
                保存三栈
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-[var(--color-accent)]">
              编辑三栈
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <section className="space-y-4 rounded-lg border border-[var(--surface-border)] p-4">
          <h3 className="text-sm font-medium">CapStack 摘要</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["capexBudget", "capexActual", "capexForecast"] as const).map((key) => (
              <label key={key} className="text-xs">
                {key === "capexBudget" ? "B" : key === "capexActual" ? "A" : "F"}
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1"
                  value={capStack[key]}
                  onChange={(e) => setCapStack((p) => ({ ...p, [key]: Number(e.target.value) }))}
                />
              </label>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StackEditColumn
              title="资本栈 IC"
              items={ics.map((ic) => ({ id: ic.id, title: ic.title, tag: ic.budgetTag, toggle: ic.fpaToggle, status: ic.gateStatus }))}
              onTitle={(id, title) => setIcs((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)))}
              onTag={(id, tag) => setIcs((prev) => prev.map((x) => (x.id === id ? { ...x, budgetTag: tag } : x)))}
            />
            <StackEditColumn
              title="产品栈"
              items={productBets.map((pb) => ({
                id: pb.id,
                title: pb.title,
                tag: pb.budgetTag ?? "",
                toggle: pb.fpaToggle,
                status: pb.gateStatus,
              }))}
              onTitle={(id, title) => setProductBets((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)))}
              onTag={(id, tag) => setProductBets((prev) => prev.map((x) => (x.id === id ? { ...x, budgetTag: tag } : x)))}
            />
            <StackEditColumn
              title="渠道栈"
              items={gtmBets.map((gb) => ({
                id: gb.id,
                title: gb.title,
                tag: gb.budgetTag ?? "",
                toggle: gb.fpaToggle,
                status: gb.gateStatus,
              }))}
              onTitle={(id, title) => setGtmBets((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)))}
              onTag={(id, tag) => setGtmBets((prev) => prev.map((x) => (x.id === id ? { ...x, budgetTag: tag } : x)))}
            />
          </div>
        </section>
      ) : (
        <ThreeStackPanel ics={ics} productBets={productBets} gtmBets={gtmBets} capSummary={capSummary} />
      )}
    </div>
  );
}

function StackEditColumn({
  title,
  items,
  onTitle,
  onTag,
}: {
  title: string;
  items: { id: string; title: string; tag: string; toggle: string; status: string }[];
  onTitle: (id: string, title: string) => void;
  onTag: (id: string, tag: string) => void;
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-[var(--surface-border)] p-2">
            <input
              className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm"
              value={item.title}
              onChange={(e) => onTitle(item.id, e.target.value)}
            />
            <input
              className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1 font-data text-xs"
              value={item.tag}
              onChange={(e) => onTag(item.id, e.target.value)}
              placeholder="budget_tag"
            />
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
              {item.status} · FPA {item.toggle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
