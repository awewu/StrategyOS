import { dbAvailable, prisma } from "@/lib/db";
import {
  gateChecklists as staticChecklists,
  type GateChecklist,
  type GateItem,
  type GateStatus,
} from "@/lib/gates/checklists";
import { CURRENT_PERIOD } from "@/lib/stratos-demo-data";

const DEFAULT_PERIOD = CURRENT_PERIOD;
const STATUSES: GateStatus[] = ["pass", "fail", "partial"];

async function seedGateIfEmpty(period: string): Promise<void> {
  const n = await prisma.gateChecklistItem.count({ where: { period } });
  if (n > 0) return;
  const data: {
    period: string;
    checklistId: string;
    itemId: string;
    label: string;
    status: string;
    note: string | null;
    sortOrder: number;
  }[] = [];
  let order = 0;
  for (const cl of staticChecklists) {
    for (const item of cl.items) {
      data.push({
        period,
        checklistId: cl.id,
        itemId: item.id,
        label: item.label,
        status: item.status,
        note: item.note ?? null,
        sortOrder: order++,
      });
    }
  }
  await prisma.gateChecklistItem.createMany({ data });
}

function mergeChecklists(rows: {
  checklistId: string;
  itemId: string;
  label: string;
  status: string;
  note: string | null;
}[]): GateChecklist[] {
  return staticChecklists.map((cl) => {
    const items: GateItem[] = cl.items.map((staticItem) => {
      const row = rows.find((r) => r.checklistId === cl.id && r.itemId === staticItem.id);
      if (!row) return staticItem;
      return {
        id: row.itemId,
        label: row.label || staticItem.label,
        status: row.status as GateStatus,
        note: row.note ?? undefined,
      };
    });
    return { ...cl, items };
  });
}

export async function getGateChecklists(period = DEFAULT_PERIOD): Promise<{
  checklists: GateChecklist[];
  source: "database" | "demo";
}> {
  if (!(await dbAvailable())) {
    return { checklists: staticChecklists, source: "demo" };
  }
  try {
    await seedGateIfEmpty(period);
    const rows = await prisma.gateChecklistItem.findMany({
      where: { period },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return { checklists: staticChecklists, source: "demo" };
    return { checklists: mergeChecklists(rows), source: "database" };
  } catch {
    return { checklists: staticChecklists, source: "demo" };
  }
}

export async function saveGateChecklists(
  checklists: GateChecklist[],
  period = DEFAULT_PERIOD,
): Promise<{ count: number }> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 Gate");
  const data: {
    period: string;
    checklistId: string;
    itemId: string;
    label: string;
    status: string;
    note: string | null;
    sortOrder: number;
  }[] = [];
  let order = 0;
  for (const cl of checklists) {
    for (const item of cl.items) {
      if (!STATUSES.includes(item.status)) {
        throw new Error(`Gate 状态须为 pass / fail / partial`);
      }
      data.push({
        period,
        checklistId: cl.id,
        itemId: item.id,
        label: item.label.trim(),
        status: item.status,
        note: item.note?.trim() || null,
        sortOrder: order++,
      });
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.gateChecklistItem.deleteMany({ where: { period } });
    await tx.gateChecklistItem.createMany({ data });
  });
  return { count: data.length };
}

export function getGatePeriod(): string {
  return DEFAULT_PERIOD;
}

export function gateSummaryFrom(checklists: GateChecklist[]): {
  pass: number;
  fail: number;
  partial: number;
} {
  let pass = 0;
  let fail = 0;
  let partial = 0;
  for (const g of checklists) {
    for (const i of g.items) {
      if (i.status === "pass") pass++;
      else if (i.status === "fail") fail++;
      else partial++;
    }
  }
  return { pass, fail, partial };
}
