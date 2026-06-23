import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { llmConfigured } from "@/lib/stratos/llm-agent";

export const runtime = "nodejs";

// ─── LLM helpers ─────────────────────────────────────────────────────────────
function apiKey() { return process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY; }
function baseUrl() { return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""); }
// 战略提取需要强推理，默认 gpt-4o；可用 STRATOS_LLM_EXTRACT_MODEL 单独覆盖
function llmModel() { return process.env.STRATOS_LLM_EXTRACT_MODEL ?? process.env.STRATOS_LLM_MODEL ?? "gpt-4o"; }

async function callLlm(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: llmModel(), temperature: 0.2, response_format: { type: "json_object" }, messages }),
    signal: AbortSignal.timeout(90000),
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
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60000);
    }
    if (ext === "xlsx" || ext === "xls") {
      return (await readZipEntry(buf, "xl/sharedStrings.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60000);
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
            const text = raw.toString("utf8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (text) slides.push({ idx: parseInt(m[1]), text });
          } catch { /* skip bad slide */ }
        }
        offset = dataStart + compSize;
      }
      slides.sort((a, b) => a.idx - b.idx);
      return slides.map((s) => `【幻灯片 ${s.idx}】${s.text}`).join("\n").slice(0, 60000);
    }
    if (ext === "pdf") {
      // 用 pdf-parse 正确提取中文PDF文本
      try {
        const pdfMod = await import("pdf-parse");
        const pdfParse = (pdfMod as unknown as { default: (buf: Buffer) => Promise<{ text: string }> }).default ?? pdfMod;
        const result = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buf);
        return result.text.replace(/\s+/g, " ").trim().slice(0, 60000);
      } catch {
        // fallback：latin1 ASCII 粗提取
        return buf.toString("latin1")
          .replace(/[^\x20-\x7E]/g, " ")
          .replace(/\s+/g, " ").trim().slice(0, 30000);
      }
    }
  } catch { /* best-effort */ }
  return buf.toString("utf8", 0, Math.min(buf.length, 30000));
}

// ─── 两阶段 Prompt ────────────────────────────────────────────────────────────

// 第一阶段：降噪摘要 —— 把混乱原文浓缩成干净的战略信号文本
const STAGE1_SYSTEM = `你是一位资深战略顾问。用户上传的是企业内部战略PPT、年度规划或战略报告的原始文字提取内容，可能包含大量噪音（封面、目录、页码、装饰性文字、重复标题、图表注释等）。

你的任务：阅读全部内容，输出一份干净的「战略信号摘要」（纯文本，约800-1500字），只保留以下有价值的信息：
- 战略方向、愿景、使命
- 量化目标、KPI、收入/市占/增长目标
- 具体举措、项目名称、负责人
- 市场数据、竞争格局、客户信息
- 时间节点、里程碑、季度计划
- 预算金额、资源配置
- 组织变化、渠道策略、产品计划

过滤掉：封面文字、目录、"汇报人：XXX"、"机密"、"版权"、重复的公司名称、无意义的装饰文字。

直接输出摘要文本，不要任何解释。`;

const STAGE1_PROMPT = (text: string) => `
请提炼以下战略文件的核心战略信号（文件总长 ${text.length} 字符）：

${text.slice(0, 40000)}
`;

// 第二阶段：结构化提取 —— 用干净摘要精准填充14个模块
const STAGE2_SYSTEM = `你是一位资深战略顾问，精通 BSC（平衡计分卡）、OKR、SWOT、TAM/SAM/SOM 等战略框架。
你将收到一份已经过降噪处理的战略信号摘要，从中精准提取结构化信息。

提取规则：
1. **intent**：一句话概括3-5年战略方向，保留原文关键词，≤60字
2. **northStar**：最核心的量化目标，如"3年收入达XX亿"
3. **objectives**：严格按 FINANCIAL/CUSTOMER/PROCESS/LEARNING 四维度分类，每维1-3个，含KR
4. **initiatives**：具体举措，关联负责人、OKR成果、季度里程碑（从摘要中推断Q1-Q4节点）
5. **swotItems**：即使摘要未明确写SWOT，也从语境推断四象限
6. **marketInsights**：市场规模数据、趋势、竞争、客户，标注原文数据来源
7. **actionItems**：有时间节点的具体行动，关联举措，写验收标准
8. **budgetItems**：投资金额、资源，分CAPEX/OPEX/HC类
9. **roadmapItems**：时间线节点，标注track
10. 文档没有的信息 → 返回 []，**绝不捏造**
11. 只输出 JSON，不要解释`;

const STAGE2_PROMPT = (summary: string) => `
请从以下战略信号摘要中提取结构化信息，输出严格 JSON（找不到留空字符串，无法提取留[]）：
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

    let extracted: Record<string, unknown> = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "LLM 返回格式异常，请重试", raw }, { status: 422 });
    }

    return NextResponse.json({ ok: true, extracted, summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM 调用失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
