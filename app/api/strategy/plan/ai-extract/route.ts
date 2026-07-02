import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { llmConfigured } from "@/lib/stratos/llm-agent";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const runtime = "nodejs";

// ─── LLM helpers ─────────────────────────────────────────────────────────────
function apiKey() { return process.env.STRATOS_LLM_API_KEY ?? process.env.OPENAI_API_KEY; }
function baseUrl() { return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""); }
// 战略提取需要强推理，默认 gpt-4o；可用 STRATOS_LLM_EXTRACT_MODEL 单独覆盖
function llmModel() { return process.env.STRATOS_LLM_EXTRACT_MODEL ?? process.env.STRATOS_LLM_MODEL ?? "gpt-4o"; }
function supportsJsonResponseFormat() {
  return !/dashscope\.aliyuncs\.com/i.test(baseUrl());
}

async function callLlm(messages: { role: string; content: string }[]): Promise<string> {
  let res: Response;
  try {
    const payload: Record<string, unknown> = {
      model: llmModel(),
      temperature: 0.2,
      messages,
    };
    if (supportsJsonResponseFormat()) payload.response_format = { type: "json_object" };
    res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`LLM 服务连接失败：无法访问 ${baseUrl()}。请检查网络，或在 .env 配置可访问的 STRATOS_LLM_BASE_URL / OPENAI_BASE_URL。原始错误：${detail}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── File text extraction (OOXML zip + PDF best-effort) ──────────────────────
class ExtractionFailure extends Error {
  constructor(message: string, public readonly detail: Record<string, unknown> = {}) {
    super(message);
    this.name = "ExtractionFailure";
  }
}

function fileUrlForDir(path: string): string {
  return pathToFileURL(path.endsWith(sep) ? path : path + sep).href;
}

function decodeXmlText(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function readZipEntry(buf: Buffer, targetName: string): Promise<string> {
  const { inflateRawSync } = await import("node:zlib");
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) { offset++; continue; }
    const fnLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + fnLen).toString("utf8");
    const dataStart = offset + 30 + fnLen + extraLen;
    const compSize = buf.readUInt32LE(offset + 18);
    if (name === targetName && compSize > 0) {
      const compressed = buf.subarray(dataStart, dataStart + compSize);
      const raw = buf.readUInt16LE(offset + 8) === 8 ? inflateRawSync(compressed) : compressed;
      return raw.toString("utf8");
    }
    offset = dataStart + compSize;
  }
  return (await readZipEntriesFromCentralDirectory(buf, (name) => name === targetName))[0] ?? "";
}

async function readZipEntriesMatching(buf: Buffer, pattern: RegExp): Promise<string> {
  const { inflateRawSync } = await import("node:zlib");
  const parts: string[] = [];
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) { offset++; continue; }
    const fnLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + fnLen).toString("utf8");
    const dataStart = offset + 30 + fnLen + extraLen;
    const compSize = buf.readUInt32LE(offset + 18);
    if (pattern.test(name) && compSize > 0) {
      try {
        const compressed = buf.subarray(dataStart, dataStart + compSize);
        const raw = buf.readUInt16LE(offset + 8) === 8 ? inflateRawSync(compressed) : compressed;
        parts.push(raw.toString("utf8"));
      } catch { /* skip bad entry */ }
    }
    offset = dataStart + compSize;
  }
  if (parts.length > 0) return parts.join(" ");
  return (await readZipEntriesFromCentralDirectory(buf, (name) => pattern.test(name))).join(" ");
}

async function readZipEntriesFromCentralDirectory(buf: Buffer, match: (name: string) => boolean): Promise<string[]> {
  const { inflateRawSync } = await import("node:zlib");
  const parts: string[] = [];
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return parts;

  const entryCount = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < entryCount && offset < buf.length - 46; i++) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const fnLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.subarray(offset + 46, offset + 46 + fnLen).toString("utf8");

    if (match(name) && compressedSize > 0 && localOffset < buf.length - 30 && buf.readUInt32LE(localOffset) === 0x04034b50) {
      const localFnLen = buf.readUInt16LE(localOffset + 26);
      const localExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localFnLen + localExtraLen;
      const compressed = buf.subarray(dataStart, dataStart + compressedSize);
      try {
        const raw = method === 8 ? inflateRawSync(compressed) : compressed;
        parts.push(raw.toString("utf8"));
      } catch {
        /* skip bad entry */
      }
    }
    offset += 46 + fnLen + extraLen + commentLen;
  }
  return parts;
}

async function extractPdfText(buf: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfRoot = join(process.cwd(), "node_modules", "pdfjs-dist");
  const workerSrc = pathToFileURL(join(pdfRoot, "legacy", "build", "pdf.worker.mjs")).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buf),
    standardFontDataUrl: fileUrlForDir(join(pdfRoot, "standard_fonts")),
    cMapUrl: fileUrlForDir(join(pdfRoot, "cmaps")),
    cMapPacked: true,
    wasmUrl: fileUrlForDir(join(pdfRoot, "wasm")),
  });
  const pages: string[] = [];
  try {
    const pdfDoc = await loadingTask.promise;
    for (let pageNo = 1; pageNo <= pdfDoc.numPages; pageNo++) {
      const page = await pdfDoc.getPage(pageNo);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (pageText) pages.push(`【PDF第 ${pageNo} 页】${pageText}`);
      page.cleanup();
    }
    await pdfDoc.destroy();
  } catch (error) {
    throw new ExtractionFailure("PDF 文本解析失败", {
      parser: "pdfjs-dist",
      cwd: process.cwd(),
      workerSrc,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return pages.join("\n").replace(/\s+/g, " ").trim().slice(0, 60000);
}

async function extractTextFromFile(buf: Buffer, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  try {
    if (ext === "docx" || ext === "doc") {
      return (await readZipEntry(buf, "word/document.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60000);
    }
    if (ext === "xlsx" || ext === "xls") {
      return (await readZipEntry(buf, "xl/sharedStrings.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60000);
    }
    if (ext === "ppt" && buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
      throw new ExtractionFailure("暂不支持旧版 .ppt 二进制文件，请另存为 .pptx 或导出 PDF 后再上传。", {
        parser: "ppt-binary",
        ext,
      });
    }
    if (ext === "pptx" || ext === "ppt") {
      // 保留幻灯片编号顺序，每张用分隔符区分，方便LLM理解层级结构
      const { inflateRawSync } = await import("node:zlib");
      const slides: { idx: number; text: string }[] = [];
      let offset = 0;
      while (offset < buf.length - 30) {
        if (buf.readUInt32LE(offset) !== 0x04034b50) { offset++; continue; }
        const fnLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const name = buf.subarray(offset + 30, offset + 30 + fnLen).toString("utf8");
        const dataStart = offset + 30 + fnLen + extraLen;
        const compSize = buf.readUInt32LE(offset + 18);
        const m = name.match(/^ppt\/slides\/slide(\d+)\.xml$/);
        if (m && compSize > 0) {
          try {
            const compressed = buf.subarray(dataStart, dataStart + compSize);
            const raw = buf.readUInt16LE(offset + 8) === 8 ? inflateRawSync(compressed) : compressed;
            const text = decodeXmlText(raw.toString("utf8"));
            if (text) slides.push({ idx: parseInt(m[1]), text });
          } catch { /* skip bad slide */ }
        }
        offset = dataStart + compSize;
      }
      slides.sort((a, b) => a.idx - b.idx);
      return slides.map((s) => `【幻灯片 ${s.idx}】${s.text}`).join("\n").slice(0, 60000);
    }
    if (ext === "pdf") {
      return await extractPdfText(buf);
    }
  } catch (error) {
    if (error instanceof ExtractionFailure) throw error;
    console.error("File text extraction failed:", error);
  }
  return buf.toString("utf8", 0, Math.min(buf.length, 30000));
}

// ─── 两阶段 Prompt ────────────────────────────────────────────────────────────

// 第一阶段：降噪摘要 —— 把混乱原文浓缩成干净的战略信号文本
const ARRAY_FIELDS = [
  "objectives",
  "initiatives",
  "swotItems",
  "assumptions",
  "marketInsights",
  "actionItems",
  "budgetItems",
  "roadmapItems",
  "productQuarterly",
  "channelPlans",
  "customerPlans",
  "orgChartNodes",
] as const;

function parseJsonObject(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

function unwrapObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  let current = value as Record<string, unknown>;
  for (const key of ["extracted", "data", "result", "plan", "structured", "output", "tabs", "fields"]) {
    const nested = current[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      current = nested as Record<string, unknown>;
    }
  }
  return current;
}

function firstValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function objectText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return stringValue(value);
  return "";
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanLine(value: string): string {
  return compactText(value)
    .replace(/^[\s\-•·*●○◆◇▶>]+/, "")
    .replace(/^\d+[.)、]\s*/, "")
    .trim();
}

function meaningfulText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(meaningfulText).filter(Boolean).join(" ").trim();
  if (!value || typeof value !== "object") return "";
  return Object.values(value as Record<string, unknown>)
    .map(meaningfulText)
    .filter(Boolean)
    .join(" ")
    .trim();
}

function hasMeaningfulValue(value: unknown): boolean {
  return meaningfulText(value).length > 0;
}

function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyOf(item).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function normalizeDimension(value: unknown): string {
  const text = stringValue(value).toUpperCase();
  if (/FIN|财务|收入|利润|营收/.test(text)) return "FINANCIAL";
  if (/CUSTOMER|客户|市场|份额/.test(text)) return "CUSTOMER";
  if (/PROCESS|流程|运营|交付|效率/.test(text)) return "PROCESS";
  if (/LEARNING|学习|组织|人才|能力|创新/.test(text)) return "LEARNING";
  return "FINANCIAL";
}

function normalizeSwotQuadrant(value: unknown): "strength" | "weakness" | "opportunity" | "threat" {
  const text = stringValue(value).toLowerCase();
  if (/weak|劣势|短板|不足|瓶颈|问题|痛点/.test(text)) return "weakness";
  if (/opportun|机会|机遇|增长空间|趋势|需求/.test(text)) return "opportunity";
  if (/threat|威胁|风险|挑战|竞争|不确定/.test(text)) return "threat";
  return "strength";
}

function normalizeExtracted(value: unknown): Record<string, unknown> {
  const root = unwrapObject(value);
  const strategicIntent = unwrapObject(firstValue(root, ["strategicIntent", "intentTab", "strategy", "direction", "战略意图", "战略方向", "愿景使命"]));
  const market = unwrapObject(firstValue(root, ["market", "marketTab", "marketLandscape", "industry", "市场洞察", "市场分析", "行业分析"]));
  const swot = unwrapObject(firstValue(root, ["swot", "swotTab", "SWOT分析", "SWOT", "situation", "形势研判"]));
  const org = unwrapObject(firstValue(root, ["org", "organization", "people", "组织规划", "组织能力", "人才组织"]));

  const objectives = arrayValue(firstValue(root, ["objectives", "bscObjectives", "kpiObjectives", "kpis", "goals", "targets", "metrics", "目标", "BSC目标", "KPI", "经营目标", "战略目标", "年度目标"]));
  const initiatives = arrayValue(firstValue(root, ["initiatives", "okrInitiatives", "keyInitiatives", "strategicMoves", "priorities", "projects", "workstreams", "举措", "关键举措", "OKR", "策略", "重点工作", "重点任务", "战略动作", "项目"]));
  const swotItems = arrayValue(firstValue(root, ["swotItems", "SWOTItems", "swot", "SWOT", "swotAnalysis", "SWOT分析"]))
    .concat(arrayValue(firstValue(swot, ["items", "swotItems", "SWOTItems"])));
  const marketInsights = arrayValue(firstValue(root, ["marketInsights", "insights", "market", "marketTrends", "industryInsights", "市场洞察", "市场趋势", "行业趋势"]))
    .concat(arrayValue(firstValue(market, ["items", "insights", "marketInsights"])));

  return {
    intent: stringValue(firstValue(root, ["intent", "strategicIntent", "strategyIntent", "direction", "vision", "mission", "theme", "战略意图", "战略方向", "战略主题", "愿景", "使命"])) ||
      stringValue(firstValue(strategicIntent, ["intent", "content", "direction", "vision", "战略意图", "战略方向", "愿景"])),
    northStar: stringValue(firstValue(root, ["northStar", "northStarMetric", "coreMetric", "primaryTarget", "北极星指标", "核心指标", "关键目标"])) ||
      stringValue(firstValue(strategicIntent, ["northStar", "metric", "target", "北极星指标", "核心指标", "关键目标"])),
    objectives: objectives.map((item) => {
      const o = unwrapObject(item);
      const text = objectText(item);
      const keyResults = arrayValue(firstValue(o, ["keyResults", "krs", "KR", "关键结果", "metrics", "kpis", "指标"]));
      return {
        dimension: normalizeDimension(firstValue(o, ["dimension", "维度", "category", "类别"]) ?? text),
        objective: stringValue(firstValue(o, ["objective", "title", "goal", "target", "目标", "content", "内容", "description", "描述"])) || text,
        keyResults: keyResults.map((kr) => {
          const k = unwrapObject(kr);
          const krText = objectText(kr);
          return {
            keyResult: stringValue(firstValue(k, ["keyResult", "kr", "metric", "kpi", "name", "关键结果", "指标", "content", "内容"])) || krText,
            target: stringValue(firstValue(k, ["target", "目标值", "value", "指标值", "targetValue"])) || dataPointFromLine(krText),
          };
        }),
      };
    }).filter((o) => o.objective || o.keyResults.length),
    initiatives: initiatives.map((item) => {
      const i = unwrapObject(item);
      const text = objectText(item);
      return {
        title: stringValue(firstValue(i, ["title", "name", "workstream", "project", "举措标题", "关键举措", "举措", "content", "内容", "description", "描述"])) || text,
        ownerName: stringValue(firstValue(i, ["ownerName", "owner", "负责人"])),
        okrKeyResult: stringValue(firstValue(i, ["okrKeyResult", "keyResult", "KR", "关键结果"])),
        okrTarget: stringValue(firstValue(i, ["okrTarget", "target", "目标值"])),
        okrBaseline: stringValue(firstValue(i, ["okrBaseline", "baseline", "基线值"])),
        q1Milestone: stringValue(firstValue(i, ["q1Milestone", "Q1", "q1", "一季度"])),
        q2Milestone: stringValue(firstValue(i, ["q2Milestone", "Q2", "q2", "二季度"])),
        q3Milestone: stringValue(firstValue(i, ["q3Milestone", "Q3", "q3", "三季度"])),
        q4Milestone: stringValue(firstValue(i, ["q4Milestone", "Q4", "q4", "四季度"])),
      };
    }).filter((i) => i.title || i.okrKeyResult),
    swotItems: swotItems.map((item) => {
      const s = unwrapObject(item);
      const text = objectText(item);
      return {
        quadrant: normalizeSwotQuadrant(firstValue(s, ["quadrant", "type", "category", "象限", "类型"]) ?? text),
        content: stringValue(firstValue(s, ["content", "description", "内容", "描述", "point"])) || text,
      };
    }).filter((s) => s.content),
    assumptions: arrayValue(firstValue(root, ["assumptions", "关键假设", "hypotheses"])).map((item) => {
      const a = unwrapObject(item);
      const text = objectText(item);
      return {
        assumption: stringValue(firstValue(a, ["assumption", "content", "假设", "内容", "description", "描述"])) || text,
        critical: Boolean(firstValue(a, ["critical", "isCritical", "关键"])),
      };
    }).filter((a) => a.assumption),
    marketInsights: marketInsights.map((item) => {
      const m = unwrapObject(item);
      const text = objectText(item);
      return {
        category: stringValue(firstValue(m, ["category", "type", "类别", "类型"])) || (/(客户|人才)/.test(text) ? "CUSTOMER" : "TREND"),
        title: stringValue(firstValue(m, ["title", "conclusion", "标题", "结论"])) || text.slice(0, 60),
        content: stringValue(firstValue(m, ["content", "description", "内容", "描述"])) || text,
        dataPoint: stringValue(firstValue(m, ["dataPoint", "data", "metric", "数据点", "关键数据"])) || dataPointFromLine(text),
        source: stringValue(firstValue(m, ["source", "来源"])) || "original document",
      };
    }).filter((m) => m.title || m.content || m.dataPoint),
    actionItems: arrayValue(firstValue(root, ["actionItems", "actions", "workplan", "executionPlan", "作战计划", "行动计划", "实施计划", "重点工作"])),
    budgetItems: arrayValue(firstValue(root, ["budgetItems", "budgets", "resources", "investment", "资源预算", "预算", "资源投入", "投资"])),
    roadmapItems: arrayValue(firstValue(root, ["roadmapItems", "roadmap", "timeline", "milestones", "路线图", "时间表", "里程碑"])),
    productQuarterly: arrayValue(firstValue(root, ["productQuarterly", "products", "portfolio", "产品季度", "产品计划", "产品组合"])),
    channelPlans: arrayValue(firstValue(root, ["channelPlans", "channels", "goToMarket", "gtm", "渠道发展", "渠道计划", "销售网络", "GTM"])),
    customerPlans: arrayValue(firstValue(root, ["customerPlans", "customers", "segments", "accounts", "客户发展", "客户计划", "客户群", "大客户"])),
    orgChartNodes: arrayValue(firstValue(root, ["orgChartNodes", "orgNodes", "organization", "组织规划"]))
      .concat(arrayValue(firstValue(org, ["nodes", "orgChartNodes", "items"]))).map((item) => {
        const n = unwrapObject(item);
        const text = objectText(item);
        return {
          name: stringValue(firstValue(n, ["name", "title", "department", "roleName", "部门", "岗位", "名称"])) || text.slice(0, 40),
          role: stringValue(firstValue(n, ["role", "description", "职责", "职能", "内容"])) || text,
          headcount: stringValue(firstValue(n, ["headcount", "hc", "HC", "编制", "人数"])),
          headcountNew: stringValue(firstValue(n, ["headcountNew", "newHeadcount", "新增编制", "新增人数"])),
          note: stringValue(firstValue(n, ["note", "备注"])),
        };
      }).filter((n) => n.name || n.role),
  };
}

function hasExtractedContent(extracted: Record<string, unknown>): boolean {
  if (stringValue(extracted.intent)) return true;
  if (stringValue(extracted.northStar)) return true;
  return ARRAY_FIELDS.some((key) => arrayValue(extracted[key]).some(hasMeaningfulValue));
}

function linesFromText(text: string): string[] {
  return text
    .replace(/【(幻灯片|PDF第)\s*\d+\s*页?】/g, "\n$& ")
    .replace(/\s+(?=(?:业务战略|组织战略|人才体系|激励机制|文化基座|集团化运营|双总部架构|销售突破|利润率突破|战略目标|战略举措|关键举措|能力建设))/g, "\n")
    .split(/\n|。|；|;|\r/)
    .map(cleanLine)
    .flatMap((line) => line.length > 180 ? line.match(/.{1,160}(?=\s|$)|.{1,160}/g) ?? [] : [line])
    .map(cleanLine)
    .filter((line) => line.length >= 4 && line.length <= 180)
    .filter((line) => !/^(目录|contents?|谢谢|thank|confidential|page\s*\d+|第\s*\d+\s*页)$/i.test(line));
}

function dataPointFromLine(line: string): string {
  return line.match(/(?:\d+(?:\.\d+)?\s*(?:%|pct|pp|个点|亿|万|万元|亿元|人|家|个|台|套|倍|年|月|Q[1-4])|20\d{2})/i)?.[0] ?? "";
}

function quarterFromLine(line: string, fallback: number): number {
  const q = line.match(/Q([1-4])|([一二三四])季度/i);
  if (!q) return fallback;
  if (q[1]) return Number(q[1]);
  const zh: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 };
  return zh[q[2]] ?? fallback;
}

function heuristicExtract(text: string): Record<string, unknown> {
  const lines = linesFromText(text);
  const intentLine = lines.find((line) => /(从业务战略到组织战略|业务战略|组织战略|战略|愿景|使命|方向|定位|目标|成为|打造|构建|聚焦|转型|增长)/.test(line) && !/(目录|背景|复盘)/.test(line));
  const northStarLine = lines.find((line) => /(收入|营收|利润|市占|份额|增长|GMV|ARR|用户|客户|覆盖|NPS|毛利|EBIT|ROS|ROI).*(\d|%|亿|万)/i.test(line));

  const marketInsights = uniqueBy(lines
    .filter((line) => /(市场|行业|客户|竞争|趋势|需求|机会|技术|政策|价格|份额|规模|TAM|SAM|SOM)/i.test(line))
    .slice(0, 8)
    .map((line) => ({
      category: /(竞争|竞品|对手)/.test(line) ? "COMPETE" : /(客户|用户|客群)/.test(line) ? "CUSTOMER" : /(技术|研发|AI|数字化)/i.test(line) ? "TECH" : "TREND",
      title: line.slice(0, 60),
      content: line,
      dataPoint: dataPointFromLine(line),
      source: "original document",
    })), (item) => item.content);

  const objectiveLines = uniqueBy(lines
    .filter((line) => /(目标|指标|KPI|收入|营收|销售|利润|利润率|份额|增长|效率|交付|质量|组织|人才|研发|创新).*(\d|%|提升|降低|达到|完成|实现|突破|成为)/i.test(line))
    .slice(0, 8), (line) => line);
  const objectives = objectiveLines.map((line) => ({
    dimension: normalizeDimension(line),
    objective: line,
    keyResults: dataPointFromLine(line) ? [{ keyResult: line.replace(dataPointFromLine(line), "").trim(), target: dataPointFromLine(line) }] : [],
  }));

  const initiatives = uniqueBy(lines
    .filter((line) => /(举措|策略|重点|任务|项目|建设|推进|落地|实施|提升|优化|拓展|打造|构建|上线|导入|转型|集团化运营|双总部|人才体系|激励机制|文化基座|组织能力)/.test(line))
    .filter((line) => !/(市场趋势|行业趋势|目录)/.test(line))
    .slice(0, 10)
    .map((line) => ({
      title: line.slice(0, 80),
      ownerName: line.match(/(?:负责人|Owner|owner)[:：]\s*([\u4e00-\u9fa5A-Za-z0-9_-]{2,12})/)?.[1] ?? "",
      okrKeyResult: dataPointFromLine(line) ? line : "",
      okrTarget: dataPointFromLine(line),
      okrBaseline: "",
      q1Milestone: /Q1|一季度/.test(line) ? line : "",
      q2Milestone: /Q2|二季度/.test(line) ? line : "",
      q3Milestone: /Q3|三季度/.test(line) ? line : "",
      q4Milestone: /Q4|四季度/.test(line) ? line : "",
    })), (item) => item.title);

  const swotItems = uniqueBy(lines
    .filter((line) => /(优势|劣势|短板|不足|机会|机遇|威胁|风险|挑战|能力|壁垒|瓶颈)/.test(line))
    .slice(0, 8)
    .map((line) => ({ quadrant: normalizeSwotQuadrant(line), content: line })), (item) => item.content);

  const assumptions = uniqueBy(lines
    .filter((line) => /(假设|前提|依赖|如果|预计|预期|判断|可能|风险)/.test(line))
    .slice(0, 6)
    .map((line) => ({ assumption: line, critical: /(关键|核心|必须|重大|高风险)/.test(line) })), (item) => item.assumption);

  const roadmapItems = uniqueBy(lines
    .filter((line) => /(20\d{2}|Q[1-4]|一季度|二季度|三季度|四季度|阶段|里程碑|上线|发布|交付)/i.test(line))
    .slice(0, 8)
    .map((line) => ({
      track: /(产品|SKU|平台)/.test(line) ? "产品" : /(组织|人才|团队)/.test(line) ? "组织" : /(技术|研发|系统|数字化)/.test(line) ? "技术" : /(渠道|经销|销售)/.test(line) ? "渠道" : "举措",
      title: line.slice(0, 60),
      startYear: Number(line.match(/20\d{2}/)?.[0] ?? 2026),
      startQ: quarterFromLine(line, 1),
      endYear: Number(line.match(/20\d{2}/)?.[0] ?? 2026),
      endQ: quarterFromLine(line, 4),
      milestone: line,
      color: "",
    })), (item) => item.milestone);

  const orgLines = uniqueBy(lines
    .filter((line) => /(组织战略|组织规划|组织能力|组织架构|人才体系|激励机制|文化基座|集团化运营|双总部|总部架构|岗位|编制|人力|HR|人力资源)/i.test(line))
    .slice(0, 8), (line) => line);
  const orgChartNodes = orgLines.map((line) => ({
    name: line.match(/(人才体系|激励机制|文化基座|集团化运营|双总部架构|组织能力|组织战略|人力资源|HR)/i)?.[0] ?? line.slice(0, 30),
    role: line,
    headcount: dataPointFromLine(line).includes("人") ? dataPointFromLine(line) : "",
    headcountNew: "",
    note: "",
  }));

  return {
    intent: intentLine?.slice(0, 90) ?? "",
    northStar: northStarLine ?? "",
    objectives,
    initiatives,
    swotItems,
    assumptions,
    marketInsights,
    actionItems: initiatives.slice(0, 6).map((item) => ({
      initiativeTitle: item.title,
      year: 2026,
      quarter: 1,
      action: item.title,
      ownerName: item.ownerName,
      acceptanceCriteria: item.okrTarget ? `达到 ${item.okrTarget}` : "",
      checkDate: "",
      status: "PLAN",
    })),
    budgetItems: [],
    roadmapItems,
    productQuarterly: [],
    channelPlans: [],
    customerPlans: [],
    orgChartNodes,
  };
}

function compactExtracted(extracted: Record<string, unknown>): Record<string, unknown> {
  const compacted: Record<string, unknown> = { ...extracted };
  for (const key of ARRAY_FIELDS) {
    compacted[key] = arrayValue(compacted[key]).filter(hasMeaningfulValue);
  }
  return compacted;
}

function mergeExtracted(primary: Record<string, unknown>, fallback: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = compactExtracted(primary);
  const cleanFallback = compactExtracted(fallback);
  for (const key of ["intent", "northStar"]) {
    if (!stringValue(merged[key])) merged[key] = stringValue(cleanFallback[key]);
  }
  for (const key of ARRAY_FIELDS) {
    const existing = arrayValue(merged[key]);
    const extra = arrayValue(cleanFallback[key]);
    if (existing.length === 0 && extra.length > 0) merged[key] = extra;
  }
  return merged;
}

const STAGE1_SYSTEM = `你是一位资深战略顾问。用户上传的是企业内部战略PPT、年度规划或战略报告的原始文字提取内容，可能包含大量噪音（封面、目录、页码、装饰性文字、重复标题、图表注释等）。

你的任务：先理解每页/每段的表达意图，再输出一份干净的「战略信号摘要」（纯文本，约1200-2200字）。
不要依赖固定模板关键词；用户PPT可能把同一类内容写成「战略主题」「年度重点」「打法」「增长抓手」「经营计划」「行动方案」「能力建设」等。

请按语义归类保留以下信息，尽量带上原文措辞、数字、时间、责任主体和页码/章节线索：
- 战略方向、愿景、使命
- 量化目标、KPI、收入/市占/增长目标
- 具体举措、项目名称、负责人
- 市场数据、竞争格局、客户信息
- 时间节点、里程碑、季度计划
- 预算金额、资源配置
- 组织变化、渠道策略、产品计划
- 问题/短板、机会/风险、关键假设

过滤掉：封面文字、目录、"汇报人：XXX"、"机密"、"版权"、重复的公司名称、无意义的装饰文字。
如果某页没有标准标题，也要根据内容意图判断它可能对应哪个模块，不能只因为没有关键词就丢弃。

直接输出摘要文本，不要任何解释。`;

const STAGE1_PROMPT = (text: string) => `
请提炼以下战略文件的核心战略信号（文件总长 ${text.length} 字符）：

${text.slice(0, 40000)}
`;

// 第二阶段：结构化提取 —— 用干净摘要精准填充14个模块
const STAGE2_SYSTEM = `你是一位资深战略顾问，精通 BSC（平衡计分卡）、OKR、SWOT、TAM/SAM/SOM 等战略框架。
你将收到一份已经过降噪处理的战略信号摘要，从中精准提取结构化信息。

提取规则：
0. 不要按模板标题机械匹配；按意图映射。比如「年度重点/打法/抓手/项目群」通常是 initiatives 或 actionItems；「经营指标/承诺/三年目标」通常是 objectives/northStar；「形势/外部环境/客户变化」通常是 marketInsights 或 SWOT。
1. **intent**：一句话概括3-5年战略方向，保留原文关键词，≤60字
2. **northStar**：最核心的量化目标，如"3年收入达XX亿"
3. **objectives**：BSC/KPI 管理，严格按 FINANCIAL/CUSTOMER/PROCESS/LEARNING 四维度分类；objective 是该维度的管理目标，keyResults 是 KPI 指标及目标值，不要放 OKR 举措
4. **initiatives**：OKR/关键举措管理；每项 initiative 是一个 Objective / 关键举措，关联负责人、Key Result、基线、目标值、季度里程碑
5. **swotItems**：即使摘要未明确写SWOT，也从语境推断四象限
6. **marketInsights**：市场规模数据、趋势、竞争、客户，标注原文数据来源
7. **actionItems**：有时间节点的具体行动，关联举措，写验收标准
8. **budgetItems**：投资金额、资源，分CAPEX/OPEX/HC类
9. **roadmapItems**：时间线节点，标注track
10. 文档没有的信息 → 返回 []，**绝不捏造**
11. 如果 PPT 内容只给了松散 bullets，也要尽量把可识别内容填入最接近的字段；字段值可以是原文短句。
12. 只输出 JSON，不要解释`;

const STAGE2_PROMPT = (summary: string) => `
Strict field mapping contract:
- intent tab: intent is the strategic intent sentence; northStar is the measurable north-star metric.
- objectives tab is BSC/KPI management only: objectives[].dimension must be FINANCIAL, CUSTOMER, PROCESS, or LEARNING; objective is the BSC management objective; keyResults[].keyResult is a KPI metric name/definition; keyResults[].target is the KPI target value. Do not put OKR initiatives here.
- initiatives tab is OKR/key initiative management: initiatives[].title is the Objective/key initiative; ownerName is owner; okrKeyResult is the Key Result; okrTarget is target value; okrBaseline is baseline; q1Milestone, q2Milestone, q3Milestone, q4Milestone are quarterly milestones.
- market tab: marketInsights[].category must be TAM, SAM, SOM, TREND, CUSTOMER, TECH, or COMPETE; title is the conclusion; content is the supporting insight; dataPoint is a number, ratio, market size, growth rate, or other evidence; source is the source section/page/report from the uploaded file or "original document".
- SWOT tab: swotItems[].quadrant must be strength, weakness, opportunity, or threat; content is one concrete fact or judgment for that quadrant.
- action tab: actionItems[].initiativeTitle, year, quarter, action, ownerName, acceptanceCriteria, checkDate, status map to the action plan table; year must be 2026-2028, quarter 1-4, status PLAN unless source says otherwise.
- product tab: productQuarterly[].productName, unit, q1Qty, q1Revenue, q2Qty, q2Revenue, q3Qty, q3Revenue, q4Qty, q4Revenue, annualQty, annualRevenue, note map to the product quarterly table.
- channel tab: channelPlans[].channelType, currentState, targetState, q1Action, q2Action, q3Action, q4Action, revenueTarget, partnerCount, note map to the channel plan table.
- customer tab: customerPlans[].customerSegment, isNew, currentCount, targetCount, q1Count, q2Count, q3Count, q4Count, revenuePerCustomer, acquisitionStrategy, retentionStrategy, note map to the customer plan table.
- org tab: orgChartNodes[].name, role, headcount, headcountNew, note map to the organization plan table.
- budget tab: budgetItems[].category must be CAPEX, OPEX, or HC; initiativeTitle, department, description, year1Amount, year2Amount, year3Amount, totalAmount, roiEstimate, justification map to the budget table.
- roadmap tab: roadmapItems[].track, title, startYear, startQ, endYear, endQ, milestone, color map to the roadmap table.
- assumptions tab: assumptions[].assumption and critical map to key assumptions.
Only return values that can be extracted or reasonably inferred for these exact fields. Return [] or "" for missing fields; do not invent facts.
请从以下战略信号摘要中提取结构化信息，输出严格 JSON（找不到留空字符串，无法提取留[]）：
{
  "intent": "三年战略意图一句话",
  "northStar": "北极星指标",
  "objectives": [
    { "dimension": "FINANCIAL|CUSTOMER|PROCESS|LEARNING", "objective": "目标描述",
      "keyResults": [{ "keyResult": "KPI指标", "target": "KPI目标值" }] }
  ],
  "initiatives": [
    { "title": "Objective/关键举措", "ownerName": "负责人",
      "okrKeyResult": "Key Result", "okrTarget": "目标值", "okrBaseline": "基线值",
      "q1Milestone": "Q1里程碑", "q2Milestone": "Q2里程碑",
      "q3Milestone": "Q3里程碑", "q4Milestone": "Q4里程碑" }
  ],
  "swotItems": [{ "quadrant": "strength|weakness|opportunity|threat", "content": "描述" }],
  "assumptions": [{ "assumption": "假设描述", "critical": true }],
  "marketInsights": [
    { "category": "TAM|SAM|SOM|TREND|CUSTOMER|TECH|COMPETE",
      "title": "一句话结论", "content": "详细描述", "dataPoint": "关键数据点", "source": "来源" }
  ],
  "actionItems": [
    { "initiativeTitle": "关联举措", "year": 2026, "quarter": 1,
      "action": "具体行动", "ownerName": "负责人", "acceptanceCriteria": "验收标准", "checkDate": "MM-DD", "status": "PLAN" }
  ],
  "budgetItems": [
    { "category": "CAPEX|OPEX|HC", "initiativeTitle": "关联举措", "department": "部门",
      "description": "项目描述", "year1Amount": "", "year2Amount": "", "year3Amount": "",
      "totalAmount": "", "roiEstimate": "", "justification": "" }
  ],
  "roadmapItems": [
    { "track": "举措|产品|组织|技术|渠道", "title": "节点名称",
      "startYear": 2026, "startQ": 1, "endYear": 2026, "endQ": 4, "milestone": "关键里程碑", "color": "" }
  ],
  "productQuarterly": [
    { "productName": "产品名", "unit": "单位",
      "q1Qty": "", "q1Revenue": "", "q2Qty": "", "q2Revenue": "",
      "q3Qty": "", "q3Revenue": "", "q4Qty": "", "q4Revenue": "", "annualRevenue": "" }
  ],
  "channelPlans": [
    { "channelType": "渠道类型", "currentState": "现状", "targetState": "目标",
      "revenueTarget": "", "q1Action": "", "q2Action": "", "q3Action": "", "q4Action": "" }
  ],
  "customerPlans": [
    { "customerSegment": "客户类型", "isNew": false, "currentCount": "", "targetCount": "",
      "acquisitionStrategy": "", "retentionStrategy": "" }
  ],
  "orgChartNodes": [{ "name": "部门/岗位名", "role": "职能描述", "headcount": "", "headcountNew": "" }]
}

战略信号摘要：
${summary}
`;

// ─── Route handler ────────────────────────────────────────────────────────────
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  if (!llmConfigured()) {
    return NextResponse.json(
      { error: "LLM 未配置，请先配置 OPENAI_API_KEY。", llmAvailable: false },
      { status: 503 },
    );
  }

  let text = "";
  let sourceMeta: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // ── 文件上传模式 ──
    let formData: FormData;
    try { formData = await req.formData(); }
    catch { return NextResponse.json({ error: "无法解析上传文件" }, { status: 400 }); }

    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "未找到上传文件（字段名：file）" }, { status: 400 });

    const ALLOWED = /\.(docx?|xlsx?|pptx?|pdf)$/i;
    if (!ALLOWED.test(file.name)) {
      return NextResponse.json({ error: "仅支持 docx/xlsx/pptx/pdf 格式" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "文件不得超过 20 MB" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    sourceMeta = {
      filename: file.name,
      ext,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
    };
    try {
      text = await extractTextFromFile(buf, file.name);
    } catch (error) {
      const debugId = `extract-${Date.now().toString(36)}`;
      const detail = error instanceof ExtractionFailure ? error.detail : {};
      const message = error instanceof Error ? error.message : "无法从文件中提取文字内容";
      console.error("AI extract file text failure:", { debugId, ...sourceMeta, detail, error });
      return NextResponse.json({
        error: `${message}（${file.name}，${ext || "未知格式"}，debugId: ${debugId}）`,
        debugId,
        detail: { ...sourceMeta, ...detail },
      }, { status: 422 });
    }

    if (!text || text.length < 50) {
      const debugId = `extract-${Date.now().toString(36)}`;
      console.error("AI extract empty text:", { debugId, ...sourceMeta, extractedLength: text?.length ?? 0, preview: text?.slice(0, 120) });
      return NextResponse.json({
        error: `无法从文件中提取足够文字内容（${file.name}，${ext || "未知格式"}，已提取 ${text?.length ?? 0} 字，debugId: ${debugId}）。请确认文件不是扫描图片，或另存为 .pptx / PDF 后重试。`,
        debugId,
        detail: { ...sourceMeta, extractedLength: text?.length ?? 0 },
      }, { status: 422 });
    }
  } else {
    // ── JSON 文本模式（兼容旧调用）──
    let body: { text?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "无效 JSON" }, { status: 400 }); }

    text = body.text?.trim() ?? "";
    if (text.length < 50) {
      return NextResponse.json({ error: "文本内容太短，至少 50 字" }, { status: 400 });
    }
  }

  try {
    const heuristic = heuristicExtract(text);

    // ── 第一阶段：降噪摘要 ──────────────────────────────────────────────────
    const summary = await callLlm([
      { role: "system", content: STAGE1_SYSTEM },
      { role: "user", content: STAGE1_PROMPT(text) },
    ]);
    if (!summary || summary.trim().length < 30) {
      return NextResponse.json({ error: "文件内容过少，无法提取战略信息" }, { status: 422 });
    }

    // ── 第二阶段：结构化提取 ─────────────────────────────────────────────────
    const raw = await callLlm([
      { role: "system", content: STAGE2_SYSTEM },
      { role: "user", content: STAGE2_PROMPT(summary) },
    ]);

    let extracted: Record<string, unknown>;
    try {
      extracted = normalizeExtracted(parseJsonObject(raw));
    } catch {
      return NextResponse.json({ error: "LLM 返回格式异常，请重试", raw }, { status: 422 });
    }
    extracted = mergeExtracted(extracted, heuristic);

    if (!hasExtractedContent(extracted)) {
      const retryRaw = await callLlm([
        { role: "system", content: "Return only valid JSON. Use exactly these top-level keys: intent, northStar, objectives, initiatives, swotItems, assumptions, marketInsights, actionItems, budgetItems, roadmapItems, productQuarterly, channelPlans, customerPlans, orgChartNodes. Do not wrap the JSON in another object." },
        { role: "user", content: `Extract at least the fields that are clearly present from this strategy summary. Infer the user's intent from non-standard headings and bullets. Use [] for missing arrays and "" for missing strings.\n\n${STAGE2_PROMPT(summary)}\n\nOriginal extracted text excerpt for intent clues:\n${text.slice(0, 12000)}` },
      ]);
      try {
        extracted = mergeExtracted(normalizeExtracted(parseJsonObject(retryRaw)), heuristic);
      } catch {
        return NextResponse.json({ error: "LLM 返回格式异常，请重试", raw: retryRaw }, { status: 422 });
      }
    }

    return NextResponse.json({ ok: true, extracted, summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM 调用失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
