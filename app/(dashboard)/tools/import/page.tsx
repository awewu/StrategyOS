import { SheetImportClient } from "@/components/tools/SheetImportClient";
import { StrategicImportPanel } from "@/components/compiler/StrategicImportPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "数据导入 · StratOS" };

export default function SheetImportPage() {
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="工具 · 导入管道"
        title="Sheet 导入 · 列映射画像"
        subtitle="首次导入:上传 → 系统猜映射 → 人工确认 → 存为画像;之后每月同模板直接套用,只看预检结果"
      />
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
