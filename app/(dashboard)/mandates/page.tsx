import { getMandateBundle } from "@/lib/mandate/data";
import { MandatesClient } from "@/components/mandate/MandatesClient";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function MandatesPage() {
  const bundle = await getMandateBundle();
  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="事在前 · 人在后 · 组织为战略服务"
        title="战略职责"
        subtitle="战略职责为主线 · 会议为时点 · 当期责任人为切片 · 人变线不断"
      />
      <MandatesClient bundle={bundle} />
    </div>
  );
}
