# PRD · StratOS × Tandem 协同：LLM 调用统一收口到 Tandem 中央 AI

- 状态: Draft
- 归属仓: **StrategyOS**（本文件只写 StratOS 侧改造；Tandem 侧改造在 Tandem 仓单独立项）
- 关联: `docs/PRODUCT_THESIS.md` · `docs/STRATOS_BLUEPRINT.md`
- 边界原则: **两仓独立**。StratOS 依赖的是 Tandem 对外的 **AI API 契约**，不依赖其代码；不合并代码库。

---

## 0. 背景（已核对现状）

StratOS 与 Tandem 已经在**身份层**收口，但**大脑层**尚未收口：

- ✅ 身份已收口：`lib/auth/tandem.ts` —— StratOS 走 Tandem OIDC SSO（issuer `ai.rhautt.com`，Authorization Code + PKCE，从 `/userinfo` 拉组织结构 claims）。
- ⚠️ 大脑未收口：`lib/market-intel/hermes-llm.ts` 直接 `fetch(STRATOS_LLM_BASE_URL/OPENAI .../chat/completions)`（默认 `gpt-4o-mini`）抽取竞品情报，**绕开了 Tandem 的 TAF Router 与 governedChat**。同类直连点还有 `lib/market-intel/market-ask-llm.ts`、`lib/compiler/import-llm.ts` 等。

绕开的代价（StratOS 当前拿不到 Tandem 已建成的能力）：
1. **无多模型路由/失败回退**：单点 provider，挂了就 500。
2. **无成本归因**：不计入 Tandem 的 `LlmUsageLog`（RMB 成本、场景、trace）。
3. **无 guardrail（最危险）**：`hermes-llm.ts` **抓取外部竞品网页原文喂给 LLM** —— 典型的间接 prompt injection 面，Tandem 的 `scanInput`/`neutralizeToolOutput` 正是为此，StratOS 目前裸奔。
4. **无治理对齐**：战略输出不过 Tandem `governedChat` 的 OKR 锚 / 价值观锚 / 输出闸，与"战略坚守"主张不一致。

---

## 1. 目标 / 非目标

**目标**：把 StratOS 的 LLM 调用统一收口到 Tandem 中央 AI（TAF + governedChat），形成 `身份 + 大脑` 双向收口。

**非目标**：
- 不合并两仓代码；StratOS 只调用 Tandem 的 AI API 契约。
- 不改 StratOS 的战略域逻辑（Rumelt/三栈/BSC/FP&A 等）。
- 不在本 PRD 里实现 Tandem 侧的对外 API（那是 Tandem 仓的前置依赖，见 §4）。

---

## 2. 设计

### 2.1 调用链（目标态）
```
StratOS lib/market-intel/* ─(OIDC token)→ Tandem 治理 AI API ─→ governedChat ─→ TAF Router ─→ 多模型
                                                    │
                                          guardrail + OKR/价值观闸 + 输出闸 + LlmUsageLog
```

### 2.2 StratOS 侧改造（本仓）
1. **新增 `lib/ai/tandem-brain.ts`**：一个瘦客户端，`askTandem({ scenario, system, user, purpose })`：
   - 用现有 Tandem OIDC 信任获取调用令牌（服务令牌或当前用户令牌，复用 `lib/auth/tandem.ts` 的 discovery/JWKS 基础）。
   - `POST {TANDEM_ISSUER}/api/ai/governed-chat`（契约见 §4），带 `scenario` + `purpose` + `messages`。
   - **fail-soft**：Tandem 不可达/超时/未配置 → 回退到现有直连 LLM（`hermes-llm.ts` 原逻辑），保证零回归。
2. **改造直连点**（逐个、保持行为）：`market-intel/hermes-llm.ts`、`market-intel/market-ask-llm.ts`、`compiler/import-llm.ts` 的 LLM 调用改为优先走 `askTandem`，失败回退直连。
3. **场景映射**（→ Tandem `ScenarioTag`）：
   - 竞品情报抽取（抓网页→结构化）→ `tool_use` / `long_context`
   - 战略推理 / 3+1 决策辅助 → `reasoning_complex`
   - 高频轻量（提示/摘要）→ `high_frequency`
4. **env 开关**：`STRATOS_USE_TANDEM_AI=1` 灰度开启；关闭时完全走现有直连（零回归）。`TANDEM_AI_BASE_URL` 可覆盖（默认取 `TANDEM_ISSUER`）。

### 2.3 安全/治理收益（收口后自动获得）
- 抓取的竞品网页原文经 Tandem guardrail 中和后再进模型（堵住注入面）。
- 战略输出过 governedChat 输出闸（与 OKR/价值观对齐，HARD_CONFLICT 重写）。
- 全部计入 Tandem `LlmUsageLog`（RMB 成本 + 场景 + trace，统一审计）。

---

## 3. 里程碑
- **M1（本仓，可独立上线）**：`lib/ai/tandem-brain.ts` + `hermes-llm.ts` 接入 + env 开关 + fail-soft 回退 + 单测（Tandem mock）。默认关，Tandem 侧就绪后开。
- **M2**：其余直连点（market-ask-llm / import-llm）接入。
- **M3**：全量切换，直连仅作降级兜底。

## 4. 前置依赖（Tandem 仓，另立项，不在本 PRD 交付）
Tandem 需对外暴露**受治理的 AI API**（当前 governedChat 仅内部）：
- `POST /api/ai/governed-chat`：入参 `{ scenario, purpose, messages, actor }`，内部走 `governedChat`（含 guardrail + 四闸 + TAF 路由 + LlmUsageLog）；出参 `{ ok, answer, blocked?, usage, model }`。
- 认证复用现有 OIDC 信任域（`ai.rhautt.com`），做**调用方鉴权 + 租户隔离 + 配额**（对齐 `tenant-ai-policy`）。
- 与 Tandem 正在规划的 "MCP Server / A2A 对外开放" 同批推进（见 Tandem 侧战略盘点）。

## 5. 验收
- 开 `STRATOS_USE_TANDEM_AI=1`：竞品情报抽取走 Tandem，`LlmUsageLog` 出现对应 scenario 记录；Tandem 不可达时自动回退直连、功能不 500。
- 关开关：行为与现状逐字节一致（零回归）。
- `npm run harness`（StratOS 全量自检）通过。

## 6. 风险
- Tandem AI API 未就绪前，M1 只能默认关（灰度）——可先合入、不启用。
- 跨服务延迟：竞品抓取本就异步，可接受；高频场景用 `high_frequency` 走廉价模型。
- 认证复杂度：优先服务令牌（StratOS↔Tandem 机器间），用户级令牌作为后续。
