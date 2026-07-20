/**
 * BSC 维度分类学 —— 单一真相（P2-1）。
 *
 * 此前四维的 key / enum / 中文标签 / 颜色 / 互转映射散落在 ≥5 处
 * (bsc-comparison, bsc-comparison-data, entity-getters, strategic-plan-data, BscTargetsBoard)，
 * 极易漂移。本模块收敛为唯一定义，所有消费方从此处引入。
 */

/** 指挥舱/健康层使用的小写 key。 */
export type BscDimKey = "financial" | "customer" | "process" | "learning";
/** 计划/Prisma 使用的大写枚举（= Prisma BscDimension）。 */
export type BscDimEnum = "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING";

export interface BscDimMeta {
  key: BscDimKey;
  enum: BscDimEnum;
  label: string;
  color: string;
}

export const BSC_DIMENSIONS: readonly BscDimMeta[] = [
  { key: "financial", enum: "FINANCIAL", label: "财务", color: "var(--bsc-financial)" },
  { key: "customer", enum: "CUSTOMER", label: "客户", color: "var(--bsc-customer)" },
  { key: "process", enum: "PROCESS", label: "流程", color: "var(--bsc-process)" },
  { key: "learning", enum: "LEARNING", label: "学习", color: "var(--bsc-learning)" },
] as const;

export const BSC_DIM_KEYS: BscDimKey[] = BSC_DIMENSIONS.map((d) => d.key);
export const BSC_DIM_ENUMS: BscDimEnum[] = BSC_DIMENSIONS.map((d) => d.enum);

export const BSC_DIM_LABEL: Record<BscDimKey, string> = Object.fromEntries(
  BSC_DIMENSIONS.map((d) => [d.key, d.label]),
) as Record<BscDimKey, string>;

export const BSC_ENUM_LABEL: Record<BscDimEnum, string> = Object.fromEntries(
  BSC_DIMENSIONS.map((d) => [d.enum, d.label]),
) as Record<BscDimEnum, string>;

const KEY_BY_ENUM = new Map<BscDimEnum, BscDimKey>(BSC_DIMENSIONS.map((d) => [d.enum, d.key]));
const ENUM_BY_KEY = new Map<BscDimKey, BscDimEnum>(BSC_DIMENSIONS.map((d) => [d.key, d.enum]));

export function keyToEnum(key: BscDimKey): BscDimEnum {
  return ENUM_BY_KEY.get(key)!;
}

export function enumToKey(dim: BscDimEnum): BscDimKey {
  return KEY_BY_ENUM.get(dim)!;
}

/**
 * 从任意上游表示解析为标准 key：
 * 支持 key(financial) / enum(FINANCIAL) / 中文标签(财务) / 含关键词的自由字符串。
 * 无法识别返回 null（宁缺毋滥）。
 */
export function toBscDimKey(raw: string | null | undefined): BscDimKey | null {
  if (raw == null) return null;
  const s = String(raw).toLowerCase().trim();
  if (!s) return null;
  if (s.includes("financ") || s.includes("财务")) return "financial";
  if (s.includes("customer") || s.includes("客户")) return "customer";
  if (s.includes("process") || s.includes("流程")) return "process";
  if (s.includes("learn") || s.includes("学习")) return "learning";
  return null;
}

/** 标签/自由字符串 → 大写枚举。 */
export function toBscDimEnum(raw: string | null | undefined): BscDimEnum | null {
  const key = toBscDimKey(raw);
  return key ? keyToEnum(key) : null;
}
