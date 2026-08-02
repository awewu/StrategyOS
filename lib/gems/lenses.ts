/**
 * Gems 审计镜头 — 把各真值源转成带证据引用的洞察卡。
 * 每个镜头都是纯函数(除 fetchOverallVerdict 读 DB), 供 builders 按角色组合。
 * 铁律: 只从真实字段产卡; 缺关键字段的条目计入 drops, 不臆造。
 */
import { dbAvailable, prisma } from "@/lib/db";
import type { StrategyDigest } from "@/lib/stratos/strategy-digest";
import type { HealthPayload } from "@/lib/health/payload";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";
import { computeCommitmentSummary } from "@/lib/execution/commitment-summary";
import type { ReportListRow } from "@/lib/reports/report-queries";
import type { InsightCard } from "./types";
import { num } from "./core";

const STANCE_LABEL: Record<string, string> = {
  persevere: "坚守",
  pivot: "转向",
  kill: "终止",
  mixed: "分化",
};

export type StrategyLens = "hardblock" | "runway" | "premise" | "bet" | "diff";

/** 战略合理性镜头集合(CEO/CFO/board 复用), 返回卡 + 丢弃计数。 */
export function strategyCards(
  digest: StrategyDigest,
  include: StrategyLens[] = ["hardblock", "runway", "premise", "bet", "diff"],
): { cards: InsightCard[]; drops: number } {
  const cards: InsightCard[] = [];
  let drops = 0;
  const has = (l: StrategyLens) => include.includes(l);

  if (has("hardblock")) {
    for (const h of digest.hardBlocks) {
      if (!h.message) {
        drops++;
        continue;
      }
      cards.push({
        id: `hardblock-${h.assertionType}`,
        kind: "risk",
        severity: "critical",
        title: `硬阻断 · ${h.assertionType}`,
        detail: h.message,
        evidence: [
          { label: "当前值", value: num(h.metricValue) },
          { label: "阈值", value: num(h.thresholdValue) },
        ],
        action: { href: "/finance?tab=overview", label: "FPA Runway" },
        source: "audit",
      });
    }
  }

  if (has("runway")) {
    const runway = digest.fpa.cashRunwayMonths;
    if (runway > 0 && runway < 3) {
      cards.push({
        id: "runway",
        kind: "risk",
        severity: runway < 2 ? "critical" : "high",
        title: "现金 runway 低于安全线",
        detail: `现金 runway 仅 ${num(runway)} 个月，低于 3 个月安全线，须优先处置现金。`,
        evidence: [
          { label: "runway", value: `${num(runway)} 月` },
          { label: "营收预测", value: num(digest.fpa.revenueForecast) },
        ],
        action: { href: "/finance?tab=overview", label: "现金与 FPA" },
        source: "audit",
      });
    }
  }

  if (has("premise")) {
    for (const p of digest.fragilePremises) {
      if (!p.premise) {
        drops++;
        continue;
      }
      const failed = Boolean(p.failSignal);
      const highFragile = p.fragility >= 85 && p.confidence < 50;
      if (!failed && !highFragile) continue;
      cards.push({
        id: `premise-${p.code}`,
        kind: "risk",
        severity: failed ? "high" : "medium",
        title: failed ? `前提失效信号 · ${p.code}` : `高脆弱前提 · ${p.code}`,
        detail: p.premise,
        evidence: [
          { label: "脆弱性", value: `${p.fragility}%` },
          { label: "置信度", value: `${p.confidence}%` },
          ...(failed
            ? [
                {
                  label: "失效信号",
                  value: p.signalSource ? `${p.failSignal} (${p.signalSource})` : String(p.failSignal),
                },
              ]
            : []),
        ],
        action: { href: "/compass", label: "前提审计" },
        source: "audit",
      });
    }
  }

  if (has("bet")) {
    for (const b of digest.bets) {
      if (b.gateStatus === "review" || b.gateStatus === "rejected") {
        cards.push({
          id: `bet-gate-${b.code}`,
          kind: "risk",
          severity: b.gateStatus === "rejected" ? "high" : "medium",
          title: `Bet 门禁未过 · ${b.code}`,
          detail: b.title,
          evidence: [
            { label: "门禁", value: b.gateStatus },
            { label: "预算标签", value: b.budgetTag || "未标注" },
            { label: "CapEx", value: num(b.capexTotal) },
          ],
          action: { href: "/gates", label: "决策 Gate" },
          source: "audit",
        });
      } else if (b.fpaToggle === "off") {
        cards.push({
          id: `bet-fpa-${b.code}`,
          kind: "todo",
          severity: "low",
          title: `Bet 未挂 FPA · ${b.code}`,
          detail: `${b.title} 尚未与预算/FPA 曲线勾连 (budget_tag)。`,
          evidence: [
            { label: "预算标签", value: b.budgetTag || "未标注" },
            { label: "CapEx", value: num(b.capexTotal) },
          ],
          action: { href: "/finance/ledger", label: "总账勾连" },
          source: "audit",
        });
      }
    }
  }

  if (has("diff")) {
    for (const d of digest.topDiffs.slice(0, 3)) {
      if (!d.title) {
        drops++;
        continue;
      }
      if (d.severity !== "critical" && d.severity !== "high") continue;
      cards.push({
        id: `diff-${d.title.slice(0, 16)}`,
        kind: "change",
        severity: d.severity === "critical" ? "high" : "medium",
        title: d.title,
        detail: `类别 ${d.category} · 形成方式 ${d.formationType}`,
        evidence: [
          { label: "类别", value: d.category },
          { label: "严重度", value: d.severity },
        ],
        action: { href: "/versions", label: "版本对照" },
        source: "audit",
      });
    }
  }

  return { cards, drops };
}

/** B-A-F 营收背离(CFO 专属)。 */
export function bafGapCard(digest: StrategyDigest): InsightCard | null {
  const { revenueBudget, revenueForecast } = digest.fpa;
  if (revenueBudget <= 0) return null;
  const gap = (revenueForecast - revenueBudget) / revenueBudget;
  if (gap > -0.05) return null;
  return {
    id: "baf-gap",
    kind: "risk",
    severity: gap <= -0.15 ? "high" : "medium",
    title: "营收预测低于预算",
    detail: `预测营收较预算低 ${Math.abs(Math.round(gap * 100))}%，需复核 B-A-F 与承诺。`,
    evidence: [
      { label: "预算", value: num(revenueBudget) },
      { label: "预测", value: num(revenueForecast) },
    ],
    action: { href: "/finance", label: "FPA 报表" },
    source: "audit",
  };
}

export function freezeReadyCard(digest: StrategyDigest, drillHref = "/council?tab=rehearsal"): InsightCard {
  return {
    id: "freeze-ready",
    kind: "advice",
    severity: "info",
    title: "无活跃硬阻断 · 可进入快照评审",
    detail: "未见一票否决与前提失效信号，可推进 WORKING → IN_REVIEW 快照。",
    evidence: [{ label: "脆弱前提", value: String(digest.counts.fragilePremises) }],
    action: { href: drillHref, label: "战略会彩排" },
    source: "audit",
  };
}

/** 读取已留痕的整体合理性研判(中央 AI / 人工), 转成建议卡。 */
export async function fetchOverallVerdict(
  period: string,
): Promise<{ card: InsightCard; stance?: string } | null> {
  if (!(await dbAvailable())) return null;
  try {
    const overall = await prisma.rationalityVerdict.findFirst({
      where: { period, targetKind: "overall" },
      orderBy: { aiGeneratedAt: "desc" },
    });
    if (!overall) return null;
    const rec = overall.humanDecision ?? overall.aiRecommendation ?? undefined;
    const decided = Boolean(overall.humanDecision);
    const fromCentral = Boolean(overall.aiModel) && overall.aiModel !== "local-fallback";
    return {
      stance: rec ?? undefined,
      card: {
        id: "verdict-overall",
        kind: "advice",
        severity: rec === "kill" ? "high" : rec === "pivot" ? "medium" : "info",
        title: `合理性研判 · ${STANCE_LABEL[rec ?? ""] ?? rec ?? "待研判"}${decided ? "(已人工裁决)" : "(AI 建议)"}`,
        detail: overall.aiRationale || overall.targetLabel || "见战略罗盘合理性审视。",
        evidence: [
          { label: "来源", value: fromCentral ? overall.aiModel! : "本地规则" },
          ...(decided ? [{ label: "裁决人", value: overall.decidedBy ?? "—" }] : []),
        ],
        action: { href: "/compass", label: "合理性审视" },
        source: fromCentral ? "central-ai" : "local-fallback",
      },
    };
  } catch {
    return null;
  }
}

/** 承诺兑现镜头(vp/system_head/pm 复用) — 兑现率 + 逾期项。 */
export function commitmentCards(
  records: CommitmentRecord[],
  opts: { scopeLabel: string; drillHref: string },
): { cards: InsightCard[]; drops: number } {
  const cards: InsightCard[] = [];
  let drops = 0;
  const summary = computeCommitmentSummary(records);

  const rate = summary.rate;
  const rateKind = rate < 50 ? "risk" : rate < 70 ? "todo" : "advice";
  const rateSev = rate < 50 ? "high" : rate < 70 ? "medium" : "info";
  cards.push({
    id: "commit-rate",
    kind: rateKind,
    severity: rateSev,
    title: `承诺兑现率 ${rate}% · ${opts.scopeLabel}`,
    detail: `共 ${summary.total} 项 · 完成 ${summary.done} · 逾期 ${summary.overdue} · 进行中 ${summary.inflight}`,
    evidence: [
      { label: "兑现率", value: `${rate}%` },
      { label: "逾期", value: String(summary.overdue) },
      ...(summary.maxDaysOverdue > 0 ? [{ label: "最长逾期", value: `${summary.maxDaysOverdue} 天` }] : []),
    ],
    action: { href: opts.drillHref, label: "驾驶舱" },
    source: "audit",
  });

  const overdue = records
    .filter((r) => r.status === "overdue")
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))
    .slice(0, 3);
  for (const r of overdue) {
    if (!r.content) {
      drops++;
      continue;
    }
    cards.push({
      id: `commit-${r.id}`,
      kind: "risk",
      severity: (r.daysOverdue ?? 0) >= 14 ? "high" : "medium",
      title: `逾期承诺 · ${r.owner || "未指派"}`,
      detail: r.content,
      evidence: [
        ...(r.daysOverdue ? [{ label: "逾期", value: `${r.daysOverdue} 天` }] : []),
        ...(r.department ? [{ label: "部门", value: r.department }] : []),
        ...(r.promiseTo ? [{ label: "承诺对象", value: r.promiseTo }] : []),
      ],
      action: { href: opts.drillHref, label: "查看" },
      source: "audit",
    });
  }

  return { cards, drops };
}

/** 报告缺口镜头(staff 专属) — 未解析 / 无信号 / 待审批。 */
export function reportGapCards(rows: ReportListRow[]): { cards: InsightCard[]; drops: number } {
  const cards: InsightCard[] = [];
  const unparsed = rows.filter((r) => !r.hasParsed);
  const noSignal = rows.filter((r) => r.hasParsed && !r.hasSignals);
  const pending = rows.filter((r) => r.approvalStatus === "pending" || r.approvalStatus === "submitted");

  if (unparsed.length > 0) {
    cards.push({
      id: "report-unparsed",
      kind: "todo",
      severity: unparsed.length >= 3 ? "medium" : "low",
      title: `${unparsed.length} 份报告未解析`,
      detail: `${unparsed
        .slice(0, 3)
        .map((r) => r.title)
        .join("、")}${unparsed.length > 3 ? " 等" : ""} 尚未提取结构化信号。`,
      evidence: [{ label: "未解析", value: String(unparsed.length) }],
      action: { href: "/reports", label: "报告中心" },
      source: "audit",
    });
  }
  if (noSignal.length > 0) {
    cards.push({
      id: "report-nosignal",
      kind: "todo",
      severity: "low",
      title: `${noSignal.length} 份报告无有效信号`,
      detail: "已解析但未产出可用战略信号，建议补充数据质量。",
      evidence: [{ label: "无信号", value: String(noSignal.length) }],
      action: { href: "/reports", label: "报告中心" },
      source: "audit",
    });
  }
  if (pending.length > 0) {
    cards.push({
      id: "report-pending",
      kind: "advice",
      severity: "info",
      title: `${pending.length} 份报告待审批`,
      detail: "存在待审批/已提交报告，推动流转以保证真值及时。",
      evidence: [{ label: "待审批", value: String(pending.length) }],
      action: { href: "/reports", label: "报告中心" },
      source: "audit",
    });
  }
  return { cards, drops: 0 };
}

/** 系统健康镜头(admin 专属)。 */
export function healthCards(payload: HealthPayload): { cards: InsightCard[]; drops: number } {
  const cards: InsightCard[] = [];
  const cap = payload.capabilities;
  const checks: Array<{ ok: boolean; label: string; detail?: string }> = [
    { ok: cap.db.reachable, label: "数据库", detail: cap.db.detail ?? undefined },
    { ok: cap.workos.configured, label: "WorkOS SSO", detail: cap.workos.detail ?? undefined },
    { ok: cap.llm.configured, label: "LLM Agent", detail: cap.llm.detail ?? undefined },
    { ok: cap.fonts.available, label: "中文 PDF 字体", detail: cap.fonts.detail ?? undefined },
  ];
  for (const c of checks) {
    if (c.ok) continue;
    const critical = c.label === "数据库";
    cards.push({
      id: `health-${c.label}`,
      kind: critical ? "risk" : "todo",
      severity: critical ? "critical" : "low",
      title: `能力降级 · ${c.label}`,
      detail: c.detail || `${c.label} 未就绪，相关功能已降级。`,
      evidence: [{ label: "状态", value: "降级" }],
      action: { href: "/api/health?format=json", label: "健康详情" },
      source: "audit",
    });
  }
  if (payload.status === "ok" && cards.length === 0) {
    cards.push({
      id: "health-ok",
      kind: "advice",
      severity: "info",
      title: "系统能力全部就绪",
      detail: `mode=${payload.mode} · dataSource=${payload.dataSource}，无降级项。`,
      evidence: Object.entries(payload.counts).map(([k, v]) => ({ label: k, value: String(v) })),
      action: { href: "/api/health?format=json", label: "健康详情" },
      source: "audit",
    });
  }
  return { cards, drops: 0 };
}
