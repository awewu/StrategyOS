import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, basename, dirname, extname } from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PREVIEW_DIR = join(process.cwd(), "public", "uploads", "plans", "previews");
const PUBLIC_PREVIEW_DIR = "/uploads/plans/previews";

function safePublicPath(storagePath: string): string | null {
  if (!storagePath.startsWith("/uploads/plans/")) return null;
  if (storagePath.includes("..")) return null;
  return join(process.cwd(), "public", storagePath);
}

function findLibreOffice(): string | null {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "soffice",
    "soffice.exe",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean) as string[];
  return candidates.find((candidate) => {
    if (candidate.includes("\\") || candidate.includes("/")) return existsSync(candidate);
    return true;
  }) ?? null;
}

function run(command: string, args: string[], timeoutMs = 120000): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("PPTX 转 PDF 超时"));
    }, timeoutMs);
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `LibreOffice exited with code ${code}`));
    });
  });
}

async function convertWithLibreOffice(inputPath: string, outputPath: string): Promise<void> {
  const soffice = findLibreOffice();
  if (!soffice) {
    throw new Error("服务器未安装 LibreOffice，无法生成 PPTX 预览 PDF。请安装 LibreOffice 后重试。");
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await run(soffice, [
    "--headless",
    "--convert-to",
    "pdf",
    "--outdir",
    dirname(outputPath),
    inputPath,
  ]);
  const generated = join(dirname(outputPath), basename(inputPath, extname(inputPath)) + ".pdf");
  if (!existsSync(generated)) {
    throw new Error("PPTX 转 PDF 未生成输出文件");
  }
  if (generated.toLowerCase() !== outputPath.toLowerCase()) {
    const { rename } = await import("node:fs/promises");
    await rename(generated, outputPath);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const attachment = await prisma.planAttachment.findUnique({
    where: { id },
    select: { id: true, filename: true, mimeType: true, storagePath: true },
  });
  if (!attachment) return NextResponse.json({ error: "附件不存在" }, { status: 404 });

  const ext = extname(attachment.filename).toLowerCase();
  if (ext === ".pdf") {
    return NextResponse.redirect(new URL(attachment.storagePath, req.url));
  }
  if (ext !== ".ppt" && ext !== ".pptx") {
    return NextResponse.json({ error: "当前仅支持 PDF 直接预览、PPT/PPTX 转 PDF 预览" }, { status: 415 });
  }

  const inputPath = safePublicPath(attachment.storagePath);
  if (!inputPath || !existsSync(inputPath)) {
    return NextResponse.json({ error: "附件文件不存在" }, { status: 404 });
  }

  const pdfName = `${attachment.id}.pdf`;
  const outputPath = join(PREVIEW_DIR, pdfName);
  const publicPath = `${PUBLIC_PREVIEW_DIR}/${pdfName}`;

  try {
    if (!existsSync(outputPath)) {
      await convertWithLibreOffice(inputPath, outputPath);
    }
    return NextResponse.redirect(new URL(publicPath, req.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "预览生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
