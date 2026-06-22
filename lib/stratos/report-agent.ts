/**
 * Rule-based report parser — Phase 3 Agent subset.
 * Extracts §8 patterns, coverage hints, runway triggers, optional McKinsey SCR blocks.
 */
import type { ReportPattern } from "@/lib/types/stratos";

export interface McKinseySections {
  situation?: string;
  complication?: string;
  resolution?: string;
  keyIssues?: string[];
  implications?: string[];
  decisions?: string[];
}

export interface ParsedReport {
  reportId: string;
  status: "parsed" | "failed";
  patterns: ReportPattern[];
  coverageUpdates: string[];
  assertionTriggers: string[];
  agentTrace: string[];
  mckinsey?: McKinseySections;
}

const EMERGENT_KEYWORDS = ["涌现", "自发", "意外", "未计划", "emergent"];
const SERENDIPITY_KEYWORDS = ["意外获", "偶然", "serendipitous"];
const RUNWAY_KEYWORDS = ["runway", "现金", "波峰", "burn"];

type SectionKey = keyof McKinseySections;

const SECTION_MARKERS: Array<{ key: SectionKey; patterns: RegExp[] }> = [
  { key: "situation", patterns: [/^§S\b/i, /^situation\b/i, /^背景/, /^§背景/] },
  { key: "complication", patterns: [/^§C\b/i, /^complication\b/i, /^症结/, /^§症结/] },
  { key: "resolution", patterns: [/^§R\b/i, /^resolution\b/i, /^建议/, /^§建议/] },
  {
    key: "keyIssues",
    patterns: [/^§MECE\b/i, /^key issues\b/i, /^关键议题/, /^§Issues\b/i, /^§议题/],
  },
  {
    key: "implications",
    patterns: [/^§So what\b/i, /^§Implications\b/i, /^启示/, /^so what\b/i, /^§启示/],
  },
  { key: "decisions", patterns: [/^§Decisions\b/i, /^§Decision\b/i, /^待决/, /^决策/] },
];

function stripMarker(line: string): string {
  return line
    .replace(/^§[\w\s·]+\s*[:：]?\s*/i, "")
    .replace(/^(Situation|Complication|Resolution|Key Issues|Implications|Decisions)\s*[:：]?\s*/i, "")
    .trim();
}

function isBullet(line: string): boolean {
  return /^[-*•·]\s/.test(line) || /^\[\s?[xX ]?\]\s/.test(line);
}

function bulletText(line: string): string {
  return line.replace(/^[-*•·]\s*/, "").replace(/^\[\s?[xX ]?\]\s*/, "").trim();
}

export function parseMcKinseySections(rawContent: string): McKinseySections | undefined {
  const lines = rawContent.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: McKinseySections = {};
  let current: SectionKey | null = null;

  for (const line of lines) {
    const matched = SECTION_MARKERS.find(({ patterns }) =>
      patterns.some((p) => p.test(line))
    );
    if (matched) {
      current = matched.key;
      const inline = stripMarker(line);
      if (inline && matched.key !== "keyIssues" && matched.key !== "implications" && matched.key !== "decisions") {
        out[matched.key] = inline;
      } else if (
        inline &&
        (matched.key === "keyIssues" || matched.key === "implications" || matched.key === "decisions")
      ) {
        const arrKey = matched.key;
        out[arrKey] = [inline];
      }
      continue;
    }

    if (!current) continue;

    if (current === "keyIssues" || current === "implications" || current === "decisions") {
      const text = isBullet(line) ? bulletText(line) : stripMarker(line);
      if (!text) continue;
      const arr = out[current] ?? [];
      arr.push(text);
      out[current] = arr;
    } else if (!out[current]) {
      out[current] = stripMarker(line) || line;
    }
  }

  const hasContent = Object.values(out).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  );
  return hasContent ? out : undefined;
}

export function parseReportContent(
  reportId: string,
  rawContent: string,
  _period: string
): ParsedReport {
  const agentTrace: string[] = [];
  const patterns: ReportPattern[] = [];
  const coverageUpdates: string[] = [];
  const assertionTriggers: string[] = [];

  agentTrace.push("Agent:ReportIngest → normalize text");
  const lines = rawContent.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const mckinsey = parseMcKinseySections(rawContent);
  if (mckinsey) {
    agentTrace.push("Agent:McKinseyParser → SCR / MECE / implications / decisions");
  }

  agentTrace.push("Agent:MintzbergScanner → §8 patterns");
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (EMERGENT_KEYWORDS.some((k) => line.includes(k))) {
      patterns.push({
        formationType: "emergent",
        title: line.replace(/^§8[：:]\s*/, "").slice(0, 120),
        linkedOkr: [],
        suggestDeliberate: line.includes("写入") || line.includes("deliberate"),
        reportId,
      });
    }
    if (SERENDIPITY_KEYWORDS.some((k) => line.includes(k))) {
      patterns.push({
        formationType: "serendipitous",
        title: line.slice(0, 120),
        linkedOkr: [],
        reportId,
      });
    }
    if (/覆盖|签约|coverage/i.test(line) && /\d/.test(line)) {
      coverageUpdates.push(line.slice(0, 120));
      agentTrace.push("Agent:CoverageExtractor → " + line.slice(0, 40));
    }
    if (RUNWAY_KEYWORDS.some((k) => lower.includes(k)) && /\d+\.?\d*/.test(line)) {
      const m = line.match(/(\d+\.?\d*)\s*月/);
      if (m && parseFloat(m[1]) < 3) {
        assertionTriggers.push(`runway ${m[1]} 月 < 3 月阈值`);
        agentTrace.push("Agent:HealthAssertion → runway hard block candidate");
      }
    }
  }

  if (patterns.length === 0 && lines.length > 0) {
    agentTrace.push("Agent:MintzbergScanner → no §8 signals (info)");
  }

  return {
    reportId,
    status: "parsed",
    patterns,
    coverageUpdates,
    assertionTriggers,
    agentTrace,
    mckinsey,
  };
}

/** Demo content for Sheet1 import simulation */
export const DEMO_SHEET_IMPORT = `Sheet1 财务 Excel 导入 · ${new Date().toISOString().slice(0, 10)}
§S 背景：Q2 营收按 B 轨运行，热泵 Crux 进入验证期
§C 症结：现金 runway 2.1 月 · 华东覆盖低于 KR
§R 建议：冻结 H3 CAPEX，优先 GtmStack 签约与 ProdStack 样机
§MECE 关键议题
- FPA runway 与波峰融资窗口
- GtmStack 覆盖缺口
§So what 启示
- runway < 3 月 → SPBP 悲观情景加权上调
§Decisions 待决
- [ ] H2 CAPEX 分期 · CFO · 6/30
§8 战略模式：区县经销商自发组团签约，建议下版 deliberate 候选
覆盖：酒店签约 820/1200 · Q2 华东新签 62/80
现金 runway 2.1 月 · 9 月波峰 3200 万
`;

export interface MonthlyPulseFields {
  oneLiner: string;
  offTrackKr?: string;
  needHelp?: string;
}

/** Format 3-field monthly pulse into normalized text for parsing pipeline */
export function formatMonthlyPulse(fields: MonthlyPulseFields): string {
  const lines = [
    `§Pulse 本月一句话：${fields.oneLiner.trim()}`,
  ];
  if (fields.offTrackKr?.trim()) {
    lines.push(`§Pulse 偏离KR：${fields.offTrackKr.trim()}`);
  }
  if (fields.needHelp?.trim()) {
    lines.push(`§Pulse 需协调：${fields.needHelp.trim()}`);
  }
  return lines.join("\n");
}

export function parseMonthlyPulse(rawContent: string): MonthlyPulseFields | null {
  const oneLiner = rawContent.match(/§Pulse 本月一句话[：:]\s*(.+)/)?.[1]?.trim();
  if (!oneLiner) return null;
  return {
    oneLiner,
    offTrackKr: rawContent.match(/§Pulse 偏离KR[：:]\s*(.+)/)?.[1]?.trim(),
    needHelp: rawContent.match(/§Pulse 需协调[：:]\s*(.+)/)?.[1]?.trim(),
  };
}
