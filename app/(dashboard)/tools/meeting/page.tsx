import { MeetingToolsClient } from "@/components/meeting/MeetingToolsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";

export default async function MeetingToolsPage() {
  await requireRouteAccess("/tools/meeting");
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="会议闭环"
        title="会议工具"
        subtitle="投票 · 表决 · 会中脉搏 → 议题 Inbox / 承诺账本"
      />
      <MeetingToolsClient />
    </div>
  );
}
