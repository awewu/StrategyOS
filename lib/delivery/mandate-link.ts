import { dbAvailable, prisma } from "@/lib/db";

/** Inbox 指派 → 战略职责 Mandate 绑定 */
export async function linkInboxAssignToMandate(opts: {
  sourceKey: string;
  title: string;
  ownerName: string;
  deadline: string;
}): Promise<string | null> {
  if (!(await dbAvailable())) return null;

  const slug = opts.sourceKey.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase() || "INBOX";
  const code = `M-INB-${slug}`.slice(0, 20);

  const mandate = await prisma.strategyMandate.upsert({
    where: { code },
    create: {
      code,
      title: opts.title.slice(0, 200),
      description: `自 Inbox 指派 · ${opts.ownerName} · 截止 ${opts.deadline}`,
      status: "ACTIVE",
    },
    update: {
      title: opts.title.slice(0, 200),
      description: `自 Inbox 指派 · ${opts.ownerName} · 截止 ${opts.deadline}`,
    },
  });

  await prisma.inboxRecord.updateMany({
    where: { sourceKey: opts.sourceKey },
    data: { mandateId: mandate.id },
  });

  return mandate.id;
}
