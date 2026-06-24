import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { llmConfigured } from "@/lib/stratos/llm-agent";

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

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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
  if (/weak|劣势|短板|不足/.test(text)) return "weakness";
  if (/opportun|机会|机遇/.test(text)) return "opportunity";
  if (/threat|威胁|风险|挑战/.test(text)) return "threat";
  return "strength";
}

function normalizeExtracted(value: unknown): Record<string, unknown> {
  const root = unwrapObject(value);
  const strategicIntent = unwrapObject(firstValue(root, ["strategicIntent", "intentTab", "战略意图"]));
  const market = unwrapObject(firstValue(root, ["market", "marketTab", "市场洞察"]));
  const swot = unwrapObject(firstValue(root, ["swot", "swotTab", "SWOT分析", "SWOT"]));
  const org = unwrapObject(firstValue(root, ["org", "organization", "组织规划"]));

  const objectives = arrayValue(firstValue(root, ["objectives", "bscObjectives", "kpiObjectives", "kpis", "目标", "BSC目标", "KPI"]));
  const initiatives = arrayValue(firstValue(root, ["initiatives", "okrInitiatives", "keyInitiatives", "举措", "关键举措", "OKR"]));
  const swotItems = arrayValue(firstValue(root, ["swotItems", "SWOTItems", "swot", "SWOT", "swotAnalysis", "SWOT分析"]))
    .concat(arrayValue(firstValue(swot, ["items", "swotItems", "SWOTItems"])));
  const marketInsights = arrayValue(firstValue(root, ["marketInsights", "insights", "market", "市场洞察"]))
    .concat(arrayValue(firstValue(market, ["items", "insights", "marketInsights"])));

  return {
    intent: stringValue(firstValue(root, ["intent", "strategicIntent", "strategyIntent", "战略意图", "战略方向"])) ||
      stringValue(firstValue(strategicIntent, ["intent", "content", "战略意图", "战略方向"])),
    northStar: stringValue(firstValue(root, ["northStar", "northStarMetric", "北极星指标", "核心指标"])) ||
      stringValue(firstValue(strategicIntent, ["northStar", "metric", "北极星指标", "核心指标"])),
    objectives: objectives.map((item) => {
      const o = unwrapObject(item);
      const keyResults = arrayValue(firstValue(o, ["keyResults", "krs", "KR", "关键结果"]));
      return {
        dimension: normalizeDimension(firstValue(o, ["dimension", "维度", "category", "类别"])),
        objective: stringValue(firstValue(o, ["objective", "title", "目标", "content", "内容"])),
        keyResults: keyResults.map((kr) => {
          const k = unwrapObject(kr);
          return {
            keyResult: stringValue(firstValue(k, ["keyResult", "kr", "关键结果", "content", "内容"])),
            target: stringValue(firstValue(k, ["target", "目标值", "value", "指标值"])),
          };
        }),
      };
    }).filter((o) => o.objective || o.keyResults.length),
    initiatives: initiatives.map((item) => {
      const i = unwrapObject(item);
      return {
        title: stringValue(firstValue(i, ["title", "name", "举措标题", "关键举措", "举措"])),
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
      return {
        quadrant: normalizeSwotQuadrant(firstValue(s, ["quadrant", "type", "category", "象限", "类型"])),
        content: stringValue(firstValue(s, ["content", "description", "内容", "描述", "point"])),
      };
    }).filter((s) => s.content),
    assumptions: arrayValue(firstValue(root, ["assumptions", "关键假设", "hypotheses"])).map((item) => {
      const a = unwrapObject(item);
      return {
        assumption: stringValue(firstValue(a, ["assumption", "content", "假设", "内容"])),
        critical: Boolean(firstValue(a, ["critical", "isCritical", "关键"])),
      };
    }).filter((a) => a.assumption),
    marketInsights: marketInsights.map((item) => {
      const m = unwrapObject(item);
      return {
        category: stringValue(firstValue(m, ["category", "type", "类别", "类型"])) || "TREND",
        title: stringValue(firstValue(m, ["title", "conclusion", "标题", "结论"])),
        content: stringValue(firstValue(m, ["content", "description", "内容", "描述"])),
        dataPoint: stringValue(firstValue(m, ["dataPoint", "data", "metric", "数据点", "关键数据"])),
        source: stringValue(firstValue(m, ["source", "来源"])) || "original document",
      };
    }).filter((m) => m.title || m.content || m.dataPoint),
    actionItems: arrayValue(firstValue(root, ["actionItems", "actions", "作战计划", "行动计划"])),
    budgetItems: arrayValue(firstValue(root, ["budgetItems", "budgets", "资源预算", "预算"])),
    roadmapItems: arrayValue(firstValue(root, ["roadmapItems", "roadmap", "路线图"])),
    productQuarterly: arrayValue(firstValue(root, ["productQuarterly", "products", "产品季度", "产品计划"])),
    channelPlans: arrayValue(firstValue(root, ["channelPlans", "channels", "渠道发展", "渠道计划"])),
    customerPlans: arrayValue(firstValue(root, ["customerPlans", "customers", "客户发展", "客户计划"])),
    orgChartNodes: arrayValue(firstValue(root, ["orgChartNodes", "orgNodes", "organization", "组织规划"]))
      .concat(arrayValue(firstValue(org, ["nodes", "orgChartNodes", "items"]))),
  };
}

function hasExtractedContent(extracted: Record<string, unknown>): boolean {
  if (stringValue(extracted.intent)) return true;
  if (stringValue(extracted.northStar)) return true;
  return ARRAY_FIELDS.some((key) => arrayValue(extracted[key]).length > 0);
}

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
3. **objectives**：BSC/KPI 管理，严格按 FINANCIAL/CUSTOMER/PROCESS/LEARNING 四维度分类；objective 是该维度的管理目标，keyResults 是 KPI 指标及目标值，不要放 OKR 举措
4. **initiatives**：OKR/关键举措管理；每项 initiative 是一个 Objective / 关键举措，关联负责人、Key Result、基线、目标值、季度里程碑
5. **swotItems**：即使摘要未明确写SWOT，也从语境推断四象限
6. **marketInsights**：市场规模数据、趋势、竞争、客户，标注原文数据来源
7. **actionItems**：有时间节点的具体行动，关联举措，写验收标准
8. **budgetItems**：投资金额、资源，分CAPEX/OPEX/HC类
9. **roadmapItems**：时间线节点，标注track
10. 文档没有的信息 → 返回 []，**绝不捏造**
11. 只输出 JSON，不要解释`;

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

    let extracted: Record<string, unknown>;
    try {
      extracted = normalizeExtracted(parseJsonObject(raw));
    } catch {
      return NextResponse.json({ error: "LLM 返回格式异常，请重试", raw }, { status: 422 });
    }

    if (!hasExtractedContent(extracted)) {
      const retryRaw = await callLlm([
        { role: "system", content: "Return only valid JSON. Use exactly these top-level keys: intent, northStar, objectives, initiatives, swotItems, assumptions, marketInsights, actionItems, budgetItems, roadmapItems, productQuarterly, channelPlans, customerPlans, orgChartNodes. Do not wrap the JSON in another object." },
        { role: "user", content: `Extract at least the fields that are clearly present from this strategy summary. Use [] for missing arrays and "" for missing strings.\n\n${STAGE2_PROMPT(summary)}` },
      ]);
      try {
        extracted = normalizeExtracted(parseJsonObject(retryRaw));
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
