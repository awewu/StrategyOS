"use client";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, type BadgeTone, Button, Card, CardBody } from "@/components/ui/primitives";

/**
 * 季度战略"合理性审视"面板 (compass 第三 tab)
 * ──────────────────────────────────────────
 * 请中央 AI (Tandem) 对脆弱前提 / at-risk Bet 给 persevere/pivot/kill 建议,
 * 人工在此逐条做最终裁决并留痕。坚守与审视是一对辩证。
 */

type Rec = "persevere" | "pivot" | "kill" | "mixed";

interface VerdictRow {
  id: string;
  period: string;
  targetKind: string; // premise | bet | overall
  targetCode: string | null;
  targetLabel: string | null;
  aiRecommendation: Rec | null;
  aiRationale: string | null;
  aiModel: string | null;
  aiGeneratedAt: string | null;
  humanDecision: Rec | null;
  humanRationale: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
}

const REC_META: Record<string, { label: string; tone: BadgeTone }> = {
  persevere: { label: "坚守", tone: "green" },
  pivot: { label: "转向", tone: "yellow" },
  kill: { label: "终止", tone: "red" },
  mixed: { label: "分化", tone: "accent" },
};

/** 三选一裁决器的语义色 (B1 Segmented 原语落地前的过渡) */
const REC_COLOR: Record<string, string> = {
  persevere: "var(--signal-green)",
  pivot: "var(--signal-yellow)",
  kill: "var(--signal-red)",
  mixed: "var(--color-accent)",
};

const KIND_LABEL: Record<string, string> = { overall: "整体研判", premise: "前提", bet: "投资 Bet" };

function RecBadge({ rec }: { rec: string | null }) {
  if (!rec) return <span className="text-caption">—</span>;
  const m = REC_META[rec];
  if (!m) return <Badge tone="neutral">{rec}</Badge>;
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function RationalityReviewPanel() {
  const [rows, setRows] = useState<VerdictRow[]>([]);
  const [period, setPeriod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { decision?: Rec; rationale?: string }>>({});

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compass/rationality-verdict`, { cache: "no-store" });
      const data = await res.json();
      setRows(data.verdicts ?? []);
      setPeriod(data.period ?? null);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function requestVerdict() {
    setRequesting(true);
    try {
      const res = await fetch("/api/compass/rationality-verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persist: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setSource(data.verdict?.source ?? null);
      flash(data.verdict?.source === "central-ai" ? "中央 AI 裁决已生成" : "中央 AI 未接入，已用本地规则研判");
      await load();
    } catch { flash("裁决请求失败"); }
    finally { setRequesting(false); }
  }

  async function saveDecision(row: VerdictRow) {
    const draft = drafts[row.id];
    if (!draft?.decision) { flash("请先选择裁决"); return; }
    try {
      const res = await fetch("/api/compass/rationality-verdict", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, humanDecision: draft.decision, humanRationale: draft.rationale ?? "" }),
      });
      if (!res.ok) throw new Error();
      flash("人工裁决已留痕");
      setDrafts((d) => { const n = { ...d }; delete n[row.id]; return n; });
      await load();
    } catch { flash("留痕失败"); }
  }

  const ordered = [...rows].sort((a, b) => {
    const rank = (k: string) => (k === "overall" ? 0 : k === "premise" ? 1 : 2);
    return rank(a.targetKind) - rank(b.targetKind) || (a.targetCode ?? "").localeCompare(b.targetCode ?? "");
  });

  return (
    <section className="space-y-4">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          {period ? <span className="mr-1 text-[var(--color-text-secondary)]">期次 {period} ·</span> : null}
          请中央 AI 基于战略真值(脆弱前提/硬阻断/Bet 门禁/现金 runway)给出坚守/转向/终止建议，最终由人工裁决并留痕。
          {source ? <span className="ml-1">· 本次来源：{source === "central-ai" ? "中央 AI" : "本地规则(AI 未接入)"}</span> : null}
        </p>
        <Button disabled={requesting} onClick={requestVerdict}>
          {requesting ? "推理中…" : "请中央 AI 裁决"}
        </Button>
      </div>

      {loading ? (
        <div className="text-caption">加载中…</div>
      ) : ordered.length === 0 ? (
        <EmptyState title="本期尚无合理性裁决" hint="点击右上「请中央 AI 裁决」生成建议后可逐条人工裁决" />
      ) : (
        <div className="space-y-3">
          {ordered.map((row) => {
            const draft = drafts[row.id] ?? {};
            const decided = row.humanDecision;
            return (
              <Card key={row.id}>
                <CardBody>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
                    {KIND_LABEL[row.targetKind] ?? row.targetKind}{row.targetCode ? ` · ${row.targetCode}` : ""}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">AI 建议</span>
                  <RecBadge rec={row.aiRecommendation} />
                  {decided ? (
                    <span className="ml-auto flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      人工裁决 <RecBadge rec={decided} />
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-[var(--signal-yellow)]">待人工裁决</span>
                  )}
                </div>

                {row.targetLabel ? (
                  <p className="mt-2 text-sm text-[var(--color-text-primary)]">{row.targetLabel}</p>
                ) : null}
                {row.aiRationale ? (
                  <p className="mt-1 text-caption">{row.aiRationale}</p>
                ) : null}

                {decided ? (
                  <div className="mt-2 rounded-lg bg-black/[0.02] px-3 py-2 text-caption">
                    <span className="text-[var(--color-text-secondary)]">最终裁决留痕：</span>
                    {REC_META[decided]?.label ?? decided}
                    {row.humanRationale ? ` · ${row.humanRationale}` : ""}
                    {row.decidedBy ? ` · ${row.decidedBy}` : ""}
                    {row.decidedAt ? ` · ${new Date(row.decidedAt).toLocaleString("zh-CN")}` : ""}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 border-t border-[var(--surface-border)] pt-3">
                    <div className="flex gap-1">
                      {(["persevere", "pivot", "kill"] as const).map((r) => {
                        const active = draft.decision === r;
                        const color = REC_COLOR[r];
                        return (
                          <button key={r} type="button"
                            onClick={() => setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], decision: r } }))}
                            className="rounded-[var(--radius-control)] px-3 py-1 text-xs font-medium transition-colors duration-[var(--motion-fast)]"
                            style={active
                              ? { color: "white", backgroundColor: color }
                              : { color, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}>
                            {REC_META[r].label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={draft.rationale ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], rationale: e.target.value } }))}
                      placeholder="裁决理由（留痕，可选）"
                      className="w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <div className="flex justify-end">
                      <Button variant="secondary" size="sm" onClick={() => saveDecision(row)}>
                        确认裁决并留痕
                      </Button>
                    </div>
                  </div>
                )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
