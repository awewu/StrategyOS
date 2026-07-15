"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import type { DealType } from "@/lib/ma/types";
import type { DealView, MaBundle } from "@/lib/ma/views";
import { DEAL_STAGE_LABEL, DEAL_STAGE_ORDER, DEAL_TYPE_LABEL } from "@/lib/ma/views";
import { DealEditor, type DealPrefill } from "./DealEditor";
import { FootballFieldChart } from "./FootballFieldChart";

const STAGE_HINT: Record<string, string> = {
  sourcing: "论点挂帅",
  screening: "风险清单",
  dd: "红旗登记",
  valuation: "三角+结构",
  approval: "举证过关",
  integration: "百日计划",
  postclose: "兑现追踪",
};

const TYPE_TONE: Record<DealType, string> = {
  acquisition: "bg-[var(--color-accent)]/12 text-[var(--color-accent)]",
  merger: "bg-[var(--accent-sim-dim)] text-[var(--accent-sim)]",
  minority_investment: "bg-[var(--signal-green)]/12 text-[var(--signal-green)]",
  jv: "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow)]",
};

function VerdictBadge({ verdict }: { verdict: string }) {
  const cls =
    verdict === "go"
      ? "bg-[var(--signal-green)]/15 text-[var(--signal-green)]"
      : verdict === "hold"
        ? "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow)]"
        : "bg-[var(--signal-red)]/15 text-[var(--signal-red)]";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${cls}`}>{verdict.toUpperCase()}</span>;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

export function MaClient({ bundle, prefill }: { bundle: MaBundle; prefill?: DealPrefill | null }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<DealType | "all">("all");
  const [editDeal, setEditDeal] = useState<DealView | null | "new">(prefill ? "new" : null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const deals = useMemo(
    () => (typeFilter === "all" ? bundle.deals : bundle.deals.filter((d) => d.dealType === typeFilter)),
    [bundle.deals, typeFilter],
  );
  const detail = bundle.deals.find((d) => d.id === detailId) ?? null;
  const detailProfile = detail ? bundle.profiles.find((p) => p.dealType === detail.dealType) : null;

  function refresh() {
    setEditDeal(null);
    router.refresh();
  }

  async function deleteDeal(id: string) {
    if (!confirm("删除该交易?")) return;
    await fetch(`/api/ma/deal?id=${id}`, { method: "DELETE" });
    setDetailId(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`rounded-full px-3 py-1.5 text-sm ${typeFilter === "all" ? "bg-[var(--color-accent)] text-white" : "border border-[var(--surface-border)] text-[var(--color-text-secondary)]"}`}
        >
          全部 {bundle.deals.length}
        </button>
        {(Object.keys(DEAL_TYPE_LABEL) as DealType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1.5 text-sm ${typeFilter === t ? "bg-[var(--color-accent)] text-white" : "border border-[var(--surface-border)] text-[var(--color-text-secondary)]"}`}
          >
            {DEAL_TYPE_LABEL[t]} {bundle.deals.filter((d) => d.dealType === t).length}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setEditDeal("new")} className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white">
          + 新建交易
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {DEAL_STAGE_ORDER.map((stage, idx) => {
          const col = deals.filter((d) => d.stage === stage);
          const strict = idx >= 4;
          return (
            <div key={stage} className="min-w-[210px] flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[11px] font-semibold text-[var(--color-accent)]">
                  {idx + 1}
                </span>
                <span className="text-xs font-medium text-[var(--color-text-primary)]">{DEAL_STAGE_LABEL[stage]}</span>
                <span className="text-caption">{STAGE_HINT[stage]}</span>
              </div>
              <div className={`space-y-2 rounded-lg p-2 ${strict ? "bg-[var(--color-accent)]/[0.04]" : "bg-black/[0.03]"}`}>
                {col.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => setDetailId(deal.id)}
                    className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3 text-left transition hover:border-[var(--color-accent)]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_TONE[deal.dealType]}`}>
                        {DEAL_TYPE_LABEL[deal.dealType]}
                      </span>
                      <VerdictBadge verdict={deal.gate.verdict} />
                    </div>
                    <div className="mt-1.5 truncate text-sm font-medium text-[var(--color-text-primary)]">{deal.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-caption">
                      <span>{deal.direction}</span>
                      {deal.price !== null && <span>对价 {deal.price.toLocaleString()}</span>}
                      {deal.price !== null && deal.synergyNpvValue > 0 && (
                        <span className={deal.economics.synergyPctOfPrice > 0.45 ? "text-[var(--signal-yellow)]" : ""}>
                          协同占 {pct(deal.economics.synergyPctOfPrice)}
                        </span>
                      )}
                      {deal.gate.blockers.length > 0 && (
                        <span className="text-[var(--signal-red)]">{deal.gate.blockers.length} 项阻断</span>
                      )}
                    </div>
                  </button>
                ))}
                {col.length === 0 && <div className="py-5 text-center text-caption">—</div>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-caption">
        审批起严格把关(红线一票否决);之前阶段宽进——阻断项作为待办清单显示,不 KILL。阈值与必备条款由交易形态画像决定。
      </p>

      {detail && (
        <Drawer onClose={() => setDetailId(null)} size="lg">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_TONE[detail.dealType]}`}>{DEAL_TYPE_LABEL[detail.dealType]}</span>
                  <VerdictBadge verdict={detail.gate.verdict} />
                  <span className="text-caption">{DEAL_STAGE_LABEL[detail.stage]}</span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-[var(--color-text-primary)]">{detail.name}</h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{detail.thesis}</p>
                {detail.linkedCrux && <p className="mt-0.5 text-[11px] text-[var(--color-accent)]">⚓ {detail.linkedCrux}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => setEditDeal(detail)} className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">编辑</button>
                <button onClick={() => deleteDeal(detail.id)} className="rounded-md px-2 py-1 text-xs text-[var(--signal-red)]">删除</button>
              </div>
            </div>

            {detail.gate.blockers.length > 0 && (
              <div className="mt-3 rounded-lg border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5 p-3">
                <div className="text-xs font-medium text-[var(--signal-red)]">Gate 阻断/待办</div>
                <ul className="mt-1 space-y-1">
                  {detail.gate.blockers.map((b, i) => <li key={i} className="text-xs text-[var(--color-text-secondary)]">· {b}</li>)}
                </ul>
              </div>
            )}
            {detail.gate.warnings.length > 0 && (
              <div className="mt-2 rounded-lg border border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/5 p-2">
                {detail.gate.warnings.map((w, i) => <p key={i} className="text-[11px] text-[var(--signal-yellow)]">⚠ {w}</p>)}
              </div>
            )}

            {detail.valuations.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">估值三角 Football Field</div>
                <div className="mt-1 overflow-x-auto">
                  <FootballFieldChart valuations={detail.valuations} price={detail.price} walkAway={detail.walkAwayPrice} width={420} />
                </div>
              </div>
            )}

            {(detail.dealStructure.cashPct !== undefined || detail.dealStructure.earnoutPct !== undefined) && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">交易结构</div>
                <div className="mt-1 flex h-3 w-full overflow-hidden rounded-full">
                  <div className="bg-[var(--color-accent)]" style={{ width: pct(detail.dealStructure.cashPct ?? 0) }} title="现金" />
                  <div className="bg-[var(--accent-sim)]" style={{ width: pct(detail.dealStructure.stockPct ?? 0) }} title="股份" />
                  <div className="bg-[var(--signal-yellow)]" style={{ width: pct(detail.dealStructure.earnoutPct ?? 0) }} title="earnout" />
                </div>
                <div className="mt-1 flex gap-3 text-caption">
                  <span>现金 {pct(detail.dealStructure.cashPct ?? 0)}</span>
                  <span>股份 {pct(detail.dealStructure.stockPct ?? 0)}</span>
                  <span>earnout {pct(detail.dealStructure.earnoutPct ?? 0)}{detail.dealStructure.earnoutTerms ? ` · ${detail.dealStructure.earnoutTerms}` : ""}</span>
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "协同 NPV", value: detail.synergyNpvValue > 0 ? detail.synergyNpvValue.toLocaleString() : "—" },
                { label: "协同/对价", value: detail.price ? pct(detail.economics.synergyPctOfPrice) : "—" },
                { label: "ROIC−WACC", value: detail.economics.roicSpread !== null ? pct(detail.economics.roicSpread) : "—" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg bg-black/[0.03] p-2 text-center">
                  <div className="text-sm font-semibold text-[var(--color-text-primary)]">{kpi.value}</div>
                  <div className="text-caption">{kpi.label}</div>
                </div>
              ))}
            </div>

            {detail.synergies.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">协同量化(逐条挂证据级)</div>
                <div className="mt-1 space-y-1">
                  {detail.synergies.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md bg-black/[0.03] px-2 py-1.5 text-xs">
                      <span className="text-[var(--color-text-secondary)]">
                        {s.type === "cost" ? "成本" : "收入"} · {s.title}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-[var(--color-text-primary)]">{s.runRate.toLocaleString()}/年</span>
                        <span className={`rounded px-1 py-0.5 text-[11px] ${s.evidenceLevel >= 4 ? "bg-[var(--signal-green)]/15 text-[var(--signal-green)]" : "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow)]"}`}>
                          L{s.evidenceLevel}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailProfile && detailProfile.requiredFlags.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">{detailProfile.name} · 必备条款</div>
                <div className="mt-1 space-y-1">
                  {detailProfile.requiredFlags.map((rf) => (
                    <div key={rf.key} className="flex items-center justify-between rounded-md bg-black/[0.03] px-2 py-1.5 text-xs">
                      <span className="text-[var(--color-text-secondary)]">{rf.label}</span>
                      <span className={detail.flags[rf.key] ? "text-[var(--signal-green)]" : "text-[var(--signal-red)]"}>
                        {detail.flags[rf.key] ? "✓ 已落实" : "✗ 未落实"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.findings.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">尽调红旗登记册</div>
                <div className="mt-1 space-y-1">
                  {detail.findings.map((f) => (
                    <div key={f.id} className="rounded-md bg-black/[0.03] px-2 py-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--color-text-muted)]">{f.workstream}</span>
                        <span className="flex items-center gap-1.5">
                          {f.dealBreaker && <span className="rounded bg-[var(--signal-red)]/15 px-1 py-0.5 text-[11px] font-semibold text-[var(--signal-red)]">deal-breaker</span>}
                          <span className={f.status === "closed" ? "text-[var(--signal-green)]" : f.status === "mitigated" ? "text-[var(--signal-yellow)]" : "text-[var(--signal-red)]"}>
                            {f.status === "closed" ? "已关" : f.status === "mitigated" ? "已缓解" : "未解"}
                          </span>
                        </span>
                      </div>
                      <p className="mt-0.5 text-[var(--color-text-secondary)]">{f.finding}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.conditions.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">先决条件 CP</div>
                <div className="mt-1 space-y-1">
                  {detail.conditions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-md bg-black/[0.03] px-2 py-1.5 text-xs">
                      <span className="text-[var(--color-text-secondary)]">{c.item}{c.owner ? ` · ${c.owner}` : ""}</span>
                      <span className={c.status === "closed" ? "text-[var(--signal-green)]" : "text-[var(--signal-yellow)]"}>
                        {c.status === "closed" ? "✓ 已关" : `未关${c.dueDate ? ` · ${c.dueDate}` : ""}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </Drawer>
      )}

      {editDeal !== null && (
        <DealEditor
          deal={editDeal === "new" ? null : editDeal}
          profiles={bundle.profiles}
          prefill={editDeal === "new" ? prefill : null}
          onClose={() => setEditDeal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
