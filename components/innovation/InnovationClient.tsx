"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import type { BetView, InnovationBundle, LineView } from "@/lib/innovation/views";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/innovation/views";
import { BetEditor } from "./BetEditor";
import { LineEditor } from "./LineEditor";
import { TriRadar } from "./TriRadar";

const STAGE_HINT: Record<string, string> = {
  discovery: "低成本探索",
  scoping: "锁定场景",
  business_case: "举证过关",
  development: "开发验证",
  testing: "中试/测试",
  launch: "放量",
};

const LIFECYCLE_LABEL: Record<string, string> = {
  introduction: "导入", growth: "成长", maturity: "成熟", decline: "衰退",
};

const PROBLEM_LABEL: Record<string, string> = {
  pmf_unvalidated: "PMF 未验证",
  tech_immature: "技术不成熟",
  manufacturing_rampup: "量产爬坡",
  cost_pressure: "成本压力",
  channel_gtm: "渠道/GTM",
  substitution_threat: "替代威胁",
};

const SOURCING_LABEL: Record<string, string> = { build: "自研", buy: "收购", partner: "合作" };

function verdictTone(v: string): "green" | "yellow" | "red" {
  return v === "go" ? "green" : v === "hold" ? "yellow" : "red";
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const tone = verdictTone(verdict);
  const cls =
    tone === "green"
      ? "bg-[var(--signal-green)]/15 text-[var(--signal-green-text)]"
      : tone === "yellow"
        ? "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow-text)]"
        : "bg-[var(--signal-red)]/15 text-[var(--signal-red-text)]";
  const label = verdict === "go" ? "GO" : verdict === "hold" ? "HOLD" : "KILL";
  return <span className={`rounded px-1.5 py-0.5 text-[var(--type-label)] font-semibold ${cls}`}>{label}</span>;
}

function EvidenceBadge({ level, bar }: { level: number; bar: number }) {
  const ok = level >= bar;
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[var(--type-label)] font-medium ${ok ? "bg-[var(--signal-green)]/15 text-[var(--signal-green-text)]" : "bg-black/[0.06] text-[var(--color-text-muted)]"}`}
      title={`论证强度 = 证据最短板;门槛 L${bar}`}
    >
      证据 L{level}
    </span>
  );
}

function fmtPayback(y: number | null): string {
  if (y === null) return "—";
  if (!Number.isFinite(y)) return "∞";
  return `${y.toFixed(1)}年`;
}

export function InnovationClient({ bundle }: { bundle: InnovationBundle }) {
  const router = useRouter();
  const [activeLineId, setActiveLineId] = useState<string | null>(bundle.lines[0]?.id ?? null);
  const [editLine, setEditLine] = useState<Partial<LineView> | null | "new">(null);
  const [editBet, setEditBet] = useState<BetView | null | "new">(null);
  const [detailBetId, setDetailBetId] = useState<string | null>(null);

  const line = useMemo(
    () => bundle.lines.find((l) => l.id === activeLineId) ?? bundle.lines[0] ?? null,
    [bundle.lines, activeLineId],
  );
  const detailBet = line?.bets.find((b) => b.id === detailBetId) ?? null;

  function refresh() {
    setEditLine(null);
    setEditBet(null);
    router.refresh();
  }

  async function deleteBet(id: string) {
    if (!confirm("删除该下注?")) return;
    await fetch(`/api/innovation/bet?id=${id}`, { method: "DELETE" });
    setDetailBetId(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {bundle.lines.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveLineId(l.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${line?.id === l.id ? "bg-[var(--color-accent)] text-white" : "border border-[var(--surface-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]"}`}
          >
            {l.name}
          </button>
        ))}
        <button
          onClick={() => setEditLine("new")}
          className="rounded-full border border-dashed border-[var(--color-accent)] px-3 py-1.5 text-sm text-[var(--color-accent)]"
        >
          + 产品线画像
        </button>
      </div>

      {!line && (
        <div className="rounded-xl border border-dashed border-[var(--surface-border)] p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">还没有产品线画像</p>
          <p className="mt-1 text-caption">
            创新底座 = 一套方法论 × N 份画像。先建一条产品线,声明它的死穴与过关标准。
          </p>
        </div>
      )}

      {line && (
        <>
          <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{line.name}</span>
                <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[var(--type-label)] text-[var(--color-text-secondary)]">
                  {LIFECYCLE_LABEL[line.lifecycleStage] ?? line.lifecycleStage}期
                </span>
                {line.dominantProblems.map((p) => (
                  <span key={p} className="rounded-full bg-[var(--signal-red)]/10 px-2 py-0.5 text-[var(--type-label)] text-[var(--signal-red-text)]">
                    {PROBLEM_LABEL[p] ?? p}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption">
                  Gate:回收≤{line.gateThresholds.maxPaybackYears}年 · 证据≥L{line.gateThresholds.minEvidenceLevel}
                </span>
                <button onClick={() => setEditLine(line)} className="rounded-md border border-[var(--surface-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]">
                  编辑画像
                </button>
                <button onClick={() => setEditBet("new")} className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-xs text-white">
                  + 新建下注
                </button>
              </div>
            </div>
            {Object.keys(line.fAxisWeights).length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-[var(--type-label)] tracking-wide text-[var(--color-text-muted)]">F 轴权重</span>
                {Object.entries(line.fAxisWeights).map(([k, w]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="text-[var(--type-label)] text-[var(--color-text-secondary)]">{k}</span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.06]">
                      <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, Number(w) * 100)}%` }} />
                    </div>
                    <span className="text-caption">{Number(w).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {STAGE_ORDER.map((stage, idx) => {
              const col = line.bets.filter((b) => b.stageGate === stage);
              return (
                <div key={stage} className="min-w-[230px] flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--type-label)] font-semibold text-[var(--color-accent)]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{STAGE_LABEL[stage]}</span>
                    <span className="text-caption">{STAGE_HINT[stage]}</span>
                  </div>
                  <div className={`space-y-2 rounded-lg p-2 ${idx >= 2 ? "bg-[var(--color-accent)]/[0.04]" : "bg-black/[0.03]"}`}>
                    {col.map((bet) => (
                      <button
                        key={bet.id}
                        onClick={() => setDetailBetId(bet.id)}
                        className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3 text-left transition hover:border-[var(--color-accent)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">{bet.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <VerdictBadge verdict={bet.gate.verdict} />
                              <EvidenceBadge level={bet.minEvidence} bar={line.gateThresholds.minEvidenceLevel} />
                              <span className="text-caption">{bet.horizon}</span>
                            </div>
                          </div>
                          <TriRadar d={bet.scores.d} f={bet.scores.f} v={bet.scores.v} size={54} tone={verdictTone(bet.gate.verdict)} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--surface-border)] pt-2 text-caption">
                          <span>回收 {fmtPayback(bet.paybackYears)}</span>
                          {bet.nextCommitAmount !== null && <span className="text-[var(--color-accent)]">下一笔 {bet.nextCommitAmount.toLocaleString()}</span>}
                          {bet.sourcing.filter((s) => s.decision !== "build").map((s) => (
                            <span key={s.capability} className="rounded bg-[var(--signal-yellow)]/15 px-1 py-0.5 text-[var(--signal-yellow-text)]">
                              {s.capability}→{SOURCING_LABEL[s.decision]}
                            </span>
                          ))}
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
            Business Case 起严格把关(证据/经济性/杀手假设一票否决);之前的阶段宽进,仅被证伪的杀手假设可 KILL。
          </p>
        </>
      )}

      {detailBet && line && (
        <Drawer onClose={() => setDetailBetId(null)} size="md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{detailBet.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <VerdictBadge verdict={detailBet.gate.verdict} />
                  <span className="text-caption">{STAGE_LABEL[detailBet.stageGate]} · {detailBet.horizon}</span>
                  {detailBet.abandonRight && <span className="text-[var(--type-label)] text-[var(--signal-green-text)]">保留放弃权</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditBet(detailBet)} className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">编辑</button>
                <button onClick={() => deleteBet(detailBet.id)} className="rounded-md px-2 py-1 text-xs text-[var(--signal-red-text)]">删除</button>
              </div>
            </div>

            <div className="mt-3 flex justify-center">
              <TriRadar d={detailBet.scores.d} f={detailBet.scores.f} v={detailBet.scores.v} size={190} showLabels tone={verdictTone(detailBet.gate.verdict)} />
            </div>

            {detailBet.gate.blockers.length > 0 && (
              <div className="mt-3 rounded-lg border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5 p-3">
                <div className="text-xs font-medium text-[var(--signal-red-text)]">Gate 阻断/待办</div>
                <ul className="mt-1 space-y-1">
                  {detailBet.gate.blockers.map((b, i) => (
                    <li key={i} className="text-xs text-[var(--color-text-secondary)]">· {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {detailBet.sourcing.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">能力缺口 → 引擎判定</div>
                <div className="mt-1 space-y-1">
                  {detailBet.sourcing.map((s) => (
                    <div key={s.capability} className="flex items-center justify-between rounded-md bg-black/[0.03] px-2 py-1.5 text-xs">
                      <span className="text-[var(--color-text-secondary)]">{s.capability}</span>
                      <span className="flex items-center gap-2">
                        <span className={s.decision === "buy" ? "font-medium text-[var(--signal-yellow-text)]" : "text-[var(--color-text-primary)]"}>
                          {SOURCING_LABEL[s.decision]} · {s.reason}
                        </span>
                        {s.decision !== "build" && (
                          <a
                            href={`/ma?new=1&dealType=${s.decision === "buy" ? "acquisition" : "jv"}&direction=${encodeURIComponent(s.capability)}&thesis=${encodeURIComponent(`${s.decision === "buy" ? "收购" : "合资"}获取「${s.capability}」能力——${s.reason}(来自创新下注:${detailBet.title})`)}&crux=${encodeURIComponent(detailBet.title)}`}
                            className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[var(--type-label)] text-white"
                          >
                            发起交易 →
                          </a>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailBet.claims.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">论证(强度 = 证据最短板)</div>
                <div className="mt-1 space-y-2">
                  {detailBet.claims.map((c) => (
                    <div key={c.id} className="rounded-md border border-[var(--surface-border)] p-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[var(--type-label)] font-semibold text-[var(--color-accent)]">{c.axis}</span>
                        <EvidenceBadge level={c.strength} bar={line.gateThresholds.minEvidenceLevel} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-text-primary)]">{c.claim}</p>
                      {c.rebuttal && <p className="mt-0.5 text-[var(--type-label)] text-[var(--signal-red-text)]/80">反证:{c.rebuttal}</p>}
                      {c.evidence.map((e) => (
                        <p key={e.id} className="mt-0.5 text-caption">
                          {e.effectiveLevel < e.level ? (
                            <span className="text-[var(--signal-yellow-text)]">L{e.level}→L{e.effectiveLevel} 未接地(缺物证)</span>
                          ) : (
                            <>L{e.level}</>
                          )}
                          {" · "}{e.source}{e.stale ? " · ⚠stale 需复研" : ""}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailBet.assumptions.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-[var(--color-text-primary)]">杀手假设</div>
                <div className="mt-1 space-y-1">
                  {detailBet.assumptions.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md bg-black/[0.03] px-2 py-1.5 text-xs">
                      <span className="text-[var(--color-text-secondary)]">{a.code} · {a.statement}</span>
                      <span className={a.status === "failed" ? "text-[var(--signal-red-text)]" : a.status === "validated" ? "text-[var(--signal-green-text)]" : "text-[var(--signal-yellow-text)]"}>
                        {a.status === "failed" ? "已证伪" : a.status === "validated" ? "已验证" : "待证伪"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </Drawer>
      )}

      {editLine !== null && (
        <LineEditor line={editLine === "new" ? null : editLine} onClose={() => setEditLine(null)} onSaved={refresh} />
      )}
      {editBet !== null && line && (
        <BetEditor lineId={line.id} bet={editBet === "new" ? null : editBet} onClose={() => setEditBet(null)} onSaved={refresh} />
      )}
    </div>
  );
}
