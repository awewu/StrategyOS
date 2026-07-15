import { getCompassBundle } from "@/lib/compass/data";
import { CompassClient } from "@/components/compass/CompassClient";
import { CompassSwotBridge } from "@/components/compass/CompassSwotBridge";
import { CommandTabs } from "@/components/command/CommandTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";

export default async function CommandCompassPage() {
  await requireRouteAccess("/command");
  const bundle = await getCompassBundle();
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="指挥舱 · 使命 · 愿景 · 终点反推"
        title="战略罗盘"
        subtitle="从5年终极目标反推当前路径风险 · 假设前提实时审计"
      />
      <CommandTabs active="compass" />
      <CompassClient bundle={bundle} />
      <div className="mt-8">
        <CompassSwotBridge premises={bundle.premises} />
      </div>
    </div>
  );
}
