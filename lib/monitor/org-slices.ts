/** N-1 org slices — aligned with prisma/seed-orgs.ts EXECUTIVE units
 *  · 职能体系 = 研发 / CMO / 品牌 / HR / 财务（含品牌事业部）
 *  · 事业部   = 运营 BU only（空调 / 热水 / BD / 制造）
 */

export type OrgSlice = {
  id: string;
  label: string;
  keywords: string[];
};

export const FUNCTION_SLICES: OrgSlice[] = [
  { id: "org-exec-rd", label: "研发中心", keywords: ["研发", "R&D", "产品开发", "核心技术", "TRL", "V4", "热泵"] },
  { id: "org-exec-cmo", label: "CMO", keywords: ["CMO", "市场", "品牌", "渠道", "GTM", "营销"] },
  { id: "org-exec-brand", label: "品牌事业部", keywords: ["品牌事业部", "Keller", "RUUD", "EVERHOT", "RHEEM", "AUQAHART"] },
  { id: "org-exec-hr", label: "HR", keywords: ["HR", "人力", "人才", "组织"] },
  { id: "org-exec-finance", label: "财务", keywords: ["财务", "FPA", "FP&A", "资本", "IC", "CAPEX", "陈静"] },
];

export const BU_SLICES: OrgSlice[] = [
  { id: "org-exec-ac", label: "空调事业部", keywords: ["空调", "商用空调", "家用空调"] },
  { id: "org-exec-hw", label: "热水事业部", keywords: ["热水", "热泵", "储水", "张健", "李伟"] },
  { id: "org-exec-bd", label: "BD事业部", keywords: ["BD", "商务拓展", "战略合作", "大客户", "渠道拓展", "项目投标"] },
  { id: "org-exec-mfg", label: "制造事业部", keywords: ["制造", "供应链", "质量", "产能"] },
];

export function getSliceById(id: string | undefined, kind: "function" | "bu"): OrgSlice {
  const list = kind === "function" ? FUNCTION_SLICES : BU_SLICES;
  return list.find((s) => s.id === id) ?? list[0]!;
}

export function getSliceByIdGlobal(
  id: string | undefined,
): { slice: OrgSlice; kind: "function" | "bu" } | null {
  if (!id) return null;
  const fn = FUNCTION_SLICES.find((s) => s.id === id);
  if (fn) return { slice: fn, kind: "function" };
  const bu = BU_SLICES.find((s) => s.id === id);
  if (bu) return { slice: bu, kind: "bu" };
  return null;
}

export function textMatchesSlice(text: string, slice: OrgSlice): boolean {
  return slice.keywords.some((k) => text.toLowerCase().includes(k.toLowerCase()) || text.includes(k));
}

export function filterBySlice<T>(
  items: T[],
  slice: OrgSlice,
  getters: ((item: T) => string | null | undefined)[],
): T[] {
  return items.filter((item) =>
    getters.some((g) => {
      const v = g(item);
      return v ? textMatchesSlice(v, slice) : false;
    }),
  );
}
