# StratRobust 五维分 · 诊断与重构设计

> 触发问题："这种打分无参考、无对比，意义何在？"
> 本文基于代码实况（`lib/data/entity-getters.ts` `getRobustScore`、`lib/stratos/robust-score.ts`、`components/health/RobustBars.tsx`、`lib/health/twelve-dimensions.ts`）给出诊断与重构方案。**尚未改动任何代码，供审阅后决策。**

---

## 一、现状：分从哪来

`getRobustScore()` 三条路径（`lib/data/entity-getters.ts:241`）：

| 路径 | 来源 | 问题 |
|---|---|---|
| ① 有 `TwelveDimScore` 行 | 12 个**人工录入**维度分两两平均映射到 6 维（如 direction=avg(d1,d4)） | 人工分无证据链；d3 同时喂给 execution 与 learning（重复计入） |
| ② 仅有 Ops 数据 | 由**单个** composite 加减常数伪造 6 维（`entity-getters.ts:291`） | 五维差异是假的——一个数戴五顶帽子 |
| ③ 兜底 | `demo.robustScore` 写死（77/82/72…） | 纯装饰 |

渲染端 `RobustBars.tsx:31` 只吐一个裸数字 `{value}` + 一个加权总分。

---

## 二、四个病根

1. **无参照**：77 相对什么？无目标线、无阈值带。（隔壁 BSC 有四灯，这里没有）
2. **无对比**：只算 `getActivePeriod()` 单期一个点——无上期、无趋势、无基准。
3. **伪造差异**：路径②的 `composite±常数` 让五维看起来独立、其实同源。
4. **信息反被丢弃**（关键）：12 维上游**本就带 `signal` 红黄绿**（`twelve-dimensions.ts:12`），平均成 6 维时**红黄绿被丢掉了**——参照不是缺失，是被算法扔掉的。

> 这直接违反系统自己写下的原则（`lib/learn/concepts.ts:228`）：
> **"这盏红灯，除了'是红的'，我们打算做什么？"** —— 当前的 StratRobust 连"是不是红的"都没告诉用户。

---

## 三、设计目标

让每一维从"裸分"变成**可判读、可对比、可追问**的决策输入：

- **判读**：分数旁给目标线 + 阈值红黄绿带（复用上游已有 signal）。
- **对比**：给上一期 Δ（↑/↓多少）+ 迷你趋势（多期）。
- **追问**：点开每维 → 它由哪些**可核查条目**支撑（哪几个 12 维子项、各自 signal、谁负责）。
- **诚实**：数据不足/维度不可分时明说，不用假差异填版面。

目标形态：`R3 执行 72 · 目标 75 · 上版 68 ↑4 · 黄 ▸ 由 d3/d9/d11 支撑（d9 流程准时率 红）`

---

## 四、数据结构改造

现有 `RobustnessDimensions = Record<6维, number>`（只有值）。改为携带参照的视图模型（**不改底层存储，只在 getter 出口聚合**）：

```
interface RobustDimView {
  key: RobustKey;              // direction…
  label: string;              // R3 执行
  weight: number;             // 0.22
  value: number;              // 72（当期）
  target: number;             // 目标线（见 §五）
  prior: number | null;       // 上一期同维
  delta: number | null;       // value - prior
  signal: "green"|"yellow"|"red";  // 由阈值带判定
  basis: {                    // 下钻:支撑的 12 维子项
    dimId: string; name: string; score: number; signal: string;
  }[];
  grounded: boolean;          // false=数据不足/伪造路径,前端标注
}
```

`getRobustScore()` 返回 `{ dims: RobustDimView[]; overall; overallPrior; grounded }`。

---

## 五、参照从哪来（都是真实可得的，非新造假数）

| 参照项 | 数据来源 | 可行性 |
|---|---|---|
| 上一期对比 | `TwelveDimScore.period` 已分期存储，查上一 period 即可 | ✅ 现成 |
| 红黄绿阈值带 | 12 维上游已有 `signal`；6 维阈值可沿用同一带（如 <60 红 / 60–75 黄 / ≥75 绿），存 `SystemSetting` 可配 | ✅ 低成本 |
| 下钻支撑项 | 映射关系已存在（`entity-getters.ts:250` 的 avg 分组），把"平均掉的明细"保留即可 | ✅ 零新查询 |
| 目标线 | 需 CEO/战略部设定，存 `TwelveDimScore` 或新 `RobustTarget`；缺省可用"上期+改进步长"占位并标注 | 🟡 需一次配置 |

---

## 六、三个选项 · 推荐组合

- **选项 1 · 加参照+对比**（最小可用）：实现 §四 的 value/target/prior/delta/signal + 迷你趋势。改动集中在 `getRobustScore` 出口 + `RobustBars`。**回报最高。**
- **选项 2 · 修掉假差异**（诚实底线）：路径②不再 `composite±常数`；`grounded=false` 时前端标"仅综合信号·维度不可分"或"数据不足"。**改动极小，应无条件先做。**
- **选项 3 · 清单化下钻**（哲学最纯）：`basis[]` 展开为可核查清单，分数降级为清单汇总徽章，对齐证据接地 L1–L6。**工作量最大。**

**推荐**：先 **2**（诚实底线，半天）→ 再 **1**（参照+对比，1–2 天）→ **3** 视需要（下钻是加分项，可增量）。

---

## 七、落地顺序与风险

1. **P0** 选项 2：堵住伪造差异 + `grounded` 标注。低风险、纯诚实修正。
2. **P1** 选项 1：`RobustDimView` + 上期 Δ + 阈值带 + 目标线配置。中等改动，`computeRobustOverall`/`panorama/view-model`/`RobustBars` 均需跟随（有测试，需同步更新）。
3. **P2** 选项 3：下钻清单（点开每维看 12 维支撑）。增量。

**风险点**：`RobustBars` 被指挥舱、`/health`、`/outlook`、A3 全景（`PanoramaPrintLayout`）多处复用——改返回结构需一并更新调用点与 `panorama/test-fixtures.ts`。

## 八、不做什么

- 不新造"看起来精确其实拍脑袋"的目标线——目标缺失就明确标注"未设定"，而非编一个。
- 不保留任何维度间的假差异。

> 请审阅。确认后建议从 **P0（选项 2）** 起，逐步推进；目标线配置（§五）需要你或战略部给一次输入。
