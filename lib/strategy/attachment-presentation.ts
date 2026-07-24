import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/lib/db";
import { classifyProjectionAttachment } from "@/lib/rehearsal/projection";
import { convertOfficeToPdf } from "@/lib/strategy/office-to-pdf";

const PREVIEW_DIR = join(process.cwd(), "public", "uploads", "plans", "previews");
const PAGE_DIR = join(PREVIEW_DIR, "presentation");

export interface PresentationAttachmentRecord {
  id: string;
  filename: string;
  mimeType: string;
  storagePath: string;
}

export interface PreparedPresentationAttachment extends PresentationAttachmentRecord {
  kind: "document" | "image";
  pageCount: number;
  sourcePath: string;
}

function snapshotAttachments(value: unknown): PresentationAttachmentRecord[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const attachments = (value as { attachments?: unknown }).attachments;
  if (!Array.isArray(attachments)) return [];
  return attachments.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : "";
    const filename = typeof raw.filename === "string" ? raw.filename : "";
    const storagePath = typeof raw.storagePath === "string" ? raw.storagePath : "";
    if (!id || !filename || !storagePath) return [];
    return [{ id, filename, storagePath, mimeType: typeof raw.mimeType === "string" ? raw.mimeType : "application/octet-stream" }];
  });
}

export function safePlanAttachmentPath(storagePath: string): string | null {
  if (!storagePath.startsWith("/uploads/plans/") || storagePath.includes("..")) return null;
  return join(process.cwd(), "public", storagePath);
}

export async function resolvePresentationAttachment(
  id: string,
  snapshotId?: string | null,
): Promise<PresentationAttachmentRecord | null> {
  if (snapshotId) {
    const snapshot = await prisma.planSubmissionSnapshot.findUnique({
      where: { id: snapshotId },
      select: { snapshotJson: true },
    });
    return snapshotAttachments(snapshot?.snapshotJson).find((attachment) => attachment.id === id) ?? null;
  }

  return prisma.planAttachment.findUnique({
    where: { id },
    select: { id: true, filename: true, mimeType: true, storagePath: true },
  });
}

async function pdfPageCount(path: string): Promise<number> {
  const parser = new PDFParse({ data: await readFile(path) });
  try {
    const info = await parser.getInfo({ first: 1 });
    return info.total;
  } finally {
    await parser.destroy();
  }
}

export async function preparePresentationAttachment(
  attachment: PresentationAttachmentRecord,
): Promise<PreparedPresentationAttachment> {
  const inputPath = safePlanAttachmentPath(attachment.storagePath);
  if (!inputPath || !existsSync(inputPath)) throw new Error("附件文件不存在，请同步 uploads/plans 目录或重新上传附件");

  const format = classifyProjectionAttachment(attachment.filename, attachment.mimeType);
  if (format === "unsupported") throw new Error("该附件格式暂不支持投屏");
  if (format === "image") return { ...attachment, kind: "image", pageCount: 1, sourcePath: inputPath };

  let pdfPath = inputPath;
  if (format === "office") {
    await mkdir(PREVIEW_DIR, { recursive: true });
    pdfPath = join(PREVIEW_DIR, `${attachment.id}.pdf`);
    if (!existsSync(pdfPath)) await convertOfficeToPdf(inputPath, pdfPath);
  }
  const pageCount = await pdfPageCount(pdfPath);
  if (pageCount < 1) throw new Error("附件没有可投屏页面");
  return { ...attachment, kind: "document", pageCount, sourcePath: pdfPath };
}

export async function presentationPage(
  prepared: PreparedPresentationAttachment,
  pageNumber: number,
): Promise<{ bytes: Buffer; mimeType: string }> {
  if (pageNumber < 1 || pageNumber > prepared.pageCount) throw new Error("投屏页码超出范围");
  if (prepared.kind === "image") {
    return { bytes: await readFile(prepared.sourcePath), mimeType: prepared.mimeType };
  }

  await mkdir(PAGE_DIR, { recursive: true });
  const outputPath = join(PAGE_DIR, `${prepared.id}-${pageNumber}.png`);
  if (!existsSync(outputPath)) {
    const parser = new PDFParse({ data: await readFile(prepared.sourcePath) });
    try {
      const result = await parser.getScreenshot({ partial: [pageNumber], desiredWidth: 1920, imageDataUrl: false, imageBuffer: true });
      const page = result.pages[0];
      if (!page?.data) throw new Error("PDF 页面渲染失败");
      await writeFile(outputPath, Buffer.from(page.data));
    } finally {
      await parser.destroy();
    }
  }
  return { bytes: await readFile(outputPath), mimeType: "image/png" };
}

export function snapshotReferencesAttachment(snapshotJson: unknown, attachmentId: string): boolean {
  return snapshotAttachments(snapshotJson).some((attachment) => attachment.id === attachmentId);
}
