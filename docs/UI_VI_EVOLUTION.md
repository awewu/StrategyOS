# StratOS · UI/VI 进化计划

**版本：** v0.1 · 2026-06-14  
**状态：** 路线图 · Phase A+B 已落地 · Phase C 待启动  
**关联：** [BRAND_VI.md](./BRAND_VI.md) · [UI_VI.md](./UI_VI.md) · [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md) · [STRATEGY_REVIEW_UI_BENCHMARK.md](./STRATEGY_REVIEW_UI_BENCHMARK.md)

---

## 执行摘要

| # | 要点 |
|---|------|
| 1 | **品牌语气已从「下注/博彩」转向「抉择/资源配置」** — `brand.tagline`、三栈 UI 文案、A3 一页纸已对齐；域模型 `ProductBet`/`GtmBet` 保留，UI 层统一称「战略项/资源配置」。 |
| 2 | **VI 骨架（暗色指挥舱 + 琥珀金 + 语义红绿灯）仍然正确**，无需换色；进化重点是 **信息层级、FP&A 视觉权重、导航 IA、打印董事会主题**。 |
| 3 | **Phase B 已落地**：12 列指挥舱 · Print/Light 预览 · chart/FP&A token · PPT palette · PageHeader/KpiTile 统一。 |
| 4 | **Phase A（1–2 天）** 已完成：标语面、导航分层、指挥舱 hero、三栈标题、FPA hero、token 注释。 |
| 5 | **Phase C** 待启动：彩排动效、五角色 nav E2E、移动端 rehearsal、chart visual regression。 |

---

## 一、现状评估 vs 新定位

### 1.1 新定位（2026-06）

| 维度 | 目标 |
|------|------|
| **标语** | 战略是抉择 · *Decide with clarity.* |
| **受众** | Rheem 量级 · ~300 人公司 · **~30 人核心管理层** 深度使用 |
| **产品形态** | 高管战略沙盘 — 年中/年底两次战略会，非 OKR/绩效工具 |
| **FP&A** | **管理报表优先** — ROS、EBITDA、利润桥、财务三张表 |
| **三栈** | **资源配置**（资本/产品/渠道）— 非博彩隐喻 |

### 1.2 已对齐项 ✅

| 区域 | 状态 |
|------|------|
| `lib/brand/tokens.ts` | tagline 抉择 / Decide with clarity |
| `docs/BRAND_VI.md` · `docs/UI_VI.md` | 标语、禁用博彩 copy |
| `ThreeStackPanel` | UI 标签：资本投向 / 产品战略项 / 市场战略项 |
| `lib/panorama/view-model.ts` | ONE_MINUTE_DIAGRAM 已用「三栈资源配置」 |
| `/finance` | 管理报表 Tab 默认 · ROS/EBITDA 四卡 |
| `/print/panorama` | Light 主题 · A3 landscape · 标语 footer |
| `/brand` | Brand Gallery · 双语标语 |

### 1.3 缺口项 ⚠️

| 缺口 | 严重度 | 说明 |
|------|--------|------|
| **指挥舱布局** | 高 | 缺战略时间轴、Top3 预警独立区、12 列网格；稳健性/BSC/ diff 混排 |
| **导航 IA** | 中 | 曾 10 项平铺；与 UI_VI 7 项主 nav + 工具项不符 |
| **标语触达** | 中 | 登录/指挥舱/Nav 曾只显示半句标语 |
| **硬编码色值** | 中 | 大量 `#d4a574` / `#64748b` 未走 CSS var |
| **typography scale** | 中 | 规范 32:20:12，实现多为 `text-2xl` / `text-sm` 混用 |
| **Print 组件** | 中 | Panorama 用 inline hex，未复用 `data-theme="print"` token |
| **遗留文档** | 低 | ~~`ONE_PAGE_PANORAMA.md` · `EVOLUTION_PLAN.md`~~ 已同步（2026-06-14） |
| **域模型命名** | 低 | `ProductBet`/`GtmBet` 内部保留；UI 已脱敏，Phase B 可加 display label map |
| **Light mode 应用** | 低 | 仅 print 主题，无董事会预览 dark↔light 切换 |
| **角色密度** | 低 | 五角色 IA 文档化，实现仅 RoleSwitcher demo |
| **图表语言** | 中 | B-A-F、利润桥、雷达无统一 chart token |

### 1.4 语气对照（抉择 vs 博彩）

| 禁用（UI copy） | 推荐 |
|-----------------|------|
| 下注、押注、赌注、胜算 XX% | 抉择、配置、投向、战略项 |
| 三栈下注 | 三栈资源配置 |
| ProductBet（用户可见） | 产品战略项 |
| GtmBet（用户可见） | 市场战略项 |

> **注：** 代码/数据库类型名 `ProductBet` 可保留；用户可见字符串走 `lib/brand/display-labels.ts`（Phase B）。

---

## 二、分阶段路线图

| 阶段 | 周期 | 目标 | 关键交付 |
|------|------|------|----------|
| **A · Quick wins** | 1–2 天 | 语气 + IA + 标语 + FP&A 视觉强调 | ✅ 部分完成（见 §五） |
| **B · 组件系统** | 1–2 周 | 可审计的设计系统 + 董事会打印 | Typography · Shell · Print theme · Chart primitives |
| **C · 战略体验** | 4–8 周 | 彩排/角色/数据 viz 语言 | Motion · Rehearsal tablet · Role density |

---

## 三、Phase A — Quick wins（1–2 天）

### 3.1 Copy & 标语触达

- [x] Nav：双语标语 `{taglineZh} · {taglineEn}`（sm+ 屏）
- [x] 指挥舱 hero：标语在上、定位语 `定焦点 · 定配置 · 留历史`
- [x] 登录页：标语 + 30 人核心层
- [x] `lib/constants.ts` PRODUCT 与 brand tokens 对齐
- [x] `/brand` hero 增加 `positioningZh`
- [x] 同步 `ONE_PAGE_PANORAMA.md` / `EVOLUTION_PLAN.md` 措辞（doc-only）

### 3.2 导航 IA

**目标结构（已实现分层）：**

```
[主 nav · text-sm]  指挥舱 | 看战略 | 看执行 | 看健康 | FPA 财务 | 版本库 | 报告中心
        |  [次 nav · text-xs]  解码 | 彩排 | Gate
```

- [x] 主/次 nav 视觉权重分离
- [x] 「StratDecode」→「解码」，「Q3彩排」→「彩排」
- [ ] ⌘K palette 分组与 nav 一致
- [ ] CEO 角色默认隐藏次 nav 或折叠为「更多」

### 3.3 Token & 注释

- [x] `tokens.ts` positioning 字段 + 抉择注释
- [x] `globals.css` v1.1 注释（FP&A gold 语义）
- [ ] 导出 `typography` / `spacing` scale 到 tokens.ts

### 3.4 模块视觉强调

- [x] `/strategy` 三栈区标题「三栈资源配置」
- [x] `/finance` 金色 H1 +「管理报表优先」副标
- [ ] 指挥舱 B-A-F 条上移或与 ROS 摘要联动（下一迭代）

---

## 四、Phase B — 组件系统（1–2 周）

### 4.1 色彩

| 动作 | 细节 |
|------|------|
| **消除 inline hex** | 组件内 `#d4a574` → `var(--color-accent-gold)` 或 Tailwind `text-gold` |
| **FP&A 语义** | 新增 `--fpa-kpi-positive` / `--fpa-kpi-negative`（复用 signal-green/red，不新造色） |
| **Print 主题完整化** | `PanoramaPrintLayout` 全部走 `[data-theme="print"]` CSS vars |
| **董事会预览** | `/command` 增加「Light 预览」toggle → `html[data-theme="print"]` |

**不改动：** 琥珀金 `#D4A574`、深空蓝底、三栈色 — 与 Logo Snapshot 框一致。

### 4.2 字体与排版

| Token | 规范 | 实现目标 |
|-------|------|----------|
| `--text-h1` | 32px Mono | 稳健性综合分、快照名 |
| `--text-h2` | 20px Sans | 模块标题 |
| `--text-body` | 16px Sans | 诊断、说明 |
| `--text-data` | 16px Mono | KPI、B-A-F |
| `--text-caption` | 12px Muted | 趋势、时间戳 |

**字体栈：** 中文 Noto Sans SC（已有）· 数据 Geist Mono（已有）· 打印标题考虑 Geist Sans 600。

**组件：** `PageHeader` · `KpiTile` · `SectionCard` · `SignalDot`（已有 CSS）· `BafBar` refactor。

### 4.3 间距

- 统一 `space-y-8` 模块间距 = 64px 规范的一半（MVP 可接受）
- 卡片 `p-6` = 24px ✅
- 新增 `--page-gutter: 4rem` 用于 `max-w-7xl` 容器

### 4.4 图标

- 引入 Lucide 或 Phosphor **2px 线性**集
- 红绿灯已有 shape+color ✅
- BSC 四满意：统一 16px icon slot
- 三栈：Cap=↑资本 · Prod=◆产品 · Gtm=◎渠道

### 4.5 图表风格

| 图表 | 规范 |
|------|------|
| **B-A-F 堆叠条** | B=muted · A=白/ navy · F=gold 40% opacity |
| **利润桥** | 瀑布：增项 green tint · 减项 coral tint · 合计 gold |
| **Robust 五维条** | 子维红则条 track 红 20% bg |
| **Sparkline** | 1.5px mono line · 无渐变填充 |
| **雷达（版本库）** | 两版 overlay · 当前版 gold stroke · 上版 dashed muted |

**原则：** 无 3D · 无 pie chart 装饰 · 数字永远比图形大。

### 4.6 A3 打印 / Board-ready

| 项 | 动作 |
|----|------|
| 结构 | 对齐 UI_VI §7：稳健性 · 四灯 · Top3 diff · Top3 预警 · B-A-F · 签章 |
| KPI 行 | 增加 ROS / EBITDA 管理报表摘要（与 `/finance` 一致） |
| 字体 | 打印 `@media` 强制 `--text-h1: 28px`（1080p 投屏可读） |
| PDF | `lib/pdf/panorama-pdf.ts` 与 `PanoramaPrintLayout` 共享 view-model ✅ 继续扩展 |
| 资产 | 更新 `stratos-a3-panorama-light.png` 匹配新 copy |

### 4.7 导航 IA（完整版）

```
StratOS · 战略是抉择
├── 指挥舱          /command
├── 看战略          /strategy
├── 看执行          /execution
├── 看健康          /health
├── FPA 财务 ★      /finance?tab=management
├── 版本库          /versions
├── 报告中心        /reports
└── [工具] 解码 · 彩排 · Gate
```

**角色过滤（Phase B）：**

| 角色 | 可见主 nav |
|------|------------|
| CEO | 全部主 nav |
| VP | 无报告中心录入 · 无 Gate |
| PM | 看执行 + 看健康 + FPA 只读 |
| staff | 报告中心 + FPA 编辑 + 版本库 |
| observer | 看战略 + 看健康 + 指挥舱只读 |

### 4.8 Light/Dark 一致性

- Shell（Nav）保持 dark
- 内容区支持 `data-theme="print"` 预览
- shadcn/ui 暗色主题 token 映射到 StratOS vars

---

## 五、Phase C — 战略体验（4–8 周）

### 5.1 Motion

| 场景 | 动效 | 备注 |
|------|------|------|
| KPI 更新 | 0.6s 数字滚动 | 仅 FP&A 管理报表 |
| 灯色变化 | 0.3s ease | 已有规划 |
| 快照定稿 | 金边 flash 0.4s | FROZEN 仪式 |
| 彩排转场 | 0.2s fade | RehearsalPresentMode |
| **禁止** | confetti · 红灯闪烁 | 保持 Calm Design |

### 5.2 数据 viz 语言

- StratDiff：18 类图标 + 严重度色（文档化 → Storybook）
- 三栈同屏：Cap/Prod/Gtm 列头色条 4px（已有 stack colors）
- SPBP 情景：ghost 线 = dashed muted · active = gold solid

### 5.3 角色密度

- CEO：L0 only（指挥舱 + 一页纸）
- staff：L2 表格默认展开
- 实现 `useRole()` → nav filter + 首页 redirect

### 5.4 Mobile / Tablet · Rehearsal

- `/rehearsal` present mode：**1280×800 横屏优先**
- 触控：大 tap target 48px ·  swipe 步骤
- 指挥舱 mobile：四灯 2×2 grid · Top3 折叠

---

## 六、具体建议速查

| 维度 | 建议 |
|------|------|
| **色** | 保持 dark + gold；FP&A KPI 用 gold；预警用 coral；勿引入新 accent |
| **字** | 32:20:12 scale；KPI 必须 Mono；中文诊断用 Sans |
| **间距** | 8px 网格；模块 48–64px；卡片 24px padding |
| **图标** | 2px linear；BSC/Doctrine 小色块 + icon |
| **图表** | Flat · mono numbers · B-A-F 三色段 · 无装饰 chartjunk |
| **A3** | Ivory 底 · navy 字 · gold 标题 · 四灯 shape+color |
| **Nav** | 7 主 + 3 次 · FPA 带 ★ · 角色过滤 |

---

## 十、Apple × McKinsey 设计原则（2026-06-14）

**目标：** 学习 MBB 报告的信息密度与 SCR 叙事，同时引入 Apple HIG 的** clarity · deference · depth · restraint** — 不复制 Apple 品牌资产。

### 10.1 信息层级（McKinsey）

| 层级 | 内容 | StratOS 组件 |
|------|------|-------------|
| L0 | SCR 执行摘要 | `ExecutiveSummary` |
| L1 | Operating scoreboard | `KpiTile` 四卡 |
| L2 | 预警 + 启示 | `TopAlertsPanel` · `ImplicationsBar` |
| L3 | 待决事项 | `DecisionsPanel` |
| L4 | 深度展开 | `<details>` 折叠 BSC / StratDiff / SPBP |

**So what 规则：** 每个 L1/L2 区块后应有可决策含义 — 由 `buildImplications()` 自动生成或报告 §So what 录入。

### 10.2 视觉语言（Apple-inspired）

| 原则 | 实现 |
|------|------|
| **Clarity** | 每屏一个主 CTA（指挥舱 = 董事会一页纸） |
| **Deference** | `surface-glass` / `surface-elevated` 替代 heavy border |
| **Depth** | `--surface-elevated` · `--blur-glass` · inset highlight |
| **Typography** | 32:20:12 · label `tracking-[0.08em]` · headline `tracking-[-0.02em]` |
| **Restraint** | 每屏 ≤1 accent（gold）；语义色仅 RAG |
| **Progressive disclosure** | 指挥舱 `<details>` · panorama `<details>` 附录 |

### 10.3 Token 与代码

| 文件 | 用途 |
|------|------|
| `lib/brand/apple-mckinsey.ts` | 章节标签 · 粘贴模板 · surface class 名 |
| `app/globals.css` | `--surface-elevated` · `.surface-glass` |
| `lib/brand/typography.ts` | 32:20:12 scale |
| `components/ui/ExecutiveSummary.tsx` | SCR 块 |
| `components/ui/ImplicationsBar.tsx` | So what 条 |
| `components/ui/DecisionsPanel.tsx` | 决策日志 |

### 10.4 与 Phase B/C 关系

- Phase B：零 inline hex · print token 统一 · LLM mckinsey 解析
- Phase C：Rehearsal tablet 同样 SCR 首屏 · 角色过滤决策面板

---

## 十一、Phase A 实施记录（2026-06-14）

| 文件 | 变更 |
|------|------|
| `lib/brand/tokens.ts` | positioningZh · 抉择注释 |
| `app/globals.css` | v1.1 token 注释 |
| `lib/constants.ts` | PRODUCT tagline/claim 对齐 |
| `components/shell/AppNav.tsx` | 主/次 nav 分层 · 双语标语 |
| `app/(dashboard)/command/page.tsx` | Hero 刷新 |
| `components/auth/LoginForm.tsx` | 标语 |
| `components/strategy/ThreeStackPanel.tsx` | 「三栈资源配置」标题 |
| `app/(dashboard)/finance/page.tsx` | 金色 H1 · 管理报表优先 |

**未改（刻意）：** 域类型 `ProductBet` · 数据库表名 · Brand PNG 资产（Phase B 重导）

---

## 八、验收标准

### Phase A Done

- [x] 任意入口可见「战略是抉择 / Decide with clarity」
- [x] Nav 主路径 ≤7 项视觉突出
- [x] 三栈 UI 无「下注」字样
- [x] FPA 默认 Tab = 管理报表

### Phase B Done

- [x] 零 inline brand hex in `components/`（PPT 图标 → `lib/brand/ppt-palette.ts`）
- [x] `PageHeader` + `KpiTile` 用于 command / finance / health
- [x] A3 PDF 含 ROS / EBITDA 行（`PANORAMA_KPI_CARDS`）
- [x] Print preview toggle on command（`CommandBoardShell` · `data-theme="print"`）
- [x] `--page-gutter` · `--fpa-kpi-*` · 12 列指挥舱网格 · `display-labels.ts`

### Phase C Done

- [ ] 五角色 nav 过滤 E2E
- [ ] Rehearsal tablet layout 1280+
- [ ] Chart storybook / visual regression

---

## 九、一句话

> **StratOS UI/VI 进化 = 同一套琥珀指挥舱视觉，把「下注语气」换成「抉择与资源配置」，把 FP&A 管理报表抬到与 BSC 同级，把导航与打印收成董事会 30 秒可读。**

*Maintainers: 改 UI 前先更新本文 Phase 状态 · token 变更同步 `lib/brand/tokens.ts` + `globals.css`*
