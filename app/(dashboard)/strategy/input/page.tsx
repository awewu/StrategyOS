import { StrategyInputClient } from "@/components/strategy/StrategyInputClient";
import { prisma } from "@/lib/db";

export default async function StrategyInputPage() {
  const orgUnits = await prisma.orgUnit.findMany({
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    include: { children: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">战略录入</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          集团 · 高管层 · 执行层 三级战略规划录入与提交
        </p>
      </div>
      <StrategyInputClient orgUnits={orgUnits} />
    </div>
  );
}
