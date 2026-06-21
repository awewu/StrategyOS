import type { IntelImpact, IntelSignal } from "./types";
import { IMPACT_LABEL } from "./types";

export type MarketBriefItem = {
  signal: IntelSignal;
  soWhat: string;
};

function defaultSoWhat(sig: IntelSignal): string {
  const hx = sig.linkedAssumptionCode ? `挑战假设 ${sig.linkedAssumptionCode}` : "需纳入战略会讨论";
  const vx = sig.linkedActionCode ? ` · 关联 ${sig.linkedActionCode}` : "";
  if (sig.impact === "threat") {
    return `${hx}${vx} — 建议核对解码 BSC 底线与 Gate`;
  }
  if (sig.impact === "opportunity") {
    return `${hx}${vx} — 评估是否写入 deliberate 或涌现复盘`;
  }
  return `${hx}${vx} — 持续监测`;
}

/** Top signals for L1 market brief (threats first, then relevance). */
export function buildMarketBrief(signals: IntelSignal[], limit = 3): MarketBriefItem[] {
  const sorted = [...signals].sort((a, b) => {
    const threat = (i: IntelImpact) => (i === "threat" ? 0 : i === "opportunity" ? 1 : 2);
    const ta = threat(a.impact);
    const tb = threat(b.impact);
    if (ta !== tb) return ta - tb;
    return b.relevance - a.relevance;
  });
  return sorted.slice(0, limit).map((signal) => ({
    signal,
    soWhat: defaultSoWhat(signal),
  }));
}

export function briefContextForLlm(items: MarketBriefItem[], extraSignals: IntelSignal[]): string {
  const lines = items.map(
    (b) =>
      `[${b.signal.competitor}] ${b.signal.title} (${IMPACT_LABEL[b.signal.impact]}, 相关度 ${b.signal.relevance}): ${b.signal.summary} | So what: ${b.soWhat}`,
  );
  if (extraSignals.length) {
    lines.push("--- 其他高相关信号 ---");
    for (const s of extraSignals.slice(0, 5)) {
      lines.push(`[${s.competitor}] ${s.title}: ${s.summary}`);
    }
  }
  return lines.join("\n");
}
