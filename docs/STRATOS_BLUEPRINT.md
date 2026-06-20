# StratOS 战略推演系统 · 产品总纲（Blueprint）

**版本：** v1.0 · 2026-06-14  
**状态：** 定稿 — 合并 v5.4 蓝图、骨架研讨、理论导入、三栈加强、进化路线之 **单一构想文档**  
**适用：** 瑞合瑞德 · ~300 人 · 核心用户 ~30 人 · 2026 Q3 战略会 MVP+ 对齐  
**v1.1：** [§16 三大闭环](./STRATOS_BLUEPRINT.md#十六三大闭环规则评审锁定--v11) · [一页纸全景](./ONE_PAGE_PANORAMA.md)

**深度附录（字段级细节）：**  
[SKELETON](./SKELETON_AND_FLESH.md) · [METHODOLOGY](./METHODOLOGY.md) · [THEORY_IMPORTS](./THEORY_IMPORTS.md) · [STRAT_CAPITAL](./STRAT_CAPITAL.md) · [STRAT_PRODUCT](./STRAT_PRODUCT.md) · [STRAT_GTM](./STRAT_GTM.md) · [REPORT_FORMATS](./REPORT_FORMATS.md) · [UI_VI](./UI_VI.md) · [HIGHER_DIMENSION](./HIGHER_DIMENSION.md)

---

## 目录

1. [产品定义](#一产品定义)  
2. [战略逻辑链](#二战略逻辑链)  
3. [总体架构](#三总体架构)  
4. [理论层](#四理论层)  
5. [三栈竖切](#五三栈竖切-capstack--prodstack--gtmstack)  
6. [十二模块](#六十二功能模块)  
7. [对象模型](#七对象模型)  
8. [三看板与 UI](#八三看板与-ui)  
9. [报告 · 节律 · 战略会](#九报告--节律--战略会)  
10. [版本 · Diff · 稳健性](#十版本--diff--稳健性)  
11. [健康度 · 五事七计](#十一健康度--五事七计)  
12. [数据导入](#十二数据导入)  
13. [分期路线图](#十三分期路线图)  
14. [边界与对标](#十四边界与对标)  
15. [验收标准](#十五验收标准)  
16. [三大闭环规则](#十六三大闭环规则评审锁定--v11)

---

## 一、产品定义

### 1.1 一句话

**StratOS 是给 CEO、董事会和高管用的「战略沙盘」** —— 把要打什么仗、钱/产品/渠道如何配置、打到哪里、哪里有风险，放在一屏看清；**每年年中、年底两次战略会**做版本快照，找变化、看战略是否还站得住。

### 1.2 不是什么

| 不是 | 是 |
|------|-----|
| ERP / 财务凭证 | 独立推演沙盘 |
| CRM / 线索 pipeline | 客户×渠道 **前瞻**布局 |
| PLM / BOM | 产品 **出牌**教练 |
| 固资台账 | 产能 **战略**推演 |
| 全员 OKR / 日复盘 | **~30 人**战略网络 |
| 实时数据仓库 | 月报/季报 + Excel 导入 |

### 1.3 用户与节律

- **深度用户 ~30 人：** CEO、VP、PM、战略/财务/HR/市场核心、observer  
- **脉冲：** 月报 → 季报 → **6 月 H1 快照** → **12 月 FY 快照**  
- **元定位（Kotter）：** StratOS = **战略网络 OS**；ERP/OA = **运营 OS**（数据导出/决议回灌，不实时绑）

### 1.4 进化愿景

| 维度 | 说明 |
|------|------|
| D1 计划对齐 | BSC + OKR + WTP/HTW + 三栈 |
| D2 执行监控 | 4DX 记分板 + Vx + 月报 |
| D2.5 财务 | FPA B-A-F + CapStack 波峰 |
| D2.5 史学 | 快照 + **Mintzberg** 战略形成 diff |
| **D3 认知** | **Rumelt 诊断 + 三栈资源配置 + Gate 清单** |

> **使命升维：** 30 人战略网络的 **认知与学习操作系统** —— 用诊断定焦点，用三栈定配置，用快照记历史，用 diff 见涌现，用稳健性保底线。

---

## 二、战略逻辑链

```
四个满意（Why 底线）
    ↓
StrategicDiagnosis（今年核心挑战 · Rumelt）
    ↓
BrandStrategyCard（WTP/HTW × 四品牌 · Playing to Win）
    ↓
BSC 四维度 + 战略地图
    ↓
三栈资源配置 ──┬── CapStack（Invest · 钱）
            ├── ProdStack（Innovate · 产品）
            └── GtmStack（Deliver · 客户×渠道）
    ↓
OKR（O←BSC，KR←Doctrine，KR 绑 budget_tag）
    ↓
Vx + Hx + 承诺
    ↓
FPA 脊梁（B-A-F · 四品牌 P&L · 现金 runway · 假设驱动）
    ↓
健康度四灯 + StratRobust
    ↓
{YYYY}-H1/FY-STRATEGIC 快照 → StratDiff → 下版 deliberate
```

**Doctrine 三支柱（审计，不打分）：**

| 支柱 | 精神 | 三栈 / 约束 |
|------|------|-------------|
| Invest to Growth | 投资驱动增长 | CapStack · 渠道 CAPEX |
| Innovate to Lead | 创新引领 | ProdStack |
| Deliver on Commitment | 承诺兑现 | GtmStack · 承诺库 |

**四个满意 × BSC：**

| BSC | 四个满意 | 示例 KPI |
|-----|----------|----------|
| 财务 | 股东 | 营收/利润/ROIC/现金流 |
| 客户 | 客户 | NPS/签约/满意度/LTV:CAC |
| 流程 | 社会 | 合格率/COP/新品占比/ESG |
| 学习 | 员工 | 单王/敬业度/培训/提案 |

---

## 三、总体架构

```
┌─────────────────────────────────────────────────────────────┐
│ Meta · D3 认知                                               │
│ Rumelt 诊断 · Mintzberg · Cynefin · 双环学习                  │
├─────────────────────────────────────────────────────────────┤
│ Normative · 四个满意 + Doctrine 审计                          │
├─────────────────────────────────────────────────────────────┤
│ Architecture · BLM · BSC · OKR · SPBP · 五事七计 Gate         │
├─────────────────────────────────────────────────────────────┤
│ ★ 三栈 · CapStack │ ProdStack │ GtmStack                     │
├─────────────────────────────────────────────────────────────┤
│ Execution · Vx · Hx · 承诺 · OKR · 4DX 记分板                 │
├─────────────────────────────────────────────────────────────┤
│ FPA 脊梁 · B-A-F · 四品牌 P&L · runway · CapStack 波峰        │
├─────────────────────────────────────────────────────────────┤
│ Version · 快照 · StratDiff(30) · StratRobust(5+1)           │
└─────────────────────────────────────────────────────────────┘
          ↑ MON-RPT / QTR-REV / Sheet 导入
```

**设计原则（锁定）：**

1. 仅 **三看板** CEO 主入口 + FPA + 版本库  
2. **完整 v5.4，分期交付** — 不阉割模块  
3. **Gate 清单 > 假分数**（Doctrine、五事七计、评分卡、竞品差距）  
4. 快照 **不可改**；diff = 战略形成史，非仅 KPI 对比  

---

## 四、理论层

### 4.1 七基座（操作层 · 全模块共享）

| 基座 | 用途 | 主模块 |
|------|------|--------|
| BLM | 差距→业务设计→任务 | StratCraft |
| BSC | 四维度·因果·KPI | StratDecode |
| OKR | 季度对齐执行 | StratPilot |
| 动态能力 | 感知-捕捉-转化 | StratReview |
| 五事七计 | **Gate 清单**（非打分） | StratCraft/Review |
| FPA | B-A-F 数字脊梁 | 贯穿 |
| SPBP | 三情景假设 | StratCraft/Finance |

### 4.2 理论导入（MVP+ / Phase 2）

| ID | 理论 | 阶段 | 落点 |
|----|------|------|------|
| I1 | Rumelt 诊断 | MVP+ | `StrategicDiagnosis` |
| I2 | Mintzberg | MVP+ | `StrategyPattern` · diff #15–18 · 月报 §8 |
| I3 | Playing to Win | MVP+ | `BrandStrategyCard` WTP/HTW |
| I4 | Cynefin | MVP+ | Hx/Vx/议题 `cynefin_domain` |
| I5 | 4DX | MVP+ | `ExecutionScoreboard` |
| I6 | 三层面 | P2 | `horizon` |
| I7 | Hoshin X-Matrix | P2 | StratDecode Tab |
| I8 | JTBD+生命周期 | MVP+ | ProdStack |

### 4.3 专属模型（瑞合）

- **价值链卡位** — B2B 研发/渠道/品牌/资源  
- **描述-诊断-预测-规范** — 健康度→行动  
- **三维健康度** — 承诺 30% + 价值观 25% + 运营 45%  

---

## 五、三栈竖切（CapStack · ProdStack · GtmStack）

三栈对称，服务 Invest / Innovate / Deliver，**看战略同屏**。

### 5.1 CapStack · 资本（Invest）

**问：** 钱往哪押？波峰何时？产能够吗？

| MVP+ 对象 | 要点 |
|-----------|------|
| `InvestmentCase` | 五类投资·评分卡·Gate·挂 Vx/Hx |
| `CapStackPeriod` | CAPEX 三态·三层面·四品牌·**现金波峰** |
| `CapacitySnapshot` | 需求→产能→缺口（**非台账**） |

**UI：** FPA **资本 Tab**；看战略 CapStack 摘要条。  
**不做：** 折旧凭证·维保·ERP 台账。

### 5.2 ProdStack · 产品（Innovate）

**问：** 今夕何牌？下一张牌？缺什么牌？

| MVP+ 对象 | 要点 |
|-----------|------|
| `ProductLine` | 品牌×品类·lifecycle·H1/H2/H3 |
| `JtbdCard` | When/I want/so I can |
| `ProductRoadmapItem` | Now/Next/Later |
| `CompetitiveProductGap` | vs 史密斯/博世 四维定性 |
| `ProductBet` | success/kill · 对齐 crux |

**UI：** 看战略 **ProdStack 屏**（H1/H2/H3 条 + 三泳道 + lagging 差距）。  
**不做：** PLM·Sprint 排期。

### 5.3 GtmStack · 客户×渠道（Deliver）

**问：** 攻谁？走哪渠道？铺多快？LTV:CAC 成立吗？

| MVP+ 对象 | 要点 |
|-----------|------|
| `CustomerSegment` | STP focus/explore/defer |
| `BrandChannelCell` | 4 品牌×5 渠道·P0–P3·coverage 三态 |
| `GtmRoadmapItem` | 渠道 Now/Next/Later |
| `GtmBet` | 如「酒店 1200 家」 |
| `CoverageSnapshot` · `SegmentEconomics` | 差距·LTV:CAC |

**UI：** 看战略 **GtmStack 屏**（矩阵热力 + 泳道）。  
**不做：** CRM 线索·返利 DMS。

### 5.4 三栈联动

```
Diagnosis.crux
  ├─ ProductBet → ProductLine → Vx
  ├─ GtmBet → Segment → OKR-KR
  └─ InvestmentCase → CapStack → runway

WTP/HTW → ProductLine + CustomerSegment + BrandChannelCell
JTBD.segment ↔ CustomerSegment
```

**Gate：** Innovate（ProdStack）· Deliver（GtmStack）· Invest（CapStack+Doctrine）· 五事七计（StratCraft）— 均输出 **风险清单**。

---

## 六、十二功能模块

| 模块 | 中文 | MVP+ 重心 |
|------|------|-----------|
| StratCraft | 战略制定 | 诊断·WTP·Hx·BLM 简版·五事 Gate |
| StratDecode | 战略解码 | BSC·OKR·三栈联动 |
| StratPilot | 执行监控 | 4DX·Vx·预警 |
| StratReview | 战略复盘 | GRAI/KPT·DC 三环 |
| StratFinance | 财务推演 | B-A-F·P&L·**资本 Tab** |
| StratGrowth | 增长引擎 | **GtmStack 全套** |
| StratProduct | 产品引擎 | **ProdStack 全套** |
| StratCapital | 资本引擎 | **CapStack 全套** |
| StratHealth | 健康度 | 四灯·8 KPI·Robust |
| StratMind | 知识引擎 | 资料库·Gate 知识卡 |
| StratDiff | 版本对比 | **30 类 diff** · StrategyPattern |
| StratForesight | 行业前瞻 | 竞品·产品级动作 |

---

## 七、对象模型

### 7.1 骨架（15 + FPA 3）

User · MissionVision · BscDimension/Measure · Objective/KeyResult · Project(Vx) · ProjectFinancials · Assumption · FpaPeriod · FpaBrandPnl · CashPosition · Commitment · HealthSignal · Report · StrategicSnapshot · DoctrineAudit

### 7.2 MVP+ 增量（+18）

**认知：** StrategicDiagnosis · BrandStrategyCard×4 · StrategyPattern · ExecutionScoreboardConfig  

**CapStack：** InvestmentCase · CapStackPeriod · CapacitySnapshot  

**ProdStack：** ProductLine · JtbdCard · ProductRoadmapItem · CompetitiveProductGap · ProductBet  

**GtmStack：** CustomerSegment · BrandChannelCell · GtmRoadmapItem · GtmBet · CoverageSnapshot · SegmentEconomics  

**横切：** Assumption/Project.cynefin_domain · Project.horizon  

**快照冻结：** 上述全部 + 三栈聚合指标（h3_ratio · coverage_gap · deliberate_rate 等）

---

## 八、三看板与 UI

### 8.1 导航

指挥舱 · **看战略** · **看执行** · **看健康** · **FPA 财务** · 报告中心 · 版本库

### 8.2 看战略（进化布局）

1. **DiagnosisBanner** — 核心挑战 ≤80 字  
2. **ProdStackPanel** — 产品前瞻  
3. **GtmStackPanel** — 客户×渠道前瞻  
4. **四品牌 WTP/HTW Tab**  
5. **CapStack 摘要条**（详请 FPA 资本 Tab）  
6. BSC 四卡（客户维 → Gtm 下钻）  
7. OKR 树  
8. Doctrine  

### 8.3 看执行

1. **ExecutionScoreboard** — WIG + 2–4 领先 KR/假设  
2. Vx 看板（horizon · Cynefin · IC/Product/Gtm 链）  
3. 假设 Hx · 承诺 · ≤3 预警  

### 8.4 看健康

四灯独立 · 8 KPI · B-A-F 条 · runway · Robust 5+1  

### 8.5 指挥舱（CEO）

时间轴 · BSC 四卡 · Robust · Top3 diff · Top3 预警 · B-A-F 迷你条 · 一页纸 PDF  

### 8.6 VI 要点

Dark 指挥舱 · BSC 维度色左边框 · 语义灯色 · Mono 数字 · 无 panic 动画  

---

## 九、报告 · 节律 · 战略会

### 9.1 月报 MON-RPT（七章 + §8）

§1 一句话 · §2 OKR/KPI · §3 Vx · §4 Hx · §5 承诺 · §6 Doctrine · §7 下月重点 · **§8 战略模式（Mintzberg，可选）**

### 9.2 战略会标准议程（~3h）

| 环节 | 内容 |
|------|------|
| 开场 15m | 诊断 · Robust · Top5 diff |
| 资本 30m | CapStack · IC Gate · 波峰 · 产能 |
| 产品 30m | ProdStack · ProductBet · Innovate Gate |
| 增长 30m | GtmStack · GtmBet · Deliver Gate · LTV:CAC |
| 解码 45m | BSC/OKR · WTP 调整 |
| 决议 30m | 快照批准 · 承诺 |

### 9.3 快照

| ID | 时机 |
|----|------|
| `{YYYY}-H1-STRATEGIC` | 年中战略会 |
| `{YYYY}-FY-STRATEGIC` | 年底战略会 |

含：BSC/OKR/Vx/Hx/FPA/**诊断/三栈/WTP/StrategyPattern** — **只读**。

---

## 十、版本 · Diff · 稳健性

### 10.1 StratDiff 30 类（分期实现）

| # | 类型 | 栈/层 |
|---|------|-------|
| 1–12 | BSC/OKR/Vx/Hx/Doctrine/健康/承诺/四满意/资源/竞争/意图 | 骨架 |
| 13–14 | FPA 预测修订·现金流安全线 | FPA |
| 15–18 | 涌现/未实现/偶成/刻意实现率 | Mintzberg |
| 19–22 | 投资 Gate·CAPEX 迁移·波峰·产能缺口 | CapStack |
| 23–26 | 产品 Roadmap/赌注/差距/品类 | ProdStack |
| 27–30 | 客户段/渠道格/覆盖/LTV:CAC | GtmStack |

### 10.2 StratRobust（5+1）

R1 方向 · R2 逻辑 · R3 执行（含 coverage·ROI） · R4 底线（含 LTV:CAC·runway） · R5 精神 · **R6 学习**（涌现吸收率）

### 10.3 一票否决

现金 runway < 3 月 · 重大质量/合规 · 核心团队流失 >30% · 品牌危机（NPS<0+重大舆情）

---

## 十一、健康度 · 五事七计

### 11.1 CEO 视图（MVP+）

- BSC **四灯** + **8 核心 KPI** + 三维摘要（不强制单一总分）  

### 11.2 十二维（Phase 2 战略部下钻）

**三维：** 承诺兑现 30% · 价值观 25% · 业务运营 45%（含财务/客户/流程/学习/营销/产品/投资/固资/风险）

### 11.3 五事七计（Gate 清单 · 非打分）

**五事：** 道（使命一致）· 天（时机）· 地（市场根基）· 将（人才）· 法（组织）  

**七计：** 对标竞品七问（主孰有道…赏罚孰明）— **定性 + 证据指引**

输出：**风险清单**，不算「胜算 XX%」。

---

## 十二、数据导入

| Sheet | MVP+ | 内容 |
|-------|------|------|
| 1 财务 | ✓ | B-A-F |
| 2 客户 | ✓ | Segment·coverage·LTV/CAC |
| 3 项目群 | ✓ | Vx |
| 4 竞品 | ✓ | 公司+**产品级** |
| 5 假设 | ✓ | Hx |
| 8 营销 | ✓ | 品牌×渠道 |
| 9 产品 | ✓ | ProductLine |
| 10 投资 | ✓ | IC |
| 12 固资摘要 | ✓ | 产能 5 字段 |

**原则：** CRM/ERP → 定期 Excel 导出 → StratOS；**无实时 API**。

---

## 十三、分期路线图

### Phase 0 · MVP（基线）

登录 · 三看板简版 · FPA B-A-F · 月报/季报 · H1/FY 快照 · diff 8 类 · Robust 简版  

### Phase 1 · MVP+（Q3 战略会主战场）

| 优先级 | 交付 |
|--------|------|
| P0 | StrategicDiagnosis · 快照 · FPA 稳定 |
| P1 | **三栈全套** · WTP/HTW |
| P2 | 4DX · Cynefin · Mintzberg · diff #15–30 |
| P3 | CEO 一页纸 PDF |

### Phase 2（6–12 月）

5 年财务·敏感性 · M&A · AARRR/Keller · Hoshin Tab · 十二维 · Real Options · TechSignal  

### Phase 3

AI Agent 子集 · 情景概率 · TRL 雷达 · 反事实 diff  

---

## 十四、边界与对标

### 14.1 明确不做

ERP 实时 · CRM pipeline · PLM · 固资台账 · 全员 OKR · Doctrine/五事 **打分** · 30 人阉割版  

### 14.2 开源对标结论

| 能力 | 最接近开源 | StratOS 差异化 |
|------|------------|----------------|
| BSC+OKR | hillfog | 三栈+FPA+快照史学 |
| OKR 执行 | Operately | 30 人战略会 |
| 产品/渠道/资本前瞻 | **无** | 三栈自研 |
| 战略形成史 | **无** | Mintzberg diff |

**策略：** 不 fork；借鉴 BSC-OKR 对象关系；**三栈 + diff 自研**。

---

## 十五、验收标准（MVP+）

1. CEO **看战略一屏**见：诊断 + 三栈 + BSC  
2. Invest/Innovate/Deliver 重大决策可追溯 **IC / ProductBet / GtmBet**  
3. H1/FY 快照不可改，含三栈+诊断  
4. 两版 diff ≥15 类 + StrategyPattern 章  
5. 月报 §8/§2 更新 emergent/coverage  
6. FPA 资本 Tab 见 CAPEX 三态+波峰  
7. Gate 输出 **风险清单** 非综合分  
8. 三栈 Bet **budget_tag** ↔ FPA Toggle；否决 **Assertion** 硬阻断；Cynefin **看执行分轨**  

---

## 附录 A · 文档体系

| 文档 | 角色 |
|------|------|
| **STRATOS_BLUEPRINT.md（本文）** | **总纲 · 单一入口** |
| [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md) | 进化路线（与总纲同步） |
| [PRD.md](./PRD.md) | 需求摘要 |
| [SKELETON_AND_FLESH.md](./SKELETON_AND_FLESH.md) | 骨架宪法 |
| STRAT_CAPITAL / PRODUCT / GTM | 三栈细则 |
| [THEORY_IMPORTS.md](./THEORY_IMPORTS.md) | I1–I8 字段 |
| [METHODOLOGY.md](./METHODOLOGY.md) | 十二模块详述 |
| [REPORT_FORMATS.md](./REPORT_FORMATS.md) | 报告与 diff 规则 |
| [UI_VI.md](./UI_VI.md) | 视觉与组件 |
| [HIGHER_DIMENSION.md](./HIGHER_DIMENSION.md) | D3 Meta 深述 |

> [PRODUCT_FRAMEWORK.md](./PRODUCT_FRAMEWORK.md)（30 人阉割版）已 **superseded**，以本文为准。

---

## 附录 B · 一句话定稿

> **StratOS = 骨架（Doctrine→四满意+BSC→OKR→FPA→快照）+ 血肉（诊断+三栈+4DX+Gate）+ 史学（Mintzberg diff+Robust）**  
> 服务 **年中/年底两次战略会**，让 **300 人公司的 30 人核心层** 在 **钱、产品、渠道** 三类资源配置上有据、变更有痕、学习可见。

---

## 十六、三大闭环规则（评审锁定 · v1.1）

> 以下三条来自 Blueprint 评审，已在骨架层 **锁死**，避免三栈、FPA、执行面板「两张皮」。

### 16.1 FPA 脊梁 ↔ 三栈 · `budget_tag` 物理勾连

**问题：** 三栈 Bet 偏定性离散，FPA 偏定量 B-A-F，若未勾连则联动失效。

**规则（骨架级）：**

| 对象 | 必填/推荐 | 说明 |
|------|-----------|------|
| `InvestmentCase` | **budget_tag** 必填 | 格式 `IC-{code}`，映射 CapStack CAPEX 行 |
| `ProductBet` | **budget_tag** 推荐 | 映射研发/新品 OPEX 或 CAPEX 行 |
| `GtmBet` | **budget_tag** 推荐 | 映射渠道/市场费用行 |
| `KeyResult` | budget_tag 必填（已有） | 与 OKR 执行层统一命名空间 |

**FPA 预测曲线开关（Toggle Line）：**

```
Bet.gate_status 变更时：
  approved  → FPA Forecast 纳入对应 budget_tag 金额（默认 ON）
  post_invest / shipped → 保持 ON，Actual 从月报回灌
  rejected / killed     → Forecast 对应 tag 金额归零（Toggle OFF），保留历史折线 ghost 供 diff
  deferred              → Forecast 延迟至 target_quarter，不删 tag
```

**UI：** FPA Tab 每条 B-A-F 行可展开「挂载 Bet 列表」；Bet 详情显示 `budget_tag` + Toggle 状态。

**校验：** 保存 approved Bet 时，若无 `budget_tag` → 阻塞（IC 必填；Product/Gtm 黄警可 CEO 例外）。

### 16.2 一票否决 · 强制断言（非实时 API）

**问题：** 不接 ERP，否决项何时生效？

**规则：** 否决 **不在线实时计算**；在 **数据入库节点** 做 **强制断言（Assertion）**：

| 触发节点 | 断言内容 |
|----------|----------|
| 月报 MON-RPT 解析完成 | 若 § 或挂载 FPA 含 runway/NPS/事故字段 |
| 季报 QTR-REV 入库 | 同上 + 核心团队流失率 |
| Sheet1 财务 Excel 确认导入 | 现金 runway · 重大事故 flag |
| 快照创建前 | **全量断言复检**，不通过则 **禁止冻结快照**（须 CEO 强制例外记录） |

**断言结果写入：** `HealthAssertion`（单例活跃记录）

| 字段 | 说明 |
|------|------|
| `assertion_type` | runway / compliance / talent / brand |
| `triggered_at` | 入库时间 |
| `source_report_id` | 来源 |
| `active` | true 直到下次导入证明解除 |

**指挥舱 UI · 硬阻断：**

- `active=true` 任一否决 → **行 0 全宽硬阻断条**（珊瑚红底，无 dismiss）  
- 内容：「一票否决：现金 runway 2.1 月 · 来源 2026-05 月报 · 须 CEO 确认例外或 remedial Vx」  
- BSC 四灯 **强制全红框**（综合 Robust 仍可看，但不得 green-wash）  
- 快照：断言状态 **一并冻结**

**与四灯关系：** 四灯 = BSC 维度业务健康；否决 = **宪法级 overlay**，覆盖四灯视觉优先级。

### 16.3 Cynefin 域 · 看执行消费规则

**问题：** 打了域标签，面板如何不同？

**规则（看执行 · 自动，无需用户选方法论）：**

| 域 | Vx 监控主轴 | Hx 验证主轴 | 4DX 记分板 |
|----|-------------|-------------|------------|
| **clear** | KPI 达成率 | 达标/未达标 | 标准 KR 滞后指标 |
| **complicated** | KPI + 里程碑 | 专家分析结论 | **成果型 KR / BSC Measure** |
| **complex** | 领先指标 + 试点信号 | 探测实验结果 | **优先进入 WIG 领先指标池** |
| **chaotic** | 48h 行动项 | CEO 裁决记录 | 暂停年度 KPI，仅保留行动项 |

**实现要点：**

- `ExecutionScoreboard` 选 leading measures 时：**complex 域 Vx 关联 KR/Hx 优先**  
- `complicated` 域 Vx：看板主列 = 进度% + **KPI 实际/目标**  
- `complex` 域 Vx：主列 = **领先指标** + 信心指数，年度 KPI 标灰「探测中」  
- `chaotic` 域：自动创建 `StrategicIssue`，不进 OKR 完成率统计  

**UI：** `CynefinBadge` tooltip 显示 **本域监控主轴** 一行文案（非仅理论解释）。

---

## 附录 C · 评审致谢与版本

- Blueprint v1.0 外部评审：三栈竖切、Mintzberg 史学、边界克制 — **采纳**  
- v1.1 增补：**§16 三大闭环** + [ONE_PAGE_PANORAMA.md](./ONE_PAGE_PANORAMA.md)

---

*Blueprint v1.1 · 2026-06-14 · strategy-driven-platform*

