"use client";

import Link from "next/link";
import { useState } from "react";
import type { MarketBriefItem } from "@/lib/market-intel/brief";
import type { IntelSignal } from "@/lib/market-intel/types";
import { DIMENSION_LABEL, IMPACT_LABEL } from "@/lib/market-intel/types";
import { SectionCard } from "@/components/ui/KpiTile";
import { EmptyState } from "@/components/ui/EmptyState";

export function MarketBriefPanel({ items }: { items: MarketBriefItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="暂无信号" hint="配置来源后运行 Hermes 扫描" />;
  }

  return (
    <SectionCard
      title="市场简报"
      dense
      action={<span className="text-caption text-[var(--color-text-muted)]">本周 Top {items.length} · So what 优先</span>}
    >
      <ul className="space-y-4">
        {items.map(({ signal, soWhat }) => (
          <li
            key={signal.id}
            className={`rounded-lg border border-l-[3px] p-4 ${
              signal.impact === "threat"
                ? "border-l-[var(--signal-red)] bg-[var(--signal-red)]/[0.04]"
                : signal.impact === "opportunity"
                  ? "border-l-[var(--signal-green)] bg-[var(--signal-green)]/[0.04]"
                  : "border-l-[var(--color-text-muted)]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-[var(--color-text-primary)]">{signal.competitor}</span>
              <span className="text-[var(--color-text-muted)]">{DIMENSION_LABEL[signal.dimension]}</span>
              <span className="rounded bg-black/[0.05] px-1.5 py-0.5">{IMPACT_LABEL[signal.impact]}</span>
            </div>
            <p className="mt-2 text-sm font-medium">{signal.title}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">{signal.summary}</p>
            <p className="mt-2 text-xs text-[var(--color-accent)]">So what · {soWhat}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {signal.linkedAssumptionCode ? (
                <Link href="/decode" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                  战略解码 →
                </Link>
              ) : null}
              <Link href="/versions" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                历史对照 →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

type AskResponse =
  | { mode: "llm"; situation: string; complication: string; resolution: string; links: string[] }
  | { mode: "fallback"; text: string; error?: string };

export function MarketAskAiPanel({ signals }: { signals: IntelSignal[] }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 4) return;
    setLoading(true);
    setErr("");
    setAnswer(null);
    try {
      const res = await fetch("/api/market/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim(), signals }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "请求失败");
        return;
      }
      setAnswer(data as AskResponse);
    } catch {
      setErr("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.04] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">问 AI · 市场推演</h2>
      <p className="mt-1 text-caption">
        自动带入 Top 信号上下文 · SCR 结构 · 链到解码 / FPA
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={2}
          placeholder="例：史密斯热泵专利对 V4 12 个月窗口意味着什么？"
          className="w-full rounded-lg border border-[var(--surface-border)] bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={loading || q.trim().length < 4}
          className="rounded-lg bg-[var(--color-accent)]/20 px-4 py-2 text-sm font-medium text-[var(--color-accent)] disabled:opacity-50"
        >
          {loading ? "推演中…" : "推演"}
        </button>
      </form>
      {err ? <p className="mt-3 text-sm text-[var(--signal-red-text)]">{err}</p> : null}
      {answer?.mode === "fallback" ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[var(--surface-border)] bg-white p-4 text-xs text-[var(--color-text-secondary)]">
          {answer.text}
        </pre>
      ) : null}
      {answer?.mode === "llm" ? (
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">S · 事实</dt>
            <dd className="mt-1">{answer.situation}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--signal-yellow-text)]">C · 影响</dt>
            <dd className="mt-1">{answer.complication}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-primary)]">R · 建议</dt>
            <dd className="mt-1">{answer.resolution}</dd>
          </div>
          {answer.links?.length ? (
            <ul className="text-xs text-[var(--color-accent)]">
              {answer.links.map((l) => (
                <li key={l}>→ {l}</li>
              ))}
            </ul>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
