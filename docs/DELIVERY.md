# StratOS · 工程级交付清单

**版本：** v1.1 · 2026-06-22  
**适用：** GitLab CI 门禁 · Docker 生产镜像 · 上线前 preflight

> 生产部署详见 **[PRODUCTION.md](./PRODUCTION.md)**（镜像、探针、回滚、备份）。

---

## 交付标准（必须全绿）

| 门禁 | 命令 | 说明 |
|------|------|------|
| 快速自检 | `npm run harness` | 环境 · 路由清单 · DB · 134 单元测试 |
| CI 门禁 | `npm run harness:ci` | Quick + ESLint |
| 生产构建 | `npm run build` | Next.js standalone；dashboard 为 force-dynamic |
| E2E 冒烟 | `npm run test:e2e` | Playwright 12 条核心路径 |
| 类型检查 | `npx tsc --noEmit` | 全量 TS |
| 上线前检 | `npm run preflight -- --http --strict` | 生产 env + DB + 战略计划 + `/api/health` |

GitLab Pipeline（`.gitlab-ci.yml`）在 `main` / MR 上自动跑：**harness → build → e2e**。

---

## 生产认证（WorkOS）

`STRATOS_REQUIRE_AUTH=1` 时：

| 行为 | 说明 |
|------|------|
| 强制登录 | 无 session → 重定向 `/login`（`proxy.ts`） |
| Demo 登录禁用 | WorkOS 已配置时 `/api/auth/login` 返回 403 |
| 角色切换隐藏 | `RoleSwitcher` 不渲染；角色来自 Prisma 用户 |
| Session 签名 | `STRATOS_SESSION_SECRET`（≥32 字符）HMAC 签 cookie |
| 启动校验 | `instrumentation.ts` → `validateProductionEnv()` |

**必填 env（生产）：**

```bash
DATABASE_URL=postgresql://...
STRATOS_PUBLIC_URL=https://stratos.example.com
STRATOS_REQUIRE_AUTH=1
STRATOS_SESSION_SECRET=   # openssl rand -base64 32
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_...
WORKOS_REDIRECT_URI=https://stratos.example.com/api/auth/callback
```

校验：`npm run preflight` · `npm run workos:check`

---

## 本地一键验收

```bash
cd StratOS
npm run setup          # 首次：.env + Postgres + seed
npm run harness:ci
npm run build
npx tsc --noEmit
npm run test:e2e       # 需 dev 或 start 在 3003
npm run preflight -- --http --strict
```

---

## Docker 生产部署

```bash
cp .env.example .env.prod   # 填写生产变量
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app npx prisma db push
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
```

容器内监听 **3000**（见 `Dockerfile`）；本地 dev 用 **3003** 避免与 PLM 冲突。

---

## 运行时行为

- **数据源标识：** 所有 dashboard 页顶有 `DataSourceBanner`（演示 / 数据库 / 部分回退）。
- **DB 容错：** `safeDbQuery` + 连接池上限；生产环境 fallback 写 `console.error` 日志。
- **导航：** 全量 hub 可见；CEO「更多」折叠未启用（见 `sidebar-layout.ts` PRODUCT GUARD）。

---

## 定量分析层升级（Calibrated Quantitative Engines）

把推演从“启发式硬编码”升级为可校准、可复现、概率化的模型：

| 引擎 | 升级前 | 升级后 |
|------|--------|--------|
| 贝叶斯更新 | ±15% 加性 nudge | `lib/stratos/bayes.ts` — 真正后验 `∝ 先验 × 似然`，无信息证据不改先验，似然比 = exp(强度) |
| 概率预测 | 无 | `lib/stratos/monte-carlo.ts` — 情景混合 + 对数正态噪声，输出 P10/P50/P90 + P(runway<3)，种子固定可复现 |
| 反事实 | 写死常量（200/季 等） | `lib/stratos/driver-model.ts` — 驱动式弹性，**锚定真实营收预测**，弹性系数可覆盖/校准 |
| 仿真初值 | 硬编码（signings=820…） | `lib/stratos/calibrate.ts` — `deriveSimSeed` / `deriveDynamicsInitial` 从 FPA 反推；`runStratSim` 接受注入 seed |
| 历史校准 | 无 | `calibrateForecastBias` 从 B-A-F 历史拟合偏差/MAPE，`applyForecastBias` 去偏 |
| StratDiff | ~9 类 | 新增 INTENT_CHANGE / ASSUMPTION_NEW / COMMITMENT_DROP / HEALTH_LIGHT / IC_ROI_DEVIATION / CAPSTACK_CHANGE / CAPACITY_GAP / PRODUCT_BET_CHANGE（~16 类） |

**UI**：`/finance?tab=scenarios` 新增「蒙特卡洛概率预测」卡（P10/P50/P90 + 跨安全线概率）；证据按钮走真贝叶斯更新。
**测试**：`lib/stratos/{bayes,monte-carlo,driver-model,calibrate}.test.ts` + 反事实属性测试（单调性、数据锚定）。

---

## 审计防篡改（Tamper-Evident Audit）

`UsageLog` 为 **SHA-256 哈希链**（append-only）：每条 `hash = SHA-256(prevHash + 不可变字段)`，
`prevHash` 指向上一条的 `hash`。任何篡改、删除或重排都会断链。

| 能力 | 实现 |
|------|------|
| 哈希计算 | `lib/audit/hash.ts`（稳定序列化，metadata 键序无关）|
| 写入链接 | `lib/audit/log-event.ts` — DB 事务内读 tip → 计算 → 写入；内存链同理 |
| 不静默丢失 | DB 写失败 `console.error` 并降级到内存链（不再吞异常）|
| 完整性校验 | `lib/audit/verify-chain.ts` → `verifyAuditChain()`，检出 `content-tampered` / `link-broken` / `missing-hash` |
| 可视化 | `/admin/access` 顶部 **链完整/链异常** 徽章 + 每条哈希前缀 |
| 迁移 | `prisma/migrations/20260624120000_audit_hash_chain` · harness 校验 `usage_logs.hash` 列 |

**敏感操作覆盖（埋点）：** 状态变更（freeze / diff / spbp / 登录 / webhook / 市场扫描）+ 敏感**读**：
`fpa_view`（FPA 财务）· `admin_view`（`/admin/access`、`/admin/org`）· `audit_export`（导出）。

**取证导出：** `GET /api/audit/export?format=csv|json`（`requireApiAdmin` L4）—
返回全量链 + 完整性校验结果，响应头 `X-Audit-Integrity: verified|broken`；`/admin/access` 提供「导出 CSV / JSON」按钮。CSV 经 `lib/audit/export.ts` RFC-4180 转义。

---

## 权限（产品决策 · 有意为之）

| 路由 | 最低级别 | 角色 |
|------|----------|------|
| `/finance`, `/fpa` | L3 | **仅 CEO** |
| `/command`, `/inbox` | L3 | CEO |
| `/strategy/input` | L2 | VP、staff、CEO |
| `/admin/*` | L4 | CEO + staff |

Staff 可编战略录入，**不可**进 FPA 财务页 — 符合 ~30 人高管沙盘定位。

---

## 已知非阻塞项（Phase C · 上线后）

- 五角色 nav 过滤 E2E · Rehearsal tablet 1280+ · Chart visual regression
- 完整 SCR 数据库持久化
- Mobile rehearsal tablet

## Phase B 完成（2026-06-22）

- Token 系统：`globals.css` · `lib/brand/tokens.ts` · `ppt-palette.ts` · `display-labels.ts`
- 指挥舱 12 列网格 + Light 预览 + ROS/EBITDA KPI + A3 打印 theme
- 详见 [UI_VI_EVOLUTION.md](./UI_VI_EVOLUTION.md) §八

---

## 相关文档

- [PRODUCTION.md](./PRODUCTION.md) · [SETUP.md](./SETUP.md) · [HARNESS.md](./HARNESS.md)
- 产品总纲：[STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md)
