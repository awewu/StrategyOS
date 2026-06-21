import { computeInboxItems } from "@/lib/inbox/aggregate";
import { mergeInboxWithRecords } from "@/lib/inbox/persist";

export async function getOpenInboxCount(): Promise<number> {
  const items = await mergeInboxWithRecords(await computeInboxItems());
  return items.filter((i) => i.status === "OPEN" || i.status === "ASSIGNED").length;
}

export async function getInboxSummary(): Promise<{ open: number; critical: number }> {
  const items = await mergeInboxWithRecords(await computeInboxItems());
  const openItems = items.filter((i) => i.status === "OPEN" || i.status === "ASSIGNED");
  return {
    open: openItems.length,
    critical: openItems.filter((i) => i.severity === "critical").length,
  };
}
