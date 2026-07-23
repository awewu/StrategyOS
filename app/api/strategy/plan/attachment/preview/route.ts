import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join, basename, dirname, extname } from "node:path";
import { spawn, spawnSync } from "node:child_process";
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

function contentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

async function pdfResponse(path: string, filename: string) {
  const bytes = await readFile(path);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.length),
      "Content-Disposition": contentDisposition(filename),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function attachmentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

async function attachmentResponse(path: string, filename: string, mimeType: string, previewError: string) {
  const bytes = await readFile(path);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mimeType || "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Content-Disposition": attachmentDisposition(filename),
      "X-Content-Type-Options": "nosniff",
      "X-StratOS-Preview-Fallback": encodeURIComponent(previewError),
    },
  });
}

function findLibreOffice(): string | null {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean) as string[];
  const explicit = candidates.find((candidate) => existsSync(candidate));
  if (explicit) return explicit;

  const command = process.platform === "win32" ? "where.exe" : "command";
  const args = process.platform === "win32" ? ["soffice.exe"] : ["-v", "soffice"];
  const found = spawnSync(command, args, { encoding: "utf8", windowsHide: true });
  if (found.status !== 0) return null;
  return found.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
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

function psSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function convertWithPowerPoint(inputPath: string, outputPath: string): Promise<void> {
  if (process.platform !== "win32") {
    throw new Error("当前服务器未安装 LibreOffice，且非 Windows 环境无法调用 PowerPoint 转换。");
  }
  await mkdir(dirname(outputPath), { recursive: true });
  const script = `
$ErrorActionPreference = 'Stop'
$inputPath = ${psSingleQuote(inputPath)}
$outputPath = ${psSingleQuote(outputPath)}
$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $presentation = $powerPoint.Presentations.Open($inputPath, $true, $true, $false)
  $presentation.SaveAs($outputPath, 32)
} finally {
  if ($presentation -ne $null) { $presentation.Close() | Out-Null }
  if ($powerPoint -ne $null) { $powerPoint.Quit() | Out-Null }
}
`;
  await run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], 120000);
  if (!existsSync(outputPath)) {
    throw new Error("PowerPoint 转 PDF 未生成输出文件");
  }
}

async function convertPresentation(inputPath: string, outputPath: string): Promise<void> {
  const errors: string[] = [];
  try {
    await convertWithLibreOffice(inputPath, outputPath);
    return;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  try {
    await convertWithPowerPoint(inputPath, outputPath);
    return;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  throw new Error(`PPT 预览生成失败：${errors.join("；")}`);
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
  const inputPath = safePublicPath(attachment.storagePath);
  if (!inputPath || !existsSync(inputPath)) {
    return NextResponse.json({ error: "附件文件不存在，请同步 uploads/plans 目录或重新上传附件" }, { status: 404 });
  }

  if (ext === ".pdf") {
    return pdfResponse(inputPath, attachment.filename);
  }
  if (ext !== ".ppt" && ext !== ".pptx") {
    return NextResponse.json({ error: "当前仅支持 PDF 直接预览、PPT/PPTX 转 PDF 预览" }, { status: 415 });
  }

  const pdfName = `${attachment.id}.pdf`;
  const outputPath = join(PREVIEW_DIR, pdfName);
  const publicPath = `${PUBLIC_PREVIEW_DIR}/${pdfName}`;

  try {
    if (!existsSync(outputPath)) {
      await convertPresentation(inputPath, outputPath);
    }
    return pdfResponse(outputPath, basename(publicPath));
  } catch (error) {
    const message = error instanceof Error ? error.message : "预览生成失败";
    return attachmentResponse(inputPath, attachment.filename, attachment.mimeType, message);
  }
}
