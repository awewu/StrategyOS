/**
 * Pre-import deduction — simulate merge/replace outcomes and surface risks before write.
 */
import type { CompiledStrategicPayload } from "./strategic-compiler";
import {
  classifyObjectiveNoise,
  isNearDuplicate,
  type QualityReject,
  type SanitizeResult,
} from "./import-quality";

export type DeductionRiskLevel = "info" | "warn" | "block";

export interface DeductionRisk {
  level: DeductionRiskLevel;
  code: string;
  message: string;
}

import type { SemanticImportMeta } from "./import-llm";

export interface ImportDeductionReport {
  mode: "merge" | "replace";
  charCount: number;
  fileName?: string;
  existingFingerprintCount: number;
  planObjectiveCount: number;
  rawObjectives: number;
  rawKeyResults: number;
  toAdd: number;
  toMergeKr: number;
  duplicateExisting: number;
  duplicateInBatch: number;
  noiseRejected: number;
  krSubsumed: number;
  intentWouldUpdate: boolean;
  northStarWouldUpdate: boolean;
  fpaWouldUpdate: boolean;
  bscHeuristicRows: number;
  risks: DeductionRisk[];
  safeToImport: boolean;
  recommendation: string;
  semantic: SemanticImportMeta;
  compileEngine: "rules" | "llm" | "hybrid";
  samples: {
    wouldAdd: string[];
    mergeKrInto: Array<{ incoming: string; into: string }>;
    duplicateWith: Array<{ incoming: string; existing: string }>;
    noise: Array<{ text: string; reason: string }>;
  };
}

export type ExistingObjectiveRef = {
  objective: string;
  keyResults: string[];
};

function pickRicher(existing: string | null | undefined, incoming: string | undefined): boolean {
  if (!incoming?.trim()) return false;
  if (!existing?.trim()) return true;
  return incoming.trim().length > existing.trim().length;
}

function countByReason(rejected: QualityReject[], reason: QualityReject["reason"]): number {
  return rejected.filter((r) => r.reason === reason).length;
}

/** Dry-run merge counts without touching the database. */
export function simulateMergeImport(
  existing: ExistingObjectiveRef[],
  sanitized: SanitizeResult,
): { toAdd: number; toMergeKr: number; skippedDuplicates: number; mergeKrInto: Array<{ incoming: string; into: string }> } {
  let toAdd = 0;
  let toMergeKr = 0;
  let skippedDuplicates = 0;
  const mergeKrInto: Array<{ incoming: string; into: string }> = [];

  const pool = existing.map((e) => ({
    objective: e.objective,
    keyResults: [...e.keyResults],
  }));

  for (const item of sanitized.accepted) {
    const title = item.objective.objective?.trim() ?? "";
    const match = pool.find((e) => isNearDuplicate(e.objective, title));

    if (match) {
      skippedDuplicates++;
      for (const kr of item.objective.keyResults) {
        const krText = kr.keyResult.trim();
        if (!krText) continue;
        if (match.keyResults.some((t) => isNearDuplicate(t, krText))) continue;
        if (isNearDuplicate(krText, match.objective)) continue;
        match.keyResults.push(krText);
        toMergeKr++;
        if (mergeKrInto.length < 8) {
          mergeKrInto.push({ incoming: krText.slice(0, 60), into: match.objective.slice(0, 60) });
        }
      }
      continue;
    }

    toAdd++;
    pool.push({
      objective: title || item.objective.keyResults[0]?.keyResult || "—",
      keyResults: item.objective.keyResults.map((k) => k.keyResult),
    });
  }

  return { toAdd, toMergeKr, skippedDuplicates, mergeKrInto };
}

export function buildImportDeductionReport(input: {
  mode: "merge" | "replace";
  fileName?: string;
  charCount: number;
  compiled: CompiledStrategicPayload;
  sanitized: SanitizeResult;
  existingObjectives: ExistingObjectiveRef[];
  planIntent?: string | null;
  planNorthStar?: string | null;
  semantic?: SemanticImportMeta;
  compileEngine?: "rules" | "llm" | "hybrid";
}): ImportDeductionReport {
  const { mode, compiled, sanitized, existingObjectives } = input;
  const existingTitles = existingObjectives.flatMap((o) => [o.objective, ...o.keyResults]);

  const duplicateExisting = countByReason(sanitized.rejected, "duplicate_existing");
  const duplicateInBatch = countByReason(sanitized.rejected, "duplicate_in_batch");
  const krSubsumed = countByReason(sanitized.rejected, "kr_subsumed");
  const noiseRejected = sanitized.rejected.filter((r) =>
    [
      "slide_boilerplate",
      "too_short",
      "discussion_prompt",
      "numeric_only",
      "low_signal",
      "semantic_noise",
    ].includes(r.reason),
  ).length;

  const intentWouldUpdate = pickRicher(input.planIntent, compiled.intent);
  const northStarWouldUpdate = pickRicher(input.planNorthStar, compiled.northStar);
  const fpaWouldUpdate = Boolean(compiled.fpa && Object.keys(compiled.fpa).length > 0);

  let toAdd = sanitized.stats.acceptedObjectives;
  let toMergeKr = 0;
  let skippedDuplicates = duplicateExisting;
  let mergeKrInto: Array<{ incoming: string; into: string }> = [];

  if (mode === "merge") {
    const sim = simulateMergeImport(existingObjectives, sanitized);
    toAdd = sim.toAdd;
    toMergeKr = sim.toMergeKr;
    skippedDuplicates = sim.skippedDuplicates;
    mergeKrInto = sim.mergeKrInto;
  }

  const risks: DeductionRisk[] = [];

  const semantic = input.semantic ?? {
    enabled: false,
    engine: "none" as const,
    checked: 0,
    removedDuplicate: 0,
    removedNoise: 0,
    pairs: [],
  };

  if (mode === "replace" && input.existingObjectives.length > 0) {
    risks.push({
      level: "warn",
      code: "REPLACE_OVERWRITE",
      message: `替换模式将删除现有 ${input.existingObjectives.length} 条目标，写入 ${sanitized.stats.acceptedObjectives} 条`,
    });
  }

  if (sanitized.stats.rawObjectives > 0 && sanitized.stats.acceptedObjectives / sanitized.stats.rawObjectives < 0.35) {
    risks.push({
      level: "warn",
      code: "AGGRESSIVE_FILTER",
      message: `去噪较狠：${sanitized.stats.rawObjectives} 条原始 → 仅 ${sanitized.stats.acceptedObjectives} 条通过（${Math.round((sanitized.stats.acceptedObjectives / sanitized.stats.rawObjectives) * 100)}%）`,
    });
  }

  if (mode === "merge" && toAdd === 0 && toMergeKr === 0 && sanitized.stats.rawObjectives > 0) {
    risks.push({
      level: "info",
      code: "ALL_DUPLICATE",
      message: "与库内完全重复，导入不会新增 OKR（安全）",
    });
  }

  if (semantic.removedDuplicate > 0 || semantic.removedNoise > 0) {
    risks.push({
      level: "info",
      code: "SEMANTIC_FILTER",
      message: `语义层剔除 ${semantic.removedDuplicate} 重复 · ${semantic.removedNoise} 噪声`,
    });
  }

  if (mode === "merge" && toAdd === 0 && compiled.bscRows.length > 0) {
    risks.push({
      level: "info",
      code: "BSC_HEURISTIC_ONLY",
      message: `无新 OKR；${compiled.bscRows.length} 条启发式 BSC 不会回写计划（合并模式）`,
    });
  }

  if (sanitized.stats.rawObjectives === 0 && !compiled.intent && !compiled.northStar) {
    risks.push({
      level: "block",
      code: "EMPTY_EXTRACT",
      message: "未提取到有效 OKR 或战略字段，不建议导入",
    });
  }

  const duplicateWith = sanitized.rejected
    .filter((r) => r.reason === "duplicate_existing" && r.detail)
    .slice(0, 8)
    .map((r) => ({ incoming: r.text.slice(0, 80), existing: r.detail!.slice(0, 80) }));

  const noise = sanitized.rejected
    .filter((r) => r.reason !== "duplicate_existing" && r.reason !== "duplicate_in_batch")
    .slice(0, 8)
    .map((r) => ({ text: r.text.slice(0, 80), reason: r.reason }));

  const wouldAdd =
    mode === "merge"
      ? sanitized.accepted
          .filter((a) => !existingObjectives.some((e) => isNearDuplicate(e.objective, a.objective.objective ?? "")))
          .slice(0, 8)
          .map((a) => (a.objective.objective ?? "").slice(0, 80))
      : sanitized.accepted.slice(0, 8).map((a) => (a.objective.objective ?? "").slice(0, 80));

  const hasBlock = risks.some((r) => r.level === "block");
  const safeToImport = !hasBlock && (sanitized.stats.acceptedObjectives > 0 || intentWouldUpdate || northStarWouldUpdate || mode === "merge");

  let recommendation: string;
  if (hasBlock) {
    recommendation = " blocked — 请检查资料格式或改用粘贴结构化 OKR";
  } else if (mode === "merge" && toAdd === 0 && toMergeKr === 0) {
    recommendation = "可跳过导入：内容已在计划中";
  } else if (mode === "merge") {
    recommendation = `建议合并导入：新增 ${toAdd} 目标${toMergeKr ? `、补 ${toMergeKr} KR` : ""}${skippedDuplicates ? `、跳过重复 ${skippedDuplicates}` : ""}`;
  } else {
    recommendation = `替换导入：${sanitized.stats.acceptedObjectives} 目标将覆盖现有 ${input.existingObjectives.length} 条`;
  }

  return {
    mode,
    charCount: input.charCount,
    fileName: input.fileName,
    existingFingerprintCount: existingTitles.length,
    planObjectiveCount: input.existingObjectives.length,
    rawObjectives: sanitized.stats.rawObjectives,
    rawKeyResults: sanitized.stats.rawKeyResults,
    toAdd,
    toMergeKr,
    duplicateExisting,
    duplicateInBatch,
    noiseRejected,
    krSubsumed,
    intentWouldUpdate,
    northStarWouldUpdate,
    fpaWouldUpdate,
    bscHeuristicRows: compiled.bscRows.length,
    risks,
    safeToImport,
    recommendation,
    semantic,
    compileEngine: input.compileEngine ?? "rules",
    samples: { wouldAdd, mergeKrInto, duplicateWith, noise },
  };
}

/** Ops 月报 Pulse 三连投 — 检测重复汇报文本 */
export function deduceOpsPulseDuplicates(pulses: string[]): {
  unique: number;
  duplicateIndexes: number[];
  message: string;
} {
  const normalized = pulses.map((p) => p.replace(/\s+/g, " ").trim().toLowerCase());
  const seen = new Map<string, number>();
  const duplicateIndexes: number[] = [];

  normalized.forEach((p, i) => {
    if (!p) return;
    const prev = seen.get(p);
    if (prev !== undefined) duplicateIndexes.push(i);
    else seen.set(p, i);
  });

  return {
    unique: seen.size,
    duplicateIndexes,
    message:
      duplicateIndexes.length > 0
        ? `${pulses.length} 份 Pulse 中有 ${duplicateIndexes.length} 份与先前重复`
        : `${pulses.length} 份 Pulse 内容互不相同`,
  };
}
