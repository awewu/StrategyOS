import type { Prisma } from "@prisma/client";

export type ReportParseEngine = "llm" | "rules" | "unknown";

export type ReportParseMeta = {
  engine: ReportParseEngine;
  textExtracted: boolean;
  signalCount: number;
  parseWarnings: string[];
};

export type ReportParseStatus = ReportParseMeta & {
  hasParsed: boolean;
  hasSignals: boolean;
  parseWarning: string | null;
};

type ParsedReportLike = {
  engine?: unknown;
  textExtracted?: unknown;
  signalCount?: unknown;
  parseWarnings?: unknown;
  coverageUpdates?: unknown;
  assertionTriggers?: unknown;
  patterns?: unknown;
};

function asObject(value: Prisma.JsonValue | null | undefined): ParsedReportLike | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ParsedReportLike;
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function countParsedSignals(parsed: Pick<ParsedReportLike, "coverageUpdates" | "assertionTriggers" | "patterns">): number {
  return arrayLength(parsed.coverageUpdates) + arrayLength(parsed.assertionTriggers) + arrayLength(parsed.patterns);
}

export function buildParseMeta(input: {
  parsed: Pick<ParsedReportLike, "coverageUpdates" | "assertionTriggers" | "patterns">;
  engine: ReportParseEngine;
  textExtracted: boolean;
  parseWarnings?: string[];
}): ReportParseMeta {
  return {
    engine: input.engine,
    textExtracted: input.textExtracted,
    signalCount: countParsedSignals(input.parsed),
    parseWarnings: input.parseWarnings ?? [],
  };
}

export function getReportParseStatus(parsedJson: Prisma.JsonValue | null | undefined): ReportParseStatus {
  const parsed = asObject(parsedJson);
  if (!parsed) {
    return {
      hasParsed: false,
      engine: "unknown",
      textExtracted: false,
      signalCount: 0,
      hasSignals: false,
      parseWarnings: [],
      parseWarning: null,
    };
  }

  const engine = parsed.engine === "llm" || parsed.engine === "rules" ? parsed.engine : "unknown";
  const signalCount =
    typeof parsed.signalCount === "number" && Number.isFinite(parsed.signalCount)
      ? Math.max(0, Math.floor(parsed.signalCount))
      : countParsedSignals(parsed);
  const parseWarnings = Array.isArray(parsed.parseWarnings)
    ? parsed.parseWarnings.filter((w): w is string => typeof w === "string" && w.trim().length > 0)
    : [];
  const textExtracted = typeof parsed.textExtracted === "boolean" ? parsed.textExtracted : true;

  return {
    hasParsed: true,
    engine,
    textExtracted,
    signalCount,
    hasSignals: signalCount > 0,
    parseWarnings,
    parseWarning: parseWarnings[0] ?? null,
  };
}
