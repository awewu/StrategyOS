# StratOS · 理论导入规范（已定稿）

**版本：** v1.0 · 2026-06-14  
**状态：** 已批准导入  
**关联：** [方法论](./METHODOLOGY.md) · [骨架与血肉](./SKELETON_AND_FLESH.md) · [高维框架](./HIGHER_DIMENSION.md) · [报告格式](./REPORT_FORMATS.md) · [UI/VI](./UI_VI.md)

---

## 一、导入总表

| # | 理论 | 阶段 | 模块 | 对象/UI | MVP 交付 |
|---|------|------|------|---------|----------|
| I1 | Rumelt 战略诊断 | **MVP+** | StratCraft / 看战略 | `StrategicDiagnosis` | 看战略顶栏 + 快照冻结 |
| I2 | Mintzberg deliberate/emergent | **MVP+** | StratDiff / 月报 | `StrategyPattern` + diff #15–18 | diff 报告新章 + 月报 §8 |
| I3 | Playing to Win WTP/HTW | **MVP+** | StratCraft | `BrandStrategyCard` ×4 | 四品牌双卡 |
| I4 | Cynefin 情境标签 | **MVP+** | 横切 | `cynefin_domain` 枚举 | 假设/Vx/议题 + 方法提示 |
| I5 | 4DX 执行记分板 | **MVP+** | 看执行 | UI 组件 | WIG 式主目标 + 领先指标 |
| I6 | McKinsey 三层面 | Phase 2 | StratCapital / Vx | `horizon` 枚举 | Vx 组合视图 |
| I7 | Hoshin X-Matrix | Phase 2 | StratDecode | 备选视图 | 与 BSC 地图切换 |
| I8 | JTBD + 产品生命周期 | **MVP+** | StratProduct | `ProductLine` 等 | **ProdStack 前瞻引导** |

**原则：** 不新增主入口；全部汇入 **看战略 / 看执行 / 版本库** 三看板或 StratCraft 子页。

---

## 二、I1 · Rumelt 战略诊断 `StrategicDiagnosis`

### 2.1 理论要点

好战略 = **诊断（Diagnosis）+ 指导方针（Guiding Policy）+ 连贯行动（Coherent Actions）**。  
StratOS 已有 Guiding Policy（Doctrine）与 Coherent Actions（OKR/Vx/FPA）；**显式补齐诊断层**。

### 2.2 对象定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | ✓ | |
| `period` | string | ✓ | 如 `2026-FY` |
| `challenge_statement` | string(≤80) | ✓ | 一句话核心挑战 |
| `bottleneck_type` | enum | ✓ | `capability` / `market` / `organization` / `capital` |
| `root_causes` | string[] | ✓ | 3–5 条 |
| `crux` | string(≤120) | ✓ | 枢纽/最小杠杆点 |
| `linked_assumption_ids` | uuid[] | | 诊断依赖的 Hx |
| `linked_bsc_measure_ids` | uuid[] | | 支撑诊断的 BSC 指标 |
| `fpa_rationale` | text | | 诊断的财务逻辑（与 FPA 脊梁对齐） |
| `valid_until` | date | ✓ | 有效期；下次快照前须重检 |
| `status` | enum | ✓ | `draft` / `approved` |
| `approved_by` | user_id | | CEO 批准 |
| `approved_at` | datetime | | |

**关系：** 每 `period` 至多 **1 条 approved** 诊断；`working_version` 可有多条 draft。

### 2.3 快照

`strategic_snapshot` 增加 `diagnosis_snapshot_id` — 冻结当时 approved 诊断全文。

### 2.4 UI · 看战略

```
┌─────────────────────────────────────────────────────────────┐
│  今年核心挑战（Diagnosis）                    [编辑 draft]   │
│  「从 1 亿到 2.5 亿，渠道扩张与产品化能力不同步」              │
│  瓶颈：能力 · 枢纽：热泵产品化 12 个月内能否成立 · 有效至 FY  │
└─────────────────────────────────────────────────────────────┘
使命愿景 · BSC 四卡 · OKR 树 · Doctrine  （诊断在其上，不在其下）
```

### 2.5 与 BLM 差距的关系

| BLM | Diagnosis |
|-----|-----------|
| 业绩/机会/对标 **差距** | 输入 |
| 战略意图 | 输出方向 |
| **Diagnosis** | 对差距的 **归因与聚焦** — 「真正卡在哪」 |

流程：`差距量化 → StrategicDiagnosis 定稿 → 战略意图 / WTP·HTW / BSC`

---

## 三、I2 · Mintzberg deliberate / emergent

### 3.1 理论要点

战略不仅是计划文档，更是决策流中显现的 **模式**。两次快照 diff 应 diff **战略如何形成**，不只 diff KPI。

### 3.2 四类模式（枚举 `strategy_formation_type`）

| 值 | 中文 | 定义 |
|----|------|------|
| `deliberate` | 刻意 | 年初/会前写入快照的意图 |
| `emergent` | 涌现 | 执行中出现、未在计划中的有效模式 |
| `unrealized` | 未实现 | 计划有、实际无 |
| `serendipitous` | 偶成 | 未计划但做成了（学习金矿） |

### 3.3 快照聚合对象 `StrategyPattern`

每版 `strategic_snapshot` 自动生成（或战略会确认后锁定）：

| 字段 | 说明 |
|------|------|
| `deliberate_realization_rate` | 0–100，刻意 OKR/Vx 实现率 |
| `emergent_patterns` | `{ title, evidence_report_ids[], fpa_impact_note }[]` |
| `unrealized_items` | `{ object_type, object_id, title }[]` |
| `serendipitous_items` | 同上 |
| `learning_prompts` | string[] — 「涌现是否写入下版 deliberate？」 |

### 3.4 StratDiff 新增变化类型

| # | 类型 | 示例 |
|---|------|------|
| 15 | 涌现模式识别 | 「恒热区县经销商自发增长」未在 FY 计划 |
| 16 | 未实现意图 | FY 计划 V6 未启动 |
| 17 | 偶成成果 | 科技住宅意外获 3 个标杆项目 |
| 18 | 刻意实现率骤降 | deliberate_realization_rate 78%→52% |

### 3.5 月报 MON-RPT · 新增 §8 战略模式观察（可选填）

```yaml
# §8 战略模式观察（Mintzberg · 可选）
strategy_patterns:
  - formation_type: emergent          # deliberate | emergent | unrealized | serendipitous
    title: 区县经销商自发组团签约
    evidence: §2 签约 82 家中 31 家来自未覆盖区县
    linked_okr: []                   # 空 = 未对齐计划 OKR
    suggest_deliberate: true         # 建议写入下版刻意战略
```

**解析规则：** `linked_okr` 为空且 `formation_type=emergent|serendipitous` → 累积进 `emergent_patterns` 候选。

### 3.6 StratRobust · R6 学习稳健性（MVP+ 可选展示）

| 输入 | 稳健 | 脆弱 |
|------|------|------|
| emergent 被吸收进下版 deliberate 的比例 | 高 | 涌现重复出现却未写入计划 |
| serendipitous 有复盘记录 | 高 | 偶成无归因 |

---

## 四、I3 · Playing to Win · WTP/HTW 双卡

### 4.1 理论要点

五问级联中 **Where to Play** 与 **How to Win** 是四品牌战略对话的最短路径；与 BSC 并列，不替代 BSC。

### 4.2 对象 `BrandStrategyCard`（四品牌各一张）

| 字段 | 说明 |
|------|------|
| `brand_code` | `RUIMEI` / `HENGRE` / `RUUD` / `TECH_HOME` |
| `period` | `2026-FY` |
| `winning_aspiration` | 什么叫赢（≤60 字） |
| `where_to_play` | 战场：区域×渠道×客户段（结构化 + 文本） |
| `how_to_win` | 差异化打法（≤200 字） |
| `must_have_capabilities` | string[] — 链接 Vx / 学习维 KPI |
| `linked_bsc_dimension_ids` | uuid[] |
| `linked_objective_ids` | uuid[] |
| `fpa_anchor` | 该品牌 P&L 目标摘要 |

**UI：** StratCraft / 看战略 → **四品牌 Tab** → 每张 **WTP 左 / HTW 右** 双卡布局。

### 4.3 与 Diagnosis 关系

`BrandStrategyCard.how_to_win` 须与 `StrategicDiagnosis.crux` **不矛盾**；保存时软校验警告。

---

## 五、I4 · Cynefin 情境标签

### 5.1 枚举 `cynefin_domain`

| 值 | 中文 | 推荐方法论 |
|----|------|------------|
| `clear` | 清晰 | 标准 KPI、SOP |
| `complicated` | 繁杂 | BLM 分析、FPA 敏感性 |
| `complex` | 复杂 | 假设探测、Vx 试点、季度 KR |
| `chaotic` | 混沌 | 事件快会、CEO 裁决、暂停年度 KPI |

### 5.2 挂载对象（MVP+ 必填于新建）

| 对象 | 必填 | UI |
|------|------|-----|
| `Assumption` | ✓ | 卡片角标 + 方法提示条 |
| `Project (Vx)` | ✓ | 看板列筛选 |
| `StrategicIssue`（战略会议题） | ✓ | 议题列表 |

**方法提示（只读文案）：**  
Complex → 「勿强行定年度 KPI；用季度探测 KR + 假设验证」  
Chaotic → 「先稳定再规划；48h 内 CEO 裁决记录」

### 5.3 默认建议（按瓶颈类型）

| Diagnosis.bottleneck_type | 建议默认域 |
|---------------------------|------------|
| capability | complex |
| market | complicated |
| organization | complex |
| capital | complicated |

### 5.4 看执行消费规则（v1.1 锁定）

| 域 | Vx 看板主轴 | 4DX 记分板 |
|----|-------------|------------|
| clear | KPI 达成 | 标准滞后 KR |
| complicated | **KPI + 里程碑成果** | 成果型 KR / BSC Measure |
| complex | **领先指标 + 试点** | **优先进入 WIG 领先指标池** |
| chaotic | 48h 行动项 | 不统计年度 KPI；升 StrategicIssue |

详 [STRATOS_BLUEPRINT §16.3](./STRATOS_BLUEPRINT.md#163-cynefin-域--看执行消费规则)。

---

## 六、I5 · 4DX 式执行记分板（看执行 UI）

### 6.1 借鉴点（不导入 4DX 变革流程）

| 4DX 概念 | StratOS 映射 |
|----------|--------------|
| WIG 最重要目标 | 当前周期 **1 个公司级 WIG** = 置顶 OKR-O 或 Diagnosis.crux 衍生 |
| 领先指标 | 2–4 个 **KR 或假设验证指标**（非滞后财务） |
| 记分板 | 看执行页 **顶部全宽组件** |
| 问责节律 | 已有月报/季报；不新增周会模块 |

### 6.2 UI 结构

```
┌─ 公司 WIG ─────────────────────────────────────────────────┐
│  O2：RUUD 渠道签约 300 家（Q2）          整体进度 ████░░ 68% │
├─ 领先指标 ─────────────────────────────────────────────────┤
│  KR3 周签约数 ≥8    ████████░░ 80%   │ H2 竞品未降价 ✓      │
│  V4 样机就绪        ███░░░░░░░ 52%   │ 演示场次 ≥12/月 △    │
└────────────────────────────────────────────────────────────┘
Vx 看板 · 假设 · 承诺 · 预警 （记分板之下）
```

**数据：** 无新表；`ExecutionScoreboard` 为 **视图配置**（`wig_objective_id` + `lead_measure_kr_ids[]`），CEO 可每季调整。

---

## 七、Phase 2 导入

### I6 · McKinsey 三层面 · Vx 组合

**枚举 `horizon` on Project：**

| 值 | 含义 | 决策法 |
|----|------|--------|
| `H1` | 核心业务优化 | 现金流、Deliver |
| `H2` | 增长 bets | Invest + 假设验证 |
| `H3` | 期权/探索 | Innovate，允许失败 |

**UI：** 看执行 / StratCapital → **三层面气泡图**（X=投入 Y=预期回报 大小=预算）。

**规则：** H3 项目 **禁止** 绑年度财务 OKR-O；仅季度探测 KR。

### I7 · Hoshin X-Matrix 备选视图

**非第二骨架** — StratDecode 中 **与 BSC 战略地图 Tab 切换**。

| X-Matrix 象限 | StratOS 对象 |
|---------------|--------------|
| 长期突破（南） | MissionVision + 3–5 年 BSC |
| 年度突破（西） | 年度 OKR-O |
| 改善项目（北） | Vx 列表 |
| 指标（东） | BscMeasure + KR |

**关联点：** 矩阵交叉格 = OKR-O ↔ Vx ↔ Measure 的 **correlation_dot**（手动或半自动建议）。

**制造基因：** 默认模板含 PDCA 环引用（链到 StratReview）。

### I8 · JTBD + 产品生命周期 · StratProduct

**对象 `Product` 扩展字段：**

| 字段 | 说明 |
|------|------|
| `jtbd_statement` | When… I want… so I can… |
| `lifecycle_stage` | `intro` / `growth` / `mature` / `decline` |
| `strategic_role` | 现金牛 / 明星 / 问题 / 瘦狗（BCG 简版） |
| `linked_vx_ids` | 研发/上市 Vx |
| `linked_brand` | 四品牌之一 |

**UI：** 组合矩阵（生命周期 × 战略角色）+ Roadmap 时间轴；点击产品 → JTBD 卡 + Vx 链。

**与 I3 关系：** `BrandStrategyCard.where_to_play` 可下钻到 Product 组合。

---

## 八、对象模型增量（相对骨架 v1.1）

```
+ StrategicDiagnosis      # I1 · 每 period 一条 approved
+ BrandStrategyCard ×4    # I3 · WTP/HTW
+ StrategyPattern         # I2 · 每快照一条聚合
+ ExecutionScoreboardConfig  # I5 · 视图配置（单例/按季）

Assumption.cynefin_domain     # I4
Project.cynefin_domain        # I4
Project.horizon               # I6 · Phase 2
StrategicIssue.cynefin_domain # I4

Product.*                     # I8 · Phase 2
```

**快照冻结清单增加：** Diagnosis · BrandStrategyCard ×4 · StrategyPattern · cynefin 标签状态

---

## 九、交付路线图

| 迭代 | 内容 | 用户可感知 |
|------|------|------------|
| **MVP** | 骨架三看板 + FPA + 快照 + diff 8 类 | 基线 |
| **MVP+（Q3 战略会前）** | I1–I5 + **I8 ProdStack** + StratCapital | 诊断 · 四品牌 · 记分板 · Cynefin · diff · **产品前瞻** · 资本 |
| **Phase 2** | I6 三层面 · I7 Hoshin · TechSignal/RICE | Vx 组合 · X 矩阵 · 产品深潜 |

---

## 十、研讨锁定（不再讨论是否导入）

- ✅ Rumelt 诊断 — **导入**
- ✅ Mintzberg — **导入**
- ✅ Playing to Win — **导入**
- ✅ Cynefin — **导入**
- ✅ 4DX 记分板 UI — **导入**
- ✅ **I8 JTBD / ProdStack — MVP+ 导入**（产品驱动型，见 [STRAT_PRODUCT.md](./STRAT_PRODUCT.md)）
- ✅ 三层面 / Hoshin — **Phase 2**

**下一步实现：** ~~prisma I1–I4~~ → 已落表 · 见 [OBJECT_MODEL.md](./OBJECT_MODEL.md) · [STRATDIFF_RULES.md](./STRATDIFF_RULES.md)
