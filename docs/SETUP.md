# StratOS 环境配置

一键初始化：

```bash
npm install
npm run setup
```

`setup` 会：创建 `.env`、下载中文字体、启动 Docker Postgres（若可用）、`prisma db push` + seed，并打印能力状态。

## 能力矩阵

| 能力 | 环境变量 | 未配置时 |
|------|----------|----------|
| DB 模式 | `DATABASE_URL` | Demo 数据 |
| WorkOS SSO | `WORKOS_*` | Demo 用户 + Cookie |
| WorkOS Webhook | `WORKOS_WEBHOOK_SECRET` | 跳过签名校验（dev） |
| LLM Agent | `OPENAI_API_KEY` | Rules 引擎 |
| 中文 PDF | `npm run fonts:fetch` | Helvetica 英文 |

检查运行时状态：`GET /api/health`

## 数据库

```bash
docker compose up -d          # Postgres 16 @ localhost:5432
npm run setup:db              # 仅 DB 初始化
```

默认连接串（`.env.example`）：

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stratos"
```

## WorkOS（Enterprise SSO）

在 [WorkOS Dashboard](https://dashboard.workos.com) 创建应用后填入 `.env`：

```env
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_...
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
WORKOS_ORGANIZATION_ID=org_...
WORKOS_WEBHOOK_SECRET=whsec_...
STRATOS_REQUIRE_AUTH=1        # 可选：强制登录
```

Dashboard 配置：

| 项 | 值 |
|----|-----|
| Redirect URI | `http://localhost:3000/api/auth/callback`（生产换域名） |
| Webhook URL | `https://<your-domain>/api/auth/workos/webhook` |
| Events | `dsync.user.created`, `dsync.user.updated`, `dsync.user.deleted` |

本地 Webhook 调试可用 [ngrok](https://ngrok.com) 或 WorkOS CLI 转发。

## LLM（报告解析 / Agent 编排）

```env
OPENAI_API_KEY=sk-...
STRATOS_LLM_BASE_URL=https://api.openai.com/v1   # 可选，兼容 OpenAI API
STRATOS_LLM_MODEL=gpt-4o-mini                     # 可选
```

## 中文字体

```bash
npm run fonts:fetch
# → public/fonts/NotoSansSC-Regular.otf
```

CI 内网无法访问 CDN 时，手动放置 OTF 到 `public/fonts/`。

## 常用命令

```bash
npm run dev
npm test
npm run build
npm run test:e2e
npm run setup -- --skip-docker   # 已有 Postgres 时
```
