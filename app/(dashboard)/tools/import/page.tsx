import { SheetImportClient } from "@/components/tools/SheetImportClient";
import { StrategicImportPanel } from "@/components/compiler/StrategicImportPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { getImportFreshness } from "@/lib/finance/import-freshness";

export const metadata = { title: "数据导入 · StratOS" };

export default async function SheetImportPage() {
  const fresh = await getImportFreshness();
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="导入管道"
        title="Sheet 导入 · 列映射画像"
        subtitle="首次导入:上传 → 系统猜映射 → 人工确认 → 存为画像;之后每月同模板直接套用,只看预检结果"
      />
      {fresh.available ? (
        fresh.stale ? (
          <div className="rounded-xl border border-[var(--signal-yellow)]/35 bg-[color-mix(in_srgb,var(--signal-yellow)_7%,white)] p-4 text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--signal-yellow)]">该导数了：</span>
            当前战略期 {fresh.activePeriod}，总账最新已导入期{" "}
            {fresh.latestLedgerPeriod ?? "无（从未导入）"}
            {fresh.lastImportAt ? ` · 上次导入 ${fresh.lastImportAt}` : ""}
            。本期数据未入库前，管理报表与利润桥停留在旧期口径。
          </div>
        ) : (
          <p className="text-caption">
            期次水位：当前期 {fresh.activePeriod} 已有总账数据
            {fresh.lastImportAt ? ` · 上次导入 ${fresh.lastImportAt}` : ""} — 数据新鲜
          </p>
        )
      ) : null}
      <SheetImportClient />

      <details className="stratos-disclosure stratos-disclosure--secondary">
        <summary>战略资料导入 · PDF / Excel 编译</summary>
        <div className="stratos-disclosure__body">
          <StrategicImportPanel embedded />
        </div>
      </details>
    </div>
  );
}
