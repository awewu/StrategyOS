/**
 * Import filter audit — breakdown of rejected OKRs for false-positive review.
 */
import type { QualityReject, RejectReason, SanitizeResult } from "./import-quality";
import { prefilterImportText, sanitizeCompiledPayload } from "./import-quality";
import { compileStrategicText } from "./strategic-compiler";

const REASON_LABEL: Record<RejectReason, string> = {
  slide_boilerplate: "幻灯片页脚",
  too_short: "过短",
  discussion_prompt: "讨论稿",
  numeric_only: "纯数字",
  duplicate_in_batch: "批次内重复",
  duplicate_existing: "库内重复",
  kr_subsumed: "KR 已含于标题",
  low_signal: "低信号",
  semantic_duplicate: "语义重复",
  semantic_noise: "语义噪声",
};

export type FilterAuditReport = {
  fileName?: string;
  charCount: number;
  prefilterChars: number;
  rawObjectives: number;
  accepted: number;
  rejected: number;
  byReason: Partial<Record<RejectReason, number>>;
  reasonLabels: typeof REASON_LABEL;
  rejectedItems: QualityReject[];
  acceptedSamples: string[];
  /** 可能误杀 — 需人工复核 */
  reviewCandidates: Array<QualityReject & { reviewHint: string }>;
  summary: string[];
};

function isReviewCandidate(r: QualityReject): string | null {
  // 带待改进点后缀的 OKR 标题是合法跟踪项，不应作为低信号复核
  if (/^(.{4,})[（(]\s*待改进点\s*[)）]\s*$/.test(r.text.trim())) {
    return null;
  }
  if (r.reason === "low_signal" && r.text.length >= 12 && /[\u4e00-\u9fff]{4,}/.test(r.text)) {
    return "中文长标题被标为低信号，建议人工确认";
  }
  if (r.reason === "low_signal" && r.text.length >= 12 && !/[\u4e00-\u9fff]/.test(r.text)) {
    return "标题较长但被标为低信号，建议人工确认";
  }
  if (r.reason === "duplicate_in_batch" && r.text.length >= 20) {
    return "批次内重复，可能是不同岗位的相似表述";
  }
  if (r.reason === "duplicate_existing" && r.text.includes("待改进点")) {
    return "带待改进点标记，可能仍需保留为独立跟踪项";
  }
  if (r.reason === "too_short" && /\d/.test(r.text) && r.text.length >= 4) {
    return "含数字的短标题，可能是 KPI 片段";
  }
  return null;
}

export function buildFilterAuditReport(input: {
  rawText: string;
  fileName?: string;
  existingTitles?: string[];
  sanitized?: SanitizeResult;
}): FilterAuditReport {
  const prefiltered = prefilterImportText(input.rawText);
  const compiled = compileStrategicText(input.rawText);
  const sanitized =
    input.sanitized ?? sanitizeCompiledPayload(compiled, input.existingTitles ?? []);

  const byReason: Partial<Record<RejectReason, number>> = {};
  for (const r of sanitized.rejected) {
    byReason[r.reason] = (byReason[r.reason] ?? 0) + 1;
  }

  const reviewCandidates = sanitized.rejected
    .map((r) => {
      const hint = isReviewCandidate(r);
      return hint ? { ...r, reviewHint: hint } : null;
    })
    .filter(Boolean) as Array<QualityReject & { reviewHint: string }>;

  const summary = [
    `原始 ${sanitized.stats.rawObjectives} 目标 → 接受 ${sanitized.stats.acceptedObjectives} · 剔除 ${sanitized.stats.rejectedCount}`,
    `预过滤 ${input.rawText.length} → ${prefiltered.length} 字符`,
    reviewCandidates.length > 0
      ? `⚠ ${reviewCandidates.length} 条建议人工复核（可能误杀）`
      : "无明显误杀候选",
  ];

  return {
    fileName: input.fileName,
    charCount: input.rawText.length,
    prefilterChars: prefiltered.length,
    rawObjectives: sanitized.stats.rawObjectives,
    accepted: sanitized.stats.acceptedObjectives,
    rejected: sanitized.stats.rejectedCount,
    byReason,
    reasonLabels: REASON_LABEL,
    rejectedItems: sanitized.rejected,
    acceptedSamples: sanitized.accepted.map((a) => a.objective.objective ?? "").filter(Boolean).slice(0, 20),
    reviewCandidates,
    summary,
  };
}
