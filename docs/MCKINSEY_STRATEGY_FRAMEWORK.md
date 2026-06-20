# McKinsey 战略制定与复盘 · StratOS 映射

**版本：** v1.0 · 2026-06-14  
**关联：** [REPORT_FORMATS.md](./REPORT_FORMATS.md) · [UI_VI_EVOLUTION.md](./UI_VI_EVOLUTION.md) §十 · [STRATEGY_REVIEW_UI_BENCHMARK.md](./STRATEGY_REVIEW_UI_BENCHMARK.md)

---

## 一、McKinsey 思路摘要

| 环节 | McKinsey 做法 | StratOS 落点 |
|------|---------------|-------------|
| **制定** | 议题树（MECE）→ 假设 → 资源组合 | `/strategy` 三栈 · `buildIssueTree()` |
| **预读** | 结构化材料 · SCR 答案先行 | `/reports` 粘贴 · §S/C/R 叙事头 |
| **讨论** | Operating scoreboard · Top 风险 | `/command` SCR → KPI → 预警 → 启示 |
| **决策** | Decision log · owner · deadline | `DecisionsPanel` · `/versions` 快照 |
| **复盘** | 假设 vs 现实 · StratDiff | `/versions` · `topDiffs()` · 稳健性 |
| **跟进** | 一页纸 · 董事会 pack | `/print/panorama` Light 主题 |

**制定 vs 复盘：** 制定在 `/strategy` 与 seed 设定 Crux、三栈投向；复盘在月报管道 + 版本 diff 检验「我们赌对了什么」。

---

## 二、SCR 叙事（Situation–Complication–Resolution）

McKinsey 高管材料通常 **Resolution 占 60–70% 篇幅** — 先给结论，再展开证据。

| 块 | 含义 | 系统来源 |
|----|------|----------|
| **S · 背景** | 稳定事实与 scope | `StrategicDiagnosis.challengeStatement` 或报告 §S |
| **C · 症结** | 变化/风险/缺口 | Runway · HealthAssertion · Top StratDiff |
| **R · 建议** | 结论与资源方向 | Crux + CapStack / FPA 指向 |

**代码：** `lib/panorama/scr.ts` → `buildScrSummary()` · UI：`ExecutiveSummary`

---

## 三、MECE 议题树

互斥穷尽分解 — 避免「议题重叠、遗漏跑道/执行/战略」。

StratOS 默认三枝：

1. **财务与 runway** — FPA · ROS/EBITDA 偏差  
2. **执行与版本变化** — StratDiff Top N  
3. **战略焦点** — Crux · 三层面 H1/H2/H3  

**代码：** `buildIssueTree()` · 打印页 `PanoramaPrintLayout` §MECE 区块

---

## 四、So what · 启示

每条 chart / 段落应回答：**对决策意味着什么？**

- 报告录入：`§So what` 或 `§Implications`（见 REPORT_FORMATS §11）  
- 指挥舱自动生成：`buildImplications()` — Runway、ROS 缺口、StratDiff  
- UI：`ImplicationsBar`

---

## 五、决策记录（Decision Log）

| 字段 | 说明 |
|------|------|
| title | 待决事项 |
| owner | 责任人（CEO/CFO/VP） |
| deadline | 截止 |
| status | open · pending · closed |

**报告格式：** `§Decisions` 或 `- [ ] 决策项 · owner · deadline`  
**UI：** `DecisionsPanel` · 指挥舱 L3 · 打印页底部

---

## 六、战略会节奏（Cadence）

```
预读          讨论           决策            跟进
/reports  →  /command   →  /versions   →  /print/panorama
月报入库       SCR+KPI        快照冻结         董事会一页纸
```

**代码：** `lib/brand/apple-mckinsey.ts` → `mckinseyCadence`

---

## 七、报告导入（McKinsey 头 + MON-RPT）

MON-RPT §1–§8 **不变**。可选在正文**前**加 McKinsey 叙事头：

```markdown
§S 背景：Q2 营收按 B 轨，热泵 Crux 进入验证期
§C 症结：Runway 2.8 月 · V4 样机延误
§R 建议：冻结 H3 CAPEX · 倾斜 GtmStack 华东

§MECE 关键议题
- FPA runway 与 ROS 缺口
- V4 执行与研发资源

§So what 启示
- Runway < 3 → SPBP 向悲观倾斜

§Decisions 待决
- [ ] 批准 H2/H3 CAPEX 冻结 · CFO · 本季末
```

**解析：** `lib/stratos/report-agent.ts` → `parseMcKinseySections()`  
**UI：** `/reports` → 「插入 McKinsey 头」· 解析后预览 §S/C/R

---

## 八、Apple 设计 × McKinsey 密度

不复制 Apple 品牌 — 借用 HIG 原则承载 MBB 信息密度：

| Apple | StratOS |
|-------|---------|
| Clarity | 指挥舱单主 CTA「董事会一页纸」 |
| Deference | `surface-glass` · 内容优先于 chrome |
| Depth | `surface-elevated` · 分层阴影 |
| Restraint | 每屏 gold accent ≤1 |
| Progressive disclosure | L0–L3 首屏 · BSC/SPBP 折叠在 `<details>` |

详见 [UI_VI_EVOLUTION.md](./UI_VI_EVOLUTION.md) §十。

---

## 九、Red Team · 预演（延伸）

| McKinsey 习惯 | StratOS |
|---------------|---------|
| Pre-mortem | `/rehearsal` Q3 彩排 |
| Red team | `/gates` Gate 清单 |
| 反事实 | `/versions` Counterfactual |

---

## 十、验证清单

- [ ] `/command` 首屏：SCR → FPA 四卡 → 预警 → 启示 → 待决  
- [ ] `/reports` 粘贴含 §S/C/R → 解析预览 McKinsey 章节  
- [ ] `/print/panorama` 含 SCR · 启示 · MECE · Decisions  
- [ ] `npm test` 含 `parseMcKinseySections` 用例
