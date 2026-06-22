/**
 * Import quality — normalize, dedupe, and filter noise from compiled OKRs.
 * Used for merge imports and Ops report ingestion.
 */
import type { CompiledKeyResult, CompiledObjective, CompiledStrategicPayload } from "./strategic-compiler";

export type RejectReason =
  | "slide_boilerplate"
  | "too_short"
  | "discussion_prompt"
  | "numeric_only"
  | "duplicate_in_batch"
  | "duplicate_existing"
  | "kr_subsumed"
  | "low_signal";

export interface QualityReject {
  text: string;
  reason: RejectReason;
  detail?: string;
}

export interface SanitizedObjective {
  objective: CompiledObjective;
  fingerprint: string;
}

export interface SanitizeResult {
  payload: CompiledStrategicPayload;
  accepted: SanitizedObjective[];
  rejected: QualityReject[];
  stats: {
    rawObjectives: number;
    rawKeyResults: number;
    acceptedObjectives: number;
    acceptedKeyResults: number;
    rejectedCount: number;
  };
}

const SLIDE_LINE =
  /^(?:--\s*\d+\s*of\s*\d+\s*--|IN-CONFIDENCE|CONFIDENTIAL|©\s*\d{4}|Agenda\s*[–-]|会议日程|Brand Vision$|Rheem Manufacturing)/i;

const DISCUSSION_PROMPT = /(?:先制造|财务|业务).{0,20}(?:vs|VS|同步|？|\?)|^讨论[:：]|^Q&A/i;

const NOISE_OBJECTIVE =
  /^(?:老客户|新客户|O\d+|KR\d+|目标\d*|\d+\s*%?|待改进点|\(\s*待改进点\s*\))$/i;

/** Strip slide chrome and collapse whitespace for fingerprinting. */
export function normalizeForMatch(text: string): string {
  return text
    .replace(/[（(]\s*待改进点\s*[)）]/g, "")
    .replace(/\s+\d{1,3}\s*%$/g, "")
    .replace(/[＞>≥]/g, "")
    .replace(/[\s·•\-–—_,，。；;：:！!？?'"“”‘’（）()[\]{}]/g, "")
    .replace(/[\uFF10-\uFF19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xff10 + 0x30))
    .toLowerCase()
    .trim();
}

export function fingerprintObjective(title: string, krs: string[] = []): string {
  const core = normalizeForMatch(title);
  const krPart = krs
    .map((k) => normalizeForMatch(k))
    .filter((k) => k.length >= 4)
    .sort()
    .join("|");
  return krPart ? `${core}::${krPart}` : core;
}

/** Bigram Jaccard similarity in [0, 1]. */
export function textSimilarity(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.length >= 8 && nb.length >= 8 && (na.includes(nb) || nb.includes(na))) {
    return 0.92;
  }

  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const A = bigrams(na);
  const B = bigrams(nb);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

const SIMILAR_THRESHOLD = 0.88;

export function isNearDuplicate(a: string, b: string): boolean {
  return textSimilarity(a, b) >= SIMILAR_THRESHOLD;
}

export function classifyObjectiveNoise(text: string): RejectReason | null {
  const t = text.trim();
  if (!t) return "too_short";
  if (t.length < 6) return "too_short";
  if (SLIDE_LINE.test(t)) return "slide_boilerplate";
  if (DISCUSSION_PROMPT.test(t)) return "discussion_prompt";
  if (NOISE_OBJECTIVE.test(t)) return "low_signal";
  if (/^[\d\s.%]+$/.test(t)) return "numeric_only";
  if (/^[\W_]+$/.test(t)) return "low_signal";
  // 有效 OKR 常带（待改进点）后缀，保留
  if (/^(.{4,})[（(]\s*待改进点\s*[)）]\s*$/.test(t)) return null;
  return null;
}

function dedupeKeyResults(krs: CompiledKeyResult[]): CompiledKeyResult[] {
  const out: CompiledKeyResult[] = [];
  for (const kr of krs) {
    const text = kr.keyResult.trim();
    if (!text || classifyObjectiveNoise(text)) continue;
    if (out.some((o) => isNearDuplicate(o.keyResult, text))) continue;
    out.push({ keyResult: text, target: kr.target?.trim() || undefined });
  }
  return out;
}

function resolveObjectiveTitle(o: CompiledObjective): string {
  return (o.objective?.trim() || o.keyResults[0]?.keyResult?.trim() || "").slice(0, 300);
}

export function sanitizeCompiledPayload(
  payload: CompiledStrategicPayload,
  existingTitles: string[] = [],
): SanitizeResult {
  const rejected: QualityReject[] = [];
  const accepted: SanitizedObjective[] = [];
  const seenFingerprints = new Set<string>();
  const seenTitles: string[] = [...existingTitles];

  let rawKeyResults = 0;

  for (const raw of payload.objectives) {
    rawKeyResults += raw.keyResults.length;
    const title = resolveObjectiveTitle(raw);
    const krs = dedupeKeyResults(raw.keyResults);

    const titleNoise = title ? classifyObjectiveNoise(title) : null;
    if (!title && krs.length === 0) continue;

    if (titleNoise) {
      rejected.push({ text: title || "(空)", reason: titleNoise });
      continue;
    }

    if (!title && krs.length > 0) {
      for (const kr of krs) {
        const krNoise = classifyObjectiveNoise(kr.keyResult);
        if (krNoise) {
          rejected.push({ text: kr.keyResult, reason: krNoise });
          continue;
        }
        const fp = fingerprintObjective(kr.keyResult, []);
        if (seenFingerprints.has(fp) || seenTitles.some((t) => isNearDuplicate(t, kr.keyResult))) {
          rejected.push({ text: kr.keyResult, reason: "duplicate_in_batch" });
          continue;
        }
        seenFingerprints.add(fp);
        seenTitles.push(kr.keyResult);
        accepted.push({
          fingerprint: fp,
          objective: {
            dimension: raw.dimension,
            objective: kr.keyResult.slice(0, 300),
            keyResults: kr.target ? [{ keyResult: kr.keyResult, target: kr.target }] : [],
          },
        });
      }
      continue;
    }

    const fp = fingerprintObjective(title, krs.map((k) => k.keyResult));
    if (seenFingerprints.has(fp)) {
      rejected.push({ text: title, reason: "duplicate_in_batch" });
      continue;
    }
    const dupExisting = seenTitles.find((t) => isNearDuplicate(t, title));
    if (dupExisting) {
      rejected.push({ text: title, reason: "duplicate_existing", detail: dupExisting.slice(0, 80) });
      continue;
    }

    const filteredKrs = krs.filter((kr) => {
      if (isNearDuplicate(kr.keyResult, title)) {
        rejected.push({ text: kr.keyResult, reason: "kr_subsumed", detail: title.slice(0, 60) });
        return false;
      }
      return true;
    });

    seenFingerprints.add(fp);
    seenTitles.push(title);
    accepted.push({
      fingerprint: fp,
      objective: {
        dimension: raw.dimension,
        objective: title,
        keyResults: filteredKrs,
      },
    });
  }

  const cleanPayload: CompiledStrategicPayload = {
    ...payload,
    objectives: accepted.map((a) => a.objective),
  };

  const acceptedKr = accepted.reduce((n, a) => n + a.objective.keyResults.length, 0);

  return {
    payload: cleanPayload,
    accepted,
    rejected,
    stats: {
      rawObjectives: payload.objectives.length,
      rawKeyResults,
      acceptedObjectives: accepted.length,
      acceptedKeyResults: acceptedKr,
      rejectedCount: rejected.length,
    },
  };
}

/** Prefilter raw PDF/slide text before line parsing. */
export function prefilterImportText(text: string): string {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((line) => {
      if (!line) return false;
      if (SLIDE_LINE.test(line)) return false;
      if (/^\d{1,3}$/.test(line)) return false;
      if (/^-- \d+ of \d+ --$/i.test(line)) return false;
      return true;
    })
    .join("\n");
}
