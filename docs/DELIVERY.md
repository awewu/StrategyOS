# StratOS · 工程级交付清单

**版本：** v1.0 · 2026-06-22  
**适用：** GitLab CI 门禁 · Docker 生产镜像 · 上线前 preflight

---

## 交付标准（必须全绿）

| 门禁 | 命令 | 说明 |
|------|------|------|
| 快速自检 | `npm run harness` | 环境 · 路由清单 · DB · 134 单元测试 |
| CI 门禁 | `npm run harness:ci` | Quick + ESLint |
| 生产构建 | `npm run build` | Next.js standalone；dashboard 为 force-dynamic |
| E2E 冒烟 | `npm run test:e2e` | Playwright 6 条核心路径 |
| 上线前检 | `npm run preflight -- --http --strict` | 生产 env + DB + 战略计划 + `/api/health` |

GitLab Pipeline（`.gitlab-ci.yml`）在 `main` / MR 上自动跑：**harness → build → e2e**。

---

## 本地一键验收

```bash
cd StratOS
npm run setup          # 首次：.env + Postgres + seed
npm run harness:ci
npm run build
npm run test:e2e       # 需 dev 或 start 在 3003
npm run preflight -- --http --strict
```

---

## Docker 生产部署

```bash
docker compose up -d postgres
npm run db:push && npm run db:seed
docker build -t stratos:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e STRATOS_PUBLIC_URL="https://stratos.example.com" \
  stratos:latest
```

容器内监听 **3000**（见 `Dockerfile`）；本地 dev 用 **3003** 避免与 PLM 冲突。

---

## 运行时行为

- **数据源标识：** 所有 dashboard 页顶有 `DataSourceBanner`（演示 / 数据库 / 部分回退）。
- **DB 容错：** `safeDbQuery` + 连接池上限；连接耗尽时降级 demo 组织树，不白屏。
- **导航：** 全量 hub 可见；CEO「更多」折叠未启用（见 `sidebar-layout.ts` PRODUCT GUARD）。

---

## 已知非阻塞项（Phase B/C）

- 指挥舱 12 列布局 · PPT 图标 inline hex · 董事会 Light 预览切换
- WorkOS SSO：生产需配置 `WORKOS_*`；未配置时为 demo 角色切换
- `/finance` 仅 CEO（L3）；staff 可编战略但不可进 FPA 页

---

## 相关文档

- [SETUP.md](./SETUP.md) · [HARNESS.md](./HARNESS.md) · [README.md](../README.md)
- 产品总纲：[STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md)
