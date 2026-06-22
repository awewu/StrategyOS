import { DecodeWorkspace } from "@/components/decode/DecodeWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { getDecodeBundle } from "@/lib/data/strategy-data";

export default async function DecodePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const { loops, source, bsc, hoshinFlat } = await getDecodeBundle();
  const initialTab =
    tab === "stratsim" ? ("stratsim" as const) : tab === "hoshin" ? ("hoshin" as const) : undefined;

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="BSC · X-Matrix · 反馈环"
        title="战略解码"
        subtitle={`战略地图与执行对齐 · 在线录入 / Excel 导入 · 数据源 ${source === "database" ? "战略计划 DB" : "Demo"}`}
      />
      <DataSourceBanner />
      <DecodeWorkspace
        initial={{ bsc, hoshinFlat, loops, source }}
        initialTab={initialTab}
      />
    </div>
  );
}
