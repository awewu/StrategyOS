import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { PostInvestDeviation, RealOptionTag } from "@/lib/types/stratos";

export type CapitalConfigBundle = {
  realOptions: RealOptionTag[];
  postInvestDeviations: PostInvestDeviation[];
  source: "database" | "demo";
};

function defaultCapitalConfig(): Omit<CapitalConfigBundle, "source"> {
  return {
    realOptions: demo.realOptions,
    postInvestDeviations: demo.postInvestDeviations,
  };
}

export function parseCapitalConfigJson(
  realOptionsJson: unknown,
  postInvestDeviationsJson: unknown,
): Omit<CapitalConfigBundle, "source"> {
  const realOptions = realOptionsJson as RealOptionTag[];
  const postInvestDeviations = postInvestDeviationsJson as PostInvestDeviation[];
  if (!Array.isArray(realOptions) || !Array.isArray(postInvestDeviations)) {
    throw new Error("资本配置数据格式无效");
  }
  return { realOptions, postInvestDeviations };
}

async function seedCapitalConfigIfEmpty(period: string): Promise<void> {
  const existing = await prisma.strategicCapitalConfig.findUnique({ where: { period } });
  if (existing) return;
  const d = defaultCapitalConfig();
  await prisma.strategicCapitalConfig.create({
    data: {
      period,
      realOptionsJson: asDbJson(d.realOptions),
      postInvestDeviationsJson: asDbJson(d.postInvestDeviations),
    },
  });
}

export async function getCapitalConfig(period = demo.CURRENT_PERIOD): Promise<CapitalConfigBundle> {
  const fallback = { ...defaultCapitalConfig(), source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    await seedCapitalConfigIfEmpty(period);
    const row = await prisma.strategicCapitalConfig.findUnique({ where: { period } });
    if (!row) return fallback;
    const parsed = parseCapitalConfigJson(row.realOptionsJson, row.postInvestDeviationsJson);
    return { ...parsed, source: "database" as const };
  }, fallback);
}

export async function saveCapitalConfig(
  payload: { realOptions: RealOptionTag[]; postInvestDeviations: PostInvestDeviation[] },
  period = demo.CURRENT_PERIOD,
): Promise<CapitalConfigBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存资本配置");
  await seedCapitalConfigIfEmpty(period);
  const row = await prisma.strategicCapitalConfig.findUnique({ where: { period } });
  if (!row) throw new Error("资本配置记录未找到");

  for (const o of payload.realOptions) {
    if (!o.icCode?.trim() || !o.title?.trim()) throw new Error("实物期权 IC 编号与标题不能为空");
  }
  for (const d of payload.postInvestDeviations) {
    if (!d.icCode?.trim() || !d.title?.trim()) throw new Error("投后偏离 IC 编号与标题不能为空");
  }

  await prisma.strategicCapitalConfig.update({
    where: { id: row.id },
    data: {
      realOptionsJson: asDbJson(payload.realOptions),
      postInvestDeviationsJson: asDbJson(payload.postInvestDeviations),
    },
  });
  return { ...payload, source: "database" };
}
