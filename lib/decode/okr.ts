/**
 * OKR 纯逻辑：TTI（Target to Improve）打分。
 *
 * 语义（与 BSC 的本质区别）：
 * - BSC 记"状态"（value vs threshold → 灯），坐标系是组织解剖面，求全
 * - OKR 记"改进量"（baseline → target，current 打分），坐标系是战略主攻方向，刻意不平衡
 * - KR 是先导指标：本周期可干预；行动放承诺账本，KR 只存结果
 */

export type TtiScore = {
  /** 0–1 进度；无法数字化时为 null（按二值 done/not 处理） */
  progress: number | null;
  /** 数字三元组是否完备 */
  numeric: boolean;
};

export function parseTtiNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[,，\s%万台家个月]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * TTI 打分：progress = (current − baseline) / (target − baseline)，截断到 [0, 1.2]。
 * baseline 缺省按 0（"从无到有"型 KR）。target 与 baseline 相等视为不可打分。
 */
export function ttiScore(
  baseline: string | null | undefined,
  target: string | null | undefined,
  current: string | null | undefined,
): TtiScore {
  const t = parseTtiNumber(target);
  if (t == null) return { progress: null, numeric: false };
  const b = parseTtiNumber(baseline) ?? 0;
  if (t === b) return { progress: null, numeric: false };
  const c = parseTtiNumber(current);
  if (c == null) return { progress: 0, numeric: true };
  const p = (c - b) / (t - b);
  return { progress: Math.max(0, Math.min(1.2, p)), numeric: true };
}

/** OKR 张力约定：0.7 即成功；1.0 说明目标定保守了 */
export function ttiTone(progress: number | null): "green" | "yellow" | "red" | "neutral" {
  if (progress == null) return "neutral";
  if (progress >= 0.7) return "green";
  if (progress >= 0.4) return "yellow";
  return "red";
}

export type OkrKeyResult = {
  id: string;
  title: string;
  baselineValue: string | null;
  targetValue: string | null;
  currentValue: string | null;
  unit: string | null;
  confidence: number | null;
  isLeadingIndicator: boolean;
  commitmentCount: number;
};

export type OkrObjective = {
  id: string;
  title: string;
  intent: string | null;
  ownerName: string | null;
  hoshinEntryId: string | null;
  hoshinLabel: string | null;
  sortOrder: number;
  keyResults: OkrKeyResult[];
};

/** O 的综合进度 = KR 数字进度均值（不可打分的 KR 不计入） */
export function objectiveProgress(o: Pick<OkrObjective, "keyResults">): number | null {
  const scores = o.keyResults
    .map((kr) => ttiScore(kr.baselineValue, kr.targetValue, kr.currentValue))
    .filter((s): s is TtiScore & { progress: number } => s.progress != null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + Math.min(1, s.progress), 0) / scores.length;
}
