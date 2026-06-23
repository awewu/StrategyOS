import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { llmConfigured } from "@/lib/stratos/llm-agent";

function apiKey() { return process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY; }
function baseUrl() { return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""); }
function llmModel() { return process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini"; }

async function callLlm(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: llmModel(), temperature: 0.1, response_format: { type: "json_object" }, messages }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export const runtime = "nodejs";

const EXTRACT_SYSTEM = `你是战略编制助手。用户提供战略文件/PPT/报告原文，
你需要从中提取结构化战略信息，输出严格 JSON，不要输出任何其他内容。`;

const EXTRACT_PROMPT = (text: string) => `
从以下战略文件中提取信息，输出 JSON，结构如下：
{
  "intent": "三年战略意图一句话",
  "northStar": "北极星指标",
  "objectives": [
    { "dimension": "FINANCIAL|CUSTOMER|PROCESS|LEARNING", "objective": "目标描述",
      "keyResults": [{ "keyResult": "KR描述", "target": "目标值" }] }
  ],
  "initiatives": [
    { "title": "举措标题", "ownerName": "负责人",
      "okrKeyResult": "对应的关键成果描述", "okrTarget": "目标值", "okrBaseline": "基线值",
      "q1Milestone": "Q1里程碑", "q2Milestone": "Q2里程碑",
      "q3Milestone": "Q3里程碑", "q4Milestone": "Q4里程碑" }
  ],
  "swotItems": [
    { "quadrant": "strength|weakness|opportunity|threat", "content": "描述" }
  ],
  "assumptions": [
    { "assumption": "假设描述", "critical": true }
  ],
  "productQuarterly": [
    { "productName": "产品名", "unit": "单位",
      "q1Qty": "数量", "q1Revenue": "收入",
      "q2Qty": "数量", "q2Revenue": "收入",
      "q3Qty": "数量", "q3Revenue": "收入",
      "q4Qty": "数量", "q4Revenue": "收入" }
  ],
  "channelPlans": [
    { "channelType": "渠道类型", "currentState": "现状", "targetState": "目标",
      "q1Action": "Q1行动", "q2Action": "Q2行动", "q3Action": "Q3行动", "q4Action": "Q4行动" }
  ],
  "customerPlans": [
    { "customerSegment": "客户类型", "isNew": false,
      "currentCount": 100, "targetCount": 150,
      "acquisitionStrategy": "获客策略", "retentionStrategy": "留存策略" }
  ],
  "orgChartNodes": [
    { "name": "部门/岗位名", "role": "职能描述", "headcount": 10, "headcountNew": 2 }
  ]
}

如果某个字段在文件中找不到，留空字符串或省略该字段。
只输出 JSON，不要有任何注释或说明文字。

文件内容：
${text.slice(0, 12000)}
`;

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < 50) {
    return NextResponse.json({ error: "文本内容太短，至少 50 字" }, { status: 400 });
  }

  if (!llmConfigured()) {
    return NextResponse.json(
      { error: "LLM 未配置，无法自动提取。请配置 OPENAI_API_KEY 后重试。", llmAvailable: false },
      { status: 503 },
    );
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
