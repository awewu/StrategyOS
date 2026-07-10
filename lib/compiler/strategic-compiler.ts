/**
 * Strategic compiler — extract structured plan + BSC from raw text / PDF.
 */
import { spawn } from "node:child_process";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import type { BscDimensionRow } from "@/lib/decode/bsc-map";
import type { FpaSummary } from "@/lib/types/stratos";
import { prefilterImportText } from "./import-quality";

export type PlanDimension = "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING";

export interface CompiledKeyResult {
  keyResult: string;
  target?: string;
}

export interface CompiledObjective {
  dimension: PlanDimension;
  objective?: string;
  keyResults: CompiledKeyResult[];
}

export interface CompiledStrategicPayload {
  intent?: string;
  northStar?: string;
  objectives: CompiledObjective[];
  priorities: string[];
  bscRows: BscDimensionRow[];
  fpa?: Partial<Pick<FpaSummary, "revenueBudget" | "revenueForecast" | "profitBudget" | "profitForecast">>;
  summary: string[];
}

const DIM_KEYWORDS: Array<{ dimension: PlanDimension; dim: string; keywords: RegExp[] }> = [
  { dimension: "FINANCIAL", dim: "财务", keywords: [/财务/i, /营收/i, /利润/i, /EBIT/i, /ROS/i, /financial/i] },
  { dimension: "CUSTOMER", dim: "客户", keywords: [/客户/i, /NPS/i, /覆盖/i, /customer/i, /签约/i] },
  { dimension: "PROCESS", dim: "流程", keywords: [/流程/i, /准时/i, /Gate/i, /交付/i, /process/i, /V\d/i] },
  { dimension: "LEARNING", dim: "学习", keywords: [/学习/i, /研发/i, /创新/i, /learning/i, /TRL/i, /专利/i] },
];

function inferDimension(line: string): PlanDimension {
  for (const entry of DIM_KEYWORDS) {
    if (entry.keywords.some((k) => k.test(line))) return entry.dimension;
  }
  return "PROCESS";
}

function parsePercent(line: string): number | null {
  const m = line.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
}

function parseRevenueWan(line: string): number | null {
  const m = line.match(/(?:营收|收入|revenue)[^\d]*(\d+(?:\.\d+)?)\s*(?:万|亿)?/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (/亿/.test(line)) n *= 10000;
  return n;
}

function stripObjectivePrefix(line: string): string {
  return line
    .replace(/^O\d+\s*[:：.\-]\s*/i, "")
    .replace(/^目标\s*\d*\s*[:：]\s*/, "")
    .trim();
}

function stripKrPrefix(line: string): string {
  return line
    .replace(/^KR\d+\s*[:：.\-]\s*/i, "")
    .replace(/^关键结果\s*[:：]\s*/, "")
    .trim();
}

export function compileStrategicText(text: string): CompiledStrategicPayload {
  const filtered = prefilterImportText(text);
  const lines = filtered.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const summary: string[] = [];
  const priorities: string[] = [];
  const objectives: CompiledObjective[] = [];
  const bscRows: BscDimensionRow[] = [];
  const fpa: CompiledStrategicPayload["fpa"] = {};

  let intent: string | undefined;
  let northStar: string | undefined;
  let currentObjective: CompiledObjective | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^(意图|intent|战略意图)\s*[:：]/i.test(line)) {
      intent = line.replace(/^[^:]+:\s*/, "").trim();
      summary.push(`意图: ${intent}`);
      continue;
    }
    if (/^(北极星|north\s*star|愿景)\s*[:：]/i.test(line)) {
      northStar = line.replace(/^[^:]+:\s*/, "").trim();
      summary.push(`北极星: ${northStar}`);
      continue;
    }
    if (!northStar && /^品牌愿景$/i.test(line)) {
      const next = lines.slice(i + 1, i + 4).find((l) => l.length > 12 && !/^brand/i.test(l));
      if (next) {
        northStar = next.replace(/^["“]|["”]$/g, "").trim();
        summary.push(`北极星: ${northStar.slice(0, 80)}`);
      }
      continue;
    }
    if (!intent && /^五年战略解码总述$/i.test(line)) {
      const block = lines.slice(i + 1, i + 6).find((l) => /RheNEXT|瑞合瑞德/i.test(l));
      if (block) {
        intent = block.slice(0, 240);
        summary.push(`意图: ${intent.slice(0, 80)}…`);
      }
      continue;
    }

    if (/^O\d+\b/i.test(line) || /^目标\s*\d*\s*[:：]/i.test(line)) {
      const objectiveText = stripObjectivePrefix(line);
      const dimension = inferDimension(line + " " + objectiveText);
      currentObjective = { dimension, objective: objectiveText, keyResults: [] };
      objectives.push(currentObjective);
      summary.push(`目标 ${objectiveText.slice(0, 60)}`);
      continue;
    }

    const weightedKr = line.match(/^(.+?)\s+(\d{1,3})\s*%$/);
    if (weightedKr && weightedKr[1]!.length > 4 && !/^O\d/i.test(line)) {
      const krText = weightedKr[1]!.trim();
      const dimension = inferDimension(krText);
      currentObjective = { dimension, objective: krText.slice(0, 80), keyResults: [{ keyResult: krText, target: `${weightedKr[2]}%` }] };
      objectives.push(currentObjective);
      continue;
    }

    if (/^KR\d+\b/i.test(line) || /^关键结果\s*[:：]/i.test(line)) {
      const krText = stripKrPrefix(line);
      const targetMatch = krText.match(/(?:目标|target)\s*[:：]?\s*([^\s，,]+)/i);
      const kr: CompiledKeyResult = {
        keyResult: targetMatch ? krText.replace(/(?:目标|target)\s*[:：]?\s*[^\s，,]+/i, "").trim() || krText : krText,
        target: targetMatch?.[1],
      };
      if (currentObjective) {
        currentObjective.keyResults.push(kr);
      } else {
        const dimension = inferDimension(krText);
        currentObjective = { dimension, objective: undefined, keyResults: [kr] };
        objectives.push(currentObjective);
      }
      continue;
    }

    if (/^优先(?:级)?\s*\d*[:：]/i.test(line) || /^P\d+\s*[:：]/i.test(line)) {
      const p = line.replace(/^[^:]+:\s*/, "").trim();
      if (p) {
        priorities.push(p);
        summary.push(`优先级: ${p.slice(0, 80)}`);
      }
      continue;
    }

    for (const entry of DIM_KEYWORDS) {
      if (entry.keywords.some((k) => k.test(line)) && line.length > 8) {
        const pct = parsePercent(line);
        bscRows.push({
          dim: entry.dim,
          objective: line.slice(0, 120),
          mustWin: pct != null ? `${pct}%` : line.slice(0, 80),
          operating: [line.slice(0, 100)],
          mustNotFail: "—",
          mustWinStatus: pct != null && pct >= 90 ? "green" : pct != null && pct >= 70 ? "yellow" : "yellow",
          notFailStatus: "yellow",
        });
        break;
      }
    }

    const rev = parseRevenueWan(line);
    if (rev != null) {
      fpa.revenueBudget = rev;
      summary.push(`营收目标 ${rev} 万`);
    }
    if (/EBIT|EBITDA|利润/i.test(line)) {
      const pct = parsePercent(line);
      const wan = line.match(/(\d+(?:\.\d+)?)\s*万/);
      if (wan) fpa.profitBudget = Number(wan[1]);
      else if (pct != null && rev) fpa.profitBudget = Math.round(rev * (pct / 100));
      if (pct != null) summary.push(`利润/EBIT ${pct}%`);
    }
  }

  const uniqueBsc = [...new Map(bscRows.map((r) => [r.dim, r])).values()];

  return {
    intent,
    northStar,
    objectives,
    priorities,
    bscRows: uniqueBsc,
    fpa: Object.keys(fpa).length > 0 ? fpa : undefined,
    summary,
  };
}

async function extractPdfWithPython(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["-c", `import sys
from pypdf import PdfReader
from io import BytesIO
reader = PdfReader(BytesIO(sys.stdin.buffer.read()))
print("\\n".join((p.extract_text() or "") for p in reader.pages))`]);
    const chunks: Buffer[] = [];
    const err: Buffer[] = [];
    py.stdout.on("data", (d: Buffer) => chunks.push(d));
    py.stderr.on("data", (d: Buffer) => err.push(d));
    py.stdin.on("error", () => undefined);
    py.on("error", reject);
    py.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks).toString("utf8"));
      else reject(new Error(Buffer.concat(err).toString("utf8") || "pypdf failed"));
    });
    py.stdin.end(buffer);
  });
}

function ensurePdfJsPolyfills() {
  const global = globalThis as Record<string, unknown>;
  if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      inverse() { return this; }
      transformPoint(point?: { x?: number; y?: number }) {
        return { x: point?.x ?? 0, y: point?.y ?? 0, z: 0, w: 1 };
      }
    };
  }
  if (!global.ImageData) {
    global.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height = 0) {
        this.data = data;
        this.width = width;
        this.height = height || Math.floor(data.length / Math.max(width * 4, 1));
      }
    };
  }
  if (!global.Path2D) global.Path2D = class Path2D {};
}

async function extractPdfWithPdfJs(buffer: Buffer): Promise<string> {
  ensurePdfJsPolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfRoot = join(process.cwd(), "node_modules", "pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(join(pdfRoot, "legacy", "build", "pdf.worker.mjs")).href;
  const fileUrl = (path: string) => pathToFileURL(path.endsWith(sep) ? path : path + sep).href;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: fileUrl(join(pdfRoot, "standard_fonts")),
    cMapUrl: fileUrl(join(pdfRoot, "cmaps")),
    cMapPacked: true,
    wasmUrl: fileUrl(join(pdfRoot, "wasm")),
  });
  const pages: string[] = [];
  const pdf = await loadingTask.promise;
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) pages.push(`【PDF 第 ${pageNumber} 页】\n${text}`);
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }
  return pages.join("\n").trim();
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const text = await extractPdfWithPdfJs(buffer);
    if (text) return text;
  } catch {
    /* try pdf-parse fallback */
  }
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    if (result.text?.trim()) return result.text;
  } catch {
    /* try python fallback */
  }
  try {
    return await extractPdfWithPython(buffer);
  } catch {
    return "";
  }
}

export async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    for (const row of rows) {
      if (Array.isArray(row)) parts.push(row.filter(Boolean).join(" "));
    }
  }
  return parts.join("\n");
}

function decodeOfficeXml(xml: string): string {
  return xml
    .replace(/<\/(?:w:p|a:p|row|si)>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readOfficeXmlEntries(
  buffer: Buffer,
  matches: (name: string) => boolean,
): Promise<Array<{ name: string; text: string }>> {
  const { inflateRawSync } = await import("node:zlib");
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65558); index--) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) return [];

  const entries: Array<{ name: string; text: string }> = [];
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let index = 0; index < entryCount && offset < buffer.length - 46; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");

    if (matches(name) && compressedSize > 0 && buffer.readUInt32LE(localOffset) === 0x04034b50) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      try {
        const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
        const raw = method === 8 ? inflateRawSync(compressed) : compressed;
        entries.push({ name, text: raw.toString("utf8") });
      } catch {
        // Ignore a damaged entry and continue extracting the remaining document.
      }
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const entries = await readOfficeXmlEntries(buffer, (name) => name === "word/document.xml");
  return entries.map((entry) => decodeOfficeXml(entry.text)).join("\n").trim();
}

export async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  const entries = await readOfficeXmlEntries(buffer, (name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return entries
    .map((entry, index) => `【幻灯片 ${index + 1}】\n${decodeOfficeXml(entry.text)}`)
    .join("\n")
    .trim();
}

export type DocumentExtractionResult = {
  text: string;
  method: "embedded" | "ocr";
  model?: string;
  pageCount?: number;
};

function hasUsefulText(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 40) return false;
  const readable = (clean.match(/[\u3400-\u9fffA-Za-z0-9%.,，。；;：:、（）()【】\s\-_/]/g) ?? []).length;
  return readable / clean.length >= 0.6;
}

export async function extractTextFromDocumentDetailed(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  let text = "";
  if (ext === "pdf") text = await extractTextFromPdf(buffer);
  else if (ext === "xlsx" || ext === "xls") text = await extractTextFromXlsx(buffer);
  else if (ext === "docx") text = await extractTextFromDocx(buffer);
  else if (ext === "pptx") text = await extractTextFromPptx(buffer);
  else if (["txt", "md", "csv"].includes(ext)) text = buffer.toString("utf8");
  else throw new Error(`暂不支持 .${ext || "未知"} 文件，请上传 PDF、Word、PPT、Excel 或文本文件`);
  text = text.replace(/\u0000/g, "").trim().slice(0, 60000);
  if (ext === "pdf" && !hasUsefulText(text)) {
    const { ocrPdfWithBailian } = await import("./pdf-ocr");
    const ocr = await ocrPdfWithBailian(buffer);
    return { text: ocr.text.slice(0, 60000), method: "ocr", model: ocr.model, pageCount: ocr.pageCount };
  }
  return { text, method: "embedded" };
}

export async function extractTextFromDocument(buffer: Buffer, fileName: string): Promise<string> {
  return (await extractTextFromDocumentDetailed(buffer, fileName)).text;
}
