import type {
  DiffRecord,
  ReportPattern,
  SnapshotStatePayload,
  StrategyPattern,
} from "../types/stratos";

const RATE_DROP_HIGH = -15;
const RATE_DROP_WARN = -10;
const FPA_FORECAST_THRESHOLD = 0.1;
const REVENUE_SERENDIPITY = 1.15;

function pctChange(from: number, to: number): number {
  if (from === 0) return to === 0 ? 0 : 100;
  return ((to - from) / from) * 100;
}

export function computeDeliberateRealizationRate(
  from: SnapshotStatePayload,
  to: SnapshotStatePayload
): number {
  const krs = from.keyResults ?? [];
  const projects = from.projects ?? [];
  const ics = (from.investmentCases ?? []).filter((ic) => ic.gateStatus === "approved");

  let total = 0;
  let achieved = 0;

  for (const kr of krs) {
    total++;
    const toKr = to.keyResults?.find((k) => k.id === kr.id);
    if (toKr && (toKr.confidence ?? 0) >= 0.8) achieved++;
  }

  for (const vx of projects.filter((p) => p.status === "active")) {
    total++;
    const toVx = to.projects?.find((p) => p.id === vx.id);
    if (toVx && (toVx.progressPercent >= 80 || toVx.status === "completed")) achieved++;
  }

  for (const ic of ics) {
    total++;
    const toIc = to.investmentCases?.find((i) => i.id === ic.id);
    if (toIc && ["approved", "post_invest"].includes(toIc.gateStatus)) achieved++;
  }

  return total === 0 ? 100 : Math.round((achieved / total) * 100);
}

export function buildStrategyPattern(
  from: SnapshotStatePayload,
  to: SnapshotStatePayload,
  reportPatterns: ReportPattern[] = []
): StrategyPattern {
  const emergentFromReports = reportPatterns
    .filter((p) => p.formationType === "emergent" && p.linkedOkr.length === 0)
    .map((p) => ({
      title: p.title,
      suggestDeliberate: p.suggestDeliberate ?? true,
    }));

  const serendipitousFromReports = reportPatterns
    .filter((p) => p.formationType === "serendipitous")
    .map((p) => ({ title: p.title }));

  const unrealized: StrategyPattern["unrealizedItems"] = [];
  for (const ic of from.investmentCases ?? []) {
    if (ic.gateStatus !== "approved") continue;
    const toIc = to.investmentCases?.find((i) => i.id === ic.id);
    if (!toIc || ["killed", "rejected"].includes(toIc.gateStatus)) {
      unrealized.push({ objectType: "investment_case", title: ic.title });
    }
  }

  for (const vx of from.projects ?? []) {
    if (vx.status === "active" && vx.progressPercent === 0) {
      const toVx = to.projects?.find((p) => p.id === vx.id);
      if (toVx && toVx.progressPercent === 0) {
        unrealized.push({ objectType: "project", title: `${vx.code} 未启动` });
      }
    }
  }

  const rate = computeDeliberateRealizationRate(from, to);
  const learningPrompts: string[] = [];
  if (emergentFromReports.length > 0) {
    learningPrompts.push("涌现模式是否写入下版 deliberate？");
  }
  if (serendipitousFromReports.length > 0) {
    learningPrompts.push("偶成成果是否归因并制度化？");
  }

  return {
    deliberateRealizationRate: rate,
    emergentPatterns: emergentFromReports,
    unrealizedItems: unrealized,
    serendipitousItems: serendipitousFromReports,
    learningPrompts,
  };
}

export function computeStratDiff(
  from: SnapshotStatePayload,
  to: SnapshotStatePayload,
  reportPatterns: ReportPattern[] = []
): DiffRecord[] {
  const diffs: DiffRecord[] = [];
  const patternFrom = from.strategyPattern;
  const patternTo = buildStrategyPattern(from, to, reportPatterns);

  // #13 FPA forecast
  if (from.fpa && to.fpa) {
    const revDev = Math.abs(pctChange(from.fpa.revenueForecast, to.fpa.revenueForecast));
    if (revDev > FPA_FORECAST_THRESHOLD * 100) {
      diffs.push({
        category: "FPA_FORECAST",
        severity: "high",
        title: `FPA 预测修订：营收 Forecast 变化 ${revDev.toFixed(1)}%`,
        beforeJson: { forecast: from.fpa.revenueForecast },
        afterJson: { forecast: to.fpa.revenueForecast },
      });
    }
  }

  // #14 runway
  if (from.fpa && to.fpa) {
    const crossed =
      (from.fpa.cashRunwayMonths < 3 && to.fpa.cashRunwayMonths >= 3) ||
      (from.fpa.cashRunwayMonths >= 3 && to.fpa.cashRunwayMonths < 3);
    if (crossed) {
      diffs.push({
        category: "CASH_RUNWAY",
        severity: "critical",
        title: `现金 runway ${from.fpa.cashRunwayMonths}→${to.fpa.cashRunwayMonths} 月（跨 3 月安全线）`,
        beforeJson: { runway: from.fpa.cashRunwayMonths },
        afterJson: { runway: to.fpa.cashRunwayMonths },
      });
    }
  }

  // #15 emergent
  for (const p of reportPatterns.filter((r) => r.formationType === "emergent")) {
    if (p.linkedOkr.length === 0) {
      diffs.push({
        category: "EMERGENT_PATTERN",
        severity: "medium",
        title: p.title,
        formationType: "emergent",
        detail: "月报 §8 涌现 · 未对齐 deliberate OKR",
      });
    }
  }
  for (const e of patternTo.emergentPatterns) {
    const known = patternFrom?.emergentPatterns?.some((x) => x.title === e.title);
    if (!known) {
      diffs.push({
        category: "EMERGENT_PATTERN",
        severity: "medium",
        title: e.title,
        formationType: "emergent",
      });
    }
  }

  // #16 unrealized
  for (const u of patternTo.unrealizedItems) {
    diffs.push({
      category: "UNREALIZED",
      severity: "medium",
      title: u.title,
      formationType: "unrealized",
      detail: u.objectType,
    });
  }

  // #17 serendipitous
  for (const p of reportPatterns.filter((r) => r.formationType === "serendipitous")) {
    diffs.push({
      category: "SERENDIPITOUS",
      severity: "medium",
      title: p.title,
      formationType: "serendipitous",
    });
  }
  if (from.fpa && to.fpa && to.fpa.revenueActual / to.fpa.revenueBudget > REVENUE_SERENDIPITY) {
    diffs.push({
      category: "SERENDIPITOUS",
      severity: "medium",
      title: "营收超预期且无 deliberate 完整归因",
      formationType: "serendipitous",
      detail: `Actual/Budget ${((to.fpa.revenueActual / to.fpa.revenueBudget) * 100).toFixed(0)}%`,
    });
  }

  // #18 deliberate rate drop
  const rateFrom = patternFrom?.deliberateRealizationRate ?? computeDeliberateRealizationRate(from, from);
  const rateTo = patternTo.deliberateRealizationRate;
  const delta = rateTo - rateFrom;
  if (delta <= RATE_DROP_WARN) {
    diffs.push({
      category: "DELIBERATE_RATE_DROP",
      severity: delta <= RATE_DROP_HIGH ? "high" : "warning",
      title: `刻意实现率 ${rateFrom}% → ${rateTo}%`,
      formationType: "deliberate",
      beforeJson: { rate: rateFrom },
      afterJson: { rate: rateTo },
    });
  }

  // #19 IC gate change
  for (const ic of to.investmentCases ?? []) {
    const prev = from.investmentCases?.find((i) => i.id === ic.id);
    if (prev && prev.gateStatus !== ic.gateStatus) {
      diffs.push({
        category: "IC_CHANGE",
        severity: "high",
        title: `${ic.code} ${prev.gateStatus}→${ic.gateStatus}`,
        beforeJson: { status: prev.gateStatus },
        afterJson: { status: ic.gateStatus },
      });
    }
  }

  // #4 assumption failed
  for (const hx of to.assumptions ?? []) {
    const prev = from.assumptions?.find((a) => a.id === hx.id);
    if (prev?.result !== "failed" && hx.result === "failed") {
      diffs.push({
        category: "ASSUMPTION_FAILED",
        severity: "high",
        title: `${hx.code} 假设失效`,
        detail: hx.content,
      });
    }
  }

  // #3 project migrate
  for (const vx of to.projects ?? []) {
    const prev = from.projects?.find((p) => p.id === vx.id);
    if (prev && prev.progressPercent !== vx.progressPercent) {
      const slip = vx.progressPercent < prev.progressPercent - 10;
      if (slip || prev.status !== vx.status) {
        diffs.push({
          category: "PROJECT_MIGRATE",
          severity: "medium",
          title: `${vx.code} ${prev.status}/${prev.progressPercent}%→${vx.status}/${vx.progressPercent}%`,
        });
      }
    }
  }

  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    warning: 2,
    medium: 3,
    info: 4,
  };

  const mintzberg = new Set([
    "EMERGENT_PATTERN",
    "UNREALIZED",
    "SERENDIPITOUS",
    "DELIBERATE_RATE_DROP",
  ]);

  return diffs.sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 5;
    const sb = severityOrder[b.severity] ?? 5;
    if (sa !== sb) return sa - sb;
    if (mintzberg.has(a.category) && !mintzberg.has(b.category)) return -1;
    if (!mintzberg.has(a.category) && mintzberg.has(b.category)) return 1;
    return 0;
  });
}

export function topDiffs(diffs: DiffRecord[], n = 3): DiffRecord[] {
  return diffs.slice(0, n);
}
