# StratOS · Phase 3 交付说明

**版本：** v1.1 · 2026-06-14  

---

## 一、本批新增（v1.1 · Phase 4 收尾）

| 模块 | 交付 |
|------|------|
| **WorkOS Webhook** | `POST /api/auth/workos/webhook` · Directory Sync 用户 upsert/delete · HMAC 验签 |
| **Diff 持久化** | `lib/stratos/persist-diff.ts` · 快照冻结自动写 `diff_records` · `POST /api/diffs/compute` |
| **StratSim 系统动力学** | `lib/stratos/strat-sim-dynamics.ts` · stock/flow R/B/D · UI 切换 |
| **LLM Agent 全面** | `lib/stratos/llm-orchestration.ts` · `runAgentOrchestrationSmart` 优先 LLM |
| **PDF 对齐** | `lib/panorama/view-model.ts` · 与 `/print/panorama` 共享布局 · PDF 同结构 |

### WorkOS Webhook

```bash
# WorkOS Dashboard → Webhooks → https://your-domain/api/auth/workos/webhook
WORKOS_WEBHOOK_SECRET=whsec_...
```

事件：`user.*` · `dsync.user.*` → 同步 `users` 表

### Diff 自动写入

- 快照 `POST /api/snapshots/freeze` 成功后自动对比上一版 frozen 快照
- 手动：`POST /api/diffs/compute` `{ "fromCode": "2025-FY-STRATEGIC", "toCode": "2026-FY-STRATEGIC" }`

### StratSim 系统动力学

- `/decode` → StratSim Tab → **系统动力学**（默认）vs 离散 MVP
- `POST /api/strat-sim` `{ "mode": "dynamics" }`

### LLM Agent

- `POST /api/agents/orchestrate` 配置 `OPENAI_API_KEY` 后 11-Agent 全链路 LLM 编排
- 报告解析 + 编排均优先 LLM，无 key 回退 rules

### 董事会 PDF 对齐

- 浏览器 `/print/panorama` 与 `GET /api/print/panorama?lang=zh` 共用 `buildPanoramaViewModel()`
- 区块一致：核心挑战 · 4 KPI · 一分钟图 · BSC/TopDiff · FPA/CapStack 附录

---

## 二、本批新增（v1.0）

| 模块 | 交付 |
|------|------|
| **全量 DB 接线** | `lib/data/entity-getters.ts` · 三栈/执行/健康/Decode 走 Prisma + demo fallback |
| **WorkOS 生产** | 用户 DB 同步 · OAuth state CSRF · `WORKOS_ORGANIZATION_ID` |
| **Q3 彩排增强** | 实时 crux/runway/Robust 横幅 · 清单 sessionStorage + 审计 API |

### DB 接线范围

`getBrandCards` · `getProductBets` · `getGtmBets` · `getProjects` · `getAssumptions` · `getLeadingKeyResults` · `getCapacity` · `getBscLights` · `getHealthOverview` · `getBscCards` · `getGtmSegments` · …

页面：`/strategy` · `/execution` · `/health` · `/decode` · `/command` 均显示数据源 DB/Demo。

```bash
npm run db:migrate && npm run db:seed
```

### WorkOS

1. Dashboard 配置 Redirect URI → `/api/auth/callback`
2. `.env` 设置 `WORKOS_CLIENT_ID` · `WORKOS_API_KEY` · 可选 `WORKOS_ORGANIZATION_ID`
3. 登录页 SSO → 首次登录自动 upsert `users` 表（邮箱匹配 seed 用户则沿用角色）

### Q3 彩排

- `/rehearsal` 顶栏 Live Banner：crux · runway · Robust · HardBlock
- 投屏模式：实时指标 + 清单勾选 → `POST /api/rehearsal/progress` 审计
- 清单状态 `sessionStorage` 持久化（刷新不丢）

---

## 二、本批新增（v0.9）

| 模块 | 交付 |
|------|------|
| **反事实 diff** | `lib/stratos/counterfactual.ts` · `POST /api/counterfactual` · 版本库交互面板 |
| **快照 API** | `POST /api/snapshots/freeze` · DB 持久化 + 内存 fallback |
| **版本库数据层** | `lib/data/versions-data.ts` · `/versions` 异步加载 |

### 反事实推演

1. `/versions` → 反事实面板 · 预设或自定义参数
2. `POST /api/counterfactual` `{ type, magnitude }` — `v4_delay` · `hotel_beat` · `price_cut`
3. ⌘K →「版本库 · 反事实」

### 快照定稿 API

```bash
curl -X POST http://localhost:3000/api/snapshots/freeze \
  -H 'Content-Type: application/json' \
  -d '{"code":"2026-FY-STRATEGIC","bypassAssertion":true}'
```

- 有 DB 时写入 `strategic_snapshots` + `strategy_patterns`
- HealthAssertion 未解除 → 422 硬阻断
- 审计 action: `snapshot_freeze` · `counterfactual_run`

---

## 二、本批新增（v0.8）

| 模块 | 交付 |
|------|------|
| **中文 PDF** | Noto Sans SC Subset · `npm run fonts:fetch` · `GET /api/print/panorama?lang=zh`（默认） |
| **StratSim** | `lib/stratos/strat-sim.ts` · `/decode` 第三 Tab · `POST /api/strat-sim` · [STRAT_SIM.md](./STRAT_SIM.md) |
| **使用审计日志** | Prisma `UsageLog` · `lib/audit/log-event.ts` · 内存 fallback |
| **访问管理** | `/admin/access` · 用户列表 · 会话信息 · 最近 50 条日志 |
| **导航会话** | 顶栏显示已登录用户 · CEO/Staff 可见「访问管理」 |

### 中文 PDF

```bash
npm run fonts:fetch   # 下载 public/fonts/NotoSansSC-Regular.otf (~8MB)
```

- 默认 `?lang=zh`；`?lang=en` 英文版
- 无字体时自动 Helvetica fallback，页脚提示运行 `fonts:fetch`
- 详见 `public/fonts/README.md`

### StratSim 使用

1. `/decode` → Tab「StratSim · 反馈环」
2. 调节 R/B/D 滑块，查看 8 季度表 + 利润柱图 + 预警
3. ⌘K →「StratSim · 反馈环推演」

### 审计动作

| action | 触发点 |
|--------|--------|
| `login` / `logout` | `POST`/`DELETE` `/api/auth/login` · WorkOS callback |
| `auth_failed` | 登录 404 · WorkOS 失败 · middleware（`STRATOS_REQUIRE_AUTH=1`） |
| `report_parse` | `POST /api/reports/parse` |
| `agent_orchestrate` | `POST /api/agents/orchestrate` |
| `spbp_update` | `POST /api/spbp/update` |
| `pdf_download` | `GET /api/print/panorama` |
| `snapshot_freeze` | 版本库 SnapshotFreezePanel（客户端） |
| `role_switch` | RoleSwitcher（客户端） |

### CEO 查看日志

1. 以 `ceo@rheem.cn` 或 `staff@rheem.cn` 登录（或演示模式切换角色为 CEO/Staff）
2. 导航栏 → **访问管理**，或 ⌘K →「访问管理 · 审计日志」
3. 页面展示用户列表、当前会话、最近 50 条使用日志

### 数据库

```bash
npm run db:migrate   # 应用 UsageLog 表
npm run db:seed      # 含示例 usage_logs
```

无 `DATABASE_URL` 时日志写入进程内存（重启后清空），与其他 data layer 行为一致。

---

## 二、本批新增（v0.7）

| 模块 | 交付 |
|------|------|
| **投屏模式** | `/rehearsal` → 全屏 Facilitator · 环节/全会计时 · 清单勾选 |
| **LLM Agent** | `lib/stratos/llm-agent.ts` · OpenAI-compatible · 无 key 则 rules fallback |

### LLM 配置

```env
OPENAI_API_KEY=sk-...
STRATOS_LLM_MODEL=gpt-4o-mini
STRATOS_LLM_BASE_URL=https://api.openai.com/v1  # 可选，兼容 Azure/本地
```

---

## 三、Phase 3++（v0.6 · 已完成）

| 模块 | 交付 |
|------|------|
| **Q3 彩排** | `/rehearsal` · 6 环节 Walkthrough · [REHEARSAL_Q3.md](./REHEARSAL_Q3.md) |
| **11-Agent 编排** | `lib/stratos/agents.ts` · `POST /api/agents/orchestrate` |
| **WorkOS 回调** | `/api/auth/workos` · `/api/auth/callback` · 登录页 SSO 按钮 |
| **报告中心** | AgentOrchestrationPanel · 全链路运行 |

---

## 四、11-Agent 列表

ReportIngest → MintzbergScanner → CoverageExtractor → HealthAssertion → FpaReconciler → StratDiffAnalyst → GateAuditor → SpbpForecaster → TechSignalScanner → RobustScorer → SnapshotAdvisor

---

## 五、认证配置

```env
# 演示登录（默认开放，无需 WorkOS）
# 演示账号见 /login

# 强制全站登录
STRATOS_REQUIRE_AUTH=1

# WorkOS Enterprise SSO
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_...
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

---

## 六、仍属 V6.3+（未做 / 部分完成）

- LLM 解析层替换规则引擎
- StratSim 完整系统动力学（当前为离散季度 MVP）
- CEO PDF A3 版式与浏览器 `/print/panorama` 像素级对齐

---

*Q3 战略会可彩排 · `/rehearsal` 180 分钟标准包 · 访问管理 `/admin/access`*
