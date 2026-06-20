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
  | "channel";

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
};
