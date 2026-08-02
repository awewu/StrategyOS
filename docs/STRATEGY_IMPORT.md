# 现有战略如何导入 StratOS

**适用：** 瑞合瑞德已有战略材料（Excel、月报、董事会 deck、SPBP）接入 StratOS，而非从零用 Demo 数据演示。

---

## 一、导入路径总览

| 路径 | 适合什么 | 成熟度 | 入口 |
|------|----------|--------|------|
| **A · 数据库 Seed** | 首版全量战略对象（诊断、三栈、BSC、FPA） | ✅ 生产可用 | `prisma/seed.ts` + `npm run setup:db` |
| **B · 报告解析** | 月报/Sheet/结构化文本 → 模式、断言、SPBP | ✅ MVP（规则/LLM） | `/reports` · `POST /api/reports/parse` |
| **C · 快照冻结** | 当前沙盘状态固化为战略会版本 | ✅ 生产可用 | `/versions` · `POST /api/snapshots/freeze` |
| **D · API 批量** | 脚本/ETL 写入 Prisma | ✅ 开发可用 | 直接调 Prisma / REST |
| **E · 文件上传** | Excel/PDF 拖拽导入 | ⚠️ 未做 UI | 见下文「缺口」 |

**推荐顺序：** A（基线对象）→ B（持续月报脉冲）→ C（年中/年底快照）。

---

## 二、A · 数据库 Seed（首版战略基线）

### 2.1 何时用

- 第一次把 **公司级战略对象** 写进系统：Rumelt 诊断、InvestmentCase、ProductBet/GtmBet、FPA、BSC 等。
- Demo 数据不符合你们真实战略，需要替换。

### 2.2 步骤

```bash
cd /Users/tiechuishan/Documents/strategy-driven-platform
npm run setup          # .env + DB + seed
# 或仅重灌：
npm run db:push && npm run db:seed
```

### 2.3 改哪里

编辑 **`prisma/seed.ts`**，按对象类型填入真实数据：

| 对象 | Prisma 模型 | 页面体现 |
|------|-------------|----------|
| 战略诊断 | `StrategicDiagnosis` | `/strategy` 顶栏 |
| 资本投向 | `InvestmentCase` | 三栈 CapStack |
| 产品战略项 | `ProductBet` | ProdStack |
| 市场战略项 | `GtmBet` | GtmStack |
| 四品牌 WTP/HTW | `BrandStrategyCard` | `/strategy` 四品牌 |
| FPA 期间数 | `FpaPeriod` · `CashPosition` | `/finance` 管理报表 |
| BSC / 断言 | `BscMeasure` · `HealthAssertion` | `/health` · 指挥舱预警 |

对象字段规范见 [OBJECT_MODEL.md](./OBJECT_MODEL.md) · [THEORY_IMPORTS.md](./THEORY_IMPORTS.md)。

### 2.4 验证

- `GET /api/health` → `"mode": "full"`
- `/command` 数据源显示 **DB**
- `/strategy` 诊断与三栈为 seed 内容

---

## 三、B · 报告中心（持续导入）

### 3.1 支持格式

规范见 **[REPORT_FORMATS.md](./REPORT_FORMATS.md)**：

| 类型 | 文件名示例 | 说明 |
|------|------------|------|
| **MON-RPT** | `MON-RPT_SALES-RUUD_2026-05.md` | 部门月报七章 + 可选 §8 战略模式 |
| **QTR-REV** | 季度复盘 | 战略会前情报包 |
| **SHEET_IMPORT** | Sheet1 财务 Excel 导出文本 | FPA / runway / 覆盖信号 |

### 3.2 UI 操作

1. 打开 **http://localhost:3003/reports**
2. 在 **「粘贴战略/月报内容」** 文本框粘贴 Markdown/纯文本（按 REPORT_FORMATS 结构）
3. 点击 **解析并入库**
4. 解析结果写入 `reports` 表；触发 assertion / SPBP 概率调整（若 DB 连通）

### 3.3 API（自动化）

```bash
curl -X POST http://localhost:3003/api/reports/parse \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "MON-RPT-SALES-2026-05",
    "rawContent": "§1 本月一句话...\n§8 涌现：区县经销商自发签约...",
    "useLlm": true
  }'
```

- `useLlm: true` 且配置 `OPENAI_API_KEY` → LLM 解析
- 未配置 → **规则引擎** fallback（关键词：涌现、runway、覆盖等）

### 3.4 解析后去哪了

| 输出 | 落点 |
|------|------|
| §8 战略模式 | `reports.parsedJson.patterns` → 版本库 diff 候选 |
| Runway 断言 | `health_assertions`（若触发阈值） |
| 覆盖/签约信号 | parsedJson.coverageUpdates |
| SPBP | 悲观情景概率 nudge（`spbp_scenarios`） |

---

## 四、C · 快照冻结（战略会版本）

战略对象 + 报告脉冲就绪后，在战略会节点 **冻结版本**：

```bash
curl -X POST http://localhost:3003/api/snapshots/freeze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "2026-H1-STRATEGIC",
    "period": "2026-H1",
    "snapshotType": "H1"
  }'
```

或在 **/versions** 页面操作（若 UI 按钮已启用）。

冻结内容 = 当前指挥舱 bundle（诊断、FPA、三栈、BSC、项目、假设等）序列化进 `strategic_snapshots.state_json`，并自动计算 **StratDiff**。

---

## 五、D · 脚本 / ETL 批量导入

适合从用友、Excel 模型、现有 SPBP 表批量灌数：

1. 确保 `DATABASE_URL` 连通
2. 编写 `scripts/import-strategy.ts`（可按你们格式定制）调用 Prisma `upsert`
3. 或导出 CSV → 临时 seed 片段

**Prisma 表清单：** `prisma/schema.prisma`（35+ 表）

---

## 六、当前缺口（诚实说明）

| 缺口 | 影响 | 计划 |
|------|------|------|
| **无 Excel 拖拽上传** | Sheet 需手动复制或 API | Phase B 报告中心 |
| **无 PPT/PDF deck 导入** | 董事会材料需人工录入 seed | 可选 OCR/LLM 管线 |
| **ProductBet 等仍用代码名** | UI 已中文化，DB 字段不变 | display label map |
| **单次导入不反向写诊断** | 报告解析不自动改 `StrategicDiagnosis` | 需 Agent 编排扩展 |

---

## 七、快速决策树

```
有结构化 Excel/SPBP 表？
  ├─ 是 → 改 prisma/seed.ts 或写 import 脚本（路径 A/D）
  └─ 否 → 有月报 Markdown？
        ├─ 是 → /reports 粘贴解析（路径 B）
        └─ 否 → 先用 Demo 彩排流程，战略会前 seed 基线（路径 A）
```

---

## 八、相关文档

- [REPORT_FORMATS.md](./REPORT_FORMATS.md) — 月报七章 + §8
- [THEORY_IMPORTS.md](./THEORY_IMPORTS.md) — 诊断/Mintzberg/WTP 对象定义
- [SETUP.md](./SETUP.md) — DB / LLM 环境
- [FPA_MANAGEMENT.md](./FPA_MANAGEMENT.md) — 管理报表 ROS/EBITDA
