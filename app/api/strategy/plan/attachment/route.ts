import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "plans");
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_MIME = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const planId = form.get("planId") as string | null;

    if (!file || !planId) {
      return NextResponse.json({ error: "file 和 planId 为必填" }, { status: 400 });
    }
    // 类型校验（客户端可绕过，后端也要验）
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mimeType) && !file.name.match(/\.(ppt|pptx|pdf|doc|docx|xls|xlsx|key)$/i)) {
      return NextResponse.json({ error: "文件类型不支持" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "文件不能超过 100 MB" }, { status: 413 });
    }

    // 确认 plan 存在
    const plan = await prisma.strategicPlan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) return NextResponse.json({ error: "plan 不存在" }, { status: 404 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const savedName = randomUUID() + "." + ext;
    const storagePath = "/uploads/plans/" + savedName;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(UPLOAD_DIR, savedName), Buffer.from(bytes));

    const attachment = await prisma.planAttachment.create({
      data: { planId, filename: file.name, mimeType, sizeBytes: file.size, storagePath },
    });

    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      sizeBytes: attachment.sizeBytes,
      mimeType: attachment.mimeType,
      storagePath: attachment.storagePath,
    });
  } catch (error: unknown) {
    console.error("Attachment upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const att = await prisma.planAttachment.findUnique({ where: { id }, select: { storagePath: true } });
    if (!att) return NextResponse.json({ error: "不存在" }, { status: 404 });

    await prisma.planAttachment.delete({ where: { id } });

    // 尝试删除文件，失败不阻断响应（文件可能已不在）
    const physPath = join(process.cwd(), "public", att.storagePath);
    await unlink(physPath).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Attachment delete error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
