import { InboxClient, PipelineStatusBar } from "@/components/inbox/InboxClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { getInboxItems, getPipelineStatus } from "@/lib/inbox/aggregate";

export default async function InboxPage() {
  await requireRouteAccess("/inbox");
  const [items, pipeline] = await Promise.all([getInboxItems(), getPipelineStatus()]);
  const critical = items.filter((i) => i.severity === "critical" && i.status === "OPEN").length;

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="战略态势 · 交付闭环"
        title="议题 Inbox"
        subtitle={`待议 ${items.length} 项 · 紧急 ${critical} · 已议/指派/推迟持久化 · 写回承诺账本`}
      />
      <PipelineStatusBar status={pipeline} />
      <InboxClient initialItems={items} />
    </div>
  );
}
