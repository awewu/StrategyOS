# StratOS · 产品前瞻布局模块加强方案（StratProduct）

**版本：** v1.0 · 2026-06-14  
**动因：** 瑞合瑞德是 **产品驱动型** 制造/B2B 企业（热泵、多品牌、V4 等产品赌注是战略核心），但现行骨架中 StratProduct **MVP 仅「Vx 挂里程碑」**，JTBD/生命周期/Roadmap 全部在 Phase 2（I8），**Innovate to Lead 缺少「往哪布局、何时出牌」的引导面**。  
**关联：** [方法论 M7](./METHODOLOGY.md) · [理论导入 I8](./THEORY_IMPORTS.md) · [资本模块](./STRAT_CAPITAL.md) · [WTP/HTW](./THEORY_IMPORTS.md#四-i3--playing-to-win--wtphtw-双卡)

---

## 一、问题诊断

| 用户感受 | 根因 |
|----------|------|
| 「产品前瞻引导不够」 | 无 **ProdStack（产品前瞻栈）** 对象，Roadmap 不在 CEO 屏 |
| Innovate 只有 Doctrine 审计 | 缺 **「打什么牌、何时出牌、凭什么赢」** 产品结构 |
| V4 等重要产品赌注 | 只在 Vx 看板，无 **JTBD / 竞品差距 / 三层面** 产品语境 |
| StratForesight 偏竞品动态 | **技术/产品趋势 → 产品假设** 链路未产品化 |
| WTP/HTW 在品牌层 | **下钻不到产品组合与 18–36 月路线** |
| 与 StratCapital 脱节 | 产品赌注的 CAPEX/研发预算不在同一屏 |

**结论：** 产品模块不应是「需求池 + BCG 矩阵工具箱」，而应是 **Doctrine Innovate 的战略引导层** —— 与 CapStack（Invest）对称的 **ProdStack（Innovate）**。

---

## 二、定位定调

### 2.1 StratProduct 是什么

> **CEO/产品负责人用的「产品前瞻布局沙盘」** —— 回答：  
> **今夕何牌 · 下一张牌 · 缺什么牌 · 何时出牌 · 对标谁 · 赌注挂哪条 Vx/假设。**

### 2.2 做什么 / 不做什么

| 做 | 不做 |
|----|------|
| 产品组合与三层面（H1/H2/H3）布局 | PLM 全生命周期、BOM、版本管理 |
| JTBD + 生命周期 × 战略角色 | 完整 RICE 需求池、Jira 需求工单 |
| 18–36 月 Roadmap（Now/Next/Later） | 迭代级 Sprint 排期 |
| 竞品产品差距（4 维定性） | 自动爬专利/论文的技术雷达 |
| 技术信号清单（人工 5–10 条） | 高维护 TRL 气泡图（Phase 3） |
| 产品赌注 ↔ Vx / Hx / IC 挂载 | 替代研发项目管理 |

### 2.3 架构：ProdStack 作为 Innovate 竖切

```
                    Doctrine · Innovate to Lead
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   BrandStrategyCard      ProdStack 产品前瞻栈     StratForesight
   WTP / HTW              组合·JTBD·Roadmap       竞品·技术信号
         │                    │                    │
         └─────────── Vx (V4…) / Hx / IC ──────────┘
                              │
                    strategic_snapshot + StratDiff #23–26
```

**不新增 CEO 第四主入口** — 产品前瞻汇入 **看战略**（主）+ **看执行**（Vx 产品标签）+ **StratForesight 产品 Tab**。

---

## 三、产品前瞻要引导的五个问题（会议语言）

| # | 问题 | 模块输出 |
|---|------|----------|
| Q1 | **我们在哪些战场要有产品？** | WTP → 产品品类矩阵（品牌×品类） |
| Q2 | **现在/下一步/再下一步各出什么牌？** | ProdHorizon：Now / Next / Later |
| Q3 | **客户雇我们完成什么 Job？** | JTBD 卡（按产品线） |
| Q4 | **相对史密斯/博世差在哪？** | CompetitiveProductGap 四维 |
| Q5 | **布局靠什么落地、何时验证？** | 挂 Vx · Hx · IC · Roadmap 里程碑 |

战略会固定环节（与资本 30 分钟并列）：**产品前瞻 30 分钟** — 过 ProdStack + 竞品差距 + 下季出牌。

---

## 四、对象模型（+6 类，MVP+ 建 4）

### 4.1 `ProductLine` 产品线 ★ MVP+

比 SKU 粗、比品牌细 — 如「RUUD 户式热泵」「恒热 中央热水商用机」。

| 字段 | 说明 |
|------|------|
| `code`, `name` | PL-RUUD-HP |
| `brand_code` | RUIMEI / HENGRE / RUUD / TECH_HOME |
| `category` | 户式热泵 / 中央热水 / … |
| `lifecycle_stage` | intro / growth / mature / decline |
| `strategic_role` | star / cash_cow / question / dog |
| `horizon` | H1 / H2 / H3 |
| `revenue_share_pct` | 可选，来自 FPA/Sheet9 |
| `linked_bsc_measure_id` | 流程/客户维 KPI |

### 4.2 `JtbdCard` ★ MVP+

| 字段 | 说明 |
|------|------|
| `product_line_id` | |
| `statement` | When… I want… so I can…（≤200 字） |
| `primary_segment` | 酒店 / 家用 / 工程… |
| `outcome_metrics` | string[] — 可验收结果 |
| `linked_okr_ids` | |

### 4.3 `ProductRoadmapItem` ★ MVP+

| 字段 | 说明 |
|------|------|
| `product_line_id` | |
| `lane` | `now` / `next` / `later` 或 `2026`/`2027`/`2028` |
| `milestone` | 如「V4 样机冻结」「RUUD 新平台上市」 |
| `target_quarter` | 2026-Q3 |
| `status` | planned / in_progress / shipped / deferred |
| `linked_vx_id` | V4… |
| `linked_assumption_ids` | Hx |
| `confidence` | 0–1（与 OKR 信心同语义） |

### 4.4 `CompetitiveProductGap` ★ MVP+

**定性为主，不做假分数。**

| 字段 | 说明 |
|------|------|
| `product_line_id` | |
| `competitor` | 史密斯 / 博世 / … |
| `dimension` | tech / cost / service / brand |
| `our_position` | leading / parity / lagging |
| `gap_summary` | ≤120 字 |
| `evidence` | 来源说明 |
| `closure_vx_id` | 填差距的 Vx |

### 4.5 `ProductBet` 产品赌注 ★ MVP+

与 `InvestmentCase` 并列，侧重 **Innovate**（IC 侧重 Invest/Capacity）。

| 字段 | 说明 |
|------|------|
| `title` | 如「热泵产品化能力 12 个月内成立」 |
| `product_line_ids` | |
| `horizon` | H2 / H3 |
| `linked_diagnosis_crux` | 对齐 Rumelt 枢纽 |
| `linked_vx_ids` | |
| `linked_ic_id` | 可选资本案 |
| `success_criteria` | 3 条可验证标准 |
| `kill_criteria` | 2 条放弃标准（Real Options 简版） |
| `budget_tag` | 推荐 · 如 `PB-V4-2026` → FPA Toggle（见 [BLUEPRINT §16.1](./STRATOS_BLUEPRINT.md#161-fpa-脊梁--三栈--budget_tag-物理勾连)） |
| `fpa_toggle` | on / off / deferred · killed 时 Forecast 归零 + ghost 线 |
| `doctrine_innovate_audit_id` | |

### 4.6 `TechSignal` 技术信号 ★ Phase 2

人工维护，非自动雷达：

| 字段 | 说明 |
|------|------|
| `domain` | 热泵 / 变频 / 智能控制 / … |
| `signal` | 一句话 |
| `implication` | 对产品布局的含义 |
| `time_horizon` | 0–12月 / 1–3年 / 3–5年 |
| `linked_product_line_ids` | |
| `source` | 展会 / 政策 / 竞品 / 内部研发 |

### 4.7 `ProdStackSnapshot` 产品前瞻快照

每次 `strategic_snapshot` 冻结：

- 全量 ProductLine + Jtbd + Roadmap + Gap + ProductBet 状态  
- 指标：`h3_bet_ratio`（H3 赌注占研发/新品资源比例）、`roadmap_slip_count`、`gap_lagging_count`

---

## 五、方法论工具箱（加强后）

### 5.1 组合与布局

| 工具 | 阶段 | 说明 |
|------|------|------|
| **品牌×品类矩阵** | MVP+ | 从 WTP/HTW 下钻 |
| **生命周期 × 战略角色** | MVP+ | 2×2 或 BCG 简版 |
| **三层面产品赌注** | MVP+ | H1 优化 / H2 增长 / H3 探索；与 Vx.horizon 统一 |
| **Now/Next/Later** | MVP+ | Roadmap 三泳道 |
| GE/BCG 全矩阵 | Phase 2 | 战略部深潜 |

### 5.2 前瞻与竞争

| 工具 | 阶段 | 说明 |
|------|------|------|
| **JTBD 卡** | MVP+ | 每条核心产品线 1 张 |
| **竞品四维差距** | MVP+ | tech/cost/service/brand |
| **TechSignal 清单** | Phase 2 | 5–15 条人工信号 |
| **技术 S 曲线 / TRL 雷达** | Phase 3 | 有研究员再开 |

### 5.3 决策与资源

| 工具 | 阶段 | 说明 |
|------|------|------|
| **ProductBet + kill/success** | MVP+ | 与 Diagnosis.crux 对齐 |
| **Innovate Gate 清单** | MVP+ | 见 §6 |
| **RICE 需求池** | Phase 2 | 不挡战略会 |
| **Stage-Gate 简版** | Phase 2 | 挂 Vx 里程碑 |

---

## 六、Innovate Gate 清单（产品战略会 Gate）

不做综合打分，输出 **风险清单 + 出牌建议**：

| 检查项 | 通过标准 |
|--------|----------|
| 每条 H2/H3 ProductBet 有 JTBD | 是/否 |
| Roadmap Now 项 ≤5（聚焦） | 是/否 |
| 每条 lagging Gap 有 Vx 或 defer 决策 | 是/否 |
| H3 占比 vs 资源（研发/CAPEX）可解释 | 是/否 |
| 与 WTP/HTW 无矛盾 | 是/否 |
| 与 Diagnosis.crux 对齐 | 是/否 |
| 新品收入占比假设 Hx 已绑定 | 是/否 |
| kill_criteria 已写（H3 赌注） | 是/否 |

**未通过项 → 战略会议题 + StratDiff 候选**

---

## 七、UI：产品前瞻引导（看战略扩展）

### 7.1 看战略 · 产品前瞻区（WTP 之下、BSC 之上）★ MVP+

```
┌─ 产品前瞻 ProdStack FY2026 ──────────────────────────────────────┐
│  H1 优化 58% │ H2 增长 32% │ H3 探索 10%     下一张牌：V4 Q3 样机冻结  │
├─ Now          │ Next              │ Later                          │
│ RUUD 热泵迭代 │ V4 产品化平台      │ 科技住宅整体方案                  │
│ 恒热 商用升级 │ 智能控制 Gen2      │ …                               │
├─ 竞品差距（lagging 高亮）──────────────────────────────────────────┤
│ V4 热泵 · 技术 vs 史密斯 · lagging · → V4                         │
└──────────────────────────────────────────────────────────────────┘
四品牌 WTP/HTW · BSC · OKR …
```

### 7.2 产品线详情 · 三卡

| 卡 | 内容 |
|----|------|
| **JTBD** | Job 陈述 + outcome |
| **Roadmap** | 季度里程碑 + confidence |
| **Gap** | 四维 vs 竞品 + closure Vx |

### 7.3 看执行 · Vx 产品标签

资本类 Vx 旁增加：`product_line` · `horizon` · `ProductBet` 链接。

### 7.4 StratForesight · 产品 Tab

- 竞品 **产品级** 动作（不仅是公司级）  
- TechSignal 列表（Phase 2）  
- 动作 → 自动建议更新 Hx / CompetitiveProductGap  

---

## 八、与现有模块衔接

| 模块 | 衔接 |
|------|------|
| **StrategicDiagnosis** | crux → ProductBet.success/kill |
| **BrandStrategyCard** | WTP 品类 → ProductLine 矩阵 |
| **StratCapital IC** | type=technology → ProductBet.linked_ic_id |
| **Vx / OKR** | RoadmapItem.linked_vx_id；Innovate KR 绑 ProductLine |
| **Hx** | 新品占比、竞品降价、政策窗口 → 产品假设类型 `product` |
| **FPA** | 新品收入占比、研发 ROI、品牌 P&L 按产品线 drill |
| **StratDiff** | #23–26 |
| **十二维健康度** | 产品子维 7% 有对象支撑 |

---

## 九、StratDiff 产品类变化（#23–26）

| # | 类型 | 示例 |
|---|------|------|
| 23 | Roadmap 重大延期 | V4 Q2→Q4 |
| 24 | 产品赌注升降面 | H3「科技住宅方案」now→later |
| 25 | 竞品差距恶化 | RUUD 热泵 tech：parity→lagging |
| 26 | JTBD/品类调整 | WTP 增加/收缩品类 |

---

## 十、数据导入

| Sheet | MVP+ 字段 | 频率 |
|-------|-----------|------|
| **Sheet9 产品（精简）** | 产品线/品牌/生命周期/角色/horizon/收入占比 | 季/战略会 |
| 竞品产品差距 | 可合入 Sheet4 竞品子表 `product_gap` | 事件/季 |
| 全量 RICE 需求池 | Phase 2 | — |

---

## 十一、分期交付（修订 · 产品驱动型公司）

| 阶段 | StratProduct | 说明 |
|------|--------------|------|
| ~~MVP~~ | ~~Vx 里程碑~~ | **不足，上移** |
| **MVP+** | ProductLine · JtbdCard · RoadmapItem · Gap · ProductBet · 看战略 ProdStack · Innovate Gate | **与 Q3 战略会同批** |
| **Phase 2** | TechSignal · RICE 池 · Stage-Gate 深 · BCG 全矩阵 | |
| **Phase 3** | TRL 雷达 · AI 产品顾问 | |

> **I8（JTBD+生命周期）从 Phase 2 提前至 MVP+** — 产品驱动型客户的硬需求，与 [STRAT_CAPITAL](./STRAT_CAPITAL.md) MVP+ 对称。

---

## 十二、瑞合瑞德示例（引导话术）

| 层级 | 示例 |
|------|------|
| Diagnosis crux | 热泵产品化 12 个月内能否成立 |
| ProductBet | H2：V4 平台化；H3：科技住宅系统方案 |
| JTBD | 「酒店业主在改造热水系统时，想在不停业前提下降低 30% 能耗并 pass 验收」 |
| Gap | V4 vs 史密斯：tech lagging → closure V4 |
| Roadmap Now | RUUD 2026 迭代；Next：V4 冻结；Later：多品牌共用平台 |
| Innovate Gate | Now≤5 ✓ · H3 有 kill 标准 ✓ · Gap 有 Vx ✓ |

---

## 十三、一句话定调

> **StratProduct 不是 PLM，而是 Innovate to Lead 的「出牌教练」** —— 让 CEO 在战略会上看见 **今夕何牌、下一张牌、缺什么牌**，且每一张牌都挂得住 Vx、假设、资本与快照 diff。

**下一步：** 更新 `THEORY_IMPORTS` I8→MVP+；`prisma` 增加 ProductLine / ProductBet / RoadmapItem；看战略页 ProdStack wireframe。
