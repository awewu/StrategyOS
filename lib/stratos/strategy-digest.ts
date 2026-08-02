/**
 * 战略合理性摘要构造器 (单一事实源)
 * ─────────────────────────────────────
 * 把 StratOS 的战略合理性传感器 —— 诊断 crux / 硬阻断 / 脆弱前提 / Top StratDiff /
 * 重大 Bet 勾连 / FPA runway —— 归一成一个只读摘要对象。
 *
 * 两处消费, 同一形状:
 *   1. GET /api/strategy/perception-digest      → 供 Tandem 中央 AI 感知 (只读拉取)
 *   2. POST /api/compass/rationality-verdict     → 组装后 POST 给中央 AI 求裁决建议
 */
import {
  getDiagnosis,
  getActiveHealthAssertions,
  getFpaSummary,
  getInvestmentCases,
  getDataSource,
} from "@/lib/data/strategy-data";
import { getStratDiffs } from "@/lib/data/versions-data";
import { getActiveStrategicPlan } from "@/lib/data/strategic-plan-data";

const SEVERITY_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
export const FRAGILE_THRESHOLD = 70;

export interface StrategyDigestPremise {
  code: string;
  premise: string;
  category: string;
  confidence: number;
  fragility: number;
  failSignal: string | null;
  signalSource: string | null;
  lastValidatedAt: string | null;
}

export interface StrategyDigestBet {
  code: string;
  title: string;
  type: string;
  gateStatus: string;
  budgetTag: string;
  fpaToggle: string;
  capexTotal: number;
}

export interface StrategyDigest {
  generatedAt: string;
  dataSource: string;
  diagnosis: {
    crux: string;
    challengeStatement: string;
    bottleneckType: string;
    period: string;
  };
  hardBlocks: Array<{ assertionType: string; message: string; metricValue: number; thresholdValue: number }>;
  fragilePremises: StrategyDigestPremise[];
  topDiffs: Array<{ category: string; severity: string; title: string; formationType: string }>;
  bets: StrategyDigestBet[];
  fpa: { revenueBudget: number; revenueForecast: number; profitForecast: number; cashRunwayMonths: number };
  counts: { premises: number; fragilePremises: number; hardBlocks: number; bets: number };
}

export async function buildStrategyDigest(): Promise<StrategyDigest> {
  const [dataSource, diagnosis, hardBlocks, diffs, bets, fpa, activePlan] = await Promise.all([
    getDataSource(),
    getDiagnosis(),
    getActiveHealthAssertions(),
    getStratDiffs(),
    getInvestmentCases(),
    getFpaSummary(),
    getActiveStrategicPlan(),
  ]);

  const premises = activePlan.plan?.premises ?? [];
  const fragilePremises: StrategyDigestPremise[] = premises
    .filter((p) => p.fragility >= FRAGILE_THRESHOLD || Boolean(p.failSignal))
    .map((p) => ({
      code: p.code,
      premise: p.premise,
      category: p.category,
      confidence: p.confidence,
      fragility: p.fragility,
      failSignal: p.failSignal,
      signalSource: p.signalSource,
      lastValidatedAt: p.lastValidatedAt,
    }));

  const topDiffs = [...diffs]
    .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0))
    .slice(0, 8)
    .map((d) => ({
      category: d.category,
      severity: d.severity,
      title: d.title,
      formationType: d.formationType ?? "unknown",
    }));

  return {
    generatedAt: new Date().toISOString(),
    dataSource,
    diagnosis: {
      crux: diagnosis.crux,
      challengeStatement: diagnosis.challengeStatement,
      bottleneckType: diagnosis.bottleneckType,
      period: diagnosis.period,
    },
    hardBlocks: hardBlocks.map((h) => ({
      assertionType: h.assertionType,
      message: h.message,
      metricValue: h.metricValue ?? 0,
      thresholdValue: h.thresholdValue ?? 0,
    })),
    fragilePremises,
    topDiffs,
    bets: bets.map((b) => ({
      code: b.code,
      title: b.title,
      type: b.type,
      gateStatus: b.gateStatus,
      budgetTag: b.budgetTag,
      fpaToggle: b.fpaToggle,
      capexTotal: b.capexTotal,
    })),
    fpa: {
      revenueBudget: fpa.revenueBudget,
      revenueForecast: fpa.revenueForecast,
      profitForecast: fpa.profitForecast,
      cashRunwayMonths: fpa.cashRunwayMonths,
    },
    counts: {
      premises: premises.length,
      fragilePremises: fragilePremises.length,
      hardBlocks: hardBlocks.length,
      bets: bets.length,
    },
  };
}
