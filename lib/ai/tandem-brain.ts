/**
 * StratOS × Tandem 大脑层收口 · 瘦客户端 (M1 脚手架)
 * ──────────────────────────────────────────────────
 * 目标态：StratOS 的 LLM 调用统一走 Tandem 受治理 AI（governedChat + TAF 多模型
 * + guardrail + OKR/价值观闸 + LlmUsageLog），形成「身份 + 大脑」双向收口。
 * 见 docs/TANDEM-COORDINATION-PRD.md。
 *
 * 边界：两仓独立。本模块只调用 Tandem 对外 AI API 契约，不依赖其代码。
 *
 * 当前状态（脚手架）：
 * - 默认关（STRATOS_USE_TANDEM_AI!=='1'）→ 直接走本地直连底座 directLlmChat，零回归。
 * - Tandem 侧对外端点 POST /api/ai/governed-chat 就绪后，置 STRATOS_USE_TANDEM_AI=1 灰度开启。
 * - fail-soft：Tandem 未配置/不可达/超时/非 2xx → 回退直连，功能绝不 500。
 */
import {
  directLlmChat,
  llmConfigured,
  type LlmChatMessage,
} from "@/lib/ai/llm-config";

/** Tandem 场景标签（映射 Tandem ScenarioTag，用于 TAF 路由）。 */
export type TandemScenario =
  | "reasoning_complex"
  | "tool_use"
  | "long_context"
  | "high_frequency";

export interface AskTandemInput {
  scenario: TandemScenario;
  system: string;
  user: string;
  /** 用途标注，供 Tandem marking/purpose 闸与审计。 */
  purpose?: string;
  temperature?: number;
  responseJson?: boolean;
  timeoutMs?: number;
}

export interface AskTandemResult {
  ok: boolean;
  content: string | null;
  /** tandem = 经 Tandem 治理返回；fallback = 回退直连；disabled = 开关未开。 */
  source: "tandem" | "fallback" | "disabled";
  model?: string;
  blocked?: boolean;
}

/** 收口开关：仅当 STRATOS_USE_TANDEM_AI='1' 时启用 Tandem 路径。 */
export function tandemAiEnabled(): boolean {
  return process.env.STRATOS_USE_TANDEM_AI === "1";
}

function tandemBaseUrl(): string | undefined {
  const base = process.env.TANDEM_AI_BASE_URL ?? process.env.TANDEM_ISSUER;
  return base?.trim() ? base.replace(/\/$/, "") : undefined;
}

function tandemToken(): string | undefined {
  return process.env.TANDEM_AI_TOKEN?.trim() || undefined;
}

/** 回退到本地直连底座（同一收口点）。 */
async function fallbackDirect(input: AskTandemInput): Promise<AskTandemResult> {
  const messages: LlmChatMessage[] = [
    { role: "system", content: input.system },
    { role: "user", content: input.user },
  ];
  const res = await directLlmChat({
    messages,
    temperature: input.temperature,
    responseFormat: input.responseJson ? "json_object" : undefined,
    timeoutMs: input.timeoutMs,
  });
  return { ok: res.ok, content: res.content, source: "fallback" };
}

/**
 * 经 Tandem 受治理 AI 求补全；未开/未配置/失败一律 fail-soft 回退直连。
 * 返回 source 供调用方审计与灰度观测。
 */
export async function askTandem(input: AskTandemInput): Promise<AskTandemResult> {
  if (!tandemAiEnabled()) {
    // 开关未开：若本地已配置 LLM 则回退直连，否则明确 disabled。
    return llmConfigured()
      ? await fallbackDirect(input)
      : { ok: false, content: null, source: "disabled" };
  }

  const base = tandemBaseUrl();
  const token = tandemToken();
  if (!base || !token) return await fallbackDirect(input);

  try {
    const res = await fetch(`${base}/api/ai/governed-chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(input.timeoutMs ?? 30_000),
      body: JSON.stringify({
        scenario: input.scenario,
        purpose: input.purpose ?? input.scenario,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });
    if (!res.ok) return await fallbackDirect(input);
    const data = (await res.json()) as {
      ok?: boolean;
      answer?: string;
      blocked?: boolean;
      model?: string;
    };
    // 治理明确阻断：如实上报，不回退（尊重 Tandem 输出闸）。
    if (data.blocked) {
      return { ok: false, content: null, source: "tandem", blocked: true, model: data.model };
    }
    if (!data.ok || typeof data.answer !== "string") return await fallbackDirect(input);
    return { ok: true, content: data.answer, source: "tandem", model: data.model };
  } catch {
    return await fallbackDirect(input);
  }
}
