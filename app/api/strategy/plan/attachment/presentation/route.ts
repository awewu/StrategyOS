import { NextResponse } from "next/server";
import {
  preparePresentationAttachment,
  presentationPage,
  resolvePresentationAttachment,
} from "@/lib/strategy/attachment-presentation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const snapshotId = searchParams.get("snapshotId");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const attachment = await resolvePresentationAttachment(id, snapshotId);
    if (!attachment) return NextResponse.json({ error: "附件不存在或不属于该战略版本" }, { status: 404 });
    const prepared = await preparePresentationAttachment(attachment);
    const requestedPage = searchParams.get("page");
    if (!requestedPage) {
      return NextResponse.json({
        id: prepared.id,
        filename: prepared.filename,
        mimeType: prepared.mimeType,
        kind: prepared.kind,
        pageCount: prepared.pageCount,
      });
    }

    const pageNumber = Number(requestedPage);
    if (!Number.isInteger(pageNumber)) return NextResponse.json({ error: "page 必须是整数" }, { status: 400 });
    const page = await presentationPage(prepared, pageNumber);
    return new NextResponse(new Uint8Array(page.bytes), {
      headers: {
        "Content-Type": page.mimeType,
        "Content-Length": String(page.bytes.length),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "附件投屏准备失败";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
