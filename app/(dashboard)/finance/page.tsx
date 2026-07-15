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
import { KpiTile } from "@/components/ui/KpiTile";
import { getFinanceBundle } from "@/lib/data/strategy-data";
import { getStacksBundle } from "@/lib/stacks/data-access";
import { getBudgetBaseline } from "@/lib/finance/budget-versions";
import { getActivePeriod } from "@/lib/data/active-period";

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
  const activePeriod = await getActivePeriod();
  const fiscalYear = activePeriod.slice(0, 4);
  const baseline = activeTab === "management" ? await getBudgetBaseline(fiscalYear) : null;

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
        subtitle="管理报表优先"
        actions={
          <Link href="/monitor/health" className="stratos-btn stratos-btn--ghost text-xs">
            集团健康
          </Link>
        }
      />

      <StratosTabNav tabs={tabs} />

      {activeTab === "management" && (
        <>
          <div className="stratos-slot-grid">
            <KpiTile
              label="营收 F"
              value={`${data.fpa.revenueForecast.toLocaleString("zh-CN")} 万`}
              tone="neutral"
              delta={{ value: data.fpa.revenueForecast - data.fpa.revenueBudget, label: "vs B" }}
            />
            <KpiTile
              label="利润 F"
              value={`${data.fpa.profitForecast.toLocaleString("zh-CN")} 万`}
              tone="neutral"
              delta={{ value: data.fpa.profitForecast - data.fpa.profitBudget, label: "vs B" }}
            />
            <KpiTile
              label="现金 Runway"
              value={`${data.fpa.cashRunwayMonths} 月`}
              tone={data.fpa.cashRunwayMonths < 3 ? "red" : "green"}
              sub="红线 3 月"
            />
            <KpiTile
              label="B 基准"
              value={baseline ? `FY${baseline.fiscalYear}` : "未受控"}
              tone={baseline ? "green" : "red"}
              sub={baseline ? baseline.name : "去预算版本建立基准"}
              href="/finance/ledger?tab=budget"
            />
          </div>
          {baseline ? (
            <p className="text-caption -mt-2">
              B 基准：FY{baseline.fiscalYear} 「{baseline.name}」· 批准于 {baseline.decidedAt?.slice(0, 10)}
              {baseline.decidedBy ? ` · ${baseline.decidedBy}` : ""} ·{" "}
              <Link href="/finance/ledger?tab=budget" className="text-[var(--color-accent)] hover:underline">预算版本 →</Link>
            </p>
          ) : (
            <p className="text-caption -mt-2 text-[var(--signal-yellow)]">
              FY{fiscalYear} 尚无已批准预算基准 — B 列口径未受控，去{" "}
              <Link href="/finance/ledger?tab=budget" className="text-[var(--color-accent)] hover:underline">预算版本</Link>
              建立基准
            </p>
          )}
          <ManagementReportEditor report={report} bridgeSource={data.managementMarginBridgeSource} />
        </>
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
