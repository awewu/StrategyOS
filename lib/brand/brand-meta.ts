/**
 * Brand SSOT — canonical brand codes (= English brand names) and their display metadata.
 * Codes are frozen and match the Prisma `BrandCode` enum. Do not rename codes.
 * 品牌 = 渠道分层背书；产品平台才是战略主轴（见品牌战略卡讨论）。
 */
import type { BrandCode } from "@/lib/types/stratos";

export interface BrandMeta {
  code: BrandCode;
  nameZh: string;
  nameEn: string;
  /** 主渠道层级 — 品牌作为渠道属性的核心定位 */
  primaryChannel: string;
  /** 主客群/场景 */
  segments: string[];
}

export const BRAND_META: Record<BrandCode, BrandMeta> = {
  EVERHOT: {
    code: "EVERHOT",
    nameZh: "恒热",
    nameEn: "Everhot",
    primaryChannel: "工程/项目",
    segments: ["酒店", "别墅大宅", "工程配套"],
  },
  RHEEM: {
    code: "RHEEM",
    nameZh: "瑞美",
    nameEn: "Rheem",
    primaryChannel: "经销批发",
    segments: ["暖通经销商", "批发商"],
  },
  RUUD: {
    code: "RUUD",
    nameZh: "瑞德",
    nameEn: "Ruud",
    primaryChannel: "零售门店",
    segments: ["高端热泵零售"],
  },
  AUQAHART: {
    code: "AUQAHART",
    nameZh: "Auqahart",
    nameEn: "Auqahart",
    primaryChannel: "暖通渠道（水力新品类预留）",
    segments: ["水箱", "水力中心", "混水泵站"],
  },
};

export const BRAND_CODES = Object.keys(BRAND_META) as BrandCode[];

/** 渠道分层 SSOT — 住宅科技是渠道（三/四大品牌任选），不占品牌枚举。 */
export const CHANNEL_CODES = [
  { code: "engineering", label: "工程/项目" },
  { code: "wholesale", label: "经销批发" },
  { code: "retail", label: "零售门店" },
  { code: "residential_tech", label: "住宅科技" },
] as const;

export type ChannelCode = (typeof CHANNEL_CODES)[number]["code"];

export function brandNameZh(code: BrandCode): string {
  return BRAND_META[code]?.nameZh ?? code;
}

export function brandLabel(code: BrandCode): string {
  const m = BRAND_META[code];
  return m ? `${m.nameZh} ${m.nameEn}` : code;
}
