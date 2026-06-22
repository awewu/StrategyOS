import { dbAvailable } from "@/lib/db";
import { getDataSource, type DataSource } from "@/lib/data/strategy-data";
import { getActiveStrategicPlan, hasPlanContent } from "@/lib/data/strategic-plan-data";

export async function resolveDataTrust(): Promise<{
  source: DataSource;
  label: string;
  isDemo: boolean;
}> {
  const source = await getDataSource();
  const db = await dbAvailable();
  if (!db) {
    return { source: "demo", label: "演示模式 — 仅彩排，数据不可用于决策", isDemo: true };
  }
  const { plan } = await getActiveStrategicPlan();
  if (plan && hasPlanContent(plan)) {
    return {
      source: "database",
      label: "数据源：战略计划（数据库）· compass / input / decode 同源",
      isDemo: false,
    };
  }
  if (source === "database") {
    return { source: "database", label: "数据源：数据库", isDemo: false };
  }
  return { source: "demo", label: "演示回退 — 部分表为空，请导入或 seed", isDemo: true };
}
