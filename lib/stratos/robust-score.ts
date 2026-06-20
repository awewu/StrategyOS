import type { RobustnessDimensions } from "@/lib/types/stratos";

/** R1–R6 formal weights per SKELETON_AND_FLESH §StratRobust */
export const ROBUST_WEIGHTS: Record<keyof RobustnessDimensions, number> = {
  direction: 0.2,
  logic: 0.18,
  execution: 0.22,
  baseline: 0.2,
  doctrine: 0.12,
  learning: 0.08,
};

export const ROBUST_LABELS: Record<keyof RobustnessDimensions, string> = {
  direction: "R1 方向",
  logic: "R2 逻辑",
  execution: "R3 执行",
  baseline: "R4 底线",
  doctrine: "R5 精神",
  learning: "R6 学习",
};

export function computeRobustOverall(dims: RobustnessDimensions): number {
  const sum = (Object.keys(ROBUST_WEIGHTS) as Array<keyof RobustnessDimensions>).reduce(
    (acc, key) => acc + dims[key] * ROBUST_WEIGHTS[key],
    0
  );
  return Math.round(sum);
}
