# StratOS · 整体进化方案

**版本：** v1.1 · 2026-06-14  
**说明：** 本文件为进化路线摘要；**完整合并构想见 [STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md)（产品总纲 · 单一入口）**。

---

### 子文档索引

| 文档 | 内容 |
|------|------|
| [SKELETON_AND_FLESH.md](./SKELETON_AND_FLESH.md) | 骨架宪法 |
| [THEORY_IMPORTS.md](./THEORY_IMPORTS.md) | 认知层 I1–I5 |
| [STRAT_CAPITAL.md](./STRAT_CAPITAL.md) | CapStack 资本 |
| [STRAT_PRODUCT.md](./STRAT_PRODUCT.md) | ProdStack 产品 |
| [STRAT_GTM.md](./STRAT_GTM.md) | GtmStack 客户×渠道 |
| [HIGHER_DIMENSION.md](./HIGHER_DIMENSION.md) | Meta D3 升维 |
| [METHODOLOGY.md](./METHODOLOGY.md) | 十二模块方法论 |
| [REPORT_FORMATS.md](./REPORT_FORMATS.md) | 报告与 diff 规则 |

---

## 一、进化总述：从「战略仪表盘」到「战略认知与资源配置系统」

### 1.1 起点（原 MVP 设想）

- 三看板 + FPA B-A-F + 两次快照 + StratDiff 简版  
- 十二模块中 **资本 / 产品 / 增长** 大量推迟 Phase 2  
- 理论层 **五事七计 / 十二维** 有名无形  

### 1.2 终点愿景（v6 进化方向）

> **30 人战略网络的认知与学习操作系统** ——  
> 用 **诊断** 定焦点，用 **三栈** 定配置，用 **快照** 记历史，用 **diff** 见涌现，用 **稳健性** 保底线。

### 1.3 产品维度跃迁

| 维度 | 名称 | v1 MVP | 进化后 MVP+ / v6 |
|------|------|--------|------------------|
| D1 | 计划对齐 | BSC + OKR | + WTP/HTW + 三栈挂载 |
| D2 | 执行监控 | 看板 + 月报 | + 4DX 记分板 + Cynefin |
| D2.5 | 财务验证 | FPA B-A-F | + CapStack 波峰 |
| D2.5 | 版本史学 | 快照 + diff | + Mintzberg 战略形成史 |
| **D3** | **战略认知** | 缺失 | **Rumelt 诊断 + 三栈前瞻 + Gate 清单** |

---

## 二、架构进化：一层骨架 + 三层竖切 + 一层 Meta

```
┌─────────────────────────────────────────────────────────────────┐
│  Meta · D3 认知层                                                │
│  Rumelt 诊断 · Mintzberg diff · Cynefin · 双环学习 · Kotter 双OS  │
├─────────────────────────────────────────────────────────────────┤
│  Normative · 四个满意 + Doctrine（审计，不打分）                    │
├─────────────────────────────────────────────────────────────────┤
│  Architecture · BLM · BSC · OKR · SPBP · 五事七计(Gate清单)       │
├─────────────────────────────────────────────────────────────────┤
│  ★ 三栈竖切（MVP+ 核心进化）                                      │
│  CapStack  Invest   钱往哪押                                      │
│  ProdStack  Innovate  产品出什么牌                                │
│  GtmStack   Deliver   客户×渠道怎么铺                             │
├─────────────────────────────────────────────────────────────────┤
│  Execution · Vx · Hx · 承诺 · OKR · 4DX 记分板                    │
├─────────────────────────────────────────────────────────────────┤
│  FPA 脊梁 · B-A-F · 四品牌 P&L · 现金 runway                      │
├─────────────────────────────────────────────────────────────────┤
│  Version Core · 快照 · StratDiff(30类) · StratRobust(5+1)        │
└─────────────────────────────────────────────────────────────────┘
         ↑ 数据管道：MON-RPT / QTR-REV / Sheet 导入（非 ERP 实时）
```

**设计原则（历次讨论锁定）：**

1. **不增第四个 CEO 主入口** — 仍「看战略 / 看执行 / 看健康」+ FPA + 版本库  
2. **不做 ERP/CRM/PLM** — 推演沙盘，Excel/报告导入  
3. **完整 v5.4 蓝图，分期交付** — 不阉割模块，只分期血肉  
4. **清单 Gate 优于假分数** — 五事七计、评分卡、竞品差距均如此  

---

## 三、三栈进化（核心产品增量）

三栈对称，服务 **Invest · Innovate · Deliver** 三支柱，在 **看战略** 同屏呈现。

| 栈 | 文档 | MVP+ 必交付 | 战略会五问 |
|----|------|-------------|------------|
| **CapStack** | [STRAT_CAPITAL](./STRAT_CAPITAL.md) | IC · CapStackPeriod · CapacitySnapshot · FPA 资本 Tab | 钱往哪押？波峰何时？产能够吗？ |
| **ProdStack** | [STRAT_PRODUCT](./STRAT_PRODUCT.md) | ProductLine · JTBD · Roadmap · Gap · ProductBet · ProdStack 屏 | 今夕何牌？下一张牌？缺什么牌？ |
| **GtmStack** | [STRAT_GTM](./STRAT_GTM.md) | Segment · BrandChannelCell · GtmBet · GtmRoadmap · GtmStack 屏 | 攻谁？走哪渠道？铺多快？经济账成立吗？ |

**三栈联动规则：**

```
StrategicDiagnosis.crux
    ├─→ ProductBet ──→ ProductLine / Vx / Hx
    ├─→ GtmBet ──→ Segment / BrandChannelCell / OKR-KR
    └─→ InvestmentCase ──→ CapStack / 现金波峰 / CapacitySnapshot

BrandStrategyCard (WTP/HTW)
    ├─→ ProductLine 矩阵
    └─→ CustomerSegment + BrandChannelCell
```

---

## 四、理论层进化（导入清单）

### 4.1 操作层七基座（保留）

BLM · BSC · OKR · 动态能力 · 五事七计 · FPA · SPBP

### 4.2 Meta / 认知层（MVP+ 起）

| ID | 理论 | 阶段 | 落点 |
|----|------|------|------|
| I1 | Rumelt 诊断 | MVP+ | `StrategicDiagnosis` · 看战略顶栏 |
| I2 | Mintzberg deliberate/emergent | MVP+ | `StrategyPattern` · diff #15–18 · 月报 §8 |
| I3 | Playing to Win | MVP+ | `BrandStrategyCard` WTP/HTW ×4 |
| I4 | Cynefin | MVP+ | `cynefin_domain` on Hx/Vx/议题 |
| I5 | 4DX 记分板 | MVP+ | `ExecutionScoreboard` · 看执行置顶 |
| I6 | 三层面 | Phase 2 | `horizon` on Vx/IC/ProductLine/GtmBet |
| I7 | Hoshin X-Matrix | Phase 2 | StratDecode 备选 Tab |
| I8 | JTBD + 生命周期 | **MVP+**（自 ProdStack 提前） | `ProductLine` 等 |

### 4.3 五事七计 · 十二维（用法进化）

| 概念 | 旧设想 | 进化用法 |
|------|--------|----------|
| **五事七计** | 量化胜算分 | **StratCraft/Review Gate 检查清单 + 风险清单**（20–30 项） |
| **十二维健康度** | MVP 全上 | CEO：**四维灯 + 8 KPI + 三维摘要**；战略部：十二维下钻 Phase 2 |
| **一票否决** | 有 | 现金 runway · 重大事故 · 核心团队流失 · 品牌危机 |

---

## 五、对象模型进化

### 5.1 阶段对比

| 阶段 | 对象规模 | 新增要点 |
|------|----------|----------|
| 骨架 v1.1 | 15 + FPA 3 | BSC/OKR/Vx/Hx/快照 |
| **MVP+** | **+18** | 诊断/三栈/Gate 配置/Mintzberg |
| Phase 2 | +8 | M&A/TechSignal/RICE/AARRR 深 |

### 5.2 MVP+ 必建对象一览

**认知 / 品牌**

- `StrategicDiagnosis` · `BrandStrategyCard` ×4 · `StrategyPattern` · `ExecutionScoreboardConfig`

**CapStack**

- `InvestmentCase` · `CapStackPeriod` · `CapacitySnapshot`

**ProdStack**

- `ProductLine` · `JtbdCard` · `ProductRoadmapItem` · `CompetitiveProductGap` · `ProductBet`

**GtmStack**

- `CustomerSegment` · `BrandChannelCell` · `GtmRoadmapItem` · `GtmBet` · `CoverageSnapshot` · `SegmentEconomics`

**横切**

- `Assumption.cynefin_domain` · `Project.cynefin_domain` · `Project.horizon`（可选 MVP+）

**快照冻结扩展：** 上述全部 + 三栈 Snapshot 聚合指标

---

## 六、StratDiff · StratRobust 进化

### 6.1 Diff 分类演进（12 → 30）

| 区间 | 类别 | 阶段 |
|------|------|------|
| #1–12 | BSC/OKR/Vx/假设/Doctrine/健康/承诺/四满意/资源/竞争/意图 | MVP 8 类起 |
| #13–14 | FPA 预测修订 · 现金流安全线 | MVP 含 |
| #15–18 | Mintzberg 涌现/未实现/偶成/刻意实现率 | MVP+ |
| #19–22 | 投资 Gate · CAPEX 迁移 · 波峰 · 产能缺口 | MVP+ |
| #23–26 | Roadmap 延期 · 产品赌注 · 竞品差距 · 品类 | MVP+ |
| #27–30 | 客户段 · 渠道格 · 覆盖目标 · LTV:CAC | MVP+ |
| Phase 3 | 反事实 · AI 归因 | 后期 |

### 6.2 StratRobust（5+1 维）

| 维 | 进化输入 |
|----|----------|
| R1 方向 | 诊断/BSC/意图 diff |
| R2 逻辑 | Hx 失效 · 三栈挂载完整性 |
| R3 执行 | 承诺 · Vx · **投资 ROI · coverage 兑现** |
| R4 底线 | 四满意 · B-A-F · **LTV:CAC 红** |
| R5 精神 | Doctrine 审计 |
| **R6 学习** | emergent 是否写入下版 deliberate |

---

## 七、UI / 信息架构进化

### 7.1 看战略（进化后）

```
1. DiagnosisBanner          ← I1 Rumelt
2. ProdStackPanel           ← 产品前瞻
3. GtmStackPanel            ← 客户×渠道前瞻
4. 四品牌 WTP/HTW Tab       ← I3
5. CapStack 摘要条          ← 资本（一行，详请进 FPA）
6. BSC 四卡（客户维 → Gtm 下钻）
7. OKR 树
8. Doctrine
```

### 7.2 看执行

```
1. ExecutionScoreboard      ← I5 4DX
2. Vx 看板（horizon · Cynefin · IC/Product/Gtm 链）
3. 假设 Hx
4. 承诺 Deliver
5. ≤3 预警
```

### 7.3 看健康

- 四维灯 + 8 KPI + B-A-F + runway + Robust 5+1  
- Phase 2：十二维雷达（战略部）

### 7.4 FPA 财务

- Tab：公司 B-A-F · 四品牌 P&L · Vx 财务 · **资本 CapStack**  

### 7.5 版本库

- 快照时间轴 · diff 30 类 · **StrategyPattern 章** · Robust 雷达 overlay  

---

## 八、十二模块进化矩阵

| 模块 | MVP | MVP+ | Phase 2 | Phase 3 |
|------|-----|------|---------|---------|
| StratCraft | BLM 简版 · Hx | +诊断 · WTP/HTW · 五事 Gate | PESTEL 深 · SPBP 概率 | AI 顾问 |
| StratDecode | BSC · OKR | +三栈联动展示 | Hoshin Tab · 反馈环 R/B/D | 因果 AI |
| StratPilot | Vx · 预警 | +4DX 记分板 | 经营分析会 · ZBB | — |
| StratReview | GRAI/KPT | +三板块 · DC 三环 | 双环 · 九宫格 | — |
| StratFinance | B-A-F · P&L · 现金 | +CapStack Tab | 5 年 · 敏感性 · 蒙特卡洛 | AI 财务 |
| **StratGrowth** | 客户 KPI | **GtmStack 全套** | AARRR · Keller · TAM | 内容矩阵摘要 |
| **StratProduct** | — | **ProdStack 全套** | TechSignal · RICE | TRL 雷达 |
| **StratCapital** | — | **CapStack 全套** | M&A · Real Options · 投后 | AI 投资 |
| StratHealth | 四灯 · 8 KPI | +三栈信号汇总 | 十二维 · 对标 | — |
| StratMind | 资料库 | +三栈/Gate 知识卡 | 学习路径 | RAG |
| StratDiff | 8 类 | **22 类起** → 30 | 归因 AI · 反事实 | — |
| StratForesight | 竞品表 | +产品级动作 | TechSignal · 政策轴 | AI 监控 |

---

## 九、数据与报告进化

### 9.1 导入 Sheet（MVP+ 最小集）

| Sheet | 用途 |
|-------|------|
| 1 财务 | B-A-F |
| 2 客户 | Segment · coverage · LTV/CAC |
| 3 项目群 | Vx |
| 4 竞品 | 公司 + **产品级**动作 |
| 5 假设 | Hx |
| 8 营销 | 品牌×渠道 · coverage_target |
| 9 产品 | ProductLine 精简 |
| 10 投资 | InvestmentCase |
| 12 固资摘要 | 产能 5 字段（非台账） |

### 9.2 月报进化

- 保留 §1–§7  
- **§8 战略模式观察**（Mintzberg）  
- §2 签约数据 → GtmStack coverage actual  

### 9.3 战略会议程（进化后标准包）

| 环节 | 时长 | 内容 |
|------|------|------|
| 开场 | 15m | 诊断 crux · Robust · Top5 diff |
| 资本 | 30m | CapStack · IC Gate · 现金波峰 · 产能缺口 |
| 产品 | 30m | ProdStack · ProductBet · Gap · Innovate Gate |
| 增长 | 30m | GtmStack · GtmBet · Deliver Gate · LTV:CAC |
| 解码 | 45m | BSC/OKR 调整 · WTP/HTW |
| 决议 | 30m | 快照批准 · 承诺录入 |

---

## 十、分期路线图（执行序）

### Phase 0 · 骨架 MVP（基线）

**目标：** 2026 Q3 战略会「能开会」  
**交付：** 登录 · 三看板简版 · FPA B-A-F · 月报/季报 · H1/FY 快照 · diff 8 类 · Robust 简版  

### Phase 1 · MVP+（本进化方案主战场）

**目标：** 战略会 **三栈 + 认知层** 可研讨、可快照、可 diff  
**优先级（建议开发序）：**

```
P0  StrategicDiagnosis + 看战略顶栏
P0  FPA B-A-F 稳定 + 快照冻结
P1  ProdStack（ProductLine/Roadmap/ProductBet）
P1  GtmStack（Segment/BrandChannelCell/GtmBet）
P1  CapStack（IC/CapStackPeriod/CapacitySnapshot）
P1  BrandStrategyCard WTP/HTW
P2  ExecutionScoreboard + Cynefin 枚举
P2  StrategyPattern + diff #15–18 + 月报 §8
P2  diff #19–30 + Gate 清单 UI
P3  CEO 一页纸 PDF（含诊断+三栈摘要）
```

**里程碑：** `{YYYY}-H1-STRATEGIC` 含完整 MVP+ 快照  

### Phase 2 · 深引擎（6–12 个月）

- StratFinance 5 年/敏感性 · M&A 管道 · AARRR/Keller · Hoshin Tab · 十二维 · Real Options · R6 正式加权  

### Phase 3 · 智能层

- 11 Agent _subset_ · 情景概率 SPBP · TRL 雷达 · 反事实 diff  

---

## 十一、开源对标结论（为何自研）

| 能力 | 开源最接近 | StratOS 进化差异化 |
|------|------------|-------------------|
| BSC+OKR | hillfog | 三栈 + FPA + 快照史学 |
| OKR 执行 | Operately | 30 人战略会，非日常 PM |
| 产品/渠道/资本前瞻 | **无** | ProdStack + GtmStack + CapStack |
| 战略形成史 | **无** | Mintzberg diff |

**结论：** 不 fork；借鉴 hillfog 对象关系 + Profit.co BSC-OKR 分层；**三栈 + 快照 diff 自研**。

---

## 十二、边界清单（进化中不变）

| 不做 | 原因 |
|------|------|
| ERP 实时同步 | 独立推演沙盘 |
| 全员日复盘 OKR | 30 人核心层 |
| CRM 线索管理 | GtmStack 只收摘要 |
| PLM/BOM | ProdStack 只出牌 |
| 固资台账 | CapStack 只产能推演 |
| Doctrine/五事 打分 | 审计 + Gate 清单 |
| 30 人阉割版 | 用户明确拒绝 |

**待归档：** [PRODUCT_FRAMEWORK.md](./PRODUCT_FRAMEWORK.md)（30 人阉割 framing）— 以本方案与 PRD v1.1 为准。

---

## 十三、成功标准（MVP+ 验收）

| # | 标准 |
|---|------|
| 1 | CEO 看战略 **一屏** 见：诊断 + 三栈摘要 + BSC |
| 2 | 每个 Invest/Innovate/Deliver 重大决策可追溯到 **IC / ProductBet / GtmBet** |
| 3 | H1/FY 快照 **不可改**，含三栈 + 诊断冻结 |
| 4 | 两版快照 diff 自动出 **≥15 类**变化 + StrategyPattern 章 |
| 5 | 月报 §8 + §2 可更新 coverage / emergent 候选 |
| 6 | FPA 资本 Tab 见 CAPEX 三态 + 现金波峰 |
| 7 | 五事七计 / 三 Gate 输出 **风险清单** 非综合分 |

---

## 十四、一句话进化定调

> **StratOS 进化 = 骨架不变，血肉升级为「诊断 + 三栈资源配置 + 快照史学 + Gate 清单」；**  
> 从「看 KPI 的仪表盘」进化为 **「看战略如何形成、钱/产品/渠道如何配置」的认知系统** —— 仍服务 **年中/年底两次战略会**，仍 **30 人深度、300 人公司**。

---

## 十五、建议立即动作

1. ~~Prisma schema~~ → ✅  
2. ~~看战略 wireframe~~ → ✅ `/strategy`  
3. ~~Gate 清单 YAML~~ → ✅ `config/gates.yaml` + `/gates`  
4. ~~归档 PRODUCT_FRAMEWORK.md~~ → ✅ superseded  
5. **2026 Q3 战略会** — 用 MVP+ 议程 §9.3 彩排 → 见 [MVP_PLUS_COMPLETE.md](./MVP_PLUS_COMPLETE.md)  

---

*Phase 1 MVP+ **代码与文档已闭合**；Phase 2 见 §十。*
