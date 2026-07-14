import Link from "next/link";
import { logUsageEvent } from "@/lib/audit/log-event";
import { requireRouteAccess } from "@/lib/auth/guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StratosTabNav } from "@/components/ui/StratosTabNav";
import { LedgerPanels, type LedgerTab } from "@/components/finance/LedgerPanels";
import { getLedgerBundle } from "@/lib/finance/ledger-queries";
import { BudgetVersionsPanel } from "@/components/finance/BudgetVersionsPanel";
import { listBudgetVersions } from "@/lib/finance/budget-versions";

const TABS: { id: LedgerTab; label: string }[] = [
  { id: "overview", label: "总览 · 批次" },
  { id: "tb", label: "试算平衡" },
  { id: "gl", label: "GL 明细" },
  { id: "facts", label: "情景事实" },
  { id: "bridge", label: "利润桥" },
  { id: "pvi", label: "PVI 新品" },
  { id: "budget", label: "预算版本" },
  { id: "accounts", label: "科目映射" },
  { id: "depts", label: "部门映射" },
  { id: "ops", label: "运营指标" },
];

function parseTab(raw: string | undefined): LedgerTab {
  return (TABS.find((t) => t.id === raw)?.id ?? "overview") as LedgerTab;
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string; q?: string }>;
}) {
  await requireRouteAccess("/finance");
  const params = await searchParams;
  const activeTab = parseTab(params.tab);
  const q = params.q?.trim() || undefined;
  await logUsageEvent({ action: "fpa_view", resource: `/finance/ledger?tab=${activeTab}` });
  const bundle = await getLedgerBundle({ period: params.period, q });
  const budgetVersions = activeTab === "budget" ? await listBudgetVersions() : [];

  const query = (tab: LedgerTab) => {
    const sp = new URLSearchParams({ tab });
    if (params.period) sp.set("period", params.period);
    if (q) sp.set("q", q);
    return `/finance/ledger?${sp.toString()}`;
  };

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="Ledger Hub · 中→美映射 · OneStream"
        title="总账中台"
        subtitle={`科目/部门映射 · 试算平衡 · GL 明细 · 运营事实 · 数据源 ${bundle.available ? "DB" : "不可用"}`}
        actions={
          <Link href="/finance" className="stratos-btn stratos-btn--ghost text-xs">
            返回 FPA
          </Link>
        }
      />

      <StratosTabNav tabs={TABS.map((t) => ({ href: query(t.id), label: t.label, active: activeTab === t.id }))} />

      {bundle.available && activeTab === "budget" ? (
        <BudgetVersionsPanel initial={budgetVersions} />
      ) : bundle.available ? (
        <LedgerPanels tab={activeTab} bundle={bundle} q={q} period={params.period} />
      ) : (
        <div className="stratos-card stratos-card--padded text-sm">
          数据库不可用。启动 Postgres 后运行 <code>npx tsx scripts/import-onestream.ts</code> 导入总账数据。
        </div>
      )}
    </div>
  );
}
