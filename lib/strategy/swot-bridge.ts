/**
 * 战略编制 SWOT ↔ 市场 SWOT 引擎的桥接（纯函数 · 可单测 · 无网络）。
 *
 * 目的：让"战略编制"的 SWOT 与"市场洞察"同源同模型——
 * 把 planSwotItem({quadrant, content, weight?, intensity?, dimension?})
 * 映射成 market 引擎的 SwotItem/SwotBoard，从而复用十字轴定位与 TOWS 推演。
 */
import type { SwotBoard, SwotCategory, SwotItem } from "@/lib/market-intel/swot";
import type { IntelDimension } from "@/lib/market-intel/types";

export interface PlanSwotInput {
  quadrant: SwotCategory;
  content: string;
  weight?: number | null;
  intensity?: number | null;
  dimension?: string | null;
}

const VALID_DIMENSIONS: IntelDimension[] = ["product", "gtm", "brand", "strategy"];

/** 1..5 量表兜底：缺省或非法 → 中位 3。 */
export function clampSwotScale(value: number | null | undefined, fallback = 3): number {
  if (value == null || !Number.isFinite(Number(value))) return fallback;
  return Math.max(1, Math.min(5, Math.round(Number(value))));
}

/** 仅接受合法情报维度，其它 → undefined。 */
export function normalizeSwotDimension(dim: string | null | undefined): IntelDimension | undefined {
  if (!dim) return undefined;
  const lower = String(dim).toLowerCase();
  return VALID_DIMENSIONS.includes(lower as IntelDimension) ? (lower as IntelDimension) : undefined;
}

/**
 * 把战略编制的 SWOT 条目归集为完整 SwotBoard。
 * - 空 content 跳过；非法象限跳过。
 * - weight/intensity 缺省取 3；dimension 仅保留合法值。
 * - 每象限按 weight×intensity 降序（与 market buildSwot 一致）。
 */
export function planSwotToBoard(items: PlanSwotInput[]): SwotBoard {
  const board: SwotBoard = { strength: [], weakness: [], opportunity: [], threat: [] };
  let index = 0;
  for (const raw of items) {
    const content = raw.content?.trim();
    if (!content) continue;
    const category = raw.quadrant;
    if (!board[category]) continue;
    const item: SwotItem = {
      id: `plan-swot-${index++}`,
      category,
      title: content,
      weight: clampSwotScale(raw.weight),
      intensity: clampSwotScale(raw.intensity),
      dimension: normalizeSwotDimension(raw.dimension),
      source: "plan",
    };
    board[category].push(item);
  }
  for (const key of ["strength", "weakness", "opportunity", "threat"] as const) {
    board[key].sort((a, b) => b.weight * b.intensity - a.weight * a.intensity);
  }
  return board;
}

export function swotBoardItemCount(board: SwotBoard): number {
  return board.strength.length + board.weakness.length + board.opportunity.length + board.threat.length;
}
