/**
 * Market Ask AI — SCR-style推演，复用 StratOS LLM 配置。
 */
import { hermesLlmConfigured } from "@/lib/market-intel/hermes-llm";
import {
  buildSwotPrompt,
  generateTows,
  parseSwotResponse,
  type SwotBoard,
  type TowsSet,
} from "@/lib/market-intel/swot";

function llmKey(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY;
}

function llmBaseUrl(): string {
  return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
}

function llmModel(): string {
  return process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini";
}

export function marketAskConfigured(): boolean {
  return hermesLlmConfigured();
}

export type MarketAskResult = {
  situation: string;
  complication: string;
  resolution: string;
  links: string[];
};

export async function askMarketAi(
  question: string,
  context: string,
): Promise<MarketAskResult | { error: string; fallback: true; text: string }> {
  if (!llmKey()) {
    return {
      error: "未配置 LLM",
      fallback: true,
      text: ruleBasedAnswer(question, context),
    };
  }

  const system = [
    "你是 StratOS 市场推演助手，服务 Rheem/Ruud 中国战略团队。",
    "基于提供的竞争情报上下文回答用户问题。",
    "返回 JSON：{ \"situation\": \"...\", \"complication\": \"...\", \"resolution\": \"...\", \"links\": [\"建议链到：战略解码\", ...] }",
    "中文，简洁，resolution 占 50% 篇幅，可执行。",
    "不要编造上下文中没有的事实。",
  ].join("\n");

  try {
    const res = await fetch(llmBaseUrl() + "/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(35000),
      headers: { Authorization: "Bearer " + llmKey(), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llmModel(),
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `上下文：\n${context.slice(0, 8000)}\n\n问题：${question}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { error: "LLM 请求失败", fallback: true, text: ruleBasedAnswer(question, context) };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return { error: "空响应", fallback: true, text: ruleBasedAnswer(question, context) };
    }
    const parsed = JSON.parse(raw) as MarketAskResult;
    return {
      situation: parsed.situation ?? "",
      complication: parsed.complication ?? "",
      resolution: parsed.resolution ?? "",
      links: Array.isArray(parsed.links) ? parsed.links : [],
    };
  } catch {
    return { error: "LLM 异常", fallback: true, text: ruleBasedAnswer(question, context) };
  }
}

export interface SwotAiResult {
  tows: TowsSet;
  engine: "llm" | "rule";
  note?: string;
}

/**
 * SWOT → TOWS 推演。LLM 可用时走模型，否则确定性回退 generateTows。
 * 复用与 askMarketAi 相同的 LLM 配置；提示词/解析在 swot.ts。
 */
export async function askSwotAi(board: SwotBoard): Promise<SwotAiResult> {
  const fallback = (): SwotAiResult => ({
    tows: generateTows(board, 2),
    engine: "rule",
    note: "未配置 LLM 或调用失败 · 规则引擎兜底",
  });

  if (!llmKey()) return fallback();

  const { system, user } = buildSwotPrompt(board);
  try {
    const res = await fetch(llmBaseUrl() + "/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(35000),
      headers: { Authorization: "Bearer " + llmKey(), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llmModel(),
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return fallback();
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    const parsed = raw ? parseSwotResponse(raw) : null;
    return parsed ? { tows: parsed, engine: "llm" } : fallback();
  } catch {
    return fallback();
  }
}

function ruleBasedAnswer(question: string, context: string): string {
  return (
    `【规则引擎回退 · 未调用 LLM 或调用失败】\n\n` +
    `你的问题：${question}\n\n` +
    `基于当前 Top 信号上下文，建议：\n` +
    `1. 核对 ${context.includes("H2") ? "假设 H2" : "相关战略假设"} 是否仍成立\n` +
    `2. 在 /decode 查看 BSC 底线与 X-Matrix 行动链\n` +
    `3. 若涉及财务影响，打开 /finance 与 /outlook\n\n` +
    `配置 OPENAI_API_KEY 或 STRATOS_LLM_API_KEY 后可启用完整 AI 推演。`
  );
}
