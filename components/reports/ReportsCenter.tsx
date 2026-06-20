"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReportListItem } from "@/lib/data/strategy-data";
import {
  mckinseyReportHeaderTemplate,
  monRptPasteGuide,
} from "@/lib/brand/apple-mckinsey";
import type { McKinseySections } from "@/lib/stratos/report-agent";

export function ReportsCenter({
  reports: initial,
  source,
}: {
  reports: ReportListItem[];
  source: string;
}) {
  const [reports, setReports] = useState(initial);
  const [parseResult, setParseResult] = useState<{
    agentTrace?: string[];
    assertionTriggers?: string[];
    engine?: string;
    mckinsey?: McKinseySections;
  } | null>(null);
  const [llmAvailable, setLlmAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    fetch("/api/reports/parse")
      .then((r) => r.json())
      .then((d: { llmConfigured?: boolean }) => setLlmAvailable(d.llmConfigured ?? false))
      .catch(() => setLlmAvailable(false));
  }, []);

  const [importText, setImportText] = useState("");
  const [importId, setImportId] = useState("MON-RPT-IMPORT");

  async function runImportParse() {
    if (!importText.trim()) return;
    setLoading(true);
    setParseResult(null);
    try {
      const res = await fetch("/api/reports/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: importId, rawContent: importText }),
      });
      const data = (await res.json()) as {
        parsed: {
          agentTrace: string[];
          assertionTriggers: string[];
          patterns: Array<{ title: string; formationType: string }>;
          mckinsey?: McKinseySections;
        };
        engine?: string;
        dbPersisted: boolean;
      };
      setParseResult({ ...data.parsed, engine: data.engine });
      setReports((prev) => [
        {
          id: importId,
          type: "MON-RPT",
          title: "粘贴导入 · 战略月报",
          period: new Date().toISOString().slice(0, 7),
          status: "parsed" as const,
          patterns: data.parsed.patterns.map((p) => `${p.formationType}: ${p.title}`),
        },
        ...prev.filter((r) => r.id !== importId),
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function runAgent(reportId: string) {
    setLoading(true);
    setParseResult(null);
    try {
      const res = await fetch("/api/reports/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = (await res.json()) as {
        parsed: {
          agentTrace: string[];
          assertionTriggers: string[];
          patterns: Array<{ title: string; formationType: string }>;
          mckinsey?: McKinseySections;
        };
        engine?: string;
        dbPersisted: boolean;
      };
      setParseResult({ ...data.parsed, engine: data.engine });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: "parsed" as const,
                patterns: data.parsed.patterns.map(
                  (p) => `${p.formationType}: ${p.title}`
                ),
              }
            : r
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function insertTemplate() {
    setImportText((prev) => (prev.trim() ? `${prev.trim()}\n\n${mckinseyReportHeaderTemplate}` : mckinseyReportHeaderTemplate));
    setShowTemplate(true);
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-[var(--color-text-muted)]">
        Agent 管道 · 数据源 {source}
        {llmAvailable === true && (
          <span className="ml-2 text-violet-400">· LLM 已配置</span>
        )}
        {llmAvailable === false && (
          <span className="ml-2">· 规则引擎 fallback</span>
        )}
      </p>

      <section className="surface-elevated rounded-2xl border border-black/[0.06] p-6 md:p-8">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">导入报告</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              MON-RPT 七章兼容 · 可选 McKinsey 叙事头（§S/C/R · MECE · So what · Decisions）
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTemplate((v) => !v)}
            className="rounded-xl border border-black/[0.06] px-3 py-2 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            {showTemplate ? "隐藏章节指南" : "章节指南"}
          </button>
        </header>

        {showTemplate && (
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div className="surface-glass rounded-xl border border-black/[0.06] p-4">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-accent-gold)]">
                MON-RPT 结构
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-text-muted)]">
                {monRptPasteGuide.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>
            <div className="surface-glass rounded-xl border border-black/[0.06] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-accent-gold)]">
                  McKinsey 叙事头模板
                </h3>
                <button
                  type="button"
                  onClick={insertTemplate}
                  className="text-xs text-[var(--color-accent-gold)] hover:underline"
                >
                  插入编辑器
                </button>
              </div>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                {mckinseyReportHeaderTemplate}
              </pre>
            </div>
          </div>
        )}

        <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Report ID
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-black/[0.06] bg-[var(--color-bg-deep)]/60 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent-gold)]/40"
          value={importId}
          onChange={(e) => setImportId(e.target.value)}
          placeholder="MON-RPT-SALES-2026-05"
        />
        <label className="mt-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          报告正文
        </label>
        <textarea
          className="mt-2 min-h-[160px] w-full resize-y rounded-xl border border-black/[0.06] bg-[var(--color-bg-deep)]/60 px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors focus:border-[var(--color-accent-gold)]/40"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="§S 背景…&#10;§1 本月一句话…&#10;§8 涌现…"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !importText.trim()}
            onClick={runImportParse}
            className="rounded-xl bg-[var(--color-accent-gold)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "解析中…" : "解析并入库"}
          </button>
          <button
            type="button"
            onClick={insertTemplate}
            className="rounded-xl border border-black/[0.06] px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            插入 McKinsey 头
          </button>
        </div>
      </section>

      <div className="space-y-4">
        {reports.map((r) => (
          <article
            key={r.id}
            className="surface-glass rounded-xl border border-black/[0.06] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-data text-xs text-[var(--color-accent-gold)]">{r.type}</span>
                <h2 className="font-medium">{r.title}</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {r.period} · {r.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                    r.status === "parsed"
                      ? "bg-[var(--signal-green)]/15 text-green-300"
                      : "bg-[var(--signal-yellow)]/15 text-yellow-200"
                  }`}
                >
                  {r.status === "parsed" ? "已解析" : "待确认"}
                </span>
                {(r.id === "rpt-sheet1-may" || r.type === "SHEET_IMPORT") && r.status !== "parsed" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => runAgent(r.id)}
                    className="rounded-lg bg-[var(--color-accent-gold)]/15 px-3 py-1 text-xs text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/25 disabled:opacity-50"
                  >
                    {loading ? "解析中…" : "Agent 解析"}
                  </button>
                )}
              </div>
            </div>
            {r.patterns.length > 0 && (
              <div className="mt-3 border-t border-white/[0.04] pt-3">
                <div className="text-xs text-[var(--color-text-muted)]">§8 战略模式观察</div>
                <ul className="mt-1 text-sm">
                  {r.patterns.map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {r.id === "rpt-sheet1-may" && r.status !== "parsed" && (
              <p className="mt-3 text-xs text-[var(--signal-red)]">
                导入后将触发 HealthAssertion（runway &lt; 3 月）并 nudge SPBP 悲观概率
              </p>
            )}
          </article>
        ))}
      </div>

      {parseResult && (
        <section className="surface-elevated rounded-2xl border border-violet-500/25 p-6">
          <h3 className="mb-2 text-sm font-medium text-violet-400">Agent Trace</h3>
          {parseResult.engine && (
            <p className="mb-2 text-xs text-violet-400">解析引擎：{parseResult.engine}</p>
          )}
          <ul className="space-y-1 font-mono text-xs text-[var(--color-text-muted)]">
            {parseResult.agentTrace?.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {parseResult.mckinsey && (
            <div className="mt-4 border-t border-black/[0.06] pt-4">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-accent-gold)]">
                McKinsey 章节预览
              </h4>
              <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                {parseResult.mckinsey.situation && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">§S</dt>
                    <dd>{parseResult.mckinsey.situation}</dd>
                  </div>
                )}
                {parseResult.mckinsey.complication && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">§C</dt>
                    <dd>{parseResult.mckinsey.complication}</dd>
                  </div>
                )}
                {parseResult.mckinsey.resolution && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">§R</dt>
                    <dd>{parseResult.mckinsey.resolution}</dd>
                  </div>
                )}
              </dl>
              {parseResult.mckinsey.keyIssues && parseResult.mckinsey.keyIssues.length > 0 && (
                <ul className="mt-2 text-sm">
                  {parseResult.mckinsey.keyIssues.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {parseResult.assertionTriggers && parseResult.assertionTriggers.length > 0 && (
            <p className="mt-3 text-xs text-[var(--signal-red)]">
              触发：{parseResult.assertionTriggers.join(" · ")}
            </p>
          )}
          <Link
            href="/command"
            className="mt-4 inline-block text-sm text-[var(--color-accent-gold)] hover:underline"
          >
            查看指挥舱 SCR →
          </Link>
        </section>
      )}

      <Link href="/gates" className="text-sm text-[var(--color-accent-gold)] hover:underline">
        查看 Gate 风险清单 →
      </Link>
    </div>
  );
}
