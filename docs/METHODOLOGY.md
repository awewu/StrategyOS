# StratOS 战略功能模块 · 理论体系与方法论架构

**版本：** v1.1 · 2026-06-14  
**定位：** 在写代码之前，先定 **每个模块凭什么存在、用什么方法、产出什么、如何衔接**。  
**关联：** [骨架与血肉](./SKELETON_AND_FLESH.md) · [PRD](./PRD.md) · [报告格式](./REPORT_FORMATS.md) · [UI/VI 设计体系](./UI_VI.md) · [理论导入](./THEORY_IMPORTS.md)

---

## 一、总理论架构（Theory Stack）

StratOS 不是「功能堆叠」，而是 **七基座 + 三专属 + 两层价值观 + 一条 FPA 脊梁** 驱动的推演系统。

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 0 · 元逻辑（Meta）                                      │
│  独立推演沙盘 · 会议驱动 · 版本快照 · 不实时绑 ERP              │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 · 价值观与方针（Normative）                           │
│  四个满意（Why） + 三支柱 Doctrine（How 精神）                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 1.5 · 认知层（Cognitive · MVP+）★ 见 THEORY_IMPORTS     │
│  Rumelt 诊断 · Playing to Win · Mintzberg · Cynefin          │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 · 七大理论基座（Foundations）                         │
│  BLM · BSC · OKR · 动态能力 · 五事七计 · FPA · SPBP            │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 · 三大专属模型（Rhautt-specific）                     │
│  价值链卡位 · 描述-诊断-预测-规范 · 三维/十二维健康度             │
├─────────────────────────────────────────────────────────────┤
│  Layer 4 · 十二功能模块（Modules）                             │
│  8 引擎 + 4 支撑 → 见下文                                      │
├─────────────────────────────────────────────────────────────┤
│  横切 · FPA 财务脊梁 + StratDiff 版本对比 + StratRobust 稳健性   │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 七大理论基座（全模块共享语言）

| 基座 | 源流 | 解决什么问题 | 主要服务模块 |
|------|------|--------------|--------------|
| **BLM** | IBM / 华为 | 从差距到业务设计再到关键任务 | StratCraft · StratReview |
| **BSC** | Kaplan & Norton | 四维度平衡、因果链、领先/滞后 | StratDecode · StratPilot · StratHealth |
| **OKR** | Grove / Doerr | 季度聚焦、对齐、信心指数 | StratDecode · StratPilot |
| **动态能力** | Teece | 感知-捕捉-转化，复盘是能力升级 | StratReview · StratForesight |
| **五事七计** | 孙子兵法 | 战略完整性校验、竞争胜算 | StratCraft · StratReview |
| **FPA** | 财务战略 | B-A-F、ROI、现金流、多品牌 P&L | **贯穿全模块** |
| **SPBP** | 情景规划 | 乐观/基准/悲观、政策窗口 | StratCraft · StratFinance · StratForesight |

### 1.2 三大专属模型（瑞合瑞德定制）

| 模型 | 方法本质 | 输出 |
|------|----------|------|
| **价值链卡位** | B2B 工业：研发/渠道/品牌/资源集中度 | 卡位图 + 投入建议 |
| **描述-诊断-预测-规范** | 不只打分，必须给行动 | 健康度 → 行动清单 |
| **三维健康度** | 承诺兑现 + 价值观践行 + 业务运营 | 稳健性底层指标 |

### 1.3 价值观与方针（所有模块的「宪法」）

**四个满意（校验器 · Why）：** 客户 / 员工 / 股东 / 社会 — 每个战略目标、OKR-O、重大决策必须校验。

**三支柱 Doctrine（精神 · How）：** Invest to Growth · Innovate to Lead · Deliver on Commitment — **审计一致性，不打健康分**。

**战略逻辑链（定稿）：**

```
四个满意 → 战略意图 → BSC 四维度 → OKR-O → OKR-KR（标 Doctrine 驱动）
                ↑                                    ↓
                └──────── 校验 ← 三支柱审计 ← Vx / 假设 / 承诺
                              ↑
                         FPA（B-A-F 数字脊梁）
```

---

## 二、模块总览与战略节律

### 2.1 十二模块一览

| 类型 | 模块 | 中文 | 战略节律中的角色 |
|------|------|------|------------------|
| 引擎 | **StratCraft** | 战略制定 | 年底/年中：定方向、扫环境、立假设 |
| 引擎 | **StratDecode** | 战略解码 | 年底：BSC 地图 + OKR 树 |
| 引擎 | **StratPilot** | 执行监控 | 全年：双周/月/季跟踪 |
| 引擎 | **StratReview** | 战略复盘 | 季/半年/年：GRAI·KPT·三板块 |
| 引擎 | **StratFinance** | 财务推演 | 季/半年/年：B-A-F、敏感性 |
| 引擎 | **StratGrowth** | 增长引擎 | 季：STP·AARRR·渠道 |
| 引擎 | **StratProduct** | 产品引擎 | 季：组合·生命周期·Roadmap |
| 引擎 | **StratCapital** | 资本引擎 | 年/事件：投资·M&A·固资 |
| 支撑 | **StratHealth** | 健康度 | 季/快照：四灯·十二维·稳健性 |
| 支撑 | **StratMind** | 知识引擎 | 持续：案例·方法论·学习路径 |
| 支撑 | **StratDiff** | 版本对比 | **年中/年底：核心差异化** |
| 支撑 | **StratForesight** | 行业前瞻 | 季/事件：雷达·政策·竞争 |

### 2.2 与「三件事」看板映射

| 用户看板 | 主模块 | 辅模块 |
|----------|--------|--------|
| **看战略** | StratDecode + **StrategicDiagnosis** + BrandStrategyCard | StratCraft（使命/BLM）、Doctrine |
| **看执行** | StratPilot + **ExecutionScoreboard** | 假设(StratCraft)、承诺(Deliver) |
| **看健康** | StratHealth + FPA | StratReview、StratDiff |

---

## 三、各模块理论体系与方法论（逐模块）

---

### M1 · StratCraft 战略制定引擎

**模块使命：** 回答「往哪打、凭什么打、关键赌注是什么」。

| 项 | 内容 |
|----|------|
| **理论基座** | BLM · SPBP · 五事七计 · **Rumelt 诊断** · **Playing to Win** · PESTEL/五力（辅） |
| **专属模型** | 价值链卡位 · 商业模式画布 · **BrandStrategyCard（WTP/HTW ×4）** |
| **方法论工具箱** | 差距分析 · 业务设计五要素 · 情景规划 · 假设清单 · 五事七计 · **StrategicDiagnosis 定稿** |
| **标准流程** | 环境扫描 → 差距量化 → **诊断定稿** → 战略意图 → **四品牌 WTP/HTW** → 业务设计 → Vx → 假设 → Gate |
| **输入** | 竞品情报、宏观政策、对标数据、上年度复盘 |
| **输出** | **StrategicDiagnosis**、**BrandStrategyCard ×4**、假设清单 Hx、Vx 立项建议、情景推演摘要 |
| **FPA** | 情景假设 → 驱动变量；差距分析 → 财务缺口；**诊断须含 fpa_rationale** |
| **Doctrine** | 业务设计阶段逐条审计三支柱 |
| **四个满意** | 业务设计「客户选择/价值主张」→ 客户满意；组织人才 → 员工满意 |
| **Cynefin** | 新建 Hx/Vx 默认域建议（见 Diagnosis.bottleneck_type） |
| **MVP 深度** | 使命愿景 + 假设管理 + 竞品录入；BLM 画布简版 |
| **MVP+** | **诊断对象 + 四品牌 WTP/HTW 双卡** |
| **完整版** | PESTEL/五力/德尔菲/蒙特卡洛/文档版本库 |

**核心方法卡 · BLM 差距分析：**

```
业绩差距：实际 vs 目标（FPA Actual）
机会差距：行业增速 vs 自身增速
对标差距：vs 史密斯/博世 分指标
→ 汇总为战略意图输入
```

**核心方法卡 · 战略假设：**

```
每条 Hx：内容 · 验证方式 · 关联 Vx · 关联 FPA 驱动 · **cynefin_domain** · 失效影响
状态：验证中 / 已验证 / 已失效
失效 → 触发 StratPilot 预警 + StratDiff 事件
```

---

### M2 · StratDecode 战略解码引擎

**模块使命：** 回答「年度战略如何变成可衡量、可对齐、可执行的体系」。

| 项 | 内容 |
|----|------|
| **理论基座** | BSC · OKR · **Hoshin Kanri（Phase 2 备选视图）** |
| **方法论工具箱** | 战略地图四维度 · 因果链 · 领先/滞后 · OKR 对齐树 · **X-Matrix 关联点（P2）** |
| **标准流程** | BSC Measure 定 annual → 拆季度里程碑 → 生成 OKR-O → 团队提交 KR → VP 对齐 → 四满意校验 → KR 绑 Vx/预算 |
| **输入** | StratCraft 战略意图、**StrategicDiagnosis**、BscMeasure 目标值 |
| **输出** | BSC 战略地图、OKR 树、RACI、挂载关系 |
| **FPA** | 每个 KR → `budget_tag`；财务维 Measure → FpaPeriod.budget |
| **Doctrine** | KR 标注 invest/innovate/deliver 驱动权重 |
| **四个满意** | 每个 O 必须四满意校验记录 |
| **MVP 深度** | BSC 四卡 + OKR 树 + 校验表单 |
| **MVP+** | 与诊断 / 四品牌 WTP·HTW 联动展示 |
| **Phase 2** | **Hoshin X-Matrix Tab**（与 BSC 地图切换） |
| **完整版** | 因果链 AI 验证、多品牌子地图 |

**核心方法卡 · BSC × OKR 融合（定稿逻辑）：**

```
BSC Measure（年度累积）→ 季度里程碑（作战地图）→ OKR KR（季度进度）
O = BSC 战略目标（定性+定量方向）
KR = 季度结果（可挂 Vx 里程碑）
禁止：把三支柱写成 O
```

---

### M3 · StratPilot 执行监控引擎

**模块使命：** 回答「仗打到哪了、要不要预警、资源要不要挪」。

| 项 | 内容 |
|----|------|
| **理论基座** | BSC · OKR · 项目管理 · **4DX 记分板（UI）** |
| **方法论工具箱** | 四维度仪表盘 · OKR 信心指数 · **WIG + 领先指标记分板** · Vx 看板 · 预警规则 |
| **标准流程** | 双周 Vx 更新 → 月度三报 → 季度 OKR Review → 预警分级 → 行动项追踪 |
| **输入** | 月报 MON-RPT、季报、FPA Actual |
| **输出** | **ExecutionScoreboard**、执行态看板、≤3 条关键预警、行动项 |
| **FPA** | Vx 预算执行率；KR 无 budget 标黄 |
| **Doctrine** | 预警升级与承诺逾期联动 Deliver |
| **MVP 深度** | Vx 看板 + 信心指数 + 3 预警 |
| **MVP+** | **4DX 式记分板（WIG + 2–4 领先指标）** |
| **完整版** | 经营分析会大屏、资源调配器 |

**预警方法论（骨架级）：**

| 级别 | 触发示例 | 动作 |
|------|----------|------|
| 黄 | KR 偏差 15%、假设偏红 | 部门 Review |
| 红 | 假设失效、Vx 延迟 >4 周、现金 runway <3 月 | CEO/战略会议题 |
| 黑 | 一票否决事件 | 强制战略会 |

---

### M4 · StratReview 战略复盘引擎

**模块使命：** 回答「打得对不对、能力有没有升级、文化绩效是否支撑战略」。

| 项 | 内容 |
|----|------|
| **理论基座** | 动态能力（感知/捕捉/转化）· 五事七计 · GRAI · KPT · PDCA |
| **方法论工具箱** | 三板块复盘（战略×文化×绩效）· 双环学习 · 5Why · 鱼骨 · 战略漂移检测 |
| **标准流程** | 季：部门 GRAI+KPT → 公司合成 → 半年/年：三板块关联分析 → 校准建议 |
| **输入** | 季报 QTR-REV、StratHealth、StratPilot 执行数据 |
| **输出** | 复盘报告、战略校准建议、下季 OKR 草案输入 |
| **FPA** | 复盘「投资效率」非「省钱多少」；B-A-F 偏差根因 |
| **Doctrine** | 复盘 Deliver 兑现率；Invest 投资 ROI |
| **四个满意** | 文化板块 = 四满意践行度 |
| **MVP 深度** | GRAI+KPT 模板 + 三板块摘要 |
| **完整版** | 双环学习、九宫格人才、激励评估 |

**动态能力复盘三问：**

```
感知：我们有没有早看到假设失效/竞品动作？（StratForesight 贡献）
捕捉：有没有果断调整 OKR/资源？（StratPilot 贡献）
转化：能力是否升级而非重复犯错？（StratMind 案例沉淀）
```

---

### M5 · StratFinance 财务推演引擎（FPA 的产品化界面）

**模块使命：** 回答「战略在数字上是否成立、钱够不够用、投哪更值」。

| 项 | 内容 |
|----|------|
| **理论基座** | FPA · SPBP（情景） |
| **方法论工具箱** | B-A-F 闭环 · 5 年战略财务模型 · 敏感性（9 格）· 多品牌 P&L · 12 月现金流 · Vx ROI 排序 |
| **标准流程** | 年底定 Budget → 月/季更新 Actual → H1 后修 Forecast → 战略会冻结 FPA 快照 |
| **输入** | 财务 Excel、Sheet1、月报/季报财务段、假设驱动变量 |
| **输出** | FpaPeriod、品牌 P&L、现金流预测、敏感性报告 |
| **横切** | **FPA 脊梁的主界面**；所有模块财务数字归口 |
| **Doctrine** | Invest 决策 → IRR/NPV/回收期 Gate |
| **MVP 深度** | B-A-F + 四品牌 P&L + 现金 runway + Vx 预算 |
| **完整版** | 5 年模型、9 格敏感性、乐观/基准/悲观 |

**B-A-F 方法（全系统统一口径）：**

```
B Budget   — 战略会定稿（年底为主）
A Actual   — 月报/导入（财务实际）
F Forecast — 职能滚动（季中修订）
偏差 = (A或F vs B) → StratHealth 财务维 + StratDiff #13
```

---

### M6 · StratGrowth 增长引擎 ★ 加强（见 [STRAT_GTM.md](./STRAT_GTM.md)）

**模块使命：** 回答「**攻哪些客户、铺哪些渠道、节奏多快、段级经济账是否成立**」— **GtmStack 客户×渠道前瞻沙盘**，非 CRM。

| 项 | 内容 |
|----|------|
| **理论基座** | STP · 品牌×渠道矩阵 · Deliver Gate · AARRR/Keller（P2） |
| **专属模型** | **GtmStack**（Deliver+渠道 Invest 竖切）· GtmBet · CoverageSnapshot |
| **方法论工具箱** | CustomerSegment · BrandChannelCell · GtmRoadmap · SegmentEconomics · Deliver Gate |
| **标准流程** | WTP 下钻 → STP focus 段 → 品牌×渠道矩阵 → GtmBet → 挂 OKR/Hx/IC → 战略会 Gate |
| **输入** | Sheet2 客户 · Sheet8 营销精简 · 月报签约段 · BrandStrategyCard |
| **输出** | GtmStack 屏 · 覆盖差距 · LTV:CAC 告警 · 渠道出牌路线 |
| **FPA** | 段级 revenue/CAC · 渠道 CPL/ROI · 与 CapStack 现金波峰 |
| **BSC** | 客户维（NPS/签约/满意度/LTV:CAC） |
| **Doctrine** | Deliver（签约承诺）· Invest（渠道投入） |
| **明确不做** | 线索 pipeline · 返利/DMS · 实时 CRM |
| **MVP+** | **Segment + BrandChannelCell + GtmBet + GtmRoadmap + 看战略 GtmStack** |
| **Phase 2** | AARRR 漏斗 · Keller · TAM/SAM/SOM · 渠道效能 |

---

### M7 · StratProduct 产品引擎 ★ 加强（见 [STRAT_PRODUCT.md](./STRAT_PRODUCT.md)）

**模块使命：** 回答「**今夕何牌、下一张牌、缺什么牌、何时出牌**」— **产品前瞻布局沙盘**，非 PLM/需求池。

| 项 | 内容 |
|----|------|
| **理论基座** | JTBD · 生命周期 · 三层面 · BCG 简版 · Now/Next/Later · Stage-Gate（P2） |
| **专属模型** | **ProdStack 产品前瞻栈**（Innovate 竖切）· ProductBet · 竞品四维差距 |
| **方法论工具箱** | 品牌×品类矩阵 · JTBD 卡 · Roadmap 三泳道 · Innovate Gate · TechSignal（P2） |
| **标准流程** | WTP 下钻 → 组合/horizon → JTBD → Gap → Roadmap → 挂 Vx/Hx/IC → 战略会 Gate |
| **输入** | Sheet9 产品精简 · Sheet4 竞品产品动作 · Diagnosis · BrandStrategyCard |
| **输出** | ProdStack 屏 · ProductBet · Roadmap · Gap 清单 · 出牌建议 |
| **FPA** | 新品收入占比 · 研发 ROI · 产品线收入 drill |
| **Doctrine** | Innovate **必须**有 ProductBet 或 ProductLine.horizon=H2/H3 依据 |
| **BSC** | 流程维（社会满意）· 客户维（产品 NPS/交付） |
| **明确不做** | BOM/PLM · Sprint 排期 · 自动专利雷达 · 全量 RICE 池（MVP+） |
| **MVP+** | **ProductLine + JTBD + Roadmap + Gap + ProductBet + 看战略 ProdStack** |
| **Phase 2** | TechSignal · RICE · BCG 全矩阵 · Stage-Gate 深 |

---

### M8 · StratCapital 资本引擎 ★ 加强（见 [STRAT_CAPITAL.md](./STRAT_CAPITAL.md)）

**模块使命：** 回答「钱往哪押、现金顶不顶得住、产能够不够、投后偏没偏」— **资本配置沙盘**，非 ERP 固资。

| 项 | 内容 |
|----|------|
| **理论基座** | 投资学 · Real Options（P2）· 三层面 · M&A 整合 · **产能战略推演** |
| **专属模型** | **CapStack 资本栈**（FPA 第二竖切）· 投资评分卡 · 现金波峰 · 产能缺口反推 |
| **方法论工具箱** | 五类投资 · 100 分 Gate 清单 · CapStack 三层面/四品牌 · CapacitySnapshot · M&A 四方向（P2） |
| **标准流程** | IC 立项 → 评分卡 → Doctrine+五事 Gate → 战略会批准 → 挂 Vx/FPA → 投后偏离（P2） |
| **输入** | Sheet10 投资 · Sheet12 固资**摘要**（5 字段，非台账）· FPA · 销售/产能假设 |
| **输出** | 投资管道 · CapStackPeriod · 现金波峰 · 产能缺口 · 风险清单 |
| **FPA** | IC.capex ↔ CapStack ↔ CashPosition.runway；波峰月联动 |
| **Doctrine** | Invest **必须**挂 IC 或 capital_tag Vx |
| **明确不做** | 折旧凭证 · 维保工单 · 实时银企 · 台账 CRUD |
| **MVP+** | **IC + CapStack + CapacitySnapshot + FPA 资本 Tab + 评分卡** |
| **Phase 2** | MaPipeline · AssetCapacityLine · Real Options · 投后偏离 |

---

### M9 · StratHealth 健康度引擎

**模块使命：** 回答「公司整体打得怎么样、底线有没有被突破」。

| 项 | 内容 |
|----|------|
| **理论基座** | BSC · 三维健康度 · 十二维扩展 |
| **专属模型** | 描述-诊断-预测-规范（分维给行动） |
| **方法论工具箱** | 四维度独立红绿灯 · 8 核心 KPI · 十二维雷达 · 一票否决 · StratRobust 五维 |
| **标准流程** | 季：录入 KPI → 算灯 → 诊断行动 → 并入快照 |
| **输入** | FPA、StratPilot、承诺、四满意调研 |
| **输出** | 健康度屏、CEO 一页纸健康段 |
| **FPA** | 财务维 = B-A-F + runway；一票否决 |
| **MVP** | 四维灯 + 8 KPI + Robust 简版 |
| **完整版** | 十二维、对标史密斯/博世 |

**三维 × 十二维关系：**

```
CEO 看：承诺兑现 30% + 价值观 25% + 业务运营 45%（三维）
战略部看：十二维下钻（含 v4.2 投资/固资维）
规则：子维红灯 → 对应三维块变红
```

---

### M10 · StratMind 知识引擎

**模块使命：** 回答「团队懂不懂战略、方法论会不会用、教训有没有沉淀」。

| 项 | 内容 |
|----|------|
| **理论基座** | 组织学习 · 双环学习 · 案例推理 |
| **方法论工具箱** | 流派库（BLM/BSC/OKR/SPBP）· 案例库 · 角色学习路径 · 理解度测评 |
| **标准流程** | 复盘结论 → 案例入库 → 下季培训推荐 |
| **输入** | StratReview 沉淀、上传 PDF |
| **输出** | 知识检索、AI RAG 语料 |
| **MVP** | 资料库上传 + 检索 |
| **完整版** | 学习路径、季度测评 |

---

### M11 · StratDiff 版本对比引擎 ★ 差异化核心

**模块使命：** 回答「两次战略会之间，什么变了、变因是什么、稳不稳」。

| 项 | 内容 |
|----|------|
| **理论基座** | 版本控制 · **Mintzberg 战略形成** · 归因分析 |
| **方法论工具箱** | **18 类 diff**（含 #15–18 模式类）· StrategyPattern · 双/多版本趋势 |
| **标准流程** | 快照 A vs B → 自动 diff → 归因（人+AI）→ 写入 Robust → 战略会议题 |
| **输入** | `{YYYY}-H1-STRATEGIC` vs `{YYYY}-FY-STRATEGIC` 等 |
| **输出** | 变化清单、**涌现/未实现/偶成报告**、稳健性分、董事会一页纸「变化段」 |
| **FPA** | #13 预测修订 · #14 现金流安全线 |
| **MVP** | 8 类 diff + Top5 变化 |
| **MVP+** | **+ diff #15–18 + StrategyPattern 章 + 月报 §8** |
| **完整版** | 18 类 + R6 学习稳健性 + 归因 AI |

**规定对比（战略会标准动作）：**

```
年中会：FY(N-1) vs H1(N)     — 上半年偏离
年底会：H1(N) vs FY(N)       — 下半年修正
年底会：FY(N-1) vs FY(N)     — 年度演化
```

---

### M12 · StratForesight 行业前瞻引擎

**模块使命：** 回答「外部会怎么变、窗口在哪、竞品下一步是什么」。

| 项 | 内容 |
|----|------|
| **理论基座** | SPBP · 技术 S 曲线 · 竞争情报 |
| **方法论工具箱** | 技术雷达 · 政策时间轴 · 竞争图谱 · 机会窗口 · 人才前瞻 |
| **标准流程** | 持续录入竞品 → 季评趋势 → 事件触发快评 → 输入 StratCraft 假设 |
| **输入** | Sheet4 竞品、外部情报 |
| **输出** | 雷达图、政策节点、事件简报 |
| **动态能力** | 「感知」能力的主数据源 |
| **MVP** | 竞品动态表 + 事件录入 |
| **完整版** | 技术雷达、政策轴、AI 监控 |

---

## 四、横切方法论（全模块必须遵守）

### 4.1 FPA 脊梁（见 StratFinance + SKELETON）

所有模块产出若涉及资源/结果，须能回答：**Budget · Actual · Forecast 各是多少，挂哪条假设。**

### 4.2 Doctrine 审计（非打分）

```
决策进入系统 → 三支柱 Yes/No/例外 → 四满意校验 → 记录 audit_id
违背 → StratDiff #6 → 可能进战略会议题
```

### 4.3 报告管道（MON-RPT / QTR-REV）

月报/季报是 **各模块的数据总线**，不是孤立文档。解析后分发至：StratPilot、StratFinance、假设库、承诺库、StratHealth。

### 4.4 StratRobust 战略稳健性

| 维 | 方法论来源 |
|----|------------|
| R1 方向 | StratDiff 意图/目标变化 + StratCraft |
| R2 逻辑 | 假设账本 + StratDecode 挂载完整性 |
| R3 执行 | Deliver 兑现 + StratPilot 准时率 + FPA 预测准确度 |
| R4 底线 | StratHealth 四满意 + BSC 灯 + FPA runway |
| R5 精神 | Doctrine 审计通过率 + Invest FPA 可行性 |
| R6 学习 | **StrategyPattern 涌现吸收率**（THEORY_IMPORTS I2） |

---

## 五、战略会方法论（年中 · 年底标准议程）

两次战略会是 **全模块方法论的总验收**。

### 5.1 年底战略会（FY 快照）

| 议程块 | 主导模块 | 方法 |
|--------|----------|------|
| 环境与差距 | StratCraft | BLM 差距 + SPBP 情景 |
| 战略解码 | StratDecode | BSC 地图 + OKR 定稿 |
| 财务与预算 | StratFinance | B-A-F 定 B + 5年/12月现金 |
| 项目与资本 | StratPilot + StratCapital | Vx 规划 + 投资队列 |
| 增长与产品 | StratGrowth + StratProduct | 漏斗 + Roadmap（完整版） |
| 健康与稳健 | StratHealth + StratDiff | FY vs FY 对比 + Robust |
| 前瞻 | StratForesight | 下年政策/竞争窗口 |
| 决议 | 全员 | Doctrine 审计 + 四满意 Gate → **FY 快照** |

### 5.2 年中战略会（H1 快照）

| 议程块 | 主导模块 | 方法 |
|--------|----------|------|
| 上半年复盘 | StratReview | GRAI + 三板块 |
| 健康与 diff | StratHealth + StratDiff | H1 vs 去年底 |
| 假设验证 | StratCraft | 假设账本修订 |
| Forecast 修订 | StratFinance | A 定稿 + F 修全年 |
| OKR 微调 | StratDecode | 下季 KR 调整 |
| 决议 | | → **H1 快照** |

---

## 六、模块依赖与建设顺序（方法论优先）

```
Phase 0 理论定稿（本文档 + 字段 spec）
    ↓
Phase 1 主干方法论落地
    StratDecode（BSC+OKR）
    + StratPilot（Vx+预警）
    + StratFinance/FPA（B-A-F）
    + StratHealth + StratDiff（快照+diff+Robust）
    + 报告管道（MON/QTR）
    ↓
Phase 2 制定与复盘加深
    StratCraft（假设+BLM简版）
    + StratReview（GRAI+三板块）
    + StratForesight（竞品）
    ↓
Phase 3 引擎扩展
    StratGrowth · StratProduct · StratCapital · StratMind 深版
    + SPBP 蒙特卡洛 · 11 Agent
```

---

## 七、研讨检查清单（每个模块过 Gate）

对每个模块，研讨时必须答完 **5 问**：

1. **使命：** 用户用它回答哪一个战略问题？  
2. **理论：** 基于哪 1–2 个基座，用什么标准方法？  
3. **输入输出：** 从哪来、到哪去、挂哪些对象？  
4. **FPA / Doctrine / 四满意：** 三者如何校验？  
5. **节律：** 月/季/年中/年底哪一步必用？

---

## 八、一句话

> **StratOS 的方法论 = 七基座定工具，四满意+三支柱定底线，FPA 定数字，十二模块定分工，两次快照定历史，StratDiff+Robust 定战略是否还能站住。**

下一步建议：按 **Phase 1 五模块**（Decode / Pilot / Finance / Health / Diff）逐张输出 **方法卡 + 字段 spec**。
