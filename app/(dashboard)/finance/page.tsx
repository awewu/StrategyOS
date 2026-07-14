import Link from "next/link";
import { redirect } from "next/navigation";
import { logUsageEvent } from "@/lib/audit/log-event";
import { requireRouteAccess } from "@/lib/auth/guard";
import { CapitalConfigEditor } from "@/components/finance/CapitalConfigEditor";
import { FpaEditor } from "@/components/finance/FpaEditor";
import { OutlookEditor } from "@/components/finance/OutlookEditor";
import { FinancialStatementsEditor } from "@/components/finance/FinancialStatementsEditor";
import { ManagementReportEditor } from "@/components/finance/ManagementReportEditor";
import { CapitalTab } from "@/components/finance/CapitalTab";
import { SpbpScenarioEditor } from "@/components/finance/SpbpScenarioEditor";
import { StacksEditor } from "@/components/stacks/StacksEditor";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
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
  | "scenarios";

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
  if (tab === "ma") redirect("/ma");
  const activeTab = parseTab(tab);
  await logUsageEvent({ action: "fpa_view", resource: `/finance?tab=${activeTab}` });
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
    { href: "/finance/ledger", label: "总账中台", active: false },
  ];

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="ROS · EBITDA · 利润桥"
        title="FPA 财务"
        subtitle={`管理报表优先 · 数据源 ${data.source === "database" ? "DB" : "Demo"}`}
        actions={
          <Link href="/monitor/health" className="stratos-btn stratos-btn--ghost text-xs">
            集团健康
          </Link>
        }
      />

      <StratosTabNav tabs={tabs} />

      {activeTab === "management" && (
        <ManagementReportEditor report={report} bridgeSource={data.managementMarginBridgeSource} />
      )}

      {activeTab === "statements" && (
        <FinancialStatementsEditor report={report} statementsSource={data.managementStatementsSource} />
      )}

      {activeTab === "overview" && <FpaEditor initial={data.fpa} source={data.source} />}

      {activeTab === "capital" && (
        <div className="stratos-page">
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
          <CapitalConfigEditor
            initialOptions={data.realOptions}
            initialDeviations={data.postInvestDeviations}
            source={data.capitalConfigSource}
          />
        </div>
      )}

      {activeTab === "forecast" && (
        <OutlookEditor
          initialRows={data.fiveYearForecast}
          initialDrivers={data.sensitivityDrivers}
          source={data.outlookSource}
        />
      )}

      {activeTab === "scenarios" && (
        <SpbpScenarioEditor initialScenarios={data.spbpScenarios} source={data.spbpSource} />
      )}

      <ConceptGuide ids={["fpa", "spbp"]} />
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
  ];
  if (tab && allowed.includes(tab as FinanceTab)) return tab as FinanceTab;
  return "management";
}
