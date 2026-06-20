import { BafBar } from "@/components/finance/BafBar";
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
import { getFinanceBundle } from "@/lib/data/strategy-data";

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
  const { tab } = await tabPromise;
  const activeTab = parseTab(tab);
  const data = await getFinanceBundle();
  const report = data.managementReport;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-accent-gold)]">FPA 财务</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          管理报表优先 · ROS / EBITDA / 利润桥 · 财务三张表 · 数据源{" "}
          {data.source === "database" ? "DB" : "Demo"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-black/10">
        <TabLink href="/finance" active={activeTab === "management"}>
          管理报表 ★
        </TabLink>
        <TabLink href="/finance?tab=statements" active={activeTab === "statements"}>
          三张表
        </TabLink>
        <TabLink href="/finance?tab=overview" active={activeTab === "overview"}>
          B-A-F 总览
        </TabLink>
        <TabLink href="/finance?tab=capital" active={activeTab === "capital"}>
          资本配置
        </TabLink>
        <TabLink href="/finance?tab=forecast" active={activeTab === "forecast"}>
          5 年展望
        </TabLink>
        <TabLink href="/finance?tab=scenarios" active={activeTab === "scenarios"}>
          SPBP 情景
        </TabLink>
        <TabLink href="/finance?tab=ma" active={activeTab === "ma"}>
          M&A 管道
        </TabLink>
      </div>

      {activeTab === "management" && <ManagementReportPanel report={report} />}

      {activeTab === "statements" && (
        <div className="space-y-6">
          <IncomeStatementPanel statement={report.incomeStatement} />
          <BalanceSheetPanel sheet={report.balanceSheet} />
          <CashFlowStatementPanel statement={report.cashFlowStatement} />
        </div>
      )}

      {activeTab === "overview" && <BafBar fpa={data.fpa} />}

      {activeTab === "capital" && (
        <div className="space-y-6">
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
        <div className="space-y-6">
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

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`border-b-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "border-[var(--color-accent)] text-[var(--color-accent)]"
          : "border-transparent text-[#828c8d] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {children}
    </a>
  );
}
