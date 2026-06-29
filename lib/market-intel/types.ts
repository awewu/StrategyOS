/**
 * Market Intelligence module types.
 *
 * Continuously scrape industry / competitor moves, normalized into four dims:
 *  - product   new SKUs, specs, patents, EOL
 *  - gtm       channels, pricing, distribution, regional expansion
 *  - brand     campaigns, endorsements, comms, reputation
 *  - strategy  investment, M&A, org, capacity, partnerships
 *
 * The Hermes agent periodically scans sources, produces signals, classifies
 * them, and scores impact on our own strategy.
 */

export type IntelDimension = "product" | "gtm" | "brand" | "strategy";

export type IntelImpact = "threat" | "opportunity" | "neutral";

export type SourceKind =
  | "official_site"
  | "press"
  | "social"
  | "filing"
  | "patent"
  | "channel"
  | "recruitment";

export interface IntelSource {
  id: string;
  competitor: string;
  kind: SourceKind;
  url: string | null;
  cadenceDays: number;
  lastScrapedAt: string | null;
  health: "active" | "stale" | "empty";
}

export interface IntelSignal {
  id: string;
  competitor: string;
  dimension: IntelDimension;
  title: string;
  summary: string;
  impact: IntelImpact;
  relevance: number;
  sourceKind: SourceKind;
  sourceLabel: string;
  capturedAt: string;
  linkedAssumptionCode?: string;
  linkedActionCode?: string;
  /** QC grounding verdict assigned by the curator node. */
  verdict?: SupportVerdict;
  /** Short evidence snippet (quoted from source text) backing this signal. */
  evidence?: string;
}

/**
 * Anti-hallucination grounding verdict for a single extracted signal.
 *  - supported   : claim is directly traceable to source text
 *  - partial     : claim is plausible but evidence is thin / inferred
 *  - unsupported : claim has no evidence in source text → dropped
 */
export type SupportVerdict = "supported" | "partial" | "unsupported";

export const VERDICT_LABEL: Record<SupportVerdict, string> = {
  supported: "已佐证",
  partial: "部分佐证",
  unsupported: "无佐证",
};

/** A signal the curator dropped, recorded for transparency (not hidden). */
export interface CurationDrop {
  competitor: string;
  dimension: IntelDimension;
  title: string;
  reason: string;
}

/** Result of one full Hermes pipeline run (collect→analyze→qc→decide). */
export interface HermesPipelineResult {
  scanId: string;
  ranAt: string;
  sourcesScanned: number;
  sourcesActive: number;
  /** Signals that passed QC and are kept (supported / partial). */
  kept: IntelSignal[];
  /** Signals the curator dropped as unsupported. */
  drops: CurationDrop[];
  /** Per-node trace for observability in the UI. */
  trace: HermesNodeTrace[];
  /** Number of closed-loop rounds executed (re-collect on low coverage). */
  rounds: number;
  llmEngine: "rule" | "llm";
}

export interface HermesNodeTrace {
  node: "collect" | "analyze" | "qc" | "decide";
  competitor: string;
  detail: string;
  fetched?: boolean;
}

export interface CompetitorTrack {
  competitor: string;
  product: string | null;
  gtm: string | null;
  brand: string | null;
  strategy: string | null;
  momentum: "up" | "down" | "flat";
  momentumNote: string;
}

export interface HermesScanResult {
  scanId: string;
  ranAt: string;
  sourcesScanned: number;
  sourcesActive: number;
  newSignals: number;
  log: string[];
  highlights: string[];
  llmEngine: "rule" | "llm";
}

export const DIMENSION_LABEL: Record<IntelDimension, string> = {
  product: "产品",
  gtm: "GTM",
  brand: "品牌",
  strategy: "战略模式",
};

export const IMPACT_LABEL: Record<IntelImpact, string> = {
  threat: "威胁",
  opportunity: "机会",
  neutral: "中性",
};

export const SOURCE_LABEL: Record<SourceKind, string> = {
  official_site: "官网",
  press: "媒体",
  social: "社媒",
  filing: "财报公告",
  patent: "专利",
  channel: "渠道情报",
  recruitment: "招聘信号",
};

/**
 * Lead time of an intelligence signal relative to a competitor's market move.
 *  - leading    : precedes the move by ~6–12 months (recruitment, patents)
 *  - coincident : surfaces as the move happens (product launch, GTM, brand)
 *  - lagging    : confirms a move after the fact (financial filings)
 *
 * Separating these lets the board see "what's coming" apart from "what already
 * happened" — the core value of early-warning intelligence.
 */
export type LeadTime = "leading" | "coincident" | "lagging";

export const LEAD_TIME_LABEL: Record<LeadTime, string> = {
  leading: "领先信号",
  coincident: "同步信号",
  lagging: "滞后信号",
};

/**
 * Map a source kind to its lead time. Recruitment + patents are the earliest
 * warning (a competitor staffs up / files IP 6–12 months before launch);
 * filings confirm moves already made.
 */
export function leadTimeOf(kind: SourceKind): LeadTime {
  switch (kind) {
    case "recruitment":
    case "patent":
      return "leading";
    case "filing":
      return "lagging";
    default:
      return "coincident";
  }
}
