import { logUsageEvent } from "@/lib/audit/log-event";
import { requireRouteAccess } from "@/lib/auth/guard";
import { InnovationClient } from "@/components/innovation/InnovationClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getInnovationBundle } from "@/lib/innovation/data-access";

export default async function InnovationPage() {
  await requireRouteAccess("/innovation");
  await logUsageEvent({ action: "innovation_view", resource: "/innovation" });
  const bundle = await getInnovationBundle();

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="Innovation Engine"
        title="创新底座"
        subtitle="想要 × 能做 × 划算——方法论内核不变,产品线画像可配;举证过关,分段下注,错了止损。"
      />
      <InnovationClient bundle={bundle} />
    </div>
  );
}
