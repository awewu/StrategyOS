# StratOS · 资本与资产模块加强方案（StratCapital）

**版本：** v1.0 · 2026-06-14  
**动因：** Invest to Growth 是 Doctrine 支柱之一，FPA 脊梁含 Vx ROI / CAPEX / 现金峰值；原 MVP 将 StratCapital 整体推迟至 Phase 2，**与战略沙盘定位不匹配**。  
**关联：** [骨架与血肉](./SKELETON_AND_FLESH.md) · [方法论](./METHODOLOGY.md) · [理论导入](./THEORY_IMPORTS.md) · [FPA 脊梁](./SKELETON_AND_FLESH.md#fpa-脊梁--贯穿逻辑横切各层)

---

## 一、问题诊断：为什么「感觉太弱」

| 现象 | 根因 |
|------|------|
| MVP 无资本专属界面 | `SKELETON` 把 StratCapital 放在 Phase 2+ 血肉 |
| 投资只在 Excel Sheet10 | 13 Sheet 有设计，骨架 15 对象无 `InvestmentCase` |
| 固资被反向推演建议「砍掉台账」 | 正确方向（不做 ERP），但 **连产能推演也一起弱化了** |
| Vx 与资本决策割裂 | V1–V10 有预算，缺 **投资类型 / 回报门槛 / 现金波峰** |
| 三层面 H1/H2/H3 挂 Vx | Phase 2 才做，资本组合视图缺失 |
| Doctrine Invest 审计 | 有审计表单，无 **「投什么、投多少、预期 ROI」** 对象支撑 |

**结论：** 不是要把 StratOS 做成 ERP 固资模块，而是要把 **「资本配置与产能赌注」** 升为 **FPA 脊梁的第二条竖切**（第一条是 B-A-F，第二条是 CapStack 资本栈）。

---

## 二、定位定调（做什么 / 不做什么）

### 2.1 StratCapital 是什么

> **CEO/董事会用的「资本配置沙盘」** —— 回答：钱往哪押、押多少、何时要现金、产能跟不跟得上、投后有没有偏离战略。

### 2.2 明确不做（留给 ERP / 财务系统）

| 不做 | 原因 |
|------|------|
| 固资台账、折旧凭证、维保工单 | ERP 强项；StratOS 只 **导入摘要** |
| 实时银企、付款审批 | 运营系统 |
| 税务处置、残值会计 | 合规在 ERP |
| M&A 尽调数据室全量 | 外部 VDR + 顾问 |

### 2.3 必须做（战略会刚需）

| 必做 | 战略会问题 |
|------|------------|
| **资本组合 CapStack** | 今年总 CAPEX/OPEX 赌注长什么样？ |
| **投资案 InvestmentCase** | 每个重大投资凭什么过 Gate？ |
| **现金波峰 CashPeak** | 哪个月现金最紧？与 B-A-F 一致吗？ |
| **产能缺口 CapacityGap** | 2.5 亿目标 → 产能够不够？ |
| **投后偏离 PostInvestDrift** | 批准 vs 实际 vs 战略假设是否一致？ |
| **M&A 战略线（简版）** | 渠道/技术/合资/品牌四条线有无标的？ |

---

## 三、架构：CapStack 作为 FPA 第二竖切

```
                    Doctrine · Invest to Growth
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    FPA 脊梁 A            FPA 脊梁 B           执行层
    B-A-F 三元组          CapStack 资本栈        Vx / OKR
    营收·利润·现金        投资·产能·波峰         挂载
         │                    │                    │
         └─────────── strategic_snapshot ──────────┘
                              │
                    StratDiff #19–22（资本类变化）
                    StratRobust R3 执行（含投资 ROI）
                    健康度 · 投资子维 + 固资/产能子维
```

**不新增第四个 CEO 主入口** — 资本视图汇入：

| 视图 | 资本内容 |
|------|----------|
| **看战略** | CapStack 摘要条：H1/H2/H3 赌注分布 + 年度 CAPEX 上限 |
| **看执行** | 投资管道 Kanban + Vx 资本标签 + 现金波峰预警 |
| **看健康** | 投资子维 + 产能利用率灯 |
| **FPA 财务** | CAPEX 波峰曲线 · 投资 vs 预算 · 多品牌资本倾斜 |

---

## 四、对象模型（骨架级新增 5 类）

在现有 15+4 对象上 **+5**（MVP+ 必建 3，Phase 2 完整 5）：

### 4.1 `InvestmentCase` 投资案 ★ MVP+

| 字段 | 说明 |
|------|------|
| `id`, `code` | IC-2026-01 |
| `title` | 如「RUUD 华东渠道中心」 |
| `type` | `strategic` / `capacity` / `technology` / `brand` / `people` |
| `horizon` | `H1` / `H2` / `H3`（三层面） |
| `linked_vx_id` | 挂 Vx |
| `linked_assumption_ids` | 挂 Hx |
| `linked_okr_ids` | 挂 OKR |
| `capex_total` / `opex_annual` | 金额 |
| `expected_irr` / `payback_months` / `npv` | FPA 摘要（可 Excel 导入） |
| `strategic_fit_score` | 评分卡汇总（见 §5） |
| `gate_status` | `draft` / `review` / `approved` / `rejected` / `post_invest` |
| `budget_tag` | **必填** · 如 `IC-2026-01` → FPA Forecast Toggle |
| `fpa_toggle` | `on` / `off` / `deferred` — killed 时 off + ghost 线 |
| `doctrine_audit_id` | Invest 审计 |
| `cynefin_domain` | 情境 |
| `approved_at` / `approved_by` | 战略会决议 |

### 4.2 `CapStackPeriod` 资本组合期 ★ MVP+

按 **FY / H1** 冻结，与 `FpaPeriod` 并列：

| 字段 | 说明 |
|------|------|
| `period` | 2026-FY |
| `capex_budget` / `capex_committed` / `capex_spent` | CAPEX 三态（对标 B-A-F） |
| `opex_investment_budget` | 投资性 OPEX |
| `by_horizon` | `{ H1: x, H2: y, H3: z }` 金额 |
| `by_brand` | 四品牌资本分配 |
| `by_type` | 五类投资分布 |
| `cash_peak_month` / `cash_peak_amount` | 波峰 |
| `runway_after_peak` | 波峰后 runway |

### 4.3 `CapacitySnapshot` 产能快照 ★ MVP+

**不做台账，做推演：**

| 字段 | 说明 |
|------|------|
| `period` | 2026-FY |
| `demand_units` | 来自 BSC/销售假设（如热泵台数） |
| `capacity_units` | 有效产能（导入 ERP 摘要或手工） |
| `utilization_pct` | 利用率 |
| `gap_units` | 缺口 = demand - capacity |
| `gap_action` | `invest` / `outsource` / `defer_demand` |
| `linked_investment_case_id` | 填缺口的 IC |
| `bottleneck_asset` | 文本：哪条产线/哪类设备 |

### 4.4 `MaPipelineItem` M&A 管道 ★ Phase 2

| 字段 | 说明 |
|------|------|
| `direction` | `channel` / `tech` / `jv` / `brand` |
| `stage` | `watch` / `screen` / `dd` / `signed` / `integrating` |
| `synergy_thesis` | 战略协同一句话 |
| `valuation_range` | 区间 |
| `linked_assumption_ids` | |
| `integration_milestone_100d` | 100 天计划摘要 |

### 4.5 `AssetCapacityLine` 产能线（非台账）★ Phase 2

从 ERP **Excel 导入** 摘要，非 CRUD 台账：

| 字段 | 说明 |
|------|------|
| `line_code` | 产线/工厂 |
| `capacity_units` / `utilization_pct` | |
| `age_years` / `criticality` | 战略关键度 |
| `constraint_for_brands` | RUUD/恒热… |
| `refresh_investment_ic_id` | 技改关联 IC |

---

## 五、投资评分卡（100 分 · 检查清单化）

反向推演已明确：**不做假精准胜算**，改为 **可审计的检查清单 + 风险清单**。

| 维度 | 权重 | 检查项示例（是/否/部分 + 证据） |
|------|------|--------------------------------|
| **战略契合** | 25 | 挂 OKR-O？挂 Diagnosis.crux？四满意过？ |
| **财务可行** | 25 | IRR > 门槛？payback < 36月？不击穿 cash_peak？ |
| **假设清晰** | 20 | ≥1 条 Hx？失效影响已写？ |
| **执行就绪** | 15 | Vx Owner？将/法（五事）过？ |
| **风险可控** | 15 | 合规/环保/单一供应商？ |

**输出：**

- `strategic_fit_score` 0–100（加权）
- **Gate 规则：** <60 不可 `approved`；60–75 黄灯需 CEO 例外；≥75 可进战略会包
- **风险清单** 自动列「部分/否」项 — 不进综合「胜算 XX%」

---

## 六、方法论工具箱（加强后）

### 6.1 投资引擎

| 工具 | 阶段 | 说明 |
|------|------|------|
| 五类投资分类 | MVP+ | strategic/capacity/tech/brand/people |
| 投资评分卡 | MVP+ | §5 |
| 资本组合 CapStack | MVP+ | 三层面 + 四品牌 + 五类 |
| Real Options 简版 | Phase 2 | 分阶段投资、放弃权标记 |
| 投后偏离追踪 | Phase 2 | 批准 CAPEX vs 实际 vs 预测 ROI |

### 6.2 产能 / 资产（战略侧）

| 工具 | 阶段 | 说明 |
|------|------|------|
| 需求→产能反推 | MVP+ | `CapacitySnapshot` |
| 利用率预警 | MVP+ | <75% 黄 / <60% 红 |
| ERP 固资摘要导入 | MVP+ | Sheet12 精简版 5 字段 |
| 技改 IC 关联 | Phase 2 | 不建台账 |
| 处置战略建议 | Phase 2 | 文本 + 财务影响，不做凭证 |

### 6.3 M&A 引擎

| 工具 | 阶段 | 说明 |
|------|------|------|
| 四方向管道 | Phase 2 | watch→integrating |
| 100 天整合里程碑 | Phase 2 | 挂 MaPipelineItem |
| 协同假设 Hx | Phase 2 | 与 StratDiff 联动 |

---

## 七、与现有模块衔接

| 模块 | 衔接 |
|------|------|
| **FPA** | IC.capex → FpaPeriod；CapStack.cash_peak → CashPosition.runway |
| **Vx** | 每个 Vx `investment_case_id` 可选；horizon + type 必填（资本类 Vx） |
| **Doctrine** | Invest 审计 **必须** 挂 IC 或 Vx.capital_tag |
| **StratDiff** | 新增 #19–22（见 §8） |
| **StratRobust R3** | 投资 ROI 准确度、CAPEX 执行率 |
| **十二维健康度** | 投资 5% + 固资/产能 5% 有数据对象支撑 |
| **三层面 I6** | horizon 枚举统一 IC + Vx |

---

## 八、StratDiff 资本类变化（新增 #19–22）

| # | 类型 | 示例 |
|---|------|------|
| 19 | 投资案 Gate 变更 | IC-03 rejected→approved |
| 20 | CAPEX 组合迁移 | H2 预算 +3000 万从 H1 挪 |
| 21 | 现金波峰上移 | 现金波峰 9 月→11 月，峰值 +800 万 |
| 22 | 产能缺口扩大 | 缺口 5000→12000 台，触发 IC-07 |

---

## 九、UI 加强（不增主入口）

### 9.1 FPA 财务页 · 资本 Tab ★ MVP+

```
┌─ CapStack FY2026 ─────────────────────────────────────────┐
│ CAPEX  B ████████░░ 1.2亿  A ██████░░░░ 0.9亿  F ███████░░░ 1.1亿 │
│ 三层面  H1 62% │ H2 28% │ H3 10%    现金波峰：2026-09 ¥3200万     │
├─ 投资管道（按 gate_status）────────────────────────────────┤
│ Review │ IC-04 V4 产线 2800万 IRR18% │ Approved │ IC-01 渠道…   │
├─ 产能缺口 ─────────────────────────────────────────────────┤
│ 需求 8.2万台 · 产能 6.5万 · 缺口 1.7万 → IC-04               │
└────────────────────────────────────────────────────────────┘
```

### 9.2 看战略 · CapStack 摘要条

一行：「FY CAPEX 1.2亿 · H2 占 28% · 9 月现金波峰 · 产能缺口 1.7 万台」

### 9.3 看执行 · 资本类 Vx 列

增加列：`IC` · `horizon` · `IRR` · `gate`

---

## 十、数据导入（精简 Sheet · 不拖 MVP）

| Sheet | MVP+ 字段 | 频率 |
|-------|-----------|------|
| **Sheet10 投资** | IC 代码/类型/金额/IRR/payback/Vx/状态 | 年中/年底 |
| **Sheet12 固资摘要** | 产线/产能/利用率/关键度（**5 列**） | 年底 |
| Sheet11 M&A | Phase 2 全量 | 事件 |

---

## 十一、分期交付（修订）

| 阶段 | StratCapital 交付 | 说明 |
|------|-------------------|------|
| ~~MVP~~ | ~~仅 Vx 预算~~ | **上移** |
| **MVP+** | IC + CapStack + CapacitySnapshot + FPA 资本 Tab + 评分卡 + Sheet10/12 导入 | **与 Q3 战略会同批** |
| **Phase 2** | MaPipeline + AssetCapacityLine + Real Options + 投后偏离 + M&A 100 天 | |
| **Phase 3** | AI 投资 Agent · 情景 CAPEX 敏感性 | |

---

## 十二、战略会议程嵌入

**年底战略会新增固定环节（30 分钟）：**

1. CapStack 三层面是否合理？H3 是否过多？  
2. 现金波峰 vs runway — 一票否决复核  
3. 产能缺口 vs 销售目标 — 反推是否诚实  
4. 待批 IC 评分卡 + 风险清单 — Gate  
5. （Phase 2）M&A 管道 watch 项是否进入 Hx  

---

## 十三、一句话定调

> **StratCapital 不是固资 ERP，而是「Invest to Growth 的数字沙盘」** —— 与 FPA B-A-F 并列，让每一笔 CAPEX 在战略会上可看见、可 Gate、可 diff、可追问产能与现金。

**下一步：** ~~prisma / wireframe~~ → 已交付见 `lib/stratos` · `/finance?tab=capital` · [FPA_CAPITAL_TAB.md](./FPA_CAPITAL_TAB.md)
