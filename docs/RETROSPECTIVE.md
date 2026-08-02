# StratOS · 软件运行复盘与优化方向

**版本：** v1.0 · 2026-06-22  
**关联章程：** [STRATEGIC_CHARTER.md](./STRATEGIC_CHARTER.md) · [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md)

---

## 一、当前已实现的健康基线

从 `harness-report.json` 与代码审计看，MVP+ 已闭合的健壮机制：

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 环境自检 | ✅ | DATABASE_URL、字体、LLM 已配置 |
| 页面/API 清单 | ✅ | 27 pages · 33 APIs |
| Prisma schema 同步 | ✅ | 35 表与 DB 列一致 |
| 单元测试 | ✅ | 全量通过 |
| 11-Agent 编排 | ✅ | LLM 优先 + 规则兜底（见 `lib/stratos/llm-orchestration.ts`） |
| 反事实推演 | ✅ | `/api/counterfactual` 已接 DB 基线 + 校准 |
| 快照冻结 | ✅ | `freeze-snapshot.ts` 含断言复检 |

---

## 二、不流畅点与风险

### 1. UI 标签与实现状态不一致（信息噪声）

多处组件仍标注 **"Phase 2" / "Phase 3" / "规则引擎 MVP · LLM 层 V6.3+"**，但后端已具备 LLM 或 DB 驱动能力：

- `components/reports/AgentOrchestrationPanel.tsx:34-36` 显示"规则引擎 MVP"，但 `lib/stratos/llm-orchestration.ts` 已实现 OpenAI 兼容 LLM 编排
- `components/versions/CounterfactualPanel.tsx:33` 标"Phase 3"，但 `/api/counterfactual/route.ts` 已使用 `buildWorkingSnapshotState()` 跑真实基线
- `components/health/TwelveDimPanel.tsx:18` 标"Phase 2 战略部下钻"，但 `lib/health/twelve-dimensions.ts` 已有完整定义

**影响：** 生产用户会误以为功能不可用，降低采用意愿。  
**优化：** 引入 `featureFlags` 或 `maturity` 元数据，对未就绪功能加"预览"标签，对已就绪功能去掉 Phase 标签。

---

### 2. Demo fallback 过度渗透（数据真实性风险）

`lib/data/strategy-data.ts` 中几乎每个 `getXxx()` 都有：

```ts
if (!(await dbAvailable())) return demo.xxx;
const rows = await prisma.xxx.findMany(...);
if (rows.length === 0) return demo.xxx;
```

`lib/db.ts:157-172` 的 `safeDbQuery` 在生产环境也会静默 fallback 到 demo。

**影响：**
- DB 偶发不可达或表空时，系统**静默进入演示模式**，用户可能基于虚假数据做决策
- 战略会场景下，demo 数据与真实数据混用是致命风险

**优化：**
- 生产环境 `NODE_ENV=production` 时，DB 失败应**硬报错**而非 fallback
- 增加 `dataSource` 醒目提示（已有，但需强化为全局 banner）
- 引入"数据新鲜度"检查：若关键表（`FpaPeriod`、`StrategicDiagnosis`）超过 N 天未更新，标黄/红

---

### 3. LLM 层缺乏显式接地门（反幻觉风险）

`lib/stratos/llm-agent.ts:39-104` 的 `parseReportWithLlm` 直接让 LLM 输出 JSON，但：
- 无强制要求返回原文逐字引文
- 无 `gradeSignal` 式的 `supported/partial/unsupported` 校验
- 无 `drops` 透明记录

这与 `docs/COMPETITIVE_ANALYSIS.md` 中宣传的 Hermes "逐字引文接地门" 存在差距。

**优化：**
- 在 LLM prompt 中要求每条 `assertionTrigger` / `pattern` 附带原文引文
- 增加 `quoteCoverage` 校验函数，对无引文支撑的信号降级或丢弃
- 将丢弃信号写入 ` drops` 日志，董事会可审计

---

### 4. 报告/Sheet 导入链路仍偏手动

数据导入依赖 `scripts/import-strategic-plan.ts` 或人工上传，没有半自动管道：
- Sheet 模板无 schema 校验（或校验未强制）
- 导入质量审计 `lib/compiler` 已存在，但用户侧无"导入质量报告"
- 月报/季报仍需人工触发解析

**优化：**
- 在 UI 增加"导入质量报告"：显示识别字段数、异常行、映射失败项
- 建立标准 Sheet 模板校验器，导入前阻塞非合规文件
- 增加"导入后自动触发 Agent 编排"选项，减少人工点击

---

### 5. HealthAssertion 触发路径有缺口

`lib/stratos/health-assertions.ts` 定义了四类断言，但触发点分散：
- 月报：通过 `report-agent.ts` 触发
- 快照冻结：通过 `freeze-snapshot.ts` 触发
- 季报、Sheet 财务导入：依赖调用方主动传入 `AssertionContext`

`lib/data/strategy-data.ts` 的 `getActiveHealthAssertions()` 只读取 `active=true`，不主动重算。

**优化：**
- 统一在 `report` 入库、`import-strategic-plan`、`FpaPeriod` 更新三个节点强制调用 `runHealthAssertions`
- 增加"解除断言"机制：当新数据证明 runway 恢复时，自动标记 `clearedAt`

---

### 6. 三栈与 FPA 的 `budget_tag` 绑定是"软约束"

`prisma/schema.prisma` 中 `budget_tag` 对 IC 是 `String`（必填），Product/Gtm 是 `String?`（推荐）。代码中没有保存时的存在性校验：
- 可能批准了一个 `InvestmentCase`，但 `budget_tag` 指向不存在的 `FpaBudgetLine`
- FPA 行无法自动感知有哪些 Bet 挂载到它上面

**优化：**
- 在 `saveInvestmentCase` / `saveProductBet` / `saveGtmBet` 的事务中校验 `budget_tag` 存在于当期 `FpaBudgetLine`
- FPA 行 UI 展开显示挂载 Bet 列表，实现双向可视化
- 拒绝/延迟的 Bet 自动把 `fpaToggle` 置 `off`，并保留 `ghostForecast`

---

### 7. 页面 Bundle 查询存在性能隐忧

`getCommandDeckBundle()` 在 `@/lib/data/strategy-data.ts:149-209` 中并发聚合 15+ 个数据源。随着：
- `StrategicSnapshot` 历史增多
- `DiffRecord` 数量增加
- `Report` 表增长

可能出现 N+1 查询或 JSON 序列化开销。

**优化：**
- 为 `/command` 建立物化聚合表或 Redis 缓存，刷新周期 5–15 分钟
- 将非实时数据（如历史快照、diff 全量）改为按需分页加载
- 对 `stateJson` 等大 JSON 字段做压缩或独立存储

---

### 8. 认证与权限仍处于 Demo fallback

`harness-report.json` 显示 `workos=demo`，`lib/auth/session.ts` 在 DB 不可用时返回 `DEMO_USERS`。`lib/auth/config.ts` 有硬编码演示用户。

**影响：** 生产环境若 WorkOS 未配置或失败，会退回到演示账号，存在权限绕过风险。

**优化：**
- 生产环境强制 WorkOS 配置，否则启动失败（`preflight` 脚本增加校验）
- 移除生产环境的 `DEMO_USERS` fallback
- 明确 level 2 / level 3 API 权限矩阵，增加权限审计日志

---

### 9. 录入纪律无防退化机制

系统是"数据进 → 洞察出"，但：
- 若 PM 不更新 Vx/Hx/承诺，系统会显示 demo 或旧数据
- 没有自动催办、stale 预警、责任人通知

**优化：**
- 每个对象增加 `updatedAt` / `nextReviewDate`
- 在 `/command` 显示"数据新鲜度"面板：哪些 Bet/假设/承诺已过期
- 增加邮件/企业微信催办（Phase 2）

---

### 10. 单工程师维护风险（Bus Factor）

自研系统，方法论与实现细节高度集中在：
- `docs/STRATOS_BLUEPRINT.md`
- `lib/stratos/` 核心算法
- `prisma/schema.prisma` 35 表

**优化：**
- 将关键算法（`strat-diff.ts`、`health-assertions.ts`、`robust-score.ts`）的单元测试覆盖率提升到 80%+
- 完善 `AGENTS.md` 与 `CLAUDE.md` 的交接上下文
- 建立关键变更的 design review 流程

---

## 三、优化优先级

### P0 · 战略会前必须解决
1. 生产环境禁用静默 demo fallback
2. WorkOS 生产认证配置与 fallback 移除
3. HealthAssertion 全触发路径统一（报告/导入/季报）
4. 数据新鲜度与数据来源全局提示

### P1 · 体验与可信度
5. 三栈 `budget_tag` 保存时存在性校验 + FPA 行双向挂载
6. 去除/修正误导性 Phase 2/3 UI 标签
7. LLM 报告解析增加引文接地门
8. Sheet 导入质量报告前端化

### P2 · 智能化与自动化
9. 自动 coverage/LTV 更新管道
10. 断言解除机制（数据恢复后自动 clear）
11. 导入后自动触发 Agent 编排
12. 十二维健康度真正下钻（非静态展示）

### P3 · 规模与工程化
13. `/command` 聚合缓存/物化视图
14. 快照历史分页与 diff 按需加载
15. 录入纪律催办与责任人通知
16. 关键算法交接文档与测试覆盖率

---

## 四、与章程的对应关系

| 章程防线 | 当前不流畅点 | 优先优化 |
|----------|--------------|----------|
| 方向防线 | 诊断与 WTP/HTW 可能基于 demo 数据 | P0 数据真实性 |
| 资源防线 | `budget_tag` 软约束 | P1 双向校验 |
| 执行防线 | 录入纪律无防退化 | P3 催办机制 |
| 底线防线 | HealthAssertion 触发路径有缺口 | P0 统一触发 |

---

*复盘日期：2026-06-22 · 建议在下次战略会前完成 P0 项。*
