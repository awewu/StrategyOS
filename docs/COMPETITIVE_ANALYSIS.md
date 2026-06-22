# StratOS · 价值总结与竞对分析

**版本：** v1.0 · 2026-06-22
**读者：** CEO · 董事会 · 核心管理层 (~30)
**定位：** 企业自用（瑞合瑞德），**不考虑商业化**——本文用于回答"自研是否成立、相对市面产品差异化在哪、应吸收什么"。
**关联：** [STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md) · [PRD.md](./PRD.md) · [STRATEGY_REVIEW_UI_BENCHMARK.md](./STRATEGY_REVIEW_UI_BENCHMARK.md)

---

## 执行摘要

| # | 要点 |
|---|------|
| 1 | StratOS 是 **30 人核心层的战略沙盘 / 战略网络 OS**，服务年中、年底两次战略会，刻意不做 ERP/CRM/全员 OKR/实时数据仓库。 |
| 2 | 三条护城河市面产品基本无对应物：**三栈竖切**（钱/产品/渠道）、**战略形成史学 diff**（Mintzberg）、**Hermes 防幻觉竞品情报智能体**。 |
| 3 | 直接对标是战略执行平台（Cascade / ClearPoint / AchieveIt / Quantive），它们偏"全员执行 + 实时集成"，**装不下三栈与史学**。 |
| 4 | 企业自用结论：**自研成立**——场景错位、方法论私有、数据主权与成本均支持自建；商业产品作为局部能力（报告自动化、轻量集成）借鉴对象。 |
| 5 | 竞对分析本身是 StratOS 的**内建产品能力**（`StratForesight` + Hermes），相对商业产品更克制可信。 |

---

## 一、项目价值总结

### 1.1 本质定位

StratOS 是面向 **300 人公司中 ~30 人核心管理层** 的「**战略沙盘 / 战略网络 OS**」，服务 **年中、年底两次战略会** 的节律。把"打什么仗、钱/产品/渠道怎么配、风险在哪"放在一屏看清，并用版本快照记录战略形成史。

**元定位（Kotter）：** StratOS = 战略网络 OS；ERP/OA = 运营 OS（数据导出/决议回灌，不实时绑）。

### 1.2 明确不做（边界克制）

| 不是 | 是 |
|------|-----|
| ERP / 财务凭证 | 独立推演沙盘 |
| CRM / 线索 pipeline | 客户×渠道前瞻布局 |
| PLM / BOM | 产品出牌教练 |
| 固资台账 | 产能战略推演 |
| 全员 OKR / 日复盘 | ~30 人战略网络 |
| 实时数据仓库 | 月报/季报 + Excel 导入 |

### 1.3 独特价值（护城河）

- **三栈竖切（差异化核心）：** `CapStack`（钱·Invest）+ `ProdStack`（产品·Innovate）+ `GtmStack`（客户×渠道·Deliver），同屏对称呈现资源配置。
- **战略形成史学（Mintzberg diff）：** 快照不可改，`StratDiff` 30 类变化 + `StrategyPattern` 区分"刻意 vs 涌现"。
- **理论编译器：** Rumelt 诊断、Playing to Win（WTP/HTW）、BSC、OKR、4DX、Cynefin、五事七计等结构化落到对象模型（35 表）。
- **FPA 财务脊梁物理勾连：** 三栈 Bet 通过 `budget_tag` 与 B-A-F 预测曲线强绑定，决策可追溯、变更有痕。
- **Gate 清单 > 假分数：** 风险清单 + 一票否决断言（runway/合规/人才/品牌），拒绝伪精确的"胜算 XX%"。
- **Hermes 防幻觉竞品情报智能体：** 详见第四节。

### 1.4 工程成熟度

Next.js 16 + Prisma 5 + Tailwind 4；完整页面路由、35 表数据模型、harness 自检、Playwright E2E、Docker 部署、GitLab CI。属于可落地的真实系统，非纯文档原型。

---

## 二、行业竞对分析

### 2.1 战略执行平台（最直接对标）

| 产品 | 定位 | 与 StratOS 的关系 |
|------|------|------|
| **Cascade** | 战略规划+执行一体化，OKR/BSC、组合管理、AI | 最全面对手，但偏全员协作、实时集成 |
| **ClearPoint Strategy** | BSC + KPI + 报告自动化标杆 | BSC/报告能力强，无三栈式资源前瞻 |
| **AchieveIt** | 战略执行+计划落地（政府/医疗/教育） | 偏计划追踪与汇报，无史学 diff |
| **Quantive（原 Gtmhub）** | OKR + 战略敏捷 + AI 洞察，企业级 | OKR 深、集成强（Jira/Slack），无 FPA 脊梁/资本推演 |

### 2.2 OKR 执行工具（部分重叠）

WorkBoard、Betterworks、Profit.co、Workpath、Mooncamp、Lattice、Asana 等——解决**全员 OKR 对齐与执行**，与 StratOS 的"30 人战略会"场景仅在 OKR 层重叠，缺战略诊断、三栈、财务推演、快照史学。

### 2.3 差异化矩阵

| 能力维度 | StratOS | Cascade/Quantive | ClearPoint | OKR 工具 |
|---------|:------:|:----:|:----:|:----:|
| OKR/BSC 对齐 | ✅ | ✅ | ✅ | ✅ |
| 三栈资源前瞻（钱/产品/渠道） | ✅ **独有** | 部分(组合) | ❌ | ❌ |
| 战略诊断（Rumelt/PtW） | ✅ | 弱 | ❌ | ❌ |
| FPA 财务脊梁（B-A-F/runway） | ✅ | ❌ | 弱 | ❌ |
| 快照 + 战略形成史 diff | ✅ **独有** | ❌ | 弱 | ❌ |
| 竞品情报智能体（防幻觉） | ✅ **独有** | 泛化 AI 问答 | ❌ | ❌ |
| 实时集成（Jira/BI/Slack） | ❌(刻意不做) | ✅ | ✅ | ✅ |
| 全员规模化协作 | ❌(30 人) | ✅ | ✅ | ✅ |

---

## 三、企业自用结论

**为什么自研成立（而非买商业产品）：**

- **场景错位：** 商业产品做"全员执行+实时集成"；StratOS 做"30 人战略会+双年快照+三栈推演"——商业产品装不下三栈与史学。
- **方法论定制：** 四个满意、Doctrine 三支柱、五事七计、瑞合专属价值链卡位等是公司私有战略语言，SaaS 无法承载。
- **数据主权与成本：** 自用无需为 30 席位付企业级 SaaS 年费，数据完全在内网。

**建议补强（吸收竞品长处）：**

- **报告自动化** — 借鉴 ClearPoint，已在 `STRATEGY_REVIEW_UI_BENCHMARK.md` 推进。
- **轻量集成** — 借鉴 Quantive/Cascade，不做实时 ERP，但可加 BI/Excel 半自动管道，降低录入负担（已规划 Sheet 导入）。
- **避免重复造轮子** — OKR/BSC 对象关系借鉴 hillfog/Operately，自研精力集中在三栈 + diff + Hermes 护城河。

---

## 四、SWOT 分析（企业自用视角）

> 注：本项目不商业化，故 SWOT 的"机会/威胁"指**对内部战略管理价值的助益与风险**，而非市场竞争。

| | 助益（Helpful） | 有害（Harmful） |
|---|---|---|
| **内部（Strengths / Weaknesses）** | **S1** 三栈竖切，钱/产品/渠道同屏，市面无对应<br>**S2** 快照不可改 + Mintzberg diff，战略形成史可追溯<br>**S3** Hermes 防幻觉竞品情报，可溯源可单测<br>**S4** 方法论编译进 35 表对象模型，沉淀为公司资产<br>**S5** 数据全内网，无 SaaS 席位成本 | **W1** 单租户自研，长期维护依赖少数工程师（巴士因子）<br>**W2** 无实时集成，依赖月报/Excel 录入，有滞后与人工负担<br>**W3** 仅服务 ~30 人，复用面窄、人均建设成本高<br>**W4** AI 管线需 LLM key 与抓取源，运维有外部依赖 |
| **外部（Opportunities / Threats）** | **O1** 把两次战略会的隐性共识固化为结构化数据<br>**O2** Hermes 持续情报 → 从一次性调研变常驻能力<br>**O3** 可吸收 ClearPoint 报告自动化、Quantive 轻集成<br>**O4** 沉淀的 diff/快照成为战略复盘训练素材 | **T1** 商业产品迭代快，自研功能可能相对落后<br>**T2** 方法论若变更，对象模型需同步重构<br>**T3** 录入纪律不足 → 数据不全 → 决策可信度下降<br>**T4** 关键人离职导致知识断层 |

**战略取向（SO/WO/ST/WT）：**

- **SO（增长）：** 用 S1/S2 强化两次战略会的不可替代性（O1/O4）——把战略会包标准化为快照驱动。
- **WO（改善）：** 用 O3 轻集成缓解 W2 录入负担；优先半自动 Excel/BI 管道。
- **ST（防御）：** 用 S4 对象模型沉淀对冲 T1/T4——方法论资产化，降低对单一产品/人的依赖。
- **WT（规避）：** 针对 W1/T4，补充文档体系 + harness 自检 + 交接规范，提升巴士因子。

---

## 五、波特五力分析（类比适配 · 自用语境）

> 自用系统无真实市场竞争，此处把五力**类比为"自建战略系统的可持续性压力"**，用于判断长期是否值得继续投入。

| 力 | 类比含义 | 评估 | 结论 |
|----|----------|------|------|
| **现有替代竞争** | 商业 SaaS（Cascade/Quantive/ClearPoint）替代自研 | 中 | 它们覆盖 OKR/BSC，但缺三栈/史学/Hermes，**短期不可替代** |
| **替代品威胁** | PPT + Excel + 人工调研回到手工流程 | 中高 | 录入纪律不足时易退化——**需用产品体验与自动化锁住用户** |
| **供方议价（依赖）** | LLM API、抓取源、开源依赖 | 中 | 已做规则引擎兜底（无 key 可降级），**依赖可控** |
| **买方议价（内部用户）** | 30 人核心层是否愿持续使用 | 高 | 采用度是生命线——**成功标准已锁：战略会 100%、PM 更新 >90%** |
| **新进入者** | 公司未来引入新商业产品 | 低中 | 自研数据主权 + 方法论私有构成切换成本，**壁垒中等** |

**总判断：** 五力均处可控区间，**自建在 3–5 年视野内可持续**；最大风险是**买方议价（内部采用度）**与**替代品退化（回归手工）**——两者均靠"降低录入摩擦 + 强化战略会刚需"化解，与第三节"建议补强"一致。

---

## 六、Hermes 智能体机制（内建竞对分析能力）

竞对分析不仅是本文一次性产出，更是 StratOS 的**内建产品能力**（`StratForesight` 模块 + Hermes 常驻智能体）。

### 6.1 定位

**市场洞察常驻智能体**（`lib/market-intel/hermes.ts`）：按 cadence 持续扫描已登记竞品来源 → 抓取动态 → 归一化为信号 → 评估对我方战略影响 → 输出扫描结果与高相关摘要。追踪四维度：**产品 / GTM / 品牌 / 战略模式**。

### 6.2 两档引擎

- **规则引擎** `runHermesScan`：来源到期检测、健康度、盲区清单、信号排序（威胁优先）。
- **LLM 多智能体管线** `runHermesPipeline`（`lib/market-intel/hermes-pipeline.ts`）：`collect → analyze → qc → decide` 闭环；覆盖不足时自动复采（`maxRounds` / `coverageFloor`）。

### 6.3 关键差异化 — 反幻觉接地门

- 每条抽取信号必须绑定**原文逐字引文**；`gradeSignal` 用 `quoteCoverage` 做确定性校验，给出 `supported / partial / unsupported` 三态。
- 无佐证的信号被**丢弃并记录在 `drops`**（透明而非静默删除）——董事会可信赖的接地保证。
- LLM 只在 `analyze` 抽取节点运行；`qc + decide` 确定性，无网络/API key 也可单测。

### 6.4 两层智能体体系

- **Hermes** = 对外市场/竞品情报常驻 agent（`lib/market-intel/`）。
- **STRAT_AGENTS 11 智能体编排**（`lib/stratos/agents.ts`）= 对内报告→诊断→FPA→Gate→diff→Robust→快照流水线。

### 6.5 相对商业产品的优势

| 维度 | 商业产品（Cascade/Quantive 等） | StratOS · Hermes |
|------|------|------|
| 竞品扫描 | AI 助手泛化问答 | 结构化四维信号 + 来源台账 + 盲区清单 |
| 可信度 | 易幻觉、无溯源 | 逐字引文接地门 + 丢弃透明化 |
| 可测试性 | 黑盒 | qc/decide 确定性，可单测 |

**结论：** Hermes 让 StratOS 把"竞对分析"从一次性人工调研，变成了常驻、可溯源、防幻觉的智能体能力——相对商业产品的又一处护城河，而非 gap。

---

## 七、SWOT / 五事七计工具接入位置

> 本节记录竞争分析工具在 StratOS 中的代码落地位置，便于后续把分析结果与产品能力对齐。

### 7.1 SWOT 推演（`/market`）

- **引擎：** `lib/market-intel/swot.ts` — 纯函数，可单测。
  - `buildSwot`：把 Hermes 信号归集为 O/T，与内部 S/W 合并。
  - `buildPositioning`：按四维度（product / gtm / brand / strategy）把「我方」与竞品定位到十字象限。
  - `generateTows` / `buildSwotPrompt`：规则引擎兜底 + LLM 推演。
- **内部 S/W 来源：** 优先从 `/compass` 战略前提审计派生（`internalSwotFromPremises`），无数据时回退 `lib/market-intel/demo-data.ts` 的 `demoInternalSwot`。
- **我方自评分：**
  - 模型：`prisma/schema.prisma` 的 `MarketSelfScores`（按 `period` 唯一，JSON 存储四维度分数）。
  - 数据访问：`lib/market-intel/swot-access.ts` 的 `getMarketSelfScores` / `saveMarketSelfScores`（DB 不可用时回退 demo）。
  - API：`app/api/market/self-scores/route.ts`（GET/PUT，level 2 鉴权）。
  - UI：`components/market/SwotPanel.tsx` 中的「我方自评分」滑块，实时重算定位图并保存。
- **展示页：** `/market` 的 `swot` Tab 展示竞争定位十字轴、SWOT 盘面、TOWS 建议。

### 7.2 五事七计（`/culture`）

- **引擎：** `lib/culture/wushi.ts` — 纯函数，输出风险清单 + 就绪度计数。
  - 五事：`dao` / `tian` / `di` / `jiang` / `fa`；`tian` / `di` 为外部只读引用，`dao` / `jiang` / `fa` 可本页编辑。
  - 七计：7 组敌我对比，当前 verdict 默认 `unknown`（下一步接入 Hermes 信号自动推导）。
- **持久化：**
  - 模型：`prisma/schema.prisma` 的 `CultureWushiAssessment`（按 `period` 唯一，JSON 存储内部五事状态与七计 verdict）。
  - 数据访问：`lib/culture/wushi-access.ts` 的 `getWushiAssessment` / `saveWushiAssessment`。
  - API：`app/api/culture/wushi/route.ts`（GET/PUT，level 2 鉴权）。
  - UI：`components/culture/WushiPanel.tsx` 提供 `道/将/法` 状态下拉 + 备注输入，保存后写入 DB。
- **展示页：** `/culture` 页面底部渲染五事七计面板、风险清单与就绪度统计。

### 7.3 与 Hermes 的后续勾连（B/C 待做）

- **七计 verdict（B）：** 计划从 `IntelSignal` 与 `CompetitorTrack` 自动推导"我方 vs 对手"对比，替代当前的 `unknown` 占位。
- **五力 Gate（C）：** 在 `/market` 或 `/gates` 补白话版波特五力清单，用五力承载七计精神，并作为 Gate 风险项来源。

---

*v1.0 · 2026-06-22 · strategy-driven-platform · 企业自用*
