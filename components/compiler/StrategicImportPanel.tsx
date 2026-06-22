"use client";

import { useState } from "react";
import type { CompiledStrategicPayload } from "@/lib/compiler/strategic-compiler";
import type { QualityReject } from "@/lib/compiler/import-quality";
import type { ImportDeductionReport } from "@/lib/compiler/import-deduction";

type ImportMode = "merge" | "replace";

type QualityStats = {
  rawObjectives: number;
  rawKeyResults: number;
  acceptedObjectives: number;
  acceptedKeyResults: number;
  rejectedCount: number;
};

type ImportResult = {
  ok: boolean;
  error?: string;
  mode?: ImportMode;
  compiled?: CompiledStrategicPayload;
  imported?: string[];
  summary?: string[];
  charCount?: number;
  quality?: QualityStats;
  rejected?: QualityReject[];
  deduction?: ImportDeductionReport;
};

function riskColor(level: string) {
  if (level === "block") return "text-[var(--signal-red)]";
  if (level === "warn") return "text-amber-800";
  return "text-[var(--color-text-muted)]";
}

type FilterAuditReport = {
  rawObjectives: number;
  accepted: number;
  rejected: number;
  byReason: Record<string, number>;
  reasonLabels: Record<string, string>;
  reviewCandidates: Array<{ text: string; reason: string; reviewHint: string }>;
  summary: string[];
};

export function StrategicImportPanel({ embedded }: { embedded?: boolean }) {
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<CompiledStrategicPayload | null>(null);
  const [quality, setQuality] = useState<QualityStats | null>(null);
  const [deduction, setDeduction] = useState<ImportDeductionReport | null>(null);
  const [audit, setAudit] = useState<FilterAuditReport | null>(null);
  const [rejected, setRejected] = useState<QualityReject[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preview" | "done">("idle");
  const [mode, setMode] = useState<ImportMode>("merge");
  const [auditComparePlan, setAuditComparePlan] = useState(true);

  async function runAudit() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("rawText", rawText);
      fd.append("comparePlan", auditComparePlan ? "1" : "0");
      const fileInput = document.getElementById("strategic-import-file") as HTMLInputElement | null;
      const file = fileInput?.files?.[0];
      if (file) fd.append("file", file);
      const res = await fetch("/api/compiler/audit", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; audit?: FilterAuditReport; error?: string };
      if (data.audit) setAudit(data.audit);
    } finally {
      setLoading(false);
    }
  }

  async function runCompile(confirm = false) {
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("rawText", rawText);
      fd.append("preview", confirm ? "0" : "1");
      fd.append("mode", mode);
      const fileInput = document.getElementById("strategic-import-file") as HTMLInputElement | null;
      const file = fileInput?.files?.[0];
      if (file) fd.append("file", file);

      const res = await fetch("/api/compiler/import", { method: "POST", body: fd });
      const data = (await res.json()) as ImportResult;
      if (!res.ok || !data.ok) {
        if (data.deduction) setDeduction(data.deduction);
        setResult({ ok: false, error: data.error ?? "解析失败", deduction: data.deduction });
        return;
      }
      if (data.compiled) setPreview(data.compiled);
      if (data.quality) setQuality(data.quality);
      if (data.rejected) setRejected(data.rejected);
      if (data.deduction) setDeduction(data.deduction);
      if (confirm) {
        setResult(data);
        setPhase("done");
      } else {
        setPhase("preview");
      }
    } finally {
      setLoading(false);
    }
  }

  const shellClass = embedded
    ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    : "stratos-card stratos-card--padded grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";

  return (
    <section className={shellClass}>
      {!embedded ? (
        <div className="lg:col-span-2">
          <h2 className="text-title text-[var(--color-text-primary)]">战略编译器</h2>
          <p className="text-caption mt-1">
            上传会议资料 → 推演查重 → 确认后合并写入（默认不覆盖已有 OKR）
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="label-xs">导入模式</label>
          <div className="stratos-segment mt-1">
            <button
              type="button"
              onClick={() => setMode("merge")}
              className={`stratos-segment__item ${mode === "merge" ? "stratos-segment__item--active" : ""}`}
            >
              合并追加
            </button>
            <button
              type="button"
              onClick={() => setMode("replace")}
              className={`stratos-segment__item stratos-segment__item--danger ${mode === "replace" ? "stratos-segment__item--active" : ""}`}
            >
              全量替换
            </button>
          </div>
        </div>

        <div>
          <label className="label-xs" htmlFor="strategic-import-file">
            上传文件
          </label>
          <input
            id="strategic-import-file"
            type="file"
            accept=".pdf,.xlsx,.xls,.txt,.docx"
            className="stratos-input mt-1 cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--color-accent-dim)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="label-xs" htmlFor="strategic-import-text">
            或粘贴战略正文
          </label>
          <textarea
            id="strategic-import-text"
            className="stratos-input mt-1 min-h-[7.5rem]"
            placeholder={"O1: 营收 6000 万路径\nKR1: 酒店签约 1200 家\n财务: EBIT 11.2%"}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <input
            type="checkbox"
            checked={!auditComparePlan}
            onChange={(e) => setAuditComparePlan(!e.target.checked)}
            className="rounded border-[var(--surface-border)]"
          />
          误杀审计：仅本批（不比对库）
        </label>

        <div className="flex flex-wrap gap-2 border-t border-[var(--surface-border)] pt-4">
          <button type="button" disabled={loading} onClick={() => runCompile(false)} className="stratos-btn">
            {loading ? "推演中…" : "推演预览"}
          </button>
          <button type="button" disabled={loading} onClick={() => void runAudit()} className="stratos-btn">
            误杀审计
          </button>
          <button
            type="button"
            disabled={loading || (phase !== "preview" && !deduction?.safeToImport)}
            onClick={() => runCompile(true)}
            className="stratos-btn stratos-btn--primary"
          >
            确认导入
          </button>
        </div>
      </div>

      <div className="stratos-card stratos-card--flat stratos-card--padded min-h-[12rem] bg-[var(--surface-raised)] text-sm">
        {audit ? (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs">
            <p className="font-semibold text-[var(--color-text-primary)]">误杀审计</p>
            {audit.summary.map((s) => (
              <p key={s} className="mt-1 text-[var(--color-text-muted)]">{s}</p>
            ))}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(audit.byReason).map(([k, n]) => (
                <span key={k} className="stratos-chip">
                  {audit.reasonLabels[k] ?? k}: {n}
                </span>
              ))}
            </div>
            {audit.reviewCandidates.length > 0 ? (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[11px] text-amber-900">
                {audit.reviewCandidates.slice(0, 10).map((r, i) => (
                  <li key={i}>
                    [{r.reason}] {r.text.slice(0, 56)} — {r.reviewHint}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {deduction ? (
          <div className="mb-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] px-3 py-2.5 text-xs">
            <p className="font-semibold text-[var(--color-text-primary)]">导入推演</p>
            <p className="mt-1 leading-relaxed">{deduction.recommendation}</p>
            <p className="mt-2 text-[var(--color-text-muted)]">
              库内 {deduction.planObjectiveCount} 目标 · 指纹 {deduction.existingFingerprintCount} →
              新增 <span className="font-semibold text-[var(--color-accent)]">{deduction.toAdd}</span>
              {deduction.toMergeKr > 0 ? <> · 补 KR {deduction.toMergeKr}</> : null}
              {deduction.duplicateExisting > 0 ? <> · 重复 {deduction.duplicateExisting}</> : null}
            </p>
            {deduction.risks.length > 0 ? (
              <ul className="mt-2 space-y-0.5">
                {deduction.risks.map((r) => (
                  <li key={r.code} className={riskColor(r.level)}>
                    [{r.level}] {r.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {quality ? (
          <div className="mb-4 text-xs">
            <p className="font-semibold text-[var(--color-text-primary)]">质量过滤</p>
            <p className="mt-1 text-[var(--color-text-muted)]">
              原始 {quality.rawObjectives} → 接受 {quality.acceptedObjectives} · 剔除 {quality.rejectedCount}
            </p>
            {rejected.length > 0 ? (
              <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-[11px] text-[var(--color-text-muted)]">
                {rejected.slice(0, 6).map((r, i) => (
                  <li key={i}>[{r.reason}] {r.text.slice(0, 52)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {preview ? (
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-[var(--color-text-muted)]">解析预览</p>
            {preview.intent ? (
              <p>
                <span className="text-[var(--color-text-muted)]">意图 · </span>
                {preview.intent}
              </p>
            ) : null}
            {preview.objectives.length > 0 ? (
              <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-4">
                {preview.objectives.slice(0, 8).map((o, i) => (
                  <li key={i}>
                    [{o.dimension}] {o.objective ?? "—"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">运行推演或审计后，结果将显示在此面板。</p>
        )}

        {result?.ok && result.imported ? (
          <div className="mt-4 rounded-lg border border-green-600/20 bg-green-600/5 px-3 py-2 text-xs text-green-900">
            已导入：{result.imported.join(" · ")}
          </div>
        ) : null}
        {result?.error ? (
          <p className="mt-3 text-xs text-[var(--signal-red)]">{result.error}</p>
        ) : null}
      </div>
    </section>
  );
}
