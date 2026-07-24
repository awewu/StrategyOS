import { existsSync } from "node:fs";
import { mkdir, rename } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

function findLibreOffice(): string | null {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    "/usr/bin/libreoffice",
    "/usr/bin/soffice",
  ].filter(Boolean) as string[];
  const explicit = candidates.find((candidate) => existsSync(candidate));
  if (explicit) return explicit;

  const command = process.platform === "win32" ? "where.exe" : "which";
  const args = process.platform === "win32" ? ["soffice.exe"] : ["soffice"];
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
      reject(new Error("Office 文件转 PDF 超时"));
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
      else reject(new Error(stderr || `Office 转换程序退出，代码 ${code}`));
    });
  });
}

async function convertWithLibreOffice(inputPath: string, outputPath: string): Promise<void> {
  const soffice = findLibreOffice();
  if (!soffice) throw new Error("服务器未安装 LibreOffice");
  await mkdir(dirname(outputPath), { recursive: true });
  await run(soffice, ["--headless", "--convert-to", "pdf", "--outdir", dirname(outputPath), inputPath]);
  const generated = join(dirname(outputPath), `${basename(inputPath, extname(inputPath))}.pdf`);
  if (!existsSync(generated)) throw new Error("LibreOffice 未生成 PDF 文件");
  if (generated.toLowerCase() !== outputPath.toLowerCase()) await rename(generated, outputPath);
}

function psSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function convertWithPowerPoint(inputPath: string, outputPath: string): Promise<void> {
  if (process.platform !== "win32") throw new Error("当前服务器无法调用 PowerPoint");
  await mkdir(dirname(outputPath), { recursive: true });
  const script = `
$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
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
  await run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);
  if (!existsSync(outputPath)) throw new Error("PowerPoint 未生成 PDF 文件");
}

async function convertWithWord(inputPath: string, outputPath: string): Promise<void> {
  if (process.platform !== "win32") throw new Error("当前服务器无法调用 Word");
  await mkdir(dirname(outputPath), { recursive: true });
  const script = `
$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
$inputPath = ${psSingleQuote(inputPath)}
$outputPath = ${psSingleQuote(outputPath)}
$word = $null
$document = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $document = $word.Documents.Open($inputPath, $false, $true)
  $document.ExportAsFixedFormat($outputPath, 17)
} finally {
  if ($document -ne $null) { $document.Close($false) | Out-Null }
  if ($word -ne $null) { $word.Quit() | Out-Null }
}
`;
  await run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);
  if (!existsSync(outputPath)) throw new Error("Word 未生成 PDF 文件");
}

export async function convertOfficeToPdf(inputPath: string, outputPath: string): Promise<void> {
  const errors: string[] = [];
  try {
    await convertWithLibreOffice(inputPath, outputPath);
    return;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const ext = extname(inputPath).toLowerCase();
  try {
    if (ext === ".ppt" || ext === ".pptx") await convertWithPowerPoint(inputPath, outputPath);
    else if (ext === ".doc" || ext === ".docx") await convertWithWord(inputPath, outputPath);
    else throw new Error("不支持的 Office 文件格式");
    return;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  console.error("Office attachment conversion failed:", errors.join(" | "));
  throw new Error("Office 转 PDF 失败，请确认服务器已安装 LibreOffice 或 Microsoft Office");
}
