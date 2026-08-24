/**
 * StratOS × Tandem 大脑层收口 · 瘦客户端 (M1 脚手架)
 * ──────────────────────────────────────────────────
 * 目标态：StratOS 的 LLM 调用统一走 Tandem 受治理 AI（governedChat + TAF 多模型
 * + guardrail + OKR/价值观闸 + LlmUsageLog），形成「身份 + 大脑」双向收口。
 * 见 docs/TANDEM-COORDINATION-PRD.md。
 *
 * 边界：两仓独立。本模块只调用 Tandem 对外 AI API 契约，不依赖其代码。
 *
 * 当前状态：
 * - 默认关（STRATOS_USE_TANDEM_AI!=='1'）→ 直接走本地直连底座 directLlmChat，零回归。
 * - 对接 Tandem 集团统一 AI 网关 POST /api/gateway/ai-chat（governedChat 治理通道，
 *   服务令牌 = Tandem 侧 AI_GATEWAY_STRATOS_TOKEN）；置 STRATOS_USE_TANDEM_AI=1 灰度开启。
 * - 契约：请求 { intent, scenario?, messages:[{role:user|assistant,content}], temperature?,
 *   responseFormat? }（system 由治理闸注入，故 StratOS 的 system 折叠进首条 user）；
 *   成功 200 { ok:true, answer, usage }；治理拦截 403 { ok:false, blocked }；
 *   未启用 503 / 未授权 401 / LLM 故障 502。
 * - fail-soft（默认）：Tandem 未配置/不可达/超时/非 2xx → 回退直连，功能绝不 500。
 * - fail-closed（可选 STRATOS_TANDEM_STRICT=1）：治理平面不可达时不回退，直接 unavailable
 *   阻断，用于「写动作必须经治理」的红线场景。治理明确 blocked 在两种模式下都不回退。
 * - 旁路可观测：每次回退/阻断都经 recordTandemBypass 上报（可注入监听做审计/告警）。
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
  /**
   * tandem = 经 Tandem 治理返回；fallback = 回退直连；disabled = 开关未开；
   * unavailable = 严格模式下治理平面不可达且拒绝回退（fail-closed 阻断）。
   */
  source: "tandem" | "fallback" | "disabled" | "unavailable";
  model?: string;
  blocked?: boolean;
}

/** 收口开关：仅当 STRATOS_USE_TANDEM_AI='1' 时启用 Tandem 路径。 */
export function tandemAiEnabled(): boolean {
  return process.env.STRATOS_USE_TANDEM_AI === "1";
}

/** 严格 fail-closed 开关：治理不可达时不回退直连，直接阻断。 */
export function tandemStrictMode(): boolean {
  return process.env.STRATOS_TANDEM_STRICT === "1";
}

/** 旁路原因：为何未经 Tandem 治理返回。 */
export type TandemBypassReason =
  | "disabled"
  | "unconfigured"
  | "network_error"
  | "non_2xx"
  | "bad_payload"
  | "blocked";

export interface TandemBypassEvent {
  reason: TandemBypassReason;
  scenario: TandemScenario;
  purpose?: string;
  /** true = 严格模式下阻断（fail-closed）；false = fail-soft 回退直连。 */
  strict: boolean;
}

let bypassListener: ((e: TandemBypassEvent) => void) | null = null;

/** 注入旁路监听（审计/告警/测试）；传 null 清除。返回上一个监听以便还原。 */
export function onTandemBypass(
  fn: ((e: TandemBypassEvent) => void) | null,
): ((e: TandemBypassEvent) => void) | null {
  const prev = bypassListener;
  bypassListener = fn;
  return prev;
}

function recordTandemBypass(e: TandemBypassEvent): void {
  try {
    bypassListener?.(e);
  } catch {
    // 监听器异常绝不影响主流程。
  }
}

function tandemBaseUrl(): string | undefined {
  const base = process.env.TANDEM_AI_BASE_URL ?? process.env.TANDEM_ISSUER;
  return base?.trim() ? base.replace(/\/$/, "") : undefined;
}

function tandemToken(): string | undefined {
  return process.env.TANDEM_AI_TOKEN?.trim() || undefined;
}

/**
 * 旁路处理：fail-soft 回退直连，或严格模式下 fail-closed 阻断。
 * 所有回退/阻断都必须经此以保证可观测。
 */
async function bypass(
  input: AskTandemInput,
  reason: TandemBypassReason,
): Promise<AskTandemResult> {
  const strict = tandemStrictMode();
  recordTandemBypass({
    reason,
    scenario: input.scenario,
    purpose: input.purpose ?? input.scenario,
    strict,
  });
  // 治理明确阻断：两种模式都不回退。
  if (reason === "blocked") {
    return { ok: false, content: null, source: "tandem", blocked: true };
  }
  // 严格模式：治理平面不可达 → fail-closed，不回退直连。
  if (strict) {
    return { ok: false, content: null, source: "unavailable" };
  }
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
      ? await bypass(input, "disabled")
      : { ok: false, content: null, source: "disabled" };
  }

  const base = tandemBaseUrl();
  const token = tandemToken();
  if (!base || !token) return await bypass(input, "unconfigured");

  // system 由治理闸注入；网关只接受 user|assistant，故把 StratOS 的任务 system 折叠进 user。
  const userContent = input.system?.trim()
    ? `${input.system}\n\n---\n\n${input.user}`
    : input.user;

  try {
    const res = await fetch(`${base}/api/gateway/ai-chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(input.timeoutMs ?? 30_000),
      body: JSON.stringify({
        intent: input.purpose ?? input.scenario,
        scenario: input.scenario,
        temperature: input.temperature,
        responseFormat: input.responseJson ? "json" : undefined,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    // 治理闸拦截：网关对 blocked 返回 403 + { blocked }（尊重输出闸，两种模式都不回退）。
    if (res.status === 403) return await bypass(input, "blocked");
    if (!res.ok) return await bypass(input, "non_2xx");
    const data = (await res.json()) as {
      ok?: boolean;
      answer?: string;
      blocked?: boolean;
      usage?: { model?: string };
    };
    // 兼容 200 携带 blocked 的实现。
    if (data.blocked) return await bypass(input, "blocked");
    if (!data.ok || typeof data.answer !== "string") return await bypass(input, "bad_payload");
    return { ok: true, content: data.answer, source: "tandem", model: data.usage?.model };
  } catch {
    return await bypass(input, "network_error");
  }
}
