import { dbAvailable, prisma } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { MaPipelineItem } from "@/lib/types/stratos";

export async function getMaPipelineEditable(period = demo.CURRENT_PERIOD): Promise<{
  items: MaPipelineItem[];
  source: "database" | "demo";
}> {
  if (!(await dbAvailable())) {
    return { items: demo.maPipeline, source: "demo" };
  }
  const rows = await prisma.maPipelineItem.findMany({ where: { period }, orderBy: { stage: "asc" } });
  if (rows.length === 0) {
    return { items: demo.maPipeline, source: "demo" };
  }
  return {
    items: rows.map(mapRow),
    source: "database",
  };
}

function mapRow(r: {
  id: string;
  name: string;
  direction: MaPipelineItem["direction"];
  stage: MaPipelineItem["stage"];
  synergyThesis: string;
  valuationRange: string;
  linkedAssumptionCodes: string[];
  integrationMilestone100d: string | null;
}): MaPipelineItem {
  return {
    id: r.id,
    name: r.name,
    direction: r.direction,
    stage: r.stage,
    synergyThesis: r.synergyThesis,
    valuationRange: r.valuationRange,
    linkedAssumptionCodes: r.linkedAssumptionCodes,
    integrationMilestone100d: r.integrationMilestone100d ?? undefined,
  };
}

export async function saveMaPipelineItems(
  items: MaPipelineItem[],
  period = demo.CURRENT_PERIOD,
): Promise<MaPipelineItem[]> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 M&A 管道");
  const saved: MaPipelineItem[] = [];
  for (const item of items) {
    if (!item.name.trim()) throw new Error("项目名称不能为空");
    const data = {
      name: item.name,
      direction: item.direction,
      stage: item.stage,
      synergyThesis: item.synergyThesis,
      valuationRange: item.valuationRange,
      linkedAssumptionCodes: item.linkedAssumptionCodes,
      integrationMilestone100d: item.integrationMilestone100d ?? null,
      period,
    };
    if (item.id && !item.id.startsWith("new-")) {
      const row = await prisma.maPipelineItem.update({ where: { id: item.id }, data });
      saved.push(mapRow(row));
    } else {
      const row = await prisma.maPipelineItem.create({ data });
      saved.push(mapRow(row));
    }
  }
  return saved;
}
