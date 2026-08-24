/**
 * LLM semantic layer for strategic compiler — dedupe & noise beyond rule engine.
 * Falls back gracefully when no API key (rules-only).
 */
import { llmConfigured } from "@/lib/stratos/llm-agent";
import { llmModel as model } from "@/lib/ai/llm-config";
import { askTandem } from "@/lib/ai/tandem-brain";
import type { CompiledStrategicPayload, PlanDimension } from "./strategic-compiler";
import type { QualityReject, SanitizeResult } from "./import-quality";
import { compileStrategicText } from "./strategic-compiler";

export { llmConfigured as compilerLlmConfigured };

export type SemanticDedupePair = {
  incoming: string;
  duplicateOf?: string;
  isDuplicate: boolean;
  isNoise?: boolean;
  confidence: number;
  reason?: string;
};

export type SemanticImportMeta = {
  enabled: boolean;
  engine: "none" | "llm";
  model?: string;
  checked: number;
  removedDuplicate: number;
  removedNoise: number;
  pairs: SemanticDedupePair[];
  error?: string;
};

type LlmDedupePayload = {
  duplicates?: Array<{
    incomingIndex: number;
    existingIndex?: number;
    existingText?: string;
    confidence?: number;
    reason?: string;
  }>;
  noise?: Array<{ incomingIndex: number; reason?: string }>;
};

const VALID_DIM: PlanDimension[] = ["FINANCIAL", "CUSTOMER", "PROCESS", "LEARNING"];

type LlmExtractPayload = {
  intent?: string;
  northStar?: string;
  objectives?: Array<{
    dimension?: string;
    objective?: string;
    keyResults?: Array<{ keyResult?: string; target?: string }>;
  }>;
};

export function parseSemanticDedupePayload(raw: string, incoming: string[], existing: string[]): SemanticDedupePair[] {
  const payload = JSON.parse(raw) as LlmDedupePayload;
  const pairs: SemanticDedupePair[] = incoming.map((text) => ({
    incoming: text,
    isDuplicate: false,
    confidence: 0,
  }));

  for (const d of payload.duplicates ?? []) {
    if (d.incomingIndex < 0 || d.incomingIndex >= pairs.length) continue;
    const p = pairs[d.incomingIndex]!;
    p.isDuplicate = true;
    p.confidence = d.confidence ?? 0.85;
    p.reason = d.reason;
    p.duplicateOf =
      d.existingText ??
      (d.existingIndex != null && d.existingIndex >= 0 ? existing[d.existingIndex] : undefined);
  }

  for (const n of payload.noise ?? []) {
    if (n.incomingIndex < 0 || n.incomingIndex >= pairs.length) continue;
    const p = pairs[n.incomingIndex]!;
    p.isNoise = true;
    p.confidence = 0.8;
    p.reason = n.reason ?? "semantic_noise";
  }

  return pairs;
}

async function callSemanticDedupeLlm(incoming: string[], existing: string[]): Promise<SemanticDedupePair[] | null> {
  if (!llmConfigured() || incoming.length === 0) return null;

  const system = `你是 StratOS 战略编译器的语义查重助手（Rheem/Ruud 中国）。
比较 incoming（新提取 OKR/KR）与 existing（库内已有），返回 JSON：
{
  "duplicates": [{ "incomingIndex": 0, "existingIndex": 2, "existingText": "…", "confidence": 0.92, "reason": "同义不同表述" }],
  "noise": [{ "incomingIndex": 1, "reason": "讨论稿非承诺目标" }]
}
规则：
- 同一 OKR 换说法、仅差权重%/待改进点 → duplicates
- 幻灯片讨论、议程、占位符 → noise
-  genuinely 新目标 → 不列入
- confidence 0.75+ 才标记 duplicate
- incomingIndex 从 0 起`;

  const user = JSON.stringify({
    existing: existing.slice(0, 100),
    incoming: incoming.slice(0, 40),
  });

  try {
    const res = await askTandem({
      scenario: "tool_use",
      purpose: "okr-semantic-dedupe",
      system,
      user,
      temperature: 0.1,
      responseJson: true,
      timeoutMs: 12000,
    });
    if (!res.ok || !res.content) return null;
    return parseSemanticDedupePayload(res.content, incoming, existing);
  } catch {
    return null;
  }
}

/** Second-pass semantic filter on rule-sanitized accept list. */
export async function refineWithSemanticDedupe(
  sanitized: SanitizeResult,
  existingTitles: string[],
): Promise<{ sanitized: SanitizeResult; semantic: SemanticImportMeta }> {
  const incoming = sanitized.accepted.map(
    (a) => a.objective.objective?.trim() || a.objective.keyResults[0]?.keyResult?.trim() || "",
  ).filter(Boolean);

  const baseMeta: SemanticImportMeta = {
    enabled: llmConfigured(),
    engine: "none",
    checked: incoming.length,
    removedDuplicate: 0,
    removedNoise: 0,
    pairs: [],
  };

  if (!llmConfigured() || incoming.length === 0) {
    return { sanitized, semantic: baseMeta };
  }

  const pairs = await callSemanticDedupeLlm(incoming, existingTitles);
  if (!pairs) {
    return {
      sanitized,
      semantic: { ...baseMeta, engine: "llm", model: model(), error: "LLM 语义查重不可用，已用规则结果" },
    };
  }

  const rejectIndexes = new Set<number>();
  const extraRejected: QualityReject[] = [];

  pairs.forEach((p, i) => {
    if (p.isNoise) {
      rejectIndexes.add(i);
      extraRejected.push({ text: p.incoming, reason: "semantic_noise" as QualityReject["reason"], detail: p.reason });
    } else if (p.isDuplicate && p.confidence >= 0.75) {
      rejectIndexes.add(i);
      extraRejected.push({
        text: p.incoming,
        reason: "semantic_duplicate" as QualityReject["reason"],
        detail: p.duplicateOf?.slice(0, 80),
      });
    }
  });

  if (rejectIndexes.size === 0) {
    return {
      sanitized,
      semantic: {
        ...baseMeta,
        engine: "llm",
        model: model(),
        pairs,
      },
    };
  }

  const kept = sanitized.accepted.filter((_, i) => !rejectIndexes.has(i));
  const removedDuplicate = pairs.filter((p, i) => rejectIndexes.has(i) && p.isDuplicate).length;
  const removedNoise = pairs.filter((p, i) => rejectIndexes.has(i) && p.isNoise).length;

  const refined: SanitizeResult = {
    accepted: kept,
    rejected: [...sanitized.rejected, ...extraRejected],
    payload: {
      ...sanitized.payload,
      objectives: kept.map((k) => k.objective),
    },
    stats: {
      ...sanitized.stats,
      acceptedObjectives: kept.length,
      acceptedKeyResults: kept.reduce((n, a) => n + a.objective.keyResults.length, 0),
      rejectedCount: sanitized.rejected.length + extraRejected.length,
    },
  };

  return {
    sanitized: refined,
    semantic: {
      enabled: true,
      engine: "llm",
      model: model(),
      checked: incoming.length,
      removedDuplicate,
      removedNoise,
      pairs: pairs.filter((_, i) => rejectIndexes.has(i)),
    },
  };
}

async function extractWithLlm(rawText: string): Promise<CompiledStrategicPayload | null> {
  if (!llmConfigured()) return null;

  const system = `你是 StratOS 战略编译器。从会议 PDF 文本提取结构化战略 JSON：
{
  "intent": "战略意图一句话",
  "northStar": "北极星/愿景",
  "objectives": [{
    "dimension": "FINANCIAL|CUSTOMER|PROCESS|LEARNING",
    "objective": "O 标题",
    "keyResults": [{ "keyResult": "KR 描述", "target": "50%" }]
  }]
}
剔除幻灯片页脚、讨论稿、重复行。中文 OKR 为主。`;

  try {
    const res = await askTandem({
      scenario: "long_context",
      purpose: "strategic-plan-extract",
      system,
      user: rawText.slice(0, 28000),
      temperature: 0.15,
      responseJson: true,
      timeoutMs: 20000,
    });
    if (!res.ok || !res.content) return null;
    const payload = JSON.parse(res.content) as LlmExtractPayload;
    const objectives = (payload.objectives ?? [])
      .filter((o) => o.objective?.trim() || (o.keyResults?.length ?? 0) > 0)
      .map((o) => ({
        dimension: (VALID_DIM.includes(o.dimension as PlanDimension) ? o.dimension : "PROCESS") as PlanDimension,
        objective: o.objective?.trim(),
        keyResults: (o.keyResults ?? [])
          .filter((kr) => kr.keyResult?.trim())
          .map((kr) => ({ keyResult: kr.keyResult!.trim(), target: kr.target?.trim() })),
      }));

    return {
      intent: payload.intent?.trim(),
      northStar: payload.northStar?.trim(),
      objectives,
      priorities: [],
      bscRows: [],
      summary: [`LLM 提取 ${objectives.length} 目标`],
    };
  } catch {
    return null;
  }
}

/** Rules first; LLM extract when large text yields sparse rule parse. */
export async function compileStrategicTextSmart(
  rawText: string,
): Promise<{ payload: CompiledStrategicPayload; engine: "rules" | "llm" | "hybrid" }> {
  const rules = compileStrategicText(rawText);
  const sparse = rules.objectives.length < 3 && rawText.length > 1500;

  if (!sparse || !llmConfigured()) {
    return { payload: rules, engine: "rules" };
  }

  const llm = await extractWithLlm(rawText);
  if (!llm || llm.objectives.length <= rules.objectives.length) {
    return { payload: rules, engine: "rules" };
  }

  return {
    payload: {
      ...rules,
      intent: rules.intent ?? llm.intent,
      northStar: rules.northStar ?? llm.northStar,
      objectives: llm.objectives.length > rules.objectives.length ? llm.objectives : rules.objectives,
      summary: [...rules.summary, ...llm.summary],
    },
    engine: rules.objectives.length > 0 ? "hybrid" : "llm",
  };
}
