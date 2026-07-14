# StratOS · 品牌视觉识别规范（BRAND VI v2.0）

**版本：** v2.0 · 2026-07-14（Ruud/Rheem 浅色主题重写）  
**状态：** 定稿 · 与 `app/globals.css` Brand Tokens v2.0 + `lib/brand/tokens.ts` 同步  
**权威来源：** 运行时以 `app/globals.css` 的 CSS 变量为准；本文件与 `lib/brand/tokens.ts` 为其镜像。  
**关联：** [UI_VI.md](./UI_VI.md) · [ONE_PAGE_PANORAMA.md](./ONE_PAGE_PANORAMA.md) · [STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md)

> **v1.0 → v2.0 迁移说明**：早期暗色 + 琥珀金（`#D4A574`）方案已**全面废弃**。当前为 Ruud 工业浅色底座：白卡 on 浅灰、**Ruud teal 作战略强调**、Rheem red 作品牌与风险。若仍在代码中见到 `#b8860b/#D4A574/#0F172A/--color-accent-gold`，均为遗留，应替换为下表 token。

---

## 一、品牌核心

| 项 | 内容 |
|----|------|
| **名称** | StratOS — Strategic Operating System |
| **中文定位** | 战略沙盘 · 战略推演系统 |
| **标语** | 战略是抉择 · *Decide with clarity.* |
| **受众** | 300 人企业 · 30 人核心层 · CEO/董事会 |
| **气质** | Ruud 工业浅色 · Teal 战略强调 · 冷静 · 可审计 · 非 OKR 工具 |

**品牌锁定：** 侧栏 = `logo-mark.svg` + Rhautt 集团字标 **Rhautt.**（红）+ 中文「瑞合瑞德」。导航激活态用 Rheem red 指示条，战略强调（链接/按钮/重点）用 Ruud teal。

---

## 二、品牌资产文件

| 资产 | 路径 | 用途 |
|------|------|------|
| Brand Kit 3×3 | `public/brand/stratos-brandkit-3x3.png` | VI 总览 · 对外演示 |
| Logo 2×2 | `public/brand/stratos-logo-2x2.png` | Mark 定稿 · 尺寸规范 |
| A3 一页纸 | `public/brand/stratos-a3-panorama-light.png` | 战略会张贴 · 签到墙 |
| Light 董事会版 | `public/brand/stratos-light-mode-board.png` | PDF 导出 · 打印 |
| Favicon | `public/icon.svg` | 浏览器 / PWA |
| Logo Mark | `public/logo-mark.svg` | 导航栏 · App Icon 源 |

**代码 Token：** `lib/brand/tokens.ts` · `app/globals.css`

---

## 三、色彩系统

### 3.1 表面与文字（默认 · 浅色）

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-bg-deep` | `#f5f5f5` | 页面底（Ruud body gray）|
| `--color-bg-surface` / `--surface-panel` | `#ffffff` | 卡片 / 面板 |
| `--surface-raised` | `#fafafa` | 抬升面 |
| `--surface-border` | `#e3e5e6` | 描边 |
| `--color-text-primary` | `#2c3133` | 标题 / 正文 |
| `--color-text-secondary` | `#4e5758` | 次级正文 |
| `--color-text-muted` | `#828c8d` | 辅助 / meta |

### 3.2 强调色

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-accent`（Ruud teal）| `#007681` | 战略强调 · 链接 · 主按钮 · 激活 |
| `--color-accent-bright` | `#3eb5d4` | hover / 填充 |
| `--color-accent-vivid`（Ruud cyan）| `#00aeef` | 高亮填充 |
| `--ruud-red-primary`（Rheem red）| `#e4002b` | 品牌 mark · 导航激活指示条 |
| `--accent-sim`（推演紫）| `#6d3fc0` | 反事实 / Agent 推演 / H3 探索（**专用语义**）|

### 3.3 语义信号色（不可挪用）

| Token | Hex | 绑定 |
|-------|-----|------|
| `--signal-green` | `#1f8a45` | 正常 · 验证 · Gate 通过 |
| `--signal-yellow` | `#b45309` | 关注 · 偏差 |
| `--signal-red` | `#8b0e04` | 预警 · 否决 · Hx 失效 |

> 注：黄信号 token 名为 `--signal-yellow`（**没有** `--signal-amber`）；推演紫用 `--accent-sim`（**没有** `--accent-violet`）。

### 3.4 三栈色 / BSC

| 栈 | Token | Hex | · | BSC 维 | Token | Hex |
|----|-------|-----|---|--------|-------|-----|
| CapStack | `--stack-cap` | `#8b0e04` | · | 财务 | `--bsc-financial` | `#8b0e04` |
| ProdStack | `--stack-prod` | `#1f8a45` | · | 客户 | `--bsc-customer` | `#0c8bab` |
| GtmStack | `--stack-gtm` | `#0c8bab` | · | 流程 | `--bsc-process` | `#6344b8` |
| | | | · | 学习 | `--bsc-learning` | `#1f8a45` |

### 3.5 Print（董事会 PDF / A3）

| Token | Hex | 用途 |
|-------|-----|------|
| `--print-ivory` | `#faf8f5` | 纸面底 |
| `--print-navy` | `#0a1220` | 印刷正文 |

启用：`<html data-theme="print">` 或 `@media print`。打印强调色沿用 `--color-accent`（teal）。

---

## 四、Logo 使用规范

### 4.1 组合

- **主组合：** Mark + StratOS Wordmark + 可选副标 *Strategic Operating System*
- **最小尺寸：** Mark 24px 高（数字屏）· 10mm（印刷）
- **安全空间：** Mark 高度的 0.5× 四周留白

### 4.2 禁止

- 改比例、改色（除反白/单色）
- 与竞品 Logo 并置小于安全距离
- 用于全员日报/任务类界面主视觉

### 4.3 App Icon

见 `public/icon.svg` / `public/logo-mark.svg`（Rhautt 集团 mark，Rheem red 主色）

---

## 五、字体

| 层级 | 字体 | 用途 |
|------|------|------|
| 英文/数据 | Geist Mono / DIN / Roboto | KPI · B-A-F · budget_tag |
| 中文 | Noto Sans SC / 思源黑体 | 界面 · 诊断 · 标语 |
| 比例 | 32 : 20 : 16 : 12 : 11 | 页面 : 卡片 : 子栏目/正文 : 说明 : 标签（`--type-*`）|
| 数据 | Geist Mono · tabular-nums | KPI · B-A-F · budget_tag（`.font-data`）|

---

## 六、应用触点

| 触点 | 模式 | 说明 |
|------|------|------|
| Web 指挥舱 | 浅色 | 默认 `/command`（Ruud teal 强调）|
| 战略会 A3 海报 | Print | `/print/panorama` 或 PNG 资产 |
| 董事会一页纸 PDF | Print | Robust + 四灯 + Top3 diff |
| 快照文件夹 | Physical | H1/FY 标识 |
| 硬阻断条 | `--signal-red` 全宽 | 否决时行 0，无 dismiss |

---

## 七、标语与文案

**可用：**

- 战略是抉择 / Decide with clarity.
- 定焦点 · 定配置 · 留历史
- Command Deck · 指挥舱
- FROZEN · H1-STRATEGIC

**禁用：**

- 「智能赋能」「数字化转型」等空泛词
- 假精准「胜算 XX%」
- 与 OKR/绩效工具混淆的 copy

---

## 八、数字尺度（瑞合瑞德）

品牌物料与 Demo **必须使用真实量级**：

- 营收量级：**6000 万** 级（非 B 级）
- CAPEX：**1.2 亿** 级
- runway：**2.1 月**（否决示例）

---

## 九、与产品模块映射

```
Ruud teal (accent)    → 战略强调 · 链接 · 主按钮 · Diagnosis 重点
Rheem red (brand)     → 品牌 mark · 导航激活指示条
signal-red            → HealthAssertion · 硬阻断 · 否决 · 财务/Cap 栈
accent-sim (推演紫)   → 反事实 · Agent 推演 · H3 探索
Green / Blue          → Prod / Gtm 栈 · BSC 客户·学习
```

---

## 十、交付清单（v1.0 完成）

- [x] Brand Kit 3×3 总览板
- [x] Logo 2×2 定稿板
- [x] A3 一页纸 Light 海报
- [x] Light Mode 董事会 PDF 板
- [x] SVG favicon + logo-mark
- [x] CSS tokens + `lib/brand/tokens.ts`
- [x] 打印页 `/print/panorama`
- [x] App 导航 Logo 集成

---

*StratOS VI v2.0 · 视觉服务于「30 秒读懂战局、两次快照看清变化」*
