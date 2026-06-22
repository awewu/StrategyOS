"use client";

import { useState } from "react";
import type { CompiledStrategicPayload } from "@/lib/compiler/strategic-compiler";
import type { QualityReject } from "@/lib/compiler/import-quality";

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
};

export function StrategicImportPanel() {
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<CompiledStrategicPayload | null>(null);
  const [quality, setQuality] = useState<QualityStats | null>(null);
  const [rejected, setRejected] = useState<QualityReject[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preview" | "done">("idle");
  const [mode, setMode] = useState<ImportMode>("merge");

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
        setResult({ ok: false, error: data.error ?? "解析失败" });
        return;
      }
      if (data.compiled) setPreview(data.compiled);
      if (data.quality) setQuality(data.quality);
      if (data.rejected) setRejected(data.rejected);
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
          上传资料 → 查重去噪 → 合并写入计划（默认合并，不覆盖已有 OKR）
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => runCompile(false)}
              className="rounded-lg border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50"
            >
              {loading ? "解析中…" : "预览解析"}
            </button>
            <button
              type="button"
              disabled={loading || (!rawText.trim() && phase !== "preview")}
              onClick={() => runCompile(true)}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              确认导入
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.06] bg-[var(--surface-panel)] p-4 text-sm">
          {quality && (
            <div className="mb-3 rounded-lg bg-black/[0.03] px-3 py-2 text-xs">
              <p className="font-medium text-[var(--color-text-primary)]">质量过滤</p>
              <p className="mt-1 text-[var(--color-text-muted)]">
                原始 {quality.rawObjectives} 目标 / {quality.rawKeyResults} KR →
                接受 <span className="text-[var(--color-accent)]">{quality.acceptedObjectives}</span> 目标 /
                {quality.acceptedKeyResults} KR · 剔除 {quality.rejectedCount}
              </p>
              {rejected.length > 0 && (
                <ul className="mt-2 max-h-24 list-disc space-y-0.5 overflow-y-auto pl-4 text-[10px] text-[var(--color-text-muted)]">
                  {rejected.slice(0, 8).map((r, i) => (
                    <li key={i}>{r.reason}: {r.text.slice(0, 50)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {preview ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">解析预览（已去噪）</p>
              {preview.intent && <p><span className="text-[var(--color-text-muted)]">意图 · </span>{preview.intent}</p>}
              {preview.northStar && <p><span className="text-[var(--color-text-muted)]">北极星 · </span>{preview.northStar}</p>}
              {preview.objectives.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs max-h-48 overflow-y-auto">
                  {preview.objectives.slice(0, 12).map((o, i) => (
                    <li key={i}>
                      [{o.dimension}] {o.objective ?? "—"} ({o.keyResults.length} KR)
                    </li>
                  ))}
                  {preview.objectives.length > 12 && (
                    <li className="list-none text-[var(--color-text-muted)]">… 另有 {preview.objectives.length - 12} 条</li>
                  )}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">预览区 — 点击「预览解析」查看提取与查重结果</p>
          )}
          {result?.ok && result.imported && (
            <div className="mt-4 rounded-lg bg-green-600/10 px-3 py-2 text-xs text-green-800">
              已导入 ({result.mode === "replace" ? "替换" : "合并"}): {result.imported.join(" · ")}
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
