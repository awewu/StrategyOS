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
  if (level === "warn") return "text-amber-700";
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

export function StrategicImportPanel() {
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

  return (
    <section className="surface-elevated rounded-2xl border border-[var(--color-accent-gold)]/25 p-5 md:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">战略编译器</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          上传资料 → 推演查重 → 确认后合并写入（默认不覆盖已有 OKR）
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="label-xs">导入模式</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("merge")}
                className={`rounded-lg px-3 py-1.5 text-xs ${mode === "merge" ? "bg-[var(--color-accent)] text-white" : "border border-[var(--surface-border)]"}`}
              >
                合并（查重追加）
              </button>
              <button
                type="button"
                onClick={() => setMode("replace")}
                className={`rounded-lg px-3 py-1.5 text-xs ${mode === "replace" ? "bg-[var(--signal-red)] text-white" : "border border-[var(--surface-border)]"}`}
              >
                全量替换
              </button>
            </div>
          </div>
          <div>
            <label className="label-xs">上传文件</label>
            <input
              id="strategic-import-file"
              type="file"
              accept=".pdf,.xlsx,.xls,.txt,.docx"
              className="mt-1 block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-accent-dim)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="label-xs">或粘贴战略正文</label>
            <textarea
              className="stratos-input mt-1 min-h-[120px] w-full resize-y"
              placeholder="O1: 营收 6000 万路径&#10;KR1: 酒店签约 1200 家&#10;财务: EBIT 11.2%"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <input
                type="checkbox"
                checked={!auditComparePlan}
                onChange={(e) => setAuditComparePlan(!e.target.checked)}
                className="rounded border-[var(--surface-border)]"
              />
              仅审计本批（不比对库）
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => runCompile(false)}
              className="rounded-lg border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50"
            >
              {loading ? "推演中…" : "推演预览"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runAudit()}
              className="rounded-lg border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50"
            >
              误杀审计
            </button>
            <button
              type="button"
              disabled={loading || (phase !== "preview" && !deduction?.safeToImport)}
              onClick={() => runCompile(true)}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              确认导入
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.06] bg-[var(--surface-panel)] p-4 text-sm">
          {audit && (
            <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
              <p className="font-medium text-[var(--color-text-primary)]">误杀审计</p>
              {audit.summary.map((s) => (
                <p key={s} className="mt-1 text-[var(--color-text-muted)]">{s}</p>
              ))}
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(audit.byReason).map(([k, n]) => (
                  <span key={k} className="rounded bg-black/[0.05] px-2 py-0.5 text-[10px]">
                    {audit.reasonLabels[k] ?? k}: {n}
                  </span>
                ))}
              </div>
              {audit.reviewCandidates.length > 0 && (
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-[10px] text-amber-900">
                  {audit.reviewCandidates.slice(0, 12).map((r, i) => (
                    <li key={i}>⚠ [{r.reason}] {r.text.slice(0, 50)} — {r.reviewHint}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {deduction && (
            <div className="mb-3 rounded-lg border border-[var(--color-accent-gold)]/20 bg-[var(--color-accent-dim)]/30 px-3 py-2 text-xs">
              <p className="font-medium text-[var(--color-text-primary)]">导入推演</p>
              <p className="mt-1">{deduction.recommendation}</p>
              <p className="mt-2 text-[var(--color-text-muted)]">
                库内 {deduction.planObjectiveCount} 目标 · 比对 {deduction.existingFingerprintCount} 指纹 →
                新增 <span className="font-medium text-[var(--color-accent)]">{deduction.toAdd}</span>
                {deduction.toMergeKr > 0 && <> · 补 KR {deduction.toMergeKr}</>}
                {deduction.duplicateExisting > 0 && <> · 重复 {deduction.duplicateExisting}</>}
                {deduction.noiseRejected > 0 && <> · 噪声 {deduction.noiseRejected}</>}
              </p>
              {deduction.risks.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {deduction.risks.map((r) => (
                    <li key={r.code} className={riskColor(r.level)}>
                      [{r.level}] {r.message}
                    </li>
                  ))}
                </ul>
              )}
              {deduction.semantic?.enabled && (
                <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                  语义层: {deduction.semantic.engine === "llm"
                    ? `已检 ${deduction.semantic.checked} · 语义去重 ${deduction.semantic.removedDuplicate} · 去噪 ${deduction.semantic.removedNoise}`
                    : deduction.semantic.error ?? "等待 LLM 响应或检查 API Key"}
                  {deduction.compileEngine !== "rules" && ` · 编译 ${deduction.compileEngine}`}
                </p>
              )}
              {!deduction.semantic?.enabled && (
                <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">语义层: 未配置 LLM（仅规则查重）</p>
              )}
              {deduction.samples.wouldAdd.length > 0 && (
                <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                  将新增: {deduction.samples.wouldAdd.slice(0, 3).join(" · ")}
                </p>
              )}
            </div>
          )}
          {quality && (
            <div className="mb-3 rounded-lg bg-black/[0.03] px-3 py-2 text-xs">
              <p className="font-medium text-[var(--color-text-primary)]">质量过滤</p>
              <p className="mt-1 text-[var(--color-text-muted)]">
                原始 {quality.rawObjectives} 目标 → 接受 {quality.acceptedObjectives} · 剔除 {quality.rejectedCount}
              </p>
              {rejected.length > 0 && (
                <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-[10px] text-[var(--color-text-muted)]">
                  {rejected.slice(0, 8).map((r, i) => (
                    <li key={i}>[{r.reason}] {r.text.slice(0, 48)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {preview ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">解析预览</p>
              {preview.intent && <p><span className="text-[var(--color-text-muted)]">意图 · </span>{preview.intent}</p>}
              {preview.northStar && <p><span className="text-[var(--color-text-muted)]">北极星 · </span>{preview.northStar}</p>}
              {preview.objectives.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs max-h-36 overflow-y-auto">
                  {preview.objectives.slice(0, 8).map((o, i) => (
                    <li key={i}>[{o.dimension}] {o.objective ?? "—"}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">点击「推演预览」或「误杀审计」</p>
          )}
          {result?.ok && result.imported && (
            <div className="mt-4 rounded-lg bg-green-600/10 px-3 py-2 text-xs text-green-800">
              已导入: {result.imported.join(" · ")}
            </div>
          )}
          {result?.error && (
            <p className="mt-3 text-xs text-[var(--signal-red)]">{result.error}</p>
          )}
        </div>
      </div>
    </section>
  );
}
