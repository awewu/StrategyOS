# StratOS · UI Architecture (统一分类学 + 主脊图)

**版本：** v1.0 · 2026-08-01 · Track A · A0
**定位：** 本文是 StratOS 前端**架构 / 分类学**的单一事实源 —— 组件分几层、依赖往哪个方向流、什么代码归到哪一层。
**分工：**

- 视觉识别（色值、Logo、打印主题）→ [BRAND_VI.md](./BRAND_VI.md)（VI 源）
- 交互气质与方法论映射 → [UI_VI.md](./UI_VI.md)（注：其色板章节为旧 dark-first 版本，已被 `app/globals.css` 的 Ruud light 主题取代；以本文与 globals.css 为准）
- 组件层级与依赖规则 → **本文**

---

## 一、主脊（The Spine）—— 单向依赖骨架

一切样式与组件沿同一条脊自上而下流动，**依赖永不反向**：

```
  ┌─────────────────────────────────────────────────────────────┐
  │  Tier 0 · Design Tokens        app/globals.css  L0 :root      │  ← 唯一色/距/动/圆角源
  │        └ L1 @theme inline      映射 token 给 Tailwind utility │
  ├─────────────────────────────────────────────────────────────┤
  │  Tier 1 · Primitives           components/ui/primitives/*     │  ← token-bound · 零依赖 · 无领域知识
  │        Button Card Badge Input Select Tabs Tooltip           │
  ├─────────────────────────────────────────────────────────────┤
  │  Tier 2 · UI Composites        components/ui/*                │  ← 组合原语 + 布局 · 仍领域无关
  │        Modal PageHeader KpiTile EmptyState Skeleton …        │
  ├─────────────────────────────────────────────────────────────┤
  │  Tier 3 · Domain Components     components/<domain>/*         │  ← 懂产品对象(战略/OKR/财务/Gems)
  │        gems/ compass/ finance/ strategy/ execution/ board/…  │
  ├─────────────────────────────────────────────────────────────┤
  │  Tier 4 · Pages & Shell         app/**  +  app-shell/app-rail │  ← 取数(server) + 装配 · 路由
  └─────────────────────────────────────────────────────────────┘

  规则: 上层可依赖下层, 下层永不依赖上层。
        · Primitives 永不 import 领域组件, 永不硬编码色值。
        · 领域组件永不硬编码色值 —— 只用 token / 原语。
        · 新 token 只进 Tier 0 (L0)。
```

CSS 侧的层级镜像已写在 `app/globals.css` 头部目录（L0 Tokens → L1 Theme bridge → L2 Shell → L3 Primitives → L4 Pages → L5 Print）；组件侧的 Tier 0–4 与之一一对应。

---

## 二、分类学（Taxonomy）—— 一个组件归哪一层？

判定顺序（自上而下命中即止）：

1. **它定义颜色/间距/动效常量吗？** → Tier 0（写进 `globals.css` L0，不是组件）。
2. **它是最小可复用控件、无任何领域词汇、可被任意页面使用吗？** → **Tier 1 Primitive**。
3. **它组合原语 + 布局，但仍不认识"战略/OKR/报价"这类业务对象吗？** → **Tier 2 Composite**。
4. **它的 props/文案里出现产品对象（bet、premise、KR、runway、commitment…）吗？** → **Tier 3 Domain**。
5. **它是路由页 / 外壳 / 取数装配点吗？** → **Tier 4 Page/Shell**。

### 现状清单（inventory）

| Tier | 位置 | 成员（现状） |
|---|---|---|
| **0 Tokens** | `app/globals.css` L0 · `lib/ui/cn.ts` | surfaces · motion · accent · signals · BSC · three-stack · radius · `cn()` joiner |
| **1 Primitives** | `components/ui/primitives/` | `Button` `Card`(+Header/Title/Description/Body/Footer) `Badge` · `Input` `Select` `Tabs` `Tooltip` |
| **2 Composites** | `components/ui/` | `Modal` `PageHeader` `KpiTile` `EmptyState` `Skeleton` `StratosTabNav` `ConceptGuide` `TrafficLight` `CynefinBadge` `HardBlockBar` `ImplicationsBar` `DecisionsPanel` `RowsEditor` `ExecutiveSummary` |
| **3 Domain** | `components/<domain>/` | `gems/` `compass/` `finance/` `strategy/` `execution/` `cockpit/` `board/` `reports/` `convergence/` `boss-ai/` `calendar/` … |
| **4 Pages/Shell** | `app/**` · `components/app-shell.tsx` · `app-rail.tsx` | 路由页（server 取数）+ 外壳/导航栏/角色轨 |

> 注：Tier 2 中若某些成员（如 `TrafficLight`/`HardBlockBar`）已带轻领域语义，属"半领域"过渡件——长期应把纯视觉部分下沉为原语、领域部分上移到 Tier 3。

---

## 三、编写规约（Conventions）

### Tier 1 Primitives —— 最严格

- **零外部 UI 依赖**：不用 clsx / tailwind-merge / radix；className 拼接一律 `cn()`（`lib/ui/cn.ts`）。
- **只用 token**：颜色/圆角/动效全部 `var(--…)`；本层不得出现十六进制色值（图表数据色除外，且也应来自 L0 chart token）。
- **`"use client"` 仅当交互**：`Button/Input/Select/Tabs/Tooltip` 是 client；`Badge/Card` 是纯展示，非 client。
- **表单控件 `forwardRef`**：`Button/Input/Select` 转发 ref；受控组件（`Tabs`）走 `value` + `onValueChange`。
- **`className` 永远最后拼**：调用方可覆盖。
- **红=风险**：`--signal-red` / `danger` / `red` tone 仅用于风险，不做装饰。
- **从桶文件导入**：`import { Button, Input, Tabs } from "@/components/ui/primitives"`。

### Tabs 的两条线（勿混用）

- **路由态**（切 URL / server tab）→ `StratosTabNav`（Tier 2，`<Link>`）。
- **页内受控态**（本地 state）→ `Tabs` 原语（Tier 1，`underline` / `segment` 两变体）。

### Tier 3 Domain

- 不硬编码色值——用 token 或原语的语义 tone。
- 数据取用走 server component / API；client 组件用 `fetch(url,{credentials:'include',cache:'no-store'})`。
- 领域组件可依赖 Tier 1/2，禁止反向被原语依赖。

---

## 四、迁移台账（Migration Ledger）

| 批次 | 内容 | 状态 |
|---|---|---|
| **B0** | 地基：`cn` + `Button`/`Card`/`Badge` 原语 | ✅ done |
| **B1** | 交互原语：`Input`/`Select`/`Tabs`/`Tooltip` | ✅ done |
| **B1.1** | `Textarea` 原语（多行输入，同 Input 的 token/invalid/`fullWidth` 处理） | ✅ done |
| **B3** | 样板迁移：`compass/RationalityReviewPanel` 换用原语 | ✅ done |
| **Gems** | 全角色审计洞察 `components/gems/*` 全量消费原语（Badge/Card/Button） | ✅ done |
| **A0** | 本文：统一分类学 + 主脊图 | ✅ done |
| **B2** | 存量页面原生 `<input><select><textarea>` → 原语的滚动迁移 | ⏳ 持续 |

**B2 已完成文件（全部 tsc 绿）：**

- **清爽层（`stratos-input` 全类）**：`reports/ReportsArchive` · `reports/MonthlyPulseForm` · `finance/OutlookEditor` · `finance/BudgetVersionsPanel` · `finance/MaPipelineEditor` · `finance/SpbpScenarioEditor` · `finance/CapitalConfigEditor` · `finance/LedgerPanels` · `culture/CultureHandbookEditor` · `compass/NorthStarEditModal` · `rehearsal/RehearsalWalkthrough` · `compiler/StrategicImportPanel`(textarea) · `decode/DecodeWorkspace` = 13 文件。`stratos-input` 仅余 `StrategicImportPanel` 的 `<input type=file>`（有意保留）。
- **密集编辑层（本地 `inp`/`inputCls` 常量或内联类）**：`innovation/BetEditor`(26) · `mandate/MandatesClient`(28) · `ma/DealEditor`(33) · `market/MarketConfigPanel`(31) · `strategy/GrowthAssetsEditor`(14) · `market/CellDetailPanel`(13) · `culture/CultureTabs`(12) · `execution/MarketResponsePanel`(11) = 8 文件。

> B2 副产物：`Input`/`Select`/`Textarea` 新增 `fullWidth`（默认自然宽），`Select` 新增 `wrapperClassName`（密集网格固定宽如 `w-16/w-20`）；条件告警边框用 `!border-[...]`（important）保证覆盖基础边框。

### 下一步（建议顺序）

1. 续迁剩余密集编辑器（控件数）：`compass/CompassClient`(13) · `market/TensionMap`(9) · `execution/ExecutionMaturity`(8) · `okr/OkrEditor`(8) · `bsc/BscEditor`(7) 等 ~30 个 5–13 控件的文件；巨型 `StrategyInputClient`(88 控件 / 3408 行) 留最后。做法：每文件移除本地 `inp`/`inputCls` 常量→原语，`w-XX` 迷你格用 `Select wrapperClassName` / `Input className`，条件边框用 `!border`，每文件 tsc 绿后合；`StrategyInputClient` 建议配浏览器预览分段做视觉回归。
   注：`<input type="file">`、`type="range"`、`type="checkbox"` 暂无对应原语，保持原生。
2. 把 Tier 2 "半领域"件（`TrafficLight`/`HardBlockBar`/`ImplicationsBar`）拆分：视觉→原语，语义→领域。
3. `UI_VI.md` 色板章节标注为历史版本或重写，指向 `globals.css` L0 + 本文，避免双源。

---

## 五、验收基线

- `npx tsc --noEmit` → 0 error（每次原语/迁移改动后必跑）。
- 新增/迁移件不得引入 Tier 1 → 上层的反向依赖。
- 新颜色一律先落 `globals.css` L0，再被引用。
