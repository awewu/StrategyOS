import type { getCommandDeckBundle } from "@/lib/data/strategy-data";
import { topDiffs } from "@/lib/stratos";

type FullCommandDeck = Awaited<ReturnType<typeof getCommandDeckBundle>>;
// bscComparison 仅供指挥舱 UI 使用，panorama 构建器不消费它 → 设为可选，避免既有测试 mock 失效。
type CommandDeck = Omit<FullCommandDeck, "bscComparison" | "bsc"> & Partial<Pick<FullCommandDeck, "bscComparison" | "bsc">>;

export interface ScrSummary {
  situation: string;
  complication: string;
  resolution: string;
}

export interface AlertItem {
  id: string;
  severity: "critical" | "warning";
  message: string;
}

export interface IssueTreeNode {
  id: string;
  label: string;
  children?: IssueTreeNode[];
}

export interface DecisionItem {
  id: string;
  title: string;
  owner?: string;
  deadline?: string;
  status: "open" | "pending" | "closed";
}

export interface McKinseyReview {
  scr: ScrSummary;
  implications: string[];
  decisions: DecisionItem[];
  issueTree: IssueTreeNode[];
}

export function buildScrSummary(deck: CommandDeck): ScrSummary {
  const assertion = deck.assertions.find((a) => a.active);
  const top = topDiffs(deck.stratDiffs, 1)[0];
  const runway = deck.fpa.cashRunwayMonths;

  const complicationParts = [
    runway < 3 ? `Runway ${runway} 月` : null,
    assertion?.message,
    top ? top.title : null,
  ].filter(Boolean);

  return {
    situation: deck.diagnosis.challengeStatement,
    complication:
      complicationParts.length > 0
        ? complicationParts.join(" · ")
        : "暂无硬阻断 — 关注 StratDiff 与 SPBP 情景",
    resolution: `聚焦：${deck.diagnosis.crux} · 需决策：资源投向与 CAPEX 节奏（见 CapStack / FPA 管理报表）`,
  };
}

export function buildTopAlerts(deck: CommandDeck, limit = 3): AlertItem[] {
  const items: AlertItem[] = [];

  if (deck.fpa.cashRunwayMonths < 3) {
    items.push({
      id: "runway",
      severity: "critical",
      message: `现金 runway ${deck.fpa.cashRunwayMonths} 月 — 低于 3 月阈值`,
    });
  }

  for (const a of deck.assertions.filter((x) => x.active)) {
    if (items.length >= limit) break;
    items.push({
      id: a.id,
      severity: "critical",
      message: a.message,
    });
  }

  for (const d of topDiffs(deck.stratDiffs, limit)) {
    if (items.length >= limit) break;
    if (items.some((i) => i.message === d.title)) continue;
    items.push({
      id: d.title,
      severity: d.severity === "critical" || d.severity === "high" ? "critical" : "warning",
      message: d.title,
    });
  }

  return items.slice(0, limit);
}

export function buildIssueTree(deck: CommandDeck): IssueTreeNode[] {
  const diffs = topDiffs(deck.stratDiffs, 4);
  const fpaBranch: IssueTreeNode = {
    id: "fpa",
    label: "财务与 runway",
    children: deck.fpa.cashRunwayMonths < 3
      ? [{ id: "runway", label: `Runway ${deck.fpa.cashRunwayMonths} 月 · 低于阈值` }]
      : [{ id: "fpa-ok", label: "Runway 在控 · 关注 ROS/EBITDA 偏差" }],
  };
  const executionBranch: IssueTreeNode = {
    id: "execution",
    label: "执行与版本变化",
    children: diffs.length
      ? diffs.map((d, i) => ({ id: `diff-${i}`, label: d.title }))
      : [{ id: "exec-ok", label: "无 critical StratDiff" }],
  };
  const strategyBranch: IssueTreeNode = {
    id: "strategy",
    label: "战略焦点",
    children: [
      { id: "crux", label: deck.diagnosis.crux },
      {
        id: "horizons",
        label: `三层面 H1 ${deck.capStack.byHorizon.H1}% · H2 ${deck.capStack.byHorizon.H2}% · H3 ${deck.capStack.byHorizon.H3}%`,
      },
    ],
  };
  return [fpaBranch, executionBranch, strategyBranch];
}

export function buildImplications(deck: CommandDeck): string[] {
  const items: string[] = [];
  const mgmt = deck.managementReport.kpis;
  const rosGap = mgmt.rosActual - mgmt.rosBudget;

  if (deck.fpa.cashRunwayMonths < 3) {
    items.push("Runway 低于 3 月 → 优先冻结非 H1 CAPEX，SPBP 情景向悲观倾斜");
  }
  if (rosGap < -0.005) {
    items.push(
      `ROS 低于预算 ${(Math.abs(rosGap) * 100).toFixed(1)}pp → 复盘 GtmStack 覆盖与价格策略后再扩 CAPEX`
    );
  }
  const top = topDiffs(deck.stratDiffs, 1)[0];
  if (top) {
    items.push(`StratDiff「${top.title}」→ 纳入下版 deliberate 或版本快照议题`);
  }
  if (items.length === 0) {
    items.push(`Crux「${deck.diagnosis.crux}」仍为资源配置主轴 — 维持三栈 H1 倾斜`);
  }
  return items.slice(0, 4);
}

export function buildDecisionItems(deck: CommandDeck): DecisionItem[] {
  const items: DecisionItem[] = [];

  // 红线突破 → 自动生成决策项（补上"治理→动作"的执行出口，每维一项，最高优先）。
  if (deck.bscComparison?.anyBreached) {
    for (const d of deck.bscComparison.dims) {
      const breach = d.thresholds.find((t) => t.breached);
      if (!breach) continue;
      items.push({
        id: `dec-redline-${d.key}`,
        title: `红线突破 · ${d.dim}：${breach.statement}（叫停 / 绩效处理）`,
        owner: `${d.dim}负责人 · 战略会`,
        deadline: "立即",
        status: "open",
      });
    }
  }

  if (deck.fpa.cashRunwayMonths < 3) {
    items.push({
      id: "dec-runway",
      title: "批准 H2/H3 CAPEX 冻结或分期",
      owner: "CFO · CapStack",
      deadline: "本季末",
      status: "open",
    });
  }

  items.push({
    id: "dec-crux",
    title: `确认 Crux 资源包：${deck.diagnosis.crux}`,
    owner: "CEO · 战略会",
    deadline: deck.diagnosis.period,
    status: "pending",
  });

  const criticalDiff = topDiffs(deck.stratDiffs, 1).find(
    (d) => d.severity === "critical" || d.severity === "high"
  );
  if (criticalDiff) {
    items.push({
      id: "dec-diff",
      title: `回应 StratDiff：${criticalDiff.title}`,
      owner: "职能 VP",
      deadline: "30 天内",
      status: "open",
    });
  }

  return items.slice(0, 4);
}

export function buildMcKinseyReview(deck: CommandDeck): McKinseyReview {
  return {
    scr: buildScrSummary(deck),
    implications: buildImplications(deck),
    decisions: buildDecisionItems(deck),
    issueTree: buildIssueTree(deck),
  };
}
