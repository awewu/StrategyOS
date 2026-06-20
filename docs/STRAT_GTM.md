# StratOS · 客户与渠道前瞻模块（StratGrowth / GtmStack）

**版本：** v1.0 · 2026-06-14  
**动因：** B2B 工业增长靠 **客户段 × 渠道组合** 的前瞻配置（酒店 1200 家、RUUD 区县经销商、科技住宅标杆等），但现行 StratGrowth **MVP 仅「客户维 KPI 进 StratHealth」**，无 **STP 前瞻、渠道矩阵、覆盖节奏** 的结构化引导；与 WTP/HTW、ProdStack、Deliver Doctrine 断链。  
**关联：** [方法论 M6](./METHODOLOGY.md) · [产品前瞻 ProdStack](./STRAT_PRODUCT.md) · [资本 CapStack](./STRAT_CAPITAL.md) · [WTP/HTW](./THEORY_IMPORTS.md)

---

## 一、定位：第三根竖切 **GtmStack**

StratOS 三条 **增长竖切**（对称设计）：

| 竖切 | Doctrine | 回答 |
|------|----------|------|
| **CapStack** | Invest to Growth | 钱往哪押 |
| **ProdStack** | Innovate to Lead | 产品出什么牌 |
| **GtmStack** | Deliver + Invest（渠道） | **客户攻谁、渠道怎么铺** |

> **GtmStack = Go-To-Market 前瞻沙盘** — 不是 CRM，不做线索/商机日常管理；服务 **年中/年底战略会** 与 **30 人增长决策**。

### 做什么 / 不做

| 做 | 不做 |
|----|------|
| STP 前瞻（细分/目标/定位） | 线索分配、销售日报、CRM  pipeline |
| 品牌×渠道矩阵 + 优先级 | 经销商进销存、返利结算 |
| 覆盖/签约 **节奏**（Now/Next/Later） | 实时 ERP 渠道库存 |
| 段级单元经济（LTV:CAC、CAC 回收）摘要 | 精准营销自动化 |
| GtmBet 渠道赌注 + Hx 假设 | 客服工单系统 |
| 与 OKR / Vx / IC / FPA 挂载 | 替代 DMS/PRM |

---

## 二、战略会五问（客户与渠道语言）

| # | 问题 | GtmStack 输出 |
|---|------|---------------|
| Q1 | **未来 18–36 月主攻哪些客户段？** | `CustomerSegment` + STP 优先级 |
| Q2 | **四品牌各走哪些渠道、资源怎么分？** | `BrandChannelCell` 矩阵 |
| Q3 | **覆盖/签约按什么节奏推进？** | `GtmRoadmapItem`（Now/Next/Later） |
| Q4 | **段级单元经济是否成立？** | `SegmentEconomics` + FPA |
| Q5 | **哪些客户/渠道假设必须监控？** | `Hx` type=`gtm` + GtmBet |

---

## 三、方法论分层（由浅入深）

### 3.1 前瞻层（MVP+ · 战略会必用）

| 方法 | 用途 | 产出 |
|------|------|------|
| **STP 简版** | 细分→目标→定位 | 3–8 个 `CustomerSegment`，每段 focus/explore/defer |
| **品牌×渠道矩阵** | WTP 落地 | 4 品牌 × 5 渠道（酒店/家用/工程/科技住宅/区域专项） |
| **覆盖前瞻** | 签约/覆盖目标 vs 实际 vs 预测 | `CoverageSnapshot` |
| **Gtm 三泳道** | 与 ProdStack 同构 | Now/Next/Later **渠道动作** |
| **GtmBet** | 渠道级赌注 | 如「RUUD Q2 签约 300 家」 |
| **Deliver Gate** | 承诺可兑现性 | 检查清单 §6 |

### 3.2 诊断层（Phase 2 · 季复盘）

| 方法 | 用途 |
|------|------|
| **AARRR 漏斗** | 哪一段漏（获客/激活/留存/收入/推荐） |
| **Keller 品牌金字塔** | 识别→共鸣，季度趋势 |
| **渠道效能** | 覆盖率 × 单产 × 满意度/冲突 |
| **TAM/SAM/SOM 简版** | 段级市场天花板（手工+假设） |

### 3.3 运营层（Phase 3 · 不做 MVP）

内容矩阵 3C、日更 KPI、GEO 线索分级 — **留给营销运营系统**，StratOS 只收 **摘要进快照**。

---

## 四、对象模型（MVP+ 建 6 类）

### 4.1 `CustomerSegment` 客户段 ★

| 字段 | 说明 |
|------|------|
| `code`, `name` | SEG-HOTEL-CHAIN |
| `brand_codes` | 主攻品牌 |
| `description` | 如「连锁酒店热水改造」 |
| `stp_priority` | `focus` / `explore` / `defer` |
| `horizon` | H1 / H2 / H3 |
| `tam_sam_note` | 市场量级文本（Phase 2 可结构化） |
| `linked_jtbd_ids` | 与 ProdStack JTBD 对齐 |
| `linked_wtp_ref` | BrandStrategyCard.where_to_play 引用 |

**瑞合示例段：** 连锁酒店 / 高端家用 / 区县中小经销商 / 科技住宅标杆 / 新疆区域项目 / 工程设计院

### 4.2 `ChannelType` + `BrandChannelCell` 品牌×渠道格 ★

**ChannelType 枚举（骨架）：** `hotel` · `dealer` · `project` · `tech_home` · `regional` · `design_institute` · `ecommerce`（可选）

**BrandChannelCell**（每个 brand×channel 一格）：

| 字段 | 说明 |
|------|------|
| `brand_code`, `channel_type` | |
| `role` | `primary` / `secondary` / `experimental` / `exit` |
| `forward_priority` | P0–P3 |
| `coverage_target` / `coverage_actual` / `coverage_forecast` | 家数/项目数/区域数 |
| `revenue_budget` / `revenue_actual` | 挂 FPA |
| `cac_target` / `ltv_cac_ratio` | 段级单元经济摘要 |
| `linked_okr_kr_ids` | |
| `linked_gtm_bet_id` | |

### 4.3 `GtmRoadmapItem` 渠道前瞻路线 ★

| 字段 | 说明 |
|------|------|
| `lane` | now / next / later |
| `title` | 「华东 RUUD 经销商 80 家」 |
| `brand_channel_cell_id` | |
| `target_quarter` | |
| `milestone_type` | coverage / capability / policy_window |
| `linked_vx_id` | 如渠道中心 IC/Vx |
| `confidence` | 0–1 |

### 4.4 `GtmBet` 增长/渠道赌注 ★

| 字段 | 说明 |
|------|------|
| `title` | 「2026 酒店签约 1200 家」 |
| `segment_id` | |
| `brand_channel_cell_id` | |
| `success_criteria` / `kill_criteria` | |
| `linked_assumption_ids` | Hx（竞品降价、政策窗口…） |
| `linked_ic_id` | 渠道投资案 |
| `budget_tag` | 推荐 · 如 `GB-HOTEL-2026` → FPA Toggle |
| `fpa_toggle` | on / off / deferred |
| `doctrine_tags` | invest / deliver |

### 4.5 `CoverageSnapshot` 覆盖快照 ★

按季 / 战略快照冻结：

| 字段 | 说明 |
|------|------|
| `period`, `brand`, `channel` | |
| `target` / `actual` / `forecast` | |
| `gap` | 自动算 |
| `gap_reason` | 文本 |

### 4.6 `SegmentEconomics` 段级单元经济 ★

| 字段 | 说明 |
|------|------|
| `segment_id` | |
| `cac`, `ltv`, `ltv_cac_ratio`, `payback_months` | 来自 Sheet2/8 或手工 |
| `fpa_period_id` | 可选挂 B-A-F |
| `viability` | green / yellow / red（规则：LTV:CAC < 3 黄，< 2 红） |

### 4.7 `GtmStackSnapshot`（冻结在 strategic_snapshot）

- 全量 Segment + BrandChannelCell + GtmBet + Coverage  
- 指标：`focus_segment_count`、`coverage_gap_total`、`ltv_cac_red_count`

---

## 五、Deliver Gate（渠道/客户战略会 Gate）

| 检查项 | 标准 |
|--------|------|
| 每个 `focus` 段有 GtmBet 或 OKR-KR | 是/否 |
| 每个 P0 BrandChannelCell 有 coverage 三态 | 是/否 |
| GtmBet 有 ≥1 条 Hx | 是/否 |
| 段级 LTV:CAC 非红，或已有修正 Vx/策略 | 是/否 |
| Now 泳道 Gtm 动作 ≤5 | 是/否 |
| 与 ProdStack / WTP 无矛盾 | 是/否 |
| 渠道 IC（若有）与 CapStack 现金波峰一致 | 是/否 |
| Deliver 承诺（签约数）与 GtmRoadmap 一致 | 是/否 |

---

## 六、UI：看战略 · GtmStack 区（MVP+）

布局顺序（看战略页）：

```
诊断顶栏
ProdStack（产品出牌）
GtmStack（客户×渠道出牌）    ← 新增
四品牌 WTP/HTW
BSC 四卡（客户维可下钻 GtmStack）
OKR 树
Doctrine
```

**GtmStack 屏结构：**

```
┌─ GtmStack FY2026 ────────────────────────────────────────────────┐
│ Focus 段：酒店链 · RUUD 区县 · 科技住宅    Explore：新疆工程 …      │
├─ 品牌×渠道矩阵（热力：P0 深 / defer 灰）──────────────────────────┤
│        │ 酒店 │ 经销商 │ 工程 │ 科技住宅 │ 区域                      │
│ RUUD   │ P1   │ P0 ★  │ P2   │ P1       │ …                        │
│ 恒热   │ P0   │ P1    │ …    │ …        │ …                        │
├─ Now / Next / Later（渠道动作）────────────────────────────────────┤
│ Now: Q2 签约 300 家 │ Next: 华东渠道中心 │ Later: 设计院突破        │
├─ 覆盖差距 Top3 · LTV:CAC 告警 ────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────┘
```

**BSC 客户维卡片 flip 背面：** 本维 Top3 GtmBet + coverage 灯。

---

## 七、数据流与节律

```
Sheet2 客户 + Sheet8 营销（精简）
    ↓ 季/月导入
CoverageSnapshot / SegmentEconomics 更新
    ↓
月报 MON-RPT §2（签约/KPI）→ 刷新 actual
    ↓
季报 QTR-REV → STP 复盘、漏斗诊断（P2）
    ↓
战略会 → GtmStackSnapshot 冻结
    ↓
StratDiff #27–30
```

### Sheet 精简（MVP+）

**Sheet2 客户（追加列）：** segment_code · coverage_actual · nps · ltv · cac  
**Sheet8 营销（追加）：** brand · channel · coverage_target · cac · roadmap_milestone  

---

## 八、与三栈 / 三 Doctrine 衔接

```
WTP/HTW.where_to_play
    → CustomerSegment + BrandChannelCell
        → GtmBet ↔ OKR-KR（Deliver/Invest）
            ↔ ProductLine/JTBD（卖什么给这段客户）
            ↔ InvestmentCase（渠道中心、样板店）
            ↔ Hx（竞品降价、政策）
            ↔ FPA（段级 revenue/CAC）
                → strategic_snapshot
```

| 场景 | 联动 |
|------|------|
| 产品驱动 | ProdStack JTBD.segment = CustomerSegment |
| 资本驱动 | IC type=brand/channel → GtmBet.linked_ic_id |
| 诊断 | crux「渠道与产品不同步」→ GtmBet + ProductBet 同屏 |
| Mintzberg | 月报 §8 emergent「区县自发签约」→ 是否写入 focus 段 |

---

## 九、StratDiff 客户/渠道类（#27–30）

| # | 类型 | 示例 |
|---|------|------|
| 27 | 客户段优先级变更 | 酒店 focus→explore |
| 28 | 渠道矩阵格角色变更 | RUUD×经销商 primary→experimental |
| 29 | 覆盖目标大幅调整 | 签约 1200→900 |
| 30 | 段级 LTV:CAC 恶化 | 酒店段 ratio 18→2.5 |

**StratRobust：** R4 底线可纳入 `ltv_cac_red_count`；R3 执行纳入 coverage 兑现率。

---

## 十、分期交付

| 阶段 | GtmStack | 说明 |
|------|----------|------|
| ~~MVP~~ | 客户维 KPI only | **不足** |
| **MVP+** | Segment · BrandChannelCell · GtmRoadmap · GtmBet · Coverage · 看战略 GtmStack · Deliver Gate | 与 ProdStack/CapStack 同批 |
| **Phase 2** | AARRR 漏斗 · Keller 品牌 · TAM/SAM/SOM · 渠道效能公式 |
| **Phase 3** | 内容矩阵 · 线索分级摘要 | 可选 |

---

## 十一、瑞合瑞德示例

| 对象 | 示例 |
|------|------|
| Segment | SEG-HOTEL：focus，H1，JTBD=不停业改造降能耗 30% |
| Cell | RUUD×dealer：P0，target 300 家 Q2，KR O2-KR3 |
| GtmBet | 「2026 酒店 1200 家」success=≥1200，kill=<900 且无替代段 |
| Hx | H2 史密斯 Q3 降价 → 影响 RUUD 经销商段 |
| Roadmap Now | Q2 华东 80 家新签；Next：渠道中心 IC-01 落地 |

---

## 十二、与 CRM/ERP 边界（再次强调）

| 系统 | 职责 |
|------|------|
| **CRM** | 线索、商机、跟进、合同 |
| **ERP/DMS** | 订单、库存、返利 |
| **StratOS GtmStack** | **攻哪些段、铺哪些渠道、节奏与假设、战略会快照与 diff** |

数据关系：**CRM/ERP → 定期 Excel 导出 → Sheet2/8 → StratOS**（月/季），不做实时 API。

---

## 十三、一句话定调

> **GtmStack 是 Deliver on Commitment 的「铺市教练」** —— 让 CEO 看见 **攻谁、从哪进、铺多快、经济账是否成立**，并与产品牌（ProdStack）、资本牌（CapStack）同屏对齐。

**下一步：** 更新 `METHODOLOGY` M6；`prisma` 增加 CustomerSegment / BrandChannelCell / GtmBet；看战略页 GtmStack wireframe。
