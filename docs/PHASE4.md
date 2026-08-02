# Phase 4 · 生产就绪

Phase 3 v1.1 功能已闭合；Phase 4 覆盖部署、联调与自动化验证。

## 交付清单

| 项 | 路径 | 状态 |
|----|------|------|
| 一键 Setup | `npm run setup` · `scripts/setup.ts` | ✓ |
| Docker Postgres | `docker-compose.yml` | ✓ |
| 生产镜像 | `Dockerfile` · `output: standalone` | ✓ |
| 健康检查 | `GET /api/health` | ✓ |
| E2E 冒烟 | `e2e/smoke.spec.ts` · Playwright | ✓ |
| CI | `.github/workflows/ci.yml` | ✓ |
| 环境文档 | `docs/SETUP.md` | ✓ |

## 部署选项

### Vercel

1. 连接 Git 仓库
2. 环境变量：`DATABASE_URL`、WorkOS、OpenAI（见 SETUP.md）
3. Build：`npm run build`（CI 已验证）
4. 部署后配置 WorkOS Redirect / Webhook 为生产域名

### Docker

```bash
docker compose up -d postgres
npm run setup -- --skip-docker
docker build -t stratos .
docker run -p 3000:3000 --env-file .env stratos
```

生产需挂载或预置 `public/fonts/NotoSansSC-Regular.otf`。

## WorkOS 生产联调

1. 创建 Production 环境应用
2. Redirect URI → `https://<domain>/api/auth/callback`
3. Webhook → `https://<domain>/api/auth/workos/webhook`
4. 启用 Directory Sync（SCIM）并绑定 Organization
5. 设置 `STRATOS_REQUIRE_AUTH=1`
6. 用 CEO 测试账号走 SSO → `/admin/access` 确认审计日志

## E2E 测试计划

```bash
npm run test:e2e                    # 本地（自动起 dev server）
PLAYWRIGHT_NO_SERVER=1 npm run test:e2e   # 已有 dev 进程时
```

覆盖路径：

- `/` → `/command`
- `/decode` · `/rehearsal` · `/print/panorama` · `/admin/access`
- `/api/health` 能力 JSON

扩展建议（后续）：登录流、快照冻结、PDF 下载、StratSim POST。

## 仍需人工配置

- WorkOS `WORKOS_*` 生产密钥
- `OPENAI_API_KEY` 或兼容 API
- 托管 Postgres（Neon / RDS / Supabase 等）
- 生产域名 + TLS
