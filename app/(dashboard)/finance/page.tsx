import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth/guard";
import { FpaEditor } from "@/components/finance/FpaEditor";
import { CapitalTab } from "@/components/finance/CapitalTab";
import { FiveYearForecast, SensitivityPanel } from "@/components/finance/FiveYearForecast";
import {
  BalanceSheetPanel,
  CashFlowStatementPanel,
  IncomeStatementPanel,
} from "@/components/finance/FinancialStatements";
import { MaPipelinePanel } from "@/components/finance/MaPipelinePanel";
import { ManagementReportPanel } from "@/components/finance/ManagementReportPanel";
import { PostInvestPanel, RealOptionsPanel } from "@/components/finance/RealOptionsPanel";
import { SpbpLivePanel } from "@/components/finance/SpbpLivePanel";
import { StacksEditor } from "@/components/stacks/StacksEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { StratosTabNav } from "@/components/ui/StratosTabNav";
import { getFinanceBundle } from "@/lib/data/strategy-data";
import { getStacksBundle } from "@/lib/stacks/data-access";

type FinanceTab =
  | "management"
  | "statements"
  | "overview"
  | "capital"
  | "forecast"
  | "scenarios"
  | "ma";

export default function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return <FinanceContent tabPromise={searchParams} />;
}

async function FinanceContent({
  tabPromise,
}: {
  tabPromise: Promise<{ tab?: string }>;
}) {
  await requireRouteAccess("/finance");
  const { tab } = await tabPromise;
  const activeTab = parseTab(tab);
  const data = await getFinanceBundle();
  const stacks = await getStacksBundle();
  const report = data.managementReport;

  const tabs = [
    { href: "/finance", label: "管理报表", active: activeTab === "management" },
    { href: "/finance?tab=statements", label: "三张表", active: activeTab === "statements" },
    { href: "/finance?tab=overview", label: "B-A-F 总览", active: activeTab === "overview" },
    { href: "/finance?tab=capital", label: "资本配置", active: activeTab === "capital" },
    { href: "/finance?tab=forecast", label: "5 年展望", active: activeTab === "forecast" },
    { href: "/finance?tab=scenarios", label: "SPBP 情景", active: activeTab === "scenarios" },
    { href: "/finance?tab=ma", label: "M&A 管道", active: activeTab === "ma" },
  ];

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="ROS · EBITDA · 利润桥"
        title="FPA 财务"
        subtitle={`管理报表优先 · 数据源 ${data.source === "database" ? "DB" : "Demo"}`}
        actions={
          <Link href="/health" className="stratos-btn stratos-btn--ghost text-xs">
            集团健康
          </Link>
        }
      />

      <StratosTabNav tabs={tabs} />

      {activeTab === "management" && <ManagementReportPanel report={report} />}

      {activeTab === "statements" && (
        <div className="stratos-section-gap flex flex-col">
          <IncomeStatementPanel statement={report.incomeStatement} />
          <BalanceSheetPanel sheet={report.balanceSheet} />
          <CashFlowStatementPanel statement={report.cashFlowStatement} />
        </div>
      )}

      {activeTab === "overview" && <FpaEditor initial={data.fpa} source={data.source} />}

      {activeTab === "capital" && (
        <div className="stratos-section-gap flex flex-col">
          <StacksEditor
            initialCapStack={stacks.capStack}
            initialIcs={stacks.investmentCases}
            initialProductBets={stacks.productBets}
            initialGtmBets={stacks.gtmBets}
            source={stacks.source}
          />
          <CapitalTab
            capStack={data.capStack}
            capacity={data.capacity}
            investmentCases={data.investmentCases}
          />
          <RealOptionsPanel options={data.realOptions} />
          <PostInvestPanel deviations={data.postInvestDeviations} />
        </div>
      )}

      {activeTab === "forecast" && (
        <div className="stratos-section-gap flex flex-col">
          <FiveYearForecast rows={data.fiveYearForecast} />
          <SensitivityPanel drivers={data.sensitivityDrivers} />
        </div>
      )}

      {activeTab === "scenarios" && <SpbpLivePanel initialScenarios={data.spbpScenarios} />}

      {activeTab === "ma" && <MaPipelinePanel items={data.maPipeline} />}
    </div>
  );
}

function parseTab(tab?: string): FinanceTab {
  const allowed: FinanceTab[] = [
    "management",
    "statements",
    "overview",
    "capital",
    "forecast",
    "scenarios",
    "ma",
  ];
  if (tab && allowed.includes(tab as FinanceTab)) return tab as FinanceTab;
  return "management";
}
