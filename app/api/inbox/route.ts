import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { computeInboxItems, getPipelineStatus } from "@/lib/inbox/aggregate";
import { disposeInboxItem, mergeInboxWithRecords } from "@/lib/inbox/persist";

export async function GET() {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;

  const [items, pipeline] = await Promise.all([
    mergeInboxWithRecords(await computeInboxItems()),
    getPipelineStatus(),
  ]);
  return NextResponse.json({ items, pipeline });
}

export async function PATCH(req: Request) {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      sourceKey: string;
      action: "close" | "defer" | "assign";
      ownerName?: string;
      deadline?: string;
      deferUntil?: string;
      resolution?: string;
    };
    if (!body.sourceKey || !body.action) {
      return NextResponse.json({ error: "sourceKey and action required" }, { status: 400 });
    }
    await disposeInboxItem(body.sourceKey, body.action, body);
    const items = await mergeInboxWithRecords(await computeInboxItems());
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "dispose failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
