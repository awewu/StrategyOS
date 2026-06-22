import Link from "next/link";
import { OutlookEditor } from "@/components/finance/OutlookEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFinanceBundle } from "@/lib/data/strategy-data";

export default async function OutlookPage() {
  const data = await getFinanceBundle();

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="战略态势 · 前瞻"
        title="战略展望"
        subtitle={`5 年轨迹与敏感性 · 可编辑并保存 · 数据源 ${data.outlookSource === "database" ? "DB" : "Demo"}`}
        actions={
          <>
            <Link href="/finance?tab=forecast" className="stratos-btn stratos-btn--primary">
              FPA 5 年全模型
            </Link>
            <Link href="/finance?tab=scenarios" className="stratos-btn">
              SPBP 情景
            </Link>
          </>
        }
      />
      <OutlookEditor
        initialRows={data.fiveYearForecast}
        initialDrivers={data.sensitivityDrivers}
        source={data.outlookSource}
      />
    </div>
  );
}
