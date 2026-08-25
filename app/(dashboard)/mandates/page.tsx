import { getMandateBundle } from "@/lib/mandate/data";
import { MandatesClient } from "@/components/mandate/MandatesClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { getActivePeriod } from "@/lib/data/active-period";

export default async function MandatesPage() {
  await requireRouteAccess("/mandates");
  const [bundle, activePeriod] = await Promise.all([getMandateBundle(), getActivePeriod()]);
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="事在前 · 人在后 · 组织为战略服务"
        title="战略职责"
        subtitle="战略职责为主线 · 会议为时点 · 当期责任人为切片 · 人变线不断"
      />
      <MandatesClient bundle={bundle} activePeriod={activePeriod} />
    </div>
  );
}
