# StratOS · UI / VI 设计体系

**版本：** v1.2 · 2026-06-14  
**变更：** v1.2 品牌 VI 定稿 — [BRAND_VI.md](./BRAND_VI.md) · Logo · A3 一页纸 · Light 打印主题 · `/brand` 资产库  
**关联：** [BRAND_VI.md](./BRAND_VI.md) · [方法论](./METHODOLOGY.md) · [骨架与血肉](./SKELETON_AND_FLESH.md)

---

## 一、设计定位：战略家的指挥舱

**一句话：** StratOS 的 UI 不是「管理后台」，是 **董事会/CEO 在战略会前 30 秒掌握战局** 的指挥舱。

**参照系（取气质，不抄界面）：**

| 参照 | 取什么 | 不取什么 |
|------|--------|----------|
| **Tesla Dashboard** | 信息密度高但层级清晰 | 消费级动效 |
| **Bloomberg Terminal** | 专业、数字优先、可信 | 过度复杂快捷键 |
| **Notion** | 文档与结构优雅 | 泛协作感 |
| **Linear** | Calm Design、单一下一步 | 研发工单感 |

**与方法论的关系：**

```
方法论（逻辑）  →  决定「屏上有什么信息」
UI/VI（表达）   →  决定「信息如何被一眼读懂」
骨架（对象）    →  决定「组件与数据一一对应」
```

---

## 二、VI · 视觉识别

> **完整规范：** [BRAND_VI.md](./BRAND_VI.md) · 资产 `public/brand/` · 画廊 `/brand` · 打印 `/print/panorama`

### 2.0 Logo

- **Mark：** 三栈横条 S + 琥珀 Snapshot 框 → `public/logo-mark.svg` · `public/icon.svg`  
- **标语：** 战略是抉择 · *Decide with clarity.*  
- **Brand Kit：** `public/brand/stratos-brandkit-3x3.png`（3×3 总览）

### 2.1 色彩系统（Semantic Color）

**基础色板（Dark-first · 战略会投屏友好）**

| Token | 色值 | 用途 |
|-------|------|------|
| `--color-bg-deep` | `#0F172A` 极夜黑 | 页面背景 |
| `--color-bg-surface` | `#0A1628` 深空蓝 | 卡片/面板 |
| `--color-accent-gold` | `#D4A574` 琥珀金 | 战略重点、Doctrine 强调、董事会一页纸标题 |
| `--color-text-primary` | `#F1F5F9` | 主文字 |
| `--color-text-muted` | `#64748B` Slate 灰 | 辅助、四级信息 |

**语义色（与产品对象绑定，不可挪作他用）**

| Token | 色值 | 绑定对象 |
|-------|------|----------|
| `--signal-green` | `#2E7D32` 翡翠绿 | 健康正常 · 假设已验证 · Doctrine 通过 |
| `--signal-yellow` | `#F9A825` | 关注 · 偏差 15% · 假设验证中 |
| `--signal-red` | `#E65100` 珊瑚红 | 预警 · 假设失效 · 承诺逾期 · 一票否决 |
| `--signal-neutral` | `#64748B` | 未开始 / 无数据 |

**BSC 四维度主题色（看战略 · 四卡片）**

| 维度 | 四个满意 | 主题色 | 用途 |
|------|----------|--------|------|
| 财务 Financial | 股东满意 | 琥珀金 `#D4A574` | BSC 财务卡左边框 |
| 客户 Customer | 客户满意 | 青蓝 `#38BDF8` | 客户维 |
| 流程 Process | 社会满意 | 紫灰 `#A78BFA` | 流程/ESG |
| 学习 Learning | 员工满意 | 绿 `#4ADE80` | 组织人才 |

**三支柱 Doctrine（图标/标签，非背景大面积使用）**

| 支柱 | 标签色 | 图标隐喻 |
|------|--------|----------|
| Invest to Growth | 金 `#D4A574` | 向上箭头 / 资本 |
| Innovate to Lead | 蓝 `#60A5FA` | 星芒 / 灯泡 |
| Deliver on Commitment | 绿 `#2E7D32` | 勾选 / 握手 |

### 2.2 字体

| 层级 | 字体 | 字号 | 用途 |
|------|------|------|------|
| H1 战略标题 | DIN / Roboto | 32px | 健康度综合分、快照版本名 |
| H2 模块标题 | 思源黑体 / Noto Sans SC | 20px | BSC 卡标题、章节 |
| 正文 | Noto Sans SC | 16px | 说明、复盘文字 |
| 数据 | JetBrains Mono / SF Mono | 16px 等宽 | KPI、B-A-F、预算、% |
| 注释 | Noto Sans SC | 12px | 趋势、对比、时间戳 |

**比例：** 标题 : 正文 : 注释 ≈ **32 : 20 : 12**（φ 黄金比例近似）

### 2.3 间距与网格

- **基础单位：** 8px  
- **卡片内边距：** 24px  
- **模块间距：** 48px  
- **页面边距：** 64px（桌面）  
- **网格：** 12 列（CEO 驾驶舱专用）

### 2.4 图标

- 线性图标，**2px** 描边，圆角端点  
- 尺寸档：16 / 20 / 24 / 32 px  
- 红绿灯用 **实心圆点 + 外发光**，不用 emoji

### 2.5 语言与双语（VI 的一部分）

| 类型 | 语言 | 示例 |
|------|------|------|
| 战略术语 | **英文** | Invest to Growth · Four Satisfactions |
| 界面操作 | **中文** | 上传季报 · 生成快照 |
| 报告封面 | 英主中辅 | Board One-Pager |
| KPI 单位 | 中文 + 国际单位 | 万元 · % · 天 |

---

## 三、UX · 交互原则（2026 · 战略沙盘专用）

v5.4 七大趋势，按 StratOS **裁剪** 后落地：

| 原则 | StratOS 落地 | 反例（禁止） |
|------|--------------|--------------|
| **1. Calm Design** | CEO 屏默认只有：稳健性 + 四灯 + Top3 变化 + Top3 预警 | 首页堆 12 模块入口 |
| **2. Invisible AI** | 战略顾问在侧栏/⌘K 唤起，无「AI 魔法棒」满屏 | 每个按钮带 AI 标签 |
| **3. Command Palette** | ⌘K：跳模块、搜 OKR/Vx/Hx、问战略顾问 | 深层菜单 >3 级 |
| **4. Role-Based** | 五角色五套默认首页（见 §四） | 所有人同一仪表盘 |
| **5. Progressive Disclosure** | L0 3秒 → L1 点击卡片 → L2 表格 → L3 原始报告 | 首屏展示 13 Sheet |
| **6. Emotional Moments** | 快照生成成功、健康度较上版提升 — 轻反馈 | 游戏化勋章 |
| **7. Strategic Minimalism** | **每屏一个主问题**（战略/执行/健康） | 一屏混合三种问题 |

**StratOS 特有交互律：**

1. **红灯不可洗白** — 任一 BSC 维红灯，综合健康区块必须同步红框，不可用绿色综合分掩盖。  
2. **三预警上限** — 执行屏最多 3 条红/黄预警，强迫聚焦。  
3. **快照仪式感** — 生成 `{YYYY}-H1/FY-STRATEGIC` 时有明确「定稿」确认，防误触。  
4. **diff 优先于表格** — 版本对比页先展示 **变化清单**，再下钻明细。

---

## 四、信息架构 × 角色视图

### 4.1 全局导航（6 项，对应骨架）

```
StratOS
├── 指挥舱（Home）     ← CEO / 董事会默认
├── 看战略
├── 看执行
├── 看健康
├── FPA 财务          ← staff 可编辑；CEO 只读摘要
├── 报告中心
└── 版本库
```

### 4.2 五角色默认首页

| 角色 | 默认着陆 | 首屏组件 |
|------|----------|----------|
| **CEO / 董事会** | 指挥舱 | 战略时间轴 · 稳健性 · 四灯 · Top3 diff · Top3 预警 · 一页纸入口 |
| **VP** | 看战略 | 本事业部 BSC 子集 · OKR 树 · 本品牌 FPA 摘要 |
| **PM** | 看执行 | 我的 Vx · 里程碑 · 预算条 · 待填月报提醒 |
| **staff** | 报告中心 | 待上传/待解析 · FPA 录入 · 快照操作 |
| **observer** | 看战略 | 只读三看板，无录入 |

### 4.3 指挥舱（CEO）布局 · 12 列网格

```
行1 [12]  战略时间轴：10年 — 5年 — 3年 — 年度（水平时间线，当前年高亮琥珀金）
行2 [3][3][3][3]  BSC 四卡（各带「满意」标签 + 维度色左边框 + 单灯）
行3 [4][4][4]      稳健性五维条 + 综合分（大数字 Mono）+ 较上版 Δ
行4 [6][6]         Top3 版本变化（StratDiff）| Top3 预警
行5 [8][4]         B-A-F 迷你条（营收/利润/现金）| 现金 runway 月数
行6 [12]           进入战略会包 / 生成董事会一页纸 PDF
```

**视觉层次（严格四级）：**

| 级别 | 元素 | 样式 |
|------|------|------|
| L1 | 稳健性综合分、快照名 | 32px Mono，居中或左对齐 |
| L2 | BSC 卡标题、模块名 | 20px 思源 |
| L3 | KPI 数值 | 16px Mono |
| L4 | 趋势、同比、时间 | 12px 灰色 |

### 4.4 三看板 UI 要点

**看战略**

- **诊断顶栏（I1）：** 全宽，`challenge_statement` ≤80 字 + 瓶颈 + crux  
- **ProdStack（I8 / STRAT_PRODUCT）：** H1/H2/H3 资源条 + Now/Next/Later 三泳道 + lagging 竞品差距摘要  
- **四品牌 Tab（I3）：** WTP/HTW 双卡 → 下钻 ProductLine 矩阵  
- BSC 四卡可 flip：正面 = 目标 + 灯；背面 = 关联 OKR-O 列表  
- OKR 树：公司 → 事业部 → 团队，Doctrine 标签用小色块  
- 四满意校验：每条 O 旁 **四 icon**（客户/员工/股东/社会）绿/红

**看执行**

- **4DX 记分板（I5）：** 全宽置顶 — WIG（单 OKR-O 或 crux 衍生）+ 2–4 领先 KR/假设指标进度条  
- Vx 看板：泳道或表格；列 = 进度条 / 预算条 / **Cynefin 域角标（I4）** / 风险 / 负责人  
- 假设：Hx 卡片，失效 **珊瑚红边框**；域标签 + 方法提示条  
- 承诺：Deliver 专区，逾期 **不加动画闪烁**（严肃、不恐慌）

**看健康**

- 四灯 **独立展示**，禁止只给一个总分  
- 8 KPI 表：指标 | 目标 | 实际 | 灯 | 趋势 sparkline  
- FPA 条：B / A / F 三段堆叠条（同指标一行）

### 4.5 版本库 UI

- 时间轴：`FY2024 — H1-2025 — FY2025 — H1-2026 …`  
- 选中两快照 → 自动并排 diff，**绿增红减黄关注**  
- 稳健性雷达：五轴 R1–R5，两版 overlay

### Phase 2 视图（已批准 · 见 THEORY_IMPORTS）

| 视图 | 模块 | 说明 |
|------|------|------|
| **三层面气泡图** | 看执行 / StratCapital | Vx 按 H1/H2/H3 着色，X=投入 Y=预期回报 |
| **Hoshin X-Matrix Tab** | StratDecode | 与 BSC 战略地图 Tab 切换；关联点 correlation_dot |
| **产品 JTBD 矩阵** | StratProduct | 生命周期 × 战略角色；下钻 JTBD 卡 + Vx |

---

## 五、组件库（与骨架对象 1:1）

| 组件 | 数据对象 | VI 要点 |
|------|----------|---------|
| `DiagnosisBanner` | StrategicDiagnosis | 看战略顶栏，琥珀金左边框 |
| `ProdStackPanel` | ProductLine + Roadmap + Gap | 看战略，Innovate 色左边框 |
| `JtbdCard` | JtbdCard | 产品线详情 |
| `ProductBetChip` | ProductBet | 挂 Vx / Diagnosis.crux |
| `BrandWtpHtwCard` | BrandStrategyCard | 四品牌 Tab 内双卡 |
| `ExecutionScoreboard` | ExecutionScoreboardConfig + OKR/KR | 看执行置顶全宽 |
| `CynefinBadge` | cynefin_domain enum | 假设/Vx 角标 + tooltip 方法提示 |
| `StrategyPatternPanel` | StrategyPattern | 版本库 diff 页「战略形成」章 |
| `BscCard` | BscDimension + Measure | 维度色左边框 4px |
| `OkrTree` | Objective / KeyResult | KR 上 Doctrine chip |
| `VxRow` | Project + ProjectFinancials | 预算进度条琥珀色 |
| `AssumptionChip` | Assumption | 状态色点 |
| `CommitmentRow` | Commitment | 逾期红字，无 blink |
| `TrafficLight` | HealthSignal | 绿/黄/红 语义色 |
| `BafBar` | FpaPeriod | B/A/F 三段 |
| `RobustRadar` | RobustnessScore | 五维雷达 |
| `DiffItem` | diff_record | 18 类图标 + 严重度色 |
| `SnapshotBadge` | strategic_snapshot | 金标 `H1` / `FY` |

**设计系统实现建议：** Tailwind v4 CSS 变量 + shadcn/ui 暗色主题，token 名与上表一致。

---

## 六、动效

| 场景 | 动效 | 时长 |
|------|------|------|
| KPI 数字更新 | 滚动计数 | 0.6s |
| 灯色变化 | 背景色渐变 | 0.3s ease |
| 黄灯预警 | 慢 pulse（opacity） | 2s 周期 |
| 红灯预警 | 快 pulse | 1s 周期 |
| 快照定稿 | 轻 scale + 金边 flash | 0.4s 一次 |
| 页面切换 | 无花哨 transition | ≤0.2s |

**禁止：** 红灯全屏闪烁、庆祝 confetti（除快照成功 subtle toast）

---

## 七、报告与 PDF VI

**董事会一页纸（L0 输出）**

- 纸张：**A3 横版**（`@page size: A3 landscape`）或 16:9 幻灯片  
- **Light 主题：** 象牙底 `#FAF8F5` + 深海军字 — 见 `data-theme="print"`  
- 在线打印：`/print/panorama` · 海报图 `public/brand/stratos-a3-panorama-light.png`  
- 结构：稳健性分 · 四灯 · Top3 变化 · Top3 预警 · B-A-F 一行 · CEO 签章区  
- 字体：标题 DIN/Geist，数据 Mono，中文 Noto Sans SC

**战略会包（L1）**

- 封面：快照 ID + 日期 + Rhautt/StratOS 标识  
- 章节色：与 BSC 四色对应

**月报/季报模板（Word/MD）**

- 与 MON-RPT / QTR-REV 章节编号一致，便于解析  
- 表格样式固定，**禁止**合并单元格（解析友好）

---

## 八、无障碍与投屏

- 对比度：正文 ≥ 4.5:1，数据 ≥ 7:1（暗色背景）  
- 色盲：红绿灯 **形+色**（绿圆/黄三角/红方）  
- 战略会投屏：1080p 下 H1 ≥ 28px，四卡单行可读  
- 打印：提供「董事会白底版」一键导出

---

## 九、MVP vs 完整版 UI

| 项 | MVP | 完整版 |
|----|-----|--------|
| 主题 | Dark 指挥舱 | **+ Light 打印主题（v1.0 已交付）** |
| 指挥舱 | 12 列简版（无雷达） | + 三维/十二维雷达 |
| ⌘K | 模块跳转 | + AI 顾问 + 对象搜索 |
| 角色视图 | CEO + staff 两档 | 五角色完整 |
| 动效 | 灯色渐变 + 数字滚动 | 全套 |
| 双语 | 中文 UI + 英文 Doctrine | 报告英主中辅 |

---

## 十、UI/VI 与方法论对照（必一致）

| 方法论 | UI 必须体现 |
|--------|-------------|
| 四个满意 + BSC | 四卡标签 + 四 icon 校验 |
| 三支柱 Doctrine | KR chip + 审计表单，**无 Doctrine 分数仪表盘** |
| OKR 牵引 | 树形对齐，KR 绑 Vx 虚线 |
| FPA B-A-F | 财务维 + 独立 FPA 条，runway 数字 |
| 两次快照 | 版本库时间轴 + 定稿仪式 |
| StratDiff | diff 页绿红黄，TopN 上指挥舱 |
| StratRobust | 五维条/雷达，子维红则块红 |
| Calm / 三预警 | 指挥舱 ≤3 预警，不堆模块 |

---

## 十一、一句话

> **StratOS 的 UI/VI = 暗色指挥舱 + 琥珀战略金 + 语义红绿灯 + Logo 三栈 Snapshot + A3 一页纸 Light 打印；视觉服务于「30 秒读懂战局、两次快照看清变化」。**

**已交付：** Tailwind/CSS token · Brand Gallery `/brand` · 指挥舱代码 · `/print/panorama`
