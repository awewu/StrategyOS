# FP&A 管理报表 · ROS / EBITDA / 三张表

**版本：** v1.1 · 2026-06-14  
**页面：** `/finance?tab=management`（默认 Tab）  
**API：** `GET /api/fpa/management-summary`

---

## 定位

FP&A **不再以现金流为唯一焦点**。核心能力是 **管理报表**：

| 指标 | 定义 | 用途 |
|------|------|------|
| **ROS** | 净利润 ÷ 营业收入（销售净利率） | 盈利能力一票摘要 |
| **EBITDA** | 毛利 − 销售及管理费用（不含 D&A、利息、税） | 经营现金创造能力 |
| **毛利率** | 毛利 ÷ 营收 | 产品/渠道定价力 |

现金流 runway 保留在 **B-A-F 总览** 与 **资本 Tab**，作为辅助而非主轴。

---

## 财务三张表

| Tab | 内容 |
|-----|------|
| 利润表 | 营收 → COGS → 毛利 → OpEx → **EBITDA** → D&A → EBIT → 净利 |
| 资产负债表 | 资产 / 负债 / 权益（Actual 时点） |
| 现金流量表 | 经营 / 投资 / 筹资 · 期末现金 |

数据锚点：`FpaPeriod` B-A-F（DB）或 `lib/stratos-demo-data`（Demo），由 `buildManagementReport()` 展开行项目。

---

## 代码

| 模块 | 路径 |
|------|------|
| 计算引擎 | `lib/fpa/management-report.ts` |
| 类型 | `lib/fpa/management-types.ts` |
| UI | `components/finance/ManagementReportPanel.tsx` · `FinancialStatements.tsx` |
| 单元测试 | `lib/fpa/management-report.test.ts` |

---

## 与资本 Tab 关系

见 [FPA_CAPITAL_TAB.md](./FPA_CAPITAL_TAB.md) — CAPEX 管道、CapStack 仍在 `/finance?tab=capital`；现金流量表中 **投资活动** 行与 CAPEX 口径对齐。

---

*瑞合瑞德 FY26 · 单位：万元*
