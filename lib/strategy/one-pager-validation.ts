import type { ChinaStrategySummaryData, StrategySubmodule } from "./china-strategy-summary";

export type OnePagerValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function filledModules(data: ChinaStrategySummaryData): StrategySubmodule[] {
  const all = [...data.leftModules, ...data.middleModules, ...data.rightModules];
  return all.filter((m) => m.content.trim().length > 0);
}

export function validateOnePagerBeforeApprove(data: ChinaStrategySummaryData): OnePagerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.periodLabel.trim()) {
    errors.push("右栏标题括号内请填写战略周期（如 2020-2025）");
  }

  const filled = filledModules(data);
  if (filled.length < 5) {
    errors.push(`至少填写 5/9 个子模块内容（当前 ${filled.length} 个）`);
  } else if (filled.length < 9) {
    warnings.push(`${9 - filled.length} 个子模块仍为空，建议补全后再审批`);
  }

  if (!data.title.trim()) {
    warnings.push("页标题为空，审批后将显示默认标题「战略汇总」");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export type ModuleDiff = {
  moduleId: string;
  label: string;
  changed: boolean;
  before: string;
  after: string;
};

export type OnePagerDiff = {
  summary: string;
  changedModules: ModuleDiff[];
  periodChanged: boolean;
  periodBefore: string;
  periodAfter: string;
  titleChanged: boolean;
};

function moduleLabel(m: StrategySubmodule): string {
  const zh = m.titleZh?.trim();
  return zh ? `${m.title} / ${zh}` : m.title || m.id;
}

export function diffOnePagerContent(
  before: ChinaStrategySummaryData,
  after: ChinaStrategySummaryData
): OnePagerDiff {
  const allBefore = [
    ...before.leftModules,
    ...before.middleModules,
    ...before.rightModules,
  ];
  const allAfter = [...after.leftModules, ...after.middleModules, ...after.rightModules];

  const changedModules: ModuleDiff[] = [];

  for (const a of allAfter) {
    const b = allBefore.find((x) => x.id === a.id);
    const beforeText = b?.content.trim() ?? "";
    const afterText = a.content.trim();
    if (beforeText !== afterText) {
      changedModules.push({
        moduleId: a.id,
        label: moduleLabel(a),
        changed: true,
        before: beforeText,
        after: afterText,
      });
    }
  }

  const periodChanged = before.periodLabel.trim() !== after.periodLabel.trim();
  const titleChanged = before.title.trim() !== after.title.trim();

  const parts: string[] = [];
  if (changedModules.length) parts.push(`${changedModules.length} 个子模块内容变更`);
  if (periodChanged) parts.push("战略周期变更");
  if (titleChanged) parts.push("页标题变更");

  return {
    summary: parts.length ? parts.join("；") : "无内容变更",
    changedModules,
    periodChanged,
    periodBefore: before.periodLabel,
    periodAfter: after.periodLabel,
    titleChanged,
  };
}

export type OnePagerRevision = {
  id: string;
  action: "draft_save" | "approve" | "revise";
  actor: string | null;
  diff: OnePagerDiff | null;
  content: ChinaStrategySummaryData;
  createdAt: string;
};
