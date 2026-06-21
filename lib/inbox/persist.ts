import { dbAvailable, prisma } from "@/lib/db";
import { createCommitmentFromInbox } from "@/lib/delivery/hooks";
import { linkInboxAssignToMandate } from "@/lib/delivery/mandate-link";
import type { InboxItem } from "./aggregate";

export type InboxDisposition = "OPEN" | "DEFERRED" | "ASSIGNED" | "CLOSED";

export type InboxItemView = InboxItem & {
  sourceKey: string;
  status: InboxDisposition;
  ownerName: string | null;
  deferUntil: string | null;
  recordId: string | null;
  commitmentId: string | null;
};

function toSourceKey(item: InboxItem): string {
  return item.sourceKey ?? item.id;
}

/** 计算项 upsert 到 DB，合并处置状态；已关闭项隐藏 */
export async function mergeInboxWithRecords(computed: InboxItem[]): Promise<InboxItemView[]> {
  if (!(await dbAvailable())) {
    return computed.map((item) => ({
      ...item,
      sourceKey: toSourceKey(item),
      status: "OPEN",
      ownerName: null,
      deferUntil: null,
      recordId: null,
      commitmentId: null,
    }));
  }

  try {
    for (const item of computed) {
      const sourceKey = toSourceKey(item);
      await prisma.inboxRecord.upsert({
        where: { sourceKey },
        create: {
          sourceKey,
          category: item.category,
          severity: item.severity,
          title: item.title,
          summary: item.summary,
          sourceLabel: item.source,
          href: item.href,
          status: "OPEN",
        },
        update: {
          title: item.title,
          summary: item.summary,
          severity: item.severity,
          sourceLabel: item.source,
          href: item.href,
        },
      });
    }

    const records = await prisma.inboxRecord.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
    });

    const computedByKey = new Map(computed.map((i) => [toSourceKey(i), i]));
    const views: InboxItemView[] = [];

    for (const rec of records) {
      const fresh = computedByKey.get(rec.sourceKey);
      if (!fresh && rec.status === "OPEN") continue;
      if (rec.status === "DEFERRED" && rec.deferUntil && rec.deferUntil > new Date()) {
        views.push(mapRecord(rec, fresh));
        continue;
      }
      if (rec.status === "DEFERRED" && rec.deferUntil && rec.deferUntil <= new Date()) {
        await prisma.inboxRecord.update({
          where: { id: rec.id },
          data: { status: "OPEN", deferUntil: null },
        });
      }
      if (fresh || rec.status !== "OPEN") {
        views.push(mapRecord(rec, fresh));
      }
    }

    for (const item of computed) {
      const key = toSourceKey(item);
      if (!views.some((v) => v.sourceKey === key)) {
        views.push({
          ...item,
          sourceKey: key,
          status: "OPEN",
          ownerName: null,
          deferUntil: null,
          recordId: null,
          commitmentId: null,
        });
      }
    }

    const order = { critical: 0, warning: 1, info: 2 };
    const statusOrder = { OPEN: 0, ASSIGNED: 1, DEFERRED: 2, CLOSED: 3 };
    return views.sort((a, b) => {
      const s = statusOrder[a.status] - statusOrder[b.status];
      if (s !== 0) return s;
      return order[a.severity] - order[b.severity];
    });
  } catch {
    return computed.map((item) => ({
      ...item,
      sourceKey: toSourceKey(item),
      status: "OPEN" as const,
      ownerName: null,
      deferUntil: null,
      recordId: null,
      commitmentId: null,
    }));
  }
}

function mapRecord(
  rec: {
    id: string;
    sourceKey: string;
    category: string;
    severity: string;
    title: string;
    summary: string | null;
    sourceLabel: string;
    href: string;
    status: InboxDisposition;
    ownerName: string | null;
    deferUntil: Date | null;
    commitmentId: string | null;
  },
  fresh?: InboxItem,
): InboxItemView {
  return {
    id: rec.sourceKey,
    sourceKey: rec.sourceKey,
    severity: (fresh?.severity ?? rec.severity) as InboxItem["severity"],
    title: fresh?.title ?? rec.title,
    summary: fresh?.summary ?? rec.summary ?? "",
    source: fresh?.source ?? rec.sourceLabel,
    href: fresh?.href ?? rec.href,
    category: (fresh?.category ?? rec.category) as InboxItem["category"],
    status: rec.status,
    ownerName: rec.ownerName,
    deferUntil: rec.deferUntil?.toISOString().slice(0, 10) ?? null,
    recordId: rec.id,
    commitmentId: rec.commitmentId,
  };
}

export async function disposeInboxItem(
  sourceKey: string,
  action: "close" | "defer" | "assign",
  payload?: { ownerName?: string; deadline?: string; deferUntil?: string; resolution?: string },
): Promise<void> {
  if (!(await dbAvailable())) throw new Error("database unavailable");

  const rec = await prisma.inboxRecord.findUnique({ where: { sourceKey } });
  if (!rec) throw new Error("inbox item not found");

  if (action === "close") {
    await prisma.inboxRecord.update({
      where: { id: rec.id },
      data: {
        status: "CLOSED",
        resolution: payload?.resolution ?? "已议",
        closedAt: new Date(),
      },
    });
    return;
  }

  if (action === "defer") {
    await prisma.inboxRecord.update({
      where: { id: rec.id },
      data: {
        status: "DEFERRED",
        deferUntil: payload?.deferUntil ? new Date(payload.deferUntil) : new Date(Date.now() + 7 * 86400000),
        resolution: payload?.resolution ?? null,
      },
    });
    return;
  }

  if (action === "assign") {
    const owner = payload?.ownerName?.trim();
    if (!owner) throw new Error("ownerName required");
    const deadline = payload?.deadline ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const commitmentId = await createCommitmentFromInbox({
      title: rec.title,
      ownerName: owner,
      deadline,
    });
    await linkInboxAssignToMandate({
      sourceKey: rec.sourceKey,
      title: rec.title,
      ownerName: owner,
      deadline,
    }).catch(() => undefined);
    await prisma.inboxRecord.update({
      where: { id: rec.id },
      data: {
        status: "ASSIGNED",
        ownerName: owner,
        commitmentId,
        resolution: `已指派 · 承诺 ${deadline}`,
      },
    });
  }
}
