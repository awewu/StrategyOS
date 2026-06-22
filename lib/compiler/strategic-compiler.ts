/**
 * Strategic compiler — extract structured plan + BSC from raw text / PDF.
 */
import { spawn } from "node:child_process";
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
    py.on("error", reject);
    py.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks).toString("utf8"));
      else reject(new Error(Buffer.concat(err).toString("utf8") || "pypdf failed"));
    });
    py.stdin.write(buffer);
    py.stdin.end();
  });
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
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
