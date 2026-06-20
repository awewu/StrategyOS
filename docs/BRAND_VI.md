# StratOS · 品牌视觉识别规范（BRAND VI v1.0）

**版本：** v1.0 · 2026-06-14  
**状态：** 定稿 · 与产品 MVP+ 同步  
**关联：** [UI_VI.md](./UI_VI.md) · [ONE_PAGE_PANORAMA.md](./ONE_PAGE_PANORAMA.md) · [STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md)

---

## 一、品牌核心

| 项 | 内容 |
|----|------|
| **名称** | StratOS — Strategic Operating System |
| **中文定位** | 战略沙盘 · 战略推演系统 |
| **标语** | 战略是抉择 · *Decide with clarity.* |
| **受众** | 300 人企业 · 30 人核心层 · CEO/董事会 |
| **气质** | 暗色指挥舱 · 琥珀战略金 · 冷静 · 可审计 · 非 OKR 工具 |

**Logo 隐喻：** 字母 **S** = 三栈横切（Cap · Prod · Gtm）+ 右上角 **Snapshot 冻结框**（琥珀金）

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

### 3.1 Dark（默认 · 投屏）

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-bg-deep` | `#0F172A` | 页面底 |
| `--color-bg-surface` | `#0A1628` | 卡片/面板 |
| `--color-accent-gold` | `#D4A574` | 战略重点 · Logo 框 · Doctrine |
| `--color-text-primary` | `#F1F5F9` | 正文 |
| `--color-text-muted` | `#64748B` | 辅助 |

### 3.2 语义色（不可挪用）

| Token | Hex | 绑定 |
|-------|-----|------|
| `--signal-green` | `#2E7D32` | 正常 · 验证 · Gate 通过 |
| `--signal-yellow` | `#F9A825` | 关注 · 偏差 |
| `--signal-red` | `#E65100` | 预警 · 否决 · Hx 失效 |

### 3.3 三栈色

| 栈 | Token | Hex |
|----|-------|-----|
| CapStack | `--stack-cap` | `#D4A574` |
| ProdStack | `--stack-prod` | `#2E7D32` |
| GtmStack | `--stack-gtm` | `#38BDF8` |

### 3.4 Light / Print（董事会 PDF）

| Token | Hex | 用途 |
|-------|-----|------|
| `--print-ivory` | `#FAF8F5` | 纸面底 |
| `--print-navy` | `#0A1628` | 印刷正文 |

启用：`<html data-theme="print">` 或 `@media print`

---

## 四、Logo 使用规范

### 4.1 组合

- **主组合：** Mark + StratOS Wordmark + 可选副标 *Strategic Operating System*
- **最小尺寸：** Mark 24px 高（数字屏）· 10mm（印刷）
- **安全空间：** Mark 高度的 0.5× 四周留白

### 4.2 禁止

- 改比例、改色（除反白/单色金）
- 去掉 Snapshot 框
- 与竞品 Logo 并置小于安全距离
- 用于全员日报/任务类界面主视觉

### 4.3 App Icon

深空蓝底 `#0A1628` + 白栈条 + 琥珀框 — 见 `public/icon.svg`

---

## 五、字体

| 层级 | 字体 | 用途 |
|------|------|------|
| 英文/数据 | Geist Mono / DIN / Roboto | KPI · B-A-F · budget_tag |
| 中文 | Noto Sans SC / 思源黑体 | 界面 · 诊断 · 标语 |
| 比例 | 32 : 20 : 12 | H1 : H2 : 注释 |

---

## 六、应用触点

| 触点 | 模式 | 说明 |
|------|------|------|
| Web 指挥舱 | Dark | 默认 `/command` |
| 战略会 A3 海报 | Light | `/print/panorama` 或 PNG 资产 |
| 董事会一页纸 PDF | Light | Robust + 四灯 + Top3 diff |
| 快照文件夹 | Physical | 深色压印 · H1/FY 金标 |
| 硬阻断条 | Coral 全宽 | 否决时行 0，无 dismiss |

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
Logo 三栈     → CapStack / ProdStack / GtmStack
Snapshot 框   → StrategicSnapshot FROZEN
Amber Gold    → Diagnosis · Doctrine Invest · 财务维
Coral         → HealthAssertion · 硬阻断
Green/Blue    → Prod / Gtm 栈 · BSC 客户/学习
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

*StratOS VI v1.0 · 视觉服务于「30 秒读懂战局、两次快照看清变化」*
