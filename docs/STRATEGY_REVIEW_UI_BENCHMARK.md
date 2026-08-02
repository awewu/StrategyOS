# StratOS · 战略复盘报告 UI 行业基准

**版本：** v1.0 · 2026-06-14  
**读者：** 产品 · 设计 · 核心管理层 (~30)  
**关联：** [UI_VI_EVOLUTION.md](./UI_VI_EVOLUTION.md) · [REPORT_FORMATS.md](./REPORT_FORMATS.md) · [ONE_PAGE_PANORAMA.md](./ONE_PAGE_PANORAMA.md)

---

## 执行摘要

| # | 要点 |
|---|------|
| 1 | MBB 与董事会 pack 的**第一性原理**：答案先行（Pyramid / BLUF）、一 slide 一 message、action title 可读即故事。 |
| 2 | 标准 pack 骨架：**Executive Summary → Operating Scoreboard → Deep Dives → Risks/Decisions → Appendix**；RAG 与「so what」注释是 KPI 标配。 |
| 3 | 数字 war-room 趋势：静态 deck + **live drill-down 伴侣**、版本/changelog、rehearsal/present mode — StratOS 已有雏形。 |
| 4 | StratOS 最大 gap：**缺 SCR 式 exec summary 层**、panorama 未含 ROS/EBITDA/decision asks、reports 偏 pipeline 非阅读面。 |
| 5 | Phase B/C 优先：panorama 董事会结构对齐、reports 章节化预览、versions diff-as-changelog 上屏。 |

---

## 一、行业模式（MBB · 董事会 Pack · BSC）

### 1.1 信息架构：Deck-first，但逻辑可数字化

顶级咨询与 CFO 董事会 pack 虽以 PowerPoint/Slides 交付，**信息架构高度一致**，可抽象为五层：

```
L0  Executive Summary     ← 30–60 秒可读；常占 pack 第 1–2 页
L1  Operating Scoreboard  ← 12–20 KPI · 四象限 · RAG
L2  Narrative Deep Dives  ← 每议题 1 message · 按需展开
L3  Decisions & Asks      ← 明确 owner · deadline · trade-off
L4  Appendix              ← 表格 · 方法论 · 备份图表 · 定义
```

**篇幅惯例（董事会 / ExCom）：**

| 来源 | 建议篇幅 | 结构 |
|------|----------|------|
| 专业 board pack 指南 | 15–25 页 | 1–2p exec · 3–5p 财务 · 2–3p 运营 · 1–2p 前瞻 |
| SaaS board deck 模板 | 14–18 slides + appendix | Title → Exec → Scoreboard → 4× Deep Dive → Wins/Risks → Asks |
| MBB 客户交付 | 20–40 slides 主 deck + 附录包 | 主 narrative 精简；细节全进 appendix |

**3-page executive summary rule（实务变体）：**

- **Slide 1**：完整论证 — Recommendation · Why now · Evidence · Trade-off · **Decision required**（非目录页、非背景页）。
- **Slide 2**：Operating scoreboard — 四象限 KPI + RAG（财务/客户/流程/学习 或 Growth/Retention/Efficiency/Profitability）。
- **Slide 3**：Forward look — Top risks · Strategic wins · Capital/people asks。

> 与 StratOS 对齐：`/print/panorama` = L0 物理输出；`/command` = L1 数字 scoreboard；`/versions` = changelog；`/reports` = L4 输入管道。

### 1.2 叙事框架

| 框架 | 结构 | 用途 |
|------|------|------|
| **Minto Pyramid** | Answer → ≤3 MECE pillars → evidence | 全 deck 逻辑；slide title 连读即故事 |
| **SCR / SCQA** | Situation · Complication · Resolution（或 Question · Answer） | Exec summary；Resolution 占 60–70% |
| **Bold-bullet** | 粗体 = claim；缩进 bullet = 证据 | 高管只读粗体即可决策 |
| **Action title** | 完整句结论，非主题词（「营收下降 8% 因华东竞品」✓ / 「营收分析」✗） | 每 slide 顶部 |
| **BLUF** | Bottom Line Up Front | 军事/项目 ExCom briefing；与 Pyramid 等价 |
| **Bain story arc** | Situation → Analysis → Recommendation | 强调 narrative flow |
| **BSC board pack** | 四维度 scorecard + 因果链（学习→流程→客户→财务） | 与 StratOS BSC 四灯一致 |

**「So what」规则：** 每个图表旁 **一句注释** — 不只展示数字，说明对决策的含义（例：「NRR 112% → 扩张收入抵消 60% churn，仍低于 board 目标 115%」）。

### 1.3 Slide / Page 解剖（MBB 标准）

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION TITLE（结论句 · ≤2 行 · 全 deck 最大字号之一）          │
├─────────────────────────────────────────────────────────────┤
│ [可选 subtitle · 仅 BCG 风格补充 scope]                      │
├──────────────────────────┬──────────────────────────────────┤
│  EXHIBIT（单图/单表）      │  SUPPORT（2–4 bullets · 或并列读） │
│  · 一 slide 一 exhibit     │  · 每 bullet 支撑 title          │
│  · 数字 > 图形面积          │  · 无段落 prose                   │
├──────────────────────────┴──────────────────────────────────┤
│ Source: … · Footnote: 定义/口径 · Page N                      │
└─────────────────────────────────────────────────────────────┘
```

**Consulting slide standards（MBB + Big 4）：**

- 一 slide **一 message**；两观点 = 两 slides。
- **60 秒规则**：说不清则拆 slide 或移 appendix。
- **2 fonts max**；同类元素字号全局一致。
- **Source everything** — 无来源的数据不上 board。
- **Reading order**：仅读 action titles 应能复述全文（「电梯测试」）。

### 1.4 KPI 与 RAG 呈现

**Operating scoreboard 列（SaaS/board 常见 12 指标模式）：**

| 象限 | 典型指标 | 列 |
|------|----------|-----|
| Growth | New ARR, ARR growth, Pipeline coverage | 实际 · 计划 · 上季 · 同比 · **RAG** |
| Retention | NRR, GRR, Logo churn | 同上 |
| Efficiency | CAC payback, Burn multiple, Rev/FTE | 同上 |
| Profitability | Gross margin, Rule of 40, Runway | 同上 |

**RAG 设计原则：**

- 阈值 **预定义且一致**（例：runway >12m 绿 · 6–12 琥珀 · <6 红）。
- RAG 旁必须有 **variance + 原因 + 对策** 三件套（MON-RPT §2 已建模）。
- **形+色** 冗余（StratOS TrafficLightDot 已符合 a11y）。
- Board 扫描模式（Sequoia/Lenny 2026 归纳）：Rule of 40 · NRR · Runway · Exec summary RAG · **Asks slide** — 五元素决定 deep read 与否。

**StratOS 映射：** BSC 四灯 = 象限级 RAG；`/finance` ROS/EBITDA = 财务 deep dive；runway = 一票否决 — 应在 L0/L1 **同权重** 展示（UI_VI §4.6 已规划）。

### 1.5 Action framing · Decisions · Timeline

**Decision slide 模板（ExCom / Board）：**

| 字段 | 内容 |
|------|------|
| Decision required | 什么决定 · 谁批 · 何时前 |
| Recommendation | 建议选项 |
| Why now | Complication — 什么变了 |
| Options considered | A / B / C（MECE） |
| Trade-offs | 得失 · 风险接受 |
| Evidence | 数字 · 客户 · 运营信号 |
| Next step | 批准后第一步 |

**Timeline / versioning：**

- Pack 状态机：`DRAFT → REVIEWED → APPROVED → DISTRIBUTED`（含 frozen month cutoff）。
- **Changes since last pack** slide — 自动生成 diff/changelog（StratOS `/versions` StratDiff 即此物数字化）。
- 战略会节律：月报脉冲 → 季报 → H1/FY 快照 — StratOS 与 METHODOLOGY 一致。

### 1.6 Appendix 模式

| 内容 | 位置 |
|------|------|
| 部门/SKU 明细表 | Appendix A |
| 完整 risk register | Appendix B |
| 假设证据链 · Hx 表 | Appendix C |
| 定义与口径 · CoA mapping | Appendix D |
| 备份图表（主 deck 放不下的） | Appendix E |

**原则：** 主 narrative ≤20 slides；**10 秒看不懂的 slide 降级到 appendix** 或 live dashboard drill-down。

### 1.7 数字 War-room / Strategy Cockpit（非 deck 产品）

| 产品/模式 | 特征 | StratOS 可借鉴 |
|-----------|------|----------------|
| StrategyWorks / 执行平台 | OKR→项目层级 · live exec dashboard · Power BI 伴侣 | `/command` + `/strategy` 层级 |
| PIOL StrategyOS | 单页 canvas · RAG 阈值自动 escalation · 版本对比 | `/versions` 快照 + assertion |
| Workiva / 治理报告 | 版本 · 审批 · audit trail | SnapshotFreeze + audit log |
| dashb0rd 等 | Dashboard-as-code · PR preview · git revert | StratDiff in repo / harness |
| FitGap board automation | Slides 模板 + Looker drill-down 伴侣 | `/print/panorama` PDF + `/command` 交互 |

**共识：** 静态 board pack **不会消失**；数字产品提供 **同一数据源** 的 drill-down、rehearsal、diff — 而非替代 narrative。

---

## 二、数字化 UI/UX 模式（Deck 原则 → 产品界面）

### 2.1 Command deck layout（指挥舱 = L1 Scoreboard）

```
┌──────────────────────────────────────────────────────────────────┐
│ TAGLINE · Period · Data freshness · [Light preview] [Print]       │
├──────────────────────────────────────────────────────────────────┤
│ █ EXEC STRIP (SCR 一行): 建议 · 为何现在 · 需决策 (折叠展开)        │
├───────────────┬───────────────┬───────────────┬────────────────────┤
│ BSC 财务      │ BSC 客户      │ BSC 流程      │ BSC 学习            │
│ ● RAG         │ ● RAG         │ ● RAG         │ ● RAG               │
├───────────────┴───────────────┴───────────────┴────────────────────┤
│ FP&A HERO: ROS · EBITDA · Runway · B-A-F 条 (数字 > 图)           │
├────────────────────────────┬─────────────────────────────────────┤
│ StratRobust 5+1            │ Top3 StratDiff + Top3 预警           │
├────────────────────────────┴─────────────────────────────────────┤
│ [硬阻断条] 若 assertion active — 全宽 · 不可忽略                    │
└──────────────────────────────────────────────────────────────────┘
```

**原则：** 30 秒扫描路径 = RAG → FP&A hero → Top3 diff → 是否阻断。

### 2.2 Drill-down（主屏 → 深读）

| L0 元素 | 点击目标 |
|---------|----------|
| BSC 灯 | `/health` 该维度 KPI 表 |
| ROS/EBITDA | `/finance?tab=management` |
| StratDiff 条目 | `/versions#diff-{id}` |
| 三栈摘要 | `/strategy` Cap/Prod/Gtm |
| 月报脉冲 | `/reports?period=` 该月 MON-RPT |

**MBB 等价：** 主 deck slide → appendix 或 **live dashboard section**（非 dead-end PDF）。

### 2.3 Diff / Changelog（版本即「Changes since last board」）

```
┌─ Changes since 2025-FY-STRATEGIC ─────────────────────────────┐
│ +3 critical · 5 high · 12 medium · deliberate rate 68%→52%  │
├───────────────────────────────────────────────────────────────┤
│ [Filter: BSC | FPA | Mintzberg | CapStack | …]                │
│ ▼ EMERGENT_PATTERN  区县自发签约  → 建议写入下版 deliberate      │
│ ▼ FPA_FORECAST_REV  营收预测下调 8%  → 联动 SPBP 悲观           │
└───────────────────────────────────────────────────────────────┘
```

StratOS `/versions` 已有 StratDiff 列表 — **缺**：与 board pack 周期对齐的 **changelog 摘要卡** 上 `/command` 和 `/print/panorama`。

### 2.4 Rehearsal / Present mode

| 模式 | 行为 |
|------|------|
| **Walkthrough** | 按战略会议程逐步 · 每步链接 deep link |
| **Present** | 1280×800 横屏 · 大字号 · 隐藏 chrome · 触控翻页 |
| **Print** | A3 light · 无交互 · 签章区 |

StratOS `/rehearsal` + `RehearsalWalkthrough` 已覆盖 — 应对齐 **标准 6 段议程**（BLUEPRINT §9.2）逐步高亮 command 子区。

### 2.5 Report ingestion UI（MON-RPT 数字化）

理想 **报告中心** 不是仅「Agent 管道」，而是 **结构化阅读 + 解析状态**：

```
┌─ MON-RPT · SALES-RUUD · 2026-05 ─────────────────────────────┐
│ Status: PARSED ✓  ·  BSC: customer,financial  ·  §8: 2 patterns │
├───────────────────────────────────────────────────────────────┤
│ §1 一句话          │ [展开] 5月签约低于 KR…                       │
│ §2 OKR/KPI        │ [表格] 3 rows · 1 red variance               │
│ §3 Vx             │ …                                            │
│ … §7              │                                              │
│ §8 战略模式        │ emergent ×1 → 链 StrategyPattern             │
├───────────────────────────────────────────────────────────────┤
│ [Agent 解析] [查看触发 assertion] [链至 /versions diff 预览]      │
└───────────────────────────────────────────────────────────────┘
```

### 2.6 角色密度（Audience-first）

| 角色 | 默认面 | 深度 |
|------|--------|------|
| CEO / Board | L0 panorama + command strip | 无表格默认展开 |
| VP ExCom | L1 scoreboard + 2 deep dives | 可按议题 drill |
| PM / 部门 | MON-RPT 录入 + §2/§3 表格 | L2 全展开 |
| staff | 解析管道 + FPA 编辑 | — |
| observer | 只读 command + strategy | 无 edit chrome |

---

## 三、StratOS 映射 — 已有 vs 应采纳

### 3.1 能力对照表

| 行业模式 | StratOS 现状 | 评级 | Phase B/C 动作 |
|----------|--------------|------|----------------|
| Pyramid / SCR exec summary | `/command` 有 tagline，**无** SCR 决策条 | ⚠️ Gap | B: ExecStrip 组件 · panorama §0 |
| Action title 叙事 | StratDiff title 接近；月报 §1 有一句话 | ◐ Partial | B: reports 章节 title = action sentence |
| Operating scoreboard | BSC 四灯 + B-A-F + Robust | ✅ Strong | B: ROS/EBITDA hero 与 finance 对齐 |
| 12-metric grid | 4 KPI cards on panorama；health 8 KPI | ◐ Partial | B: 四象限 scoreboard 组件 |
| RAG + so what | TrafficLightDot；MON-RPT §2 偏差原因列 | ◐ Partial | B: 每 KPI 强制 one-line annotation |
| Decision / Asks slide | Gate 风险 · SPBP；**无**统一 asks 区 | ⚠️ Gap | C: `/command` DecisionsPanel |
| Changes since last | `/versions` StratDiff 30 类 | ✅ Strong | B: changelog 摘要上 command/panorama |
| Appendix | view-model 有 fpaLines/capStackLines **未渲染** | ⚠️ Gap | B: panorama 背面或 PDF 附录页 |
| Frozen snapshot | SnapshotFreeze · WORKING/FROZEN | ✅ Strong | C: 定稿仪式动效 |
| MON-RPT 七章+§8 | REPORT_FORMATS 完整 · UI 仅列表+Agent | ⚠️ Gap | B: 章节折叠预览 |
| Rehearsal | `/rehearsal` Q3 议程 | ✅ Strong | C: present mode 1280 布局 |
| Drill-down links | 部分 Link（versions/finance） | ◐ Partial | B: KPI 卡全链 |
| Source/audit | audit log · data source badge | ◐ Partial | B: 每 KPI 显示 freshness + owner |
| Anti-chartjunk | UI_VI 禁止 3D/pie；panorama 有 inline hex | ◐ Partial | B: token 化 · chart primitives |
| 抉择语气 | 已去博彩；ProductBet 内部保留 | ✅ Aligned | — |
| FP&A 管理报表优先 | `/finance` 默认 management tab | ✅ Strong | B: panorama 加 ROS/EBITDA 行 |

### 3.2 与 MON-RPT 管道对齐

| MON-RPT § | 行业等价 | StratOS 消费点 |
|-----------|----------|----------------|
| §1 一句话 | Exec pulse / action title | diff 摘要 · command pulse |
| §2 OKR/KPI | Scoreboard row | `/health` · BSC 挂载 |
| §3 Vx | Deep dive · project RAG | `/execution` |
| §4 Hx | Risk / assumption slide | SPBP · scenarios |
| §5 承诺 | Accountability | Gate · assertion |
| §6 Doctrine | Values audit | 无分数 — 清单式 ✅ |
| §7 下月重点 | Forward look | 滚动至下月 §2 |
| §8 Mintzberg | Strategic pattern appendix | StrategyPattern · diff #15–18 |

### 3.3 Phase B 优先项（1–2 周）

1. **Panorama 董事会结构** — §0 SCR · FP&A 行 · Top3 预警 · 签章 · appendix 页（fpaLines/capStackLines）
2. **Command 12 列网格** — UI_VI §4.3 待办
3. **Reports 章节预览** — 解析结果结构化展示，非仅 Agent trace
4. **KpiTile + annotation** — 「so what」一行
5. **Print token 化** — 消除 PanoramaPrintLayout inline hex

### 3.4 Phase C 优先项（4–8 周）

1. **Decisions & Asks** 统一面板（战略会 §决议 数字化）
2. **Rehearsal present mode** — 议程步进 + command 区块 spotlight
3. **五角色 nav 过滤** — CEO 见 L0-only 默认
4. **Board pack PDF 多页** — L0 + appendix 自动组装

---

## 四、线框级建议 — `/reports` 与 `/print/panorama` 刷新

### 4.1 `/reports` 报告中心（刷新）

```
┌─────────────────────────────────────────────────────────────────┐
│ 报告中心                                    [上传] [模板下载]     │
│ MON-RPT · QTR-REV · Sheet → 结构化解析 → 战略脉冲                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ 行业基准 ─────────────────────────────────────────────────┐ │
│ │ 董事会 pack 结构 · SCR 摘要 · RAG scoreboard → 见文档 ↗      │ │
│ └──────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ FILTER: [全部] [MON-RPT] [QTR-REV] [待解析] [本季]               │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ rpt-sheet1-may · SHEET_IMPORT · 2026-05 ─── PARSED ────────┐ │
│ │ § 摘要 (SCR)                                                 │ │
│ │   S: 5月财务导入 · C: runway 2.1m · R: 触发悲观 SPBP + assertion│ │
│ │ §2 关键 KPI (3) · §8 模式 (1) · 触发: runway · Gate           │ │
│ │ [展开七章] [Agent trace] [→ /finance] [→ /versions]          │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌─ MON-RPT-SALES-2026-05 · 待确认 ────────────────────────────┐ │
│ │ §1 5月签约低于 KR…  §2: 1 red  §8: emergent×1               │ │
│ │ [Agent 解析]                                                 │ │
│ └──────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ 11-Agent 编排 (折叠) · Q3 彩排 → · Gate 风险 →                   │
└─────────────────────────────────────────────────────────────────┘
```

**关键改动：**

- 顶部 **行业基准** 链至本文档（stub）。
- 每报告 = **SCR 摘要卡** + 章节折叠（§1–§8 与 REPORT_FORMATS 同编号）。
- Agent trace **降为折叠**，非主视觉。
- 解析触发 **直达** finance/versions/gates。

### 4.2 `/print/panorama` 董事会一页纸（刷新）

**目标：** UI_VI §7 L0 — 30 秒读懂 · A3 横版 · 可扩展 PDF 多页。

```
┌──────────────────────────────────────────────────────────────────────────── A3 LANDSCAPE ───
│ [Logo] StratOS · 战略推演全景 · 2026-Q2 · WORKING                    Rheem China (placeholder)
├────────────────────────────────────────────────────────────────────────────────────────────
│ §0 EXEC (SCR · gold border)                                                                │
│   建议: 聚焦 V4 上市 + 华东渠道防御 · 为何现在: runway 2.1m + 竞品降价 · 需决策: CAPEX 追加 │
├────────────────────────────────────────────────────────────────────────────────────────────
│ 核心挑战 (Rumelt)          │  Crux                                                         │
│  ≤80字 challenge           │  one-line crux                                                │
├────────────────────────────┴──────────────────────────────────────────────────────────────
│ SCOREBOARD (4+4 grid)                                                                      │
│ ┌─────────┬─────────┬─────────┬─────────┐  ┌─────────┬─────────┬─────────┬─────────┐      │
│ │稳健性 72│Runway 2.1│ROS 8.2%│EBITDA  │  │营收 F   │CAPEX B  │BSC 四灯 │Assertion│      │
│ │         │月 ●RED  │ ●AMBER │ 12.1% ● │  │ 万      │ 万      │ F/C/P/L │ 条      │      │
│ └─────────┴─────────┴─────────┴─────────┘  └─────────┴─────────┴─────────┴─────────┘      │
├────────────────────────────────────────────────────────────────────────────────────────────
│ B-A-F 一行 (mini bar) · 四品牌 P&L 摘要 (可选 Phase B)                                      │
├───────────────────────────────┬────────────────────────────────────────────────────────────
│ Top3 StratDiff                │ Top3 预警 (≤3 · calm)                                      │
│ · [critical] …                │ · runway · …                                               │
├───────────────────────────────┴────────────────────────────────────────────────────────────
│ 一分钟看懂 (compact diagram · 可选缩小或移 appendix)                                        │
├────────────────────────────────────────────────────────────────────────────────────────────
│ FOOTER: 战略是抉择 · Decide with clarity · 签章: ________ · 日期 ________ · QR → /command   │
└────────────────────────────────────────────────────────────────────────────────────────────

── PAGE 2 (PDF appendix · print 可选) ──
│ FPA 明细 (fpaLines) · CapStack (capStackLines) · 口径说明 · StratDiff #4–5 完整列表        │
└────────────────────────────────────────────────────────────────────────────────────────────
```

**与现版 diff：**

| 现版 | 刷新 |
|------|------|
| 4 KPI：稳健/runway/营收/CAPEX | + ROS/EBITDA · BSC 四灯可视化 · assertion  prominence |
| 无 SCR/decision | §0 exec strip |
| 无 Top3 预警区 | 独立列 · ≤3 条 |
| 无 B-A-F | 一行 mini bar |
| 无签章 | footer 签章区 |
| fpaLines/capStackLines 未显示 | PDF page 2 appendix |
| inline hex | CSS `data-theme="print"` tokens |

---

## 五、反模式（避免）

### 5.1 Consultant / Board pack 反模式

| 反模式 | 为何有害 | StratOS 对策 |
|--------|----------|--------------|
| **Chartjunk** — 3D pie、装饰渐变、过多色 | 稀释 signal；board 扫描失败 | UI_VI：flat · mono numbers · 数字>图 |
| **Topic titles** — 「财务分析」「市场概况」 | 无法 elevator test | action title / SCR 句 |
| **Data dump** — 主 deck 塞满表格 | 10 秒看不懂 | appendix + drill-down |
| **Missing so what** — 只有数字无注释 | 引发「所以呢？」会议 | KpiTile annotation 强制 |
| **Inconsistent RAG** — 每季改阈值 | 失去趋势信任 | 阈值 config + 文档化 |
| **Contents page as slide 1** | 浪费 exec 注意力 | panorama §0 = 论证非目录 |
| **Two messages per slide** | 违反 MBB one-message | 拆组件/card |
| **Unsourced metrics** | 审计/信任风险 | source + freshness badge |

### 5.2 StratOS 特有反模式

| 反模式 | 说明 |
|--------|------|
| **博彩/下注语气** | 「胜算 XX%」「三栈下注」— 已禁用；勿回流 |
| **Doctrine 分数仪表盘** | 方法论要求清单式审计，非 gamification |
| **预警堆叠** | 指挥舱 >3 预警 — 违反 Calm Design |
| **Agent trace 主视觉** | 报告中心应服务 **阅读与决策**，非调试管道 |
| **Panorama = 架构海报** | 一分钟图应 **缩小或 appendix**；L0 留给 scoreboard + SCR |
| **红灯 panic 动效** | 禁止全屏闪；assertion 用 steady 硬阻断条 |
| **PDF 与 screen 双源** | panorama view-model 已共享 — 保持 single source |
| **MON-RPT 合并单元格** | 破坏解析 — REPORT_FORMATS 已禁止 |

### 5.3 语气与品牌

- **用「抉择 / 配置 / 战略项」**，不用「押注 / 赌注 / 博彩隐喻」。
- **用「资源投向 / trade-off」**，不用「all-in / double down」赌博修辞。
- ExCom 文案遵循 **bold-bullet + 具体数字**，避免形容词堆砌（「显著改善」→「签约 +12% QoQ」）。

---

## 附录 A · 参考来源（调研 2026-06）

| 主题 | 参考 |
|------|------|
| Pyramid / SCQA | Barbara Minto · ModelThinkers · Winning Presentations |
| SCR / Exec summary | Deckary · Management Consulted |
| Consulting slide standards | Deckary · Poesius (MBB visual languages) |
| Board pack structure | Lucid.now · ScaleWithCFO · PepperEffect SaaS 14-slide |
| RAG dashboards | Board reporting guides · KPI threshold best practice |
| Digital cockpit | StrategyWorks · PIOL StrategyOS · Workiva governance |
| BLUF / ExCom briefing | PM Resource Hub Executive Briefing Pack |

---

## 附录 B · 文档维护

- 刷新 panorama/reports UI 前更新 **§三 对照表** 状态列。
- 新 MON-RPT 字段 → 同步 **§2.5** 与 REPORT_FORMATS。
- Phase B 验收：§4.2 scoreboard 含 ROS/EBITDA · §0 SCR 可见。

*Maintainers: 与 [UI_VI_EVOLUTION.md](./UI_VI_EVOLUTION.md) Phase B/C 同步更新。*
