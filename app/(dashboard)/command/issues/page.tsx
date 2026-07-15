import Link from "next/link";
import { CommandTabs } from "@/components/command/CommandTabs";
import { InboxClient, PipelineStatusBar } from "@/components/inbox/InboxClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { getInboxItems, getPipelineStatus } from "@/lib/inbox/aggregate";

export default async function CommandIssuesPage() {
  await requireRouteAccess("/command");
  const [allItems, pipeline] = await Promise.all([getInboxItems(), getPipelineStatus()]);
  const items = allItems.filter((i) => i.category !== "market");
  const marketCount = allItems.length - items.length;
  const critical = items.filter((i) => i.severity === "critical" && i.status === "OPEN").length;

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="指挥舱 · 交付闭环"
        title="议题"
        subtitle={`待议 ${items.length} 项 · 紧急 ${critical} · 已议/指派/推迟持久化 · 写回承诺账本`}
        actions={
          marketCount > 0 ? (
            <Link href="/market?tab=intel" className="stratos-btn stratos-btn--ghost">
              市场威胁议题 {marketCount} 条 → 市场洞察
            </Link>
          ) : undefined
        }
      />
      <CommandTabs active="issues" />
      <PipelineStatusBar status={pipeline} />
      <InboxClient initialItems={items} />
    </div>
  );
}
