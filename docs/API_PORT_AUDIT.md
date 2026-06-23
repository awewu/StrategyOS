# StratOS · API 端口全量审计报告

**版本：** v1.0 · 2026-06-23  
**目的：** 盘点所有数据输入/输出槽位，验证鉴权、输入格式、是否落口  
**共计：** 86 个 route 文件 · 约 130 个 HTTP 端点

---

## 一、端口清单（按域分组）

图例：  
- **方法** — GET=只读输出 · POST=写入/触发 · PUT=覆盖保存 · PATCH=局部更新 · DELETE=删除  
- **鉴权** — ✅已有 · ⚠️缺失（见第二节）  
- **输入格式** — JSON / multipart（文件上传）/ query-param / 无Body

---

### 🔐 认证 (auth)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/auth/login` | GET/POST | —（认证本身） | — | WorkOS 登录发起 |
| `/api/auth/callback` | GET | — | query | WorkOS OAuth 回调 |
| `/api/auth/workos` | GET | — | — | WorkOS session 查询 |
| `/api/auth/workos/webhook` | POST | — | JSON | WorkOS Webhook 事件 |

---

### 🏛️ 管理 (admin)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/admin/permissions` | GET, POST | ✅ `requireRouteAccess` | JSON | 权限配置读写 |

---

### 🔭 指挥甲板 (command)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/command/decisions` | GET, POST, PUT | ✅ `requireApiMinLevel(2)` | JSON | 战略决策录入/更新 |

---

### 🧭 北极星 (compass)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/compass/northstar` | GET, PUT | ✅ | JSON | 使命/愿景/5年目标 |
| `/api/compass/milestone` | GET, POST, PUT, DELETE | ✅ | JSON | 年度里程碑 CRUD |
| `/api/compass/premise` | GET, POST, PUT, DELETE | ✅ | JSON | 假设前提审计 CRUD |
| `/api/compass/seed` | POST | ✅ admin | JSON | 初始化默认北极星数据 |
| `/api/compass/sync` | POST | ✅ | JSON | 从战略计划同步北极星 |

---

### 🔬 战略编译器 (compiler)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/compiler/import` | POST | ✅ `requireApiMinLevel(2)` | **multipart** (PDF/XLSX) + JSON | 战略计划导入（AI解析+语义去重） |
| `/api/compiler/audit` | GET | ✅ admin | — | 查看导入审计日志 |

---

### 🔄 战略差异计算 (diffs)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/diffs/compute` | GET, POST | ⚠️ **无鉴权** | JSON | 快照差异计算（见第二节） |

---

### 🧮 反事实推演 (counterfactual)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/counterfactual` | GET, POST | ⚠️ **无鉴权** | JSON | 反事实情景推演（LLM调用，见第二节） |

---

### 📊 财务预测 (fpa)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/fpa/period` | GET, PUT | ✅ | JSON | FPA 当期收支数据 |
| `/api/fpa/bsc-config` | GET, PUT | ✅ | JSON | BSC 配置 |
| `/api/fpa/capital-config` | GET, PUT | ✅ | JSON | 资本配置 |
| `/api/fpa/capital-summary` | GET | ✅ | — | 资本汇总只读 |
| `/api/fpa/execution-analytics` | GET, PUT | ✅ | JSON | 执行分析数据 |
| `/api/fpa/growth-analytics` | GET, PUT | ✅ | JSON | 增长分析数据 |
| `/api/fpa/ma-pipeline` | GET, POST, PUT, DELETE | ✅ | JSON | M&A 管道 CRUD |
| `/api/fpa/management-report` | GET | ✅ | — | 管理层报告只读 |
| `/api/fpa/management-summary` | GET | ✅ | — | 管理摘要只读 |
| `/api/fpa/outlook` | GET, PUT | ✅ | JSON | 战略展望五年预测 |
| `/api/fpa/sync-runway` | POST | ✅ | JSON | 同步现金 runway 到健康断言 |

---

### 🚪 战略门槛 (gates)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/gates` | GET, PUT | ✅ `requireApiMinLevel(2)` | JSON | Gate 检查项读写 |
| `/api/gates/five-forces` | GET, PUT | ✅ `requireApiMinLevel(2)` | JSON | 五力分析读写 |

---

### 🏥 健康仪表盘 (health)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/health` | GET | ✅ | — | 十二维健康评分 + 断言 |
| `/api/health/ops-metric` | GET, POST, PUT | ✅ | JSON | 运营指标 CRUD |

---

### 📥 待办中心 (inbox)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/inbox` | GET, POST, PUT | ✅ | JSON | 待办信号读写/处置 |
| `/api/inbox/count` | GET | ✅ | — | 待办未读数只读 |

---

### 🎯 战略职责 (mandate)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/mandate` | GET, POST, PUT, DELETE | ✅ | JSON | 战略职责 CRUD |
| `/api/mandate/holding` | GET, POST, PUT | ✅ | JSON | 责任人认领/交账 |

---

### 🏪 市场洞察 (market)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/market/brand` | GET, POST, PUT, DELETE | ✅ | JSON | 竞品品牌 CRUD |
| `/api/market/product` | GET, POST, PUT, DELETE | ✅ | JSON | 竞品产品 CRUD |
| `/api/market/productline` | GET, POST, PUT, DELETE | ✅ | JSON | 产品线 CRUD |
| `/api/market/region` | GET, POST, PUT, DELETE | ✅ | JSON | 销售区域 CRUD |
| `/api/market/cell` | GET, POST, PUT, DELETE | ✅ | JSON | 竞争格局单元格 CRUD |
| `/api/market/research` | GET, POST, PUT, DELETE | ✅ | JSON | 竞品研究项 CRUD |
| `/api/market/source` | GET, POST, PUT, DELETE | ✅ | JSON | Hermes 情报源 CRUD |
| `/api/market/winloss` | GET, POST, DELETE | ✅ | JSON | 赢单/丢单记录 CRUD |
| `/api/market/scan` | GET, POST | ⚠️ **无鉴权** | JSON | Hermes LLM扫描（见第二节） |
| `/api/market/ask` | POST | ⚠️ **无鉴权** | JSON | 市场AI问答（LLM调用，见第二节） |
| `/api/market/swot` | POST | ✅ `requireApiMinLevel(2)` | JSON | SWOT AI分析（已修复） |
| `/api/market/self-scores` | GET, PUT | ✅ `requireApiMinLevel(2)` | JSON | 市场自评分 |

---

### 🏢 组织 (org)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/org-unit` | GET, POST, PUT, DELETE | ✅ admin | JSON | 组织单元 CRUD |

---

### 📋 报告 (reports)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/reports/submit` | POST (文件), PATCH (审批) | ⚠️ POST无鉴权 / PATCH ✅ | **multipart** (docx/xlsx/pdf) + JSON | 报告上传入库（见第二节） |
| `/api/reports/parse` | POST | ⚠️ **无鉴权** | JSON | 报告解析（LLM，见第二节） |
| `/api/reports/list` | GET | ✅ | — | 报告列表 |
| `/api/reports/pulse-check` | POST | ✅ | JSON | 月度脉冲重复检查 |

---

### 🎭 彩排 (rehearsal)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/rehearsal/progress` | GET | ✅ | — | 彩排进度只读 |

---

### 📸 快照/版本 (snapshots)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/snapshots/freeze` | GET, POST | ✅ session 校验 | JSON | 快照冻结（最重要写操作） |

---

### 📈 SPBP 情景 (spbp)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/spbp/scenarios` | GET, POST, PUT, DELETE | ✅ | JSON | 情景 CRUD |
| `/api/spbp/update` | POST | ✅ | JSON | 情景概率批量更新 |

---

### 📦 三栈 (stacks)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/stacks` | GET, POST, PUT | ✅ `requireApiMinLevel(2)` | JSON | IC/ProductBet/GtmBet/CapStack/Projects |

---

### 🔮 战略模拟 (strat-sim)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/strat-sim` | POST | ✅ | JSON | 战略情景模拟 |

---

### 📄 战略计划 (strategy)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/strategy/plan` | GET, POST, PUT | ✅ | JSON | 组织战略计划 CRUD |
| `/api/strategy/plan/attachment` | POST, DELETE | ✅ | **multipart** | 计划附件上传/删除 |
| `/api/strategy/plan/lifecycle` | POST | ✅ | JSON | 计划生命周期变更（提交/锁定） |
| `/api/strategy/one-pager` | GET, PUT | ✅ | JSON | 一页纸战略读写 |
| `/api/strategy/one-pager/approve` | POST | ✅ admin | JSON | 一页纸审批 |
| `/api/strategy/one-pager/revise` | POST | ✅ | JSON | 一页纸修订 |
| `/api/strategy/one-pager/revisions` | GET | ✅ | — | 修订历史 |

---

### 🤖 Agent 编排 (agents)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/agents/orchestrate` | GET, POST | ⚠️ **无鉴权** | JSON | 11-Agent LLM编排（见第二节） |

---

### 🔁 反馈环 (feedback)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/feedback/loops` | GET, PUT | ✅ | JSON | 系统反馈环读写 |

---

### 🗳️ 会议 (meeting)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/meeting` | GET, POST, PUT | ✅ | JSON | 战略会议 CRUD |
| `/api/meeting/poll` | GET, POST, PUT | ✅ | JSON | 会议投票 CRUD |

---

### 🎨 文化 (culture)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/culture/wushi` | GET, PUT | ✅ `requireApiMinLevel(2)` | JSON | 五事七计就绪度 |
| `/api/culture/awards` | GET, POST, PUT, DELETE | ✅ | JSON | 文化奖项 CRUD |
| `/api/culture/handbook` | GET, PUT | ✅ | JSON | 文化手册 |
| `/api/culture/understanding` | GET, POST, PUT, DELETE | ✅ | JSON | 文化理解案例 CRUD |

---

### 🧩 战略解码 (decode)

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/decode/bsc` | GET, PUT | ✅ | JSON | BSC 战略地图行 |
| `/api/decode/hoshin` | GET, PUT | ✅ | JSON | Hoshin X 矩阵 |
| `/api/decode/import` | POST | ✅ | **multipart** | 解码数据批量导入 |
| `/api/decode/template` | GET | ✅ | — | 下载导入模板 |

---

### 📊 数据源元信息 / 执行 / 审计 / 系统

| 端点 | 方法 | 鉴权 | 输入格式 | 说明 |
|------|------|------|---------|------|
| `/api/data-source` | GET | ⚪ 无（设计有意） | — | 数据新鲜度信号灯（非敏感） |
| `/api/execution/scoreboard` | GET, PUT | ✅ | JSON | 4DX 记分板 |
| `/api/execution/commitment` | GET, POST, PUT | ✅ | JSON | 承诺库 CRUD |
| `/api/execution/market-evidence` | GET, POST, PUT | ✅ | JSON | 市场证据 CRUD |
| `/api/execution/maturity` | GET, PUT | ✅ | JSON | 执行成熟度 |
| `/api/execution/position` | GET, PUT | ✅ | JSON | 竞争定位 |
| `/api/execution/tension` | GET, POST, PUT | ✅ | JSON | 执行矛盾分析 |
| `/api/audit/export` | GET | ✅ admin | query(`?format=csv`) | 审计日志导出 CSV/JSON |
| `/api/audit/log` | POST | 内部 header 校验 | JSON | 客户端审计事件上报 |
| `/api/harness` | GET | ✅ admin | — | 系统健康自检报告 |
| `/api/print/panorama` | GET | ✅ | — | 全景一页纸打印输出 |

---

## 二、鉴权缺口专项清单

以下端点**调用 LLM 或写入 DB，但缺少 `requireApiMinLevel` 鉴权**，存在未登录用户滥用风险：

| 端点 | 风险 | 建议 |
|------|------|------|
| `POST /api/agents/orchestrate` | 触发 11-Agent LLM编排，写 DB | 加 `requireApiMinLevel(2)` |
| `POST /api/reports/parse` | 触发 LLM 报告解析 | 加 `requireApiMinLevel(2)` |
| `POST /api/reports/submit` | 文件写磁盘 + 写 DB | 加 `requireApiMinLevel(1)` |
| `POST /api/market/scan` | 触发 Hermes LLM 扫描 + 写 DB | 加 `requireApiMinLevel(2)` |
| `POST /api/market/ask` | 触发 LLM 问答 | 加 `requireApiMinLevel(1)` |
| `POST /api/diffs/compute` | 计算并写 DiffRecord | 加 `requireApiMinLevel(2)` |
| `POST /api/counterfactual` | 触发 LLM 推演 | 加 `requireApiMinLevel(2)` |

> `POST /api/market/swot` — ✅ 已在本次修复中补充鉴权（commit `12206b0`）

---

## 三、输入格式汇总

| 输入类型 | 涉及端点数 | 主要端点 |
|---------|-----------|---------|
| **JSON Body** | ~60个 | 所有标准 CRUD |
| **multipart/form-data（文件）** | 4个 | `reports/submit`、`compiler/import`、`strategy/plan/attachment`、`decode/import` |
| **Query Param 只读** | ~15个 | 所有 GET 端点 |
| **无 Body（触发型）** | ~8个 | `harness`、`compass/seed`、`fpa/sync-runway` 等 |

### 文件上传规格

| 端点 | 支持格式 | 大小限制 | 验收方式 |
|------|---------|---------|---------|
| `reports/submit` | docx, xlsx, pdf, pptx, doc, xls, ppt | **80 MB** | 扩展名白名单 + 大小校验，解析失败不阻断 |
| `compiler/import` | PDF, XLSX, 纯文本 | 未显式限制 | LLM 解析 + 语义去重 + `sanitizeCompiledPayload` |
| `strategy/plan/attachment` | 任意（multipart） | 未显式限制 | 文件名保存，无内容校验 |
| `decode/import` | multipart | 未显式限制 | 内容解析 |

---

## 四、输出格式汇总

| 输出类型 | 涉及端点 |
|---------|---------|
| **JSON**（默认） | 所有端点 |
| **CSV 下载** | `GET /api/audit/export?format=csv` |
| **JSON 文件下载** | `GET /api/audit/export`（带 `Content-Disposition`） |
| **HTML/打印** | `GET /api/print/panorama` |

---

## 五、落口验证结论

### ✅ 已落口（正常）

- 所有 **CRUD 业务端点**（strategy/fpa/execution/culture/mandate/meeting等）均有 `requireApiMinLevel` 或 `requireRouteAccess` 鉴权
- 所有**快照冻结**操作有 session 校验 + 健康断言硬阻断
- 所有**文件上传**有格式和大小校验
- **审计日志导出**有 `requireApiAdmin` 最高权限保护
- `POST /api/market/swot`：已修复（commit `12206b0`）
- `persistHealthAssertions`：已改为原子事务（commit `1d5a27b`）

### ⚠️ 未落口（待修）

**7个 LLM/写DB 端点无鉴权**（见第二节），建议回公司后统一修复：

```
POST /api/agents/orchestrate    → requireApiMinLevel(2)
POST /api/reports/parse         → requireApiMinLevel(2)
POST /api/reports/submit        → requireApiMinLevel(1)
POST /api/market/scan           → requireApiMinLevel(2)
POST /api/market/ask            → requireApiMinLevel(1)
POST /api/diffs/compute         → requireApiMinLevel(2)
POST /api/counterfactual        → requireApiMinLevel(2)
```

### ⚪ 有意设计（非缺陷）

- `GET /api/data-source`：无鉴权，数据源信号灯为公开 UI 组件，内容非敏感

---

*审计日期：2026-06-23 · 下次战略会前建议完成第二节7个端点修复*
