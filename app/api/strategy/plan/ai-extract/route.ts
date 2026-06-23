import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { llmConfigured } from "@/lib/stratos/llm-agent";

export const runtime = "nodejs";

// ─── LLM helpers ─────────────────────────────────────────────────────────────
function apiKey() { return process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY; }
function baseUrl() { return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""); }
function llmModel() { return process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini"; }

async function callLlm(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: llmModel(), temperature: 0.1, response_format: { type: "json_object" }, messages }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── File text extraction (OOXML zip + PDF best-effort) ──────────────────────
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
  return "";
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
  return parts.join(" ");
}

async function extractTextFromFile(buf: Buffer, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  try {
    if (ext === "docx" || ext === "doc") {
      return (await readZipEntry(buf, "word/document.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40000);
    }
    if (ext === "xlsx" || ext === "xls") {
      return (await readZipEntry(buf, "xl/sharedStrings.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40000);
    }
    if (ext === "pptx" || ext === "ppt") {
      return (await readZipEntriesMatching(buf, /^ppt\/slides\/slide\d+\.xml$/))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40000);
    }
    if (ext === "pdf") {
      // Best-effort: extract readable ASCII text from PDF binary
      return buf.toString("latin1")
        .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, " ")
        .replace(/\s+/g, " ").trim().slice(0, 20000);
    }
  } catch { /* best-effort */ }
  return buf.toString("utf8", 0, Math.min(buf.length, 20000));
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
const EXTRACT_SYSTEM = `你是战略编制助手。用户提供战略文件/PPT/报告原文，
你需要从中提取结构化战略信息，输出严格 JSON，不要输出任何其他内容。`;

const EXTRACT_PROMPT = (text: string) => `
从以下战略文件中提取信息，输出严格 JSON，结构如下（找不到的字段留空字符串，数组留空数组）：
{
  "intent": "三年战略意图一句话",
  "northStar": "北极星指标",
  "objectives": [
    { "dimension": "FINANCIAL|CUSTOMER|PROCESS|LEARNING", "objective": "目标描述",
      "keyResults": [{ "keyResult": "KR描述", "target": "目标值" }] }
  ],
  "initiatives": [
    { "title": "举措标题", "ownerName": "负责人",
      "okrKeyResult": "关键成果描述", "okrTarget": "目标值", "okrBaseline": "基线值",
      "q1Milestone": "Q1里程碑", "q2Milestone": "Q2里程碑",
      "q3Milestone": "Q3里程碑", "q4Milestone": "Q4里程碑" }
  ],
  "swotItems": [
    { "quadrant": "strength|weakness|opportunity|threat", "content": "描述" }
  ],
  "assumptions": [{ "assumption": "假设描述", "critical": true }],
  "marketInsights": [
    { "category": "TAM|SAM|SOM|TREND|CUSTOMER|TECH|COMPETE",
      "title": "一句话结论", "content": "详细描述",
      "dataPoint": "关键数据点", "source": "数据来源" }
  ],
  "actionItems": [
    { "initiativeTitle": "关联举措", "year": 2026, "quarter": 1,
      "action": "具体行动", "ownerName": "负责人",
      "acceptanceCriteria": "验收标准", "checkDate": "MM-DD", "status": "PLAN" }
  ],
  "budgetItems": [
    { "category": "CAPEX|OPEX|HC", "initiativeTitle": "关联举措", "department": "部门",
      "description": "项目描述", "year1Amount": "", "year2Amount": "", "year3Amount": "",
      "totalAmount": "", "roiEstimate": "", "justification": "" }
  ],
  "roadmapItems": [
    { "track": "举措|产品|组织|技术|渠道", "title": "节点名称",
      "startYear": 2026, "startQ": 1, "endYear": 2026, "endQ": 4,
      "milestone": "关键里程碑", "color": "" }
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
    { "customerSegment": "客户类型", "isNew": false,
      "currentCount": "", "targetCount": "",
      "acquisitionStrategy": "", "retentionStrategy": "" }
  ],
  "orgChartNodes": [
    { "name": "部门/岗位名", "role": "职能描述", "headcount": "", "headcountNew": "" }
  ]
}

只输出 JSON，不要有任何注释或说明文字。

文件内容：
${text.slice(0, 14000)}
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
    text = await extractTextFromFile(buf, file.name);

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "无法从文件中提取文字内容，请尝试粘贴文本" }, { status: 422 });
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
    const raw = await callLlm([
      { role: "system", content: EXTRACT_SYSTEM },
      { role: "user", content: EXTRACT_PROMPT(text) },
    ]);

    let extracted: Record<string, unknown> = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "LLM 返回格式异常，请重试", raw }, { status: 422 });
    }

    return NextResponse.json({ ok: true, extracted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM 调用失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
