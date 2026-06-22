import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  deleteCultureUnderstanding,
  getCultureUnderstanding,
  saveCultureUnderstanding,
} from "@/lib/culture/data-access";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const { records, source } = await getCultureUnderstanding();
  return NextResponse.json({ records, source });
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      id?: string;
      date?: string;
      title?: string;
      unit?: string;
      author?: string;
      summary?: string;
      relatedPrinciple?: string;
    };
    if (!body.title?.trim() || !body.summary?.trim()) {
      return NextResponse.json({ error: "标题与摘要必填" }, { status: 400 });
    }
    const record = await saveCultureUnderstanding({
      id: body.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      title: body.title,
      unit: body.unit ?? "—",
      author: body.author ?? "—",
      summary: body.summary,
      relatedPrinciple: body.relatedPrinciple,
    });
    return NextResponse.json({ ok: true, record });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteCultureUnderstanding(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "删除失败" }, { status: 500 });
  }
}
