# PRD · StratOS 进化：从"单发裁决"到"持续闭环 + 先例驱动 + AI 绑定"

- 状态: Draft
- 归属仓: **StrategyOS**（StratOS 侧改造；Tandem 侧依赖单列 §6）
- 关联: `docs/TANDEM-COORDINATION-PRD.md`（LLM 收口）· `docs/PRODUCT_THESIS.md` · `docs/STRATOS_BLUEPRINT.md`
- 边界: 两仓独立；StratOS 只依赖 Tandem 对外 API 契约，不依赖其代码。

---

## 0. 现状（已核对代码）

StratOS 已是三层认知栈，不是纯资料汇总：
- **L1 汇总**（成熟）：decode/BSC/OKR、FP&A、`market-intel` 抓取、`StratDiff`、KPI 健康表。
- **L2 规则判断**（强·确定性）：`lib/innovation/engine.ts`（DFV/ODI/回收期/ROIC-WACC 门禁/杀手假设/**证据接地** `UNGROUNDED_EVIDENCE_CAP`）；`lib/gems/lenses.ts`（证据卡 + **"只从真实字段产卡、缺字段计 drops、不臆造"**）。
- **L3 AI 判断**（新增·尚薄）：`app/api/compass/rationality-verdict`（战略摘要→Tandem 中央 AI 出 坚守/pivot/kill + 本地规则降级 + 人在环最终裁决 + 落库）。

已建成的**双向跨仓桥**（最大资产）：
- Tandem → StratOS：`rationality-verdict` 调 `HERMES_VERDICT_URL` 求裁决。
- StratOS → Tandem：`app/api/strategy/perception-digest` 把"战略合理性传感器"(`buildStrategyDigest`) 对 Tandem 只读暴露（技能 `strategy.validity_digest`，confidential + marking/purpose 闸）。

**真实短板**（本 PRD 要解决）：
1. 判断是**季度单发**，非持续闭环——对手/失效信号进来不会自动更新前提脆弱性、自动重裁决。
2. `market-intel` 的 `linkedAssumptionCode`（对手动作→挑战哪条前提）**靠人工手填、稀疏**。
3. "So what" 是模板（`buildMarketBrief` 的 `defaultSoWhat`），非针对本企业战略推理。
4. 裁决**就事论事**，不带历史先例（StratDiff / 过往 verdict 未被复用）。
5. 竞品情报抽取（`hermes-llm.ts`）裸连 gpt-4o-mini、绕 Tandem 治理（见协同 PRD）。

---

## 1. 目标 / 非目标

**目标**：把"感知→判断→决策"合成**持续闭环**，让**对手/行业信号自动流入战略前提并驱动重裁决**，且判断**先例驱动 + 证据接地**。

**非目标**：不改战略域方法论（Rumelt/三栈/BSC/FP&A）；不合并两仓；不做全自动执行（写回战略真值一律走人工/proposeAction）。

---

## 2. 设计（四条演进线）

### 2.1 持续闭环（最高杠杆）
新增轻量 sweeper `lib/monitor/validity-loop.ts`：
- 触发源：新 `IntelSignal`（威胁/高相关）或前提 `failSignal` 落库、或每日 cron。
- 步骤：重算受影响前提的 `fragility/confidence` → 若越过阈值（如 fragility≥85 且 confidence<50，或出现 failSignal）→ **自动触发** `rationality-verdict` 重裁决（去抖：同前提 24h 一次）→ 产出 `gems` 洞察卡挂到 `/command` 与 `/compass` → **人工确认**方最终留痕。
- 纪律：只改建议态（verdict.ai*），不动人工裁决；全程 fail-soft。

### 2.2 AI 推断 signal→前提绑定（替代手填）
新增 `lib/market-intel/link-inference.ts`：
- 输入：一条 `IntelSignal` + 当前前提清单（`buildStrategyDigest().fragilePremises` 的 code+premise）。
- 走 **Tandem 受治理 AI**（复用协同 PRD 的 `lib/ai/tandem-brain.ts`，scenario=`reasoning_complex`）：输出 `{ linkedAssumptionCode, challengeType: 反驳|强化|无关, confidence, evidenceQuote }`。
- 回填 `IntelSignal.linkedAssumptionCode`（低置信度只提示、不自动绑）；**证据引用必填**，无引用不绑（对齐 `UNGROUNDED_EVIDENCE_CAP` 纪律）。
- "So what" 从模板升级为该推断的一句话结论。

### 2.3 决策图谱先例化（与 Tandem Context Graph 咬合）
- 出裁决前，`rationality-verdict` 先查 Tandem `decision.trail`（Tandem 已暴露只读技能）：检索"相似前提失效 / 相似 bet 门禁"的历史决策 + 结果。
- 把先例作为上下文喂给中央 AI 裁决（"上次类似前提失效我们 pivot，结果 X"），并在 verdict 卡上展示先例链接。
- 裁决落库后回写为一个决策节点（经人工 proposeAction），喂回 Tandem 决策图谱 —— 形成"决策先例"正循环。

### 2.4 对抗层（红队）
- 高威胁竞品信号或 kill/pivot 裁决触发 `council`/`rehearsal` 红队：调 Tandem `expert-panel` 对"坚守"论点反驳，产出反方证据卡；人工在战略会彩排时对质。

---

## 3. 里程碑
- **M1（依赖协同 PRD）**：`lib/ai/tandem-brain.ts` 落地（LLM 收口），`hermes-llm.ts` 改走 Tandem（fail-soft）。
- **M2**：2.2 AI 绑定 signal→前提（含证据必填 + 单测）。
- **M3**：2.1 持续闭环 sweeper（去抖 + gems 卡 + 人工确认）。
- **M4**：2.3 决策图谱先例化（查 `decision.trail` 喂裁决 + 回写节点）。
- **M5**：2.4 对抗红队。

## 4. 验收
- 注入一条"对手降价"威胁信号 → 系统自动推断其挑战的前提（带证据）→ 该前提脆弱性上升 → 自动生成一张 pivot 建议卡 → 人工可一键确认留痕；全程可在 `LlmUsageLog` 追踪、Tandem 不可达时降级为本地规则、功能不 500。
- `npm run harness` 通过。

## 5. 风险
- 自动重裁决噪声：靠阈值 + 去抖 + "仅建议态"控制；人工是唯一最终裁决。
- 先例检索质量依赖 Tandem 决策图谱数据量：早期先例少时退化为无先例裁决（不阻断）。
- 跨仓延迟/可用性：全部 fail-soft 回退本地规则。

## 6. 前置依赖（Tandem 仓，另立项）
- 受治理 AI 端点（协同 PRD §4）：`POST /api/ai/governed-chat`。
- `decision.trail` 只读检索技能（Tandem 已暴露 MCP/A2A，需补"按相似度检索决策先例"的查询形态）。
- `expert-panel` 对外可调（红队）。

## 7. 结论
StratOS 已跨过"汇总→判断"门槛，但判断是单发、手工绑定、无先例。补上**持续闭环 + AI 绑定 + 先例驱动**三件，"对手/行业分析"才真正**内生**为战略的一部分，StratOS 才从"战略沙盘"进化为"活的 AI 战略 OS"。与 Tandem 的双向桥已具备，是最快的落地路径。
