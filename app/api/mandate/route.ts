import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const VALID_STATUS = ["ACTIVE", "AT_RISK", "ON_HOLD", "CLOSED"];

export async function POST(req: Request) {
  try {
    const { id, code, title, theme, description, status, closed, linkedProjectCode, linkedAssumptionCode, sortOrder } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "标题必填" }, { status: 400 });
    if (!id && !code?.trim()) return NextResponse.json({ error: "编号必填" }, { status: 400 });
    if (status && !VALID_STATUS.includes(status)) return NextResponse.json({ error: "状态无效" }, { status: 400 });

    const data = {
      title: title.trim(),
      theme: theme?.trim() || null,
      description: description?.trim() || null,
      status: status ?? "ACTIVE",
      closed: closed ?? false,
      linkedProjectCode: linkedProjectCode?.trim() || null,
      linkedAssumptionCode: linkedAssumptionCode?.trim() || null,
      sortOrder: sortOrder ?? 999,
    };
    const mandate = id
      ? await prisma.strategyMandate.update({ where: { id }, data })
      : await prisma.strategyMandate.create({ data: { ...data, code: code.trim() } });
    return NextResponse.json({ ok: true, mandate });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const holdingCount = await prisma.mandateHolding.count({ where: { mandateId: id } });
    if (holdingCount > 0) {
      return NextResponse.json({ error: `该职责有 ${holdingCount} 条认领记录，结案而非删除以保留历史` }, { status: 409 });
    }
    await prisma.strategyMandate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
