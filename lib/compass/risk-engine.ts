import type { CompassMilestone, PremiseAudit } from "./types";

export function scoreMilestones(
  milestones: CompassMilestone[],
  premises: PremiseAudit[],
  currentRevenue: number,
  currentYear: number,
): CompassMilestone[] {
  const fragileActive = premises.filter((p) => p.fragility >= 70 && p.confidence < 60);
  const failSignals = premises.filter((p) => p.failSignal);

  return milestones.slice().sort((a, b) => a.year - b.year).map((m) => {
    if (!m.revenueTarget) return { ...m, riskScore: null, riskFactors: [] };

    const yearsLeft = m.year - currentYear;
    if (yearsLeft <= 0) {
      const achieved = m.revenueActual ?? currentRevenue;
      const gap = Math.max(0, m.revenueTarget - achieved) / m.revenueTarget;
      return {
        ...m,
        riskScore: Math.round(Math.min(100, gap * 150)),
        riskFactors: gap > 0.1 ? [`实际收入低于里程碑目标 ${Math.round(gap * 100)}%`] : [],
      };
    }

    const required = Math.pow(m.revenueTarget / Math.max(currentRevenue, 1), 1 / yearsLeft) - 1;
    const factors: string[] = [];
    let score = 0;

    if (required > 0.35) { score += 40; factors.push(`需要 ${Math.round(required * 100)}% 年复合增速，超高挑战`); }
    else if (required > 0.20) { score += 25; factors.push(`需要 ${Math.round(required * 100)}% 年复合增速`); }
    else if (required > 0.10) { score += 10; }

    if (fragileActive.length >= 3) { score += 30; factors.push(`${fragileActive.length} 条高脆弱性假设置信度不足`); }
    else if (fragileActive.length >= 1) { score += 15; factors.push(`${fragileActive.length} 条高脆弱性假设需关注`); }

    if (failSignals.length > 0) {
      score += failSignals.length * 12;
      factors.push(`${failSignals.length} 条假设已出现失效信号`);
    }

    return { ...m, riskScore: Math.min(100, score), riskFactors: factors };
  });
}

export function riskVerdict(score: number | null): { label: string; color: string; bg: string } {
  if (score === null) return { label: "未评估", color: "var(--color-text-muted)", bg: "transparent" };
  if (score >= 70) return { label: "高风险", color: "var(--signal-red)", bg: "rgba(139,14,4,0.08)" };
  if (score >= 40) return { label: "中等风险", color: "var(--signal-yellow)", bg: "rgba(180,83,9,0.08)" };
  return { label: "可控", color: "var(--signal-green)", bg: "rgba(31,138,69,0.08)" };
}
