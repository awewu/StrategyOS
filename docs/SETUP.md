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
| WorkOS Webhook | `WORKOS_WEBHOOK_SECRET` | Webhook 返回 501（未配置密钥） |
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

## WorkOS（Enterprise SSO · ~30 人核心层）

### 1. WorkOS Dashboard

1. 登录 [WorkOS Dashboard](https://dashboard.workos.com)，创建 **User Management** 应用（AuthKit）。
2. 记录 **Client ID** 与 **API Key**（`sk_…`）。
3. 若使用 Directory Sync / SCIM，创建 **Organization** 并记录 `org_…`。

### 2. 本地 `.env`

```env
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_...
WORKOS_REDIRECT_URI=http://localhost:3003/api/auth/callback
WORKOS_ORGANIZATION_ID=org_...          # 可选：限定组织 SSO
WORKOS_WEBHOOK_SECRET=whsec_...         # Directory Sync 用户同步

# 生产必填（~30 人）
STRATOS_REQUIRE_AUTH=1
STRATOS_SESSION_SECRET=                 # openssl rand -base64 32
```

验证配置：

```bash
npm run workos:check
```

### 3. Dashboard 回调与 Webhook

| 项 | 值 |
|----|-----|
| Redirect URI（本地） | `http://localhost:3003/api/auth/callback` |
| Redirect URI（生产） | `https://<your-domain>/api/auth/callback` |
| Webhook URL | `https://<your-domain>/api/auth/workos/webhook` |
| Webhook Events | `dsync.user.created`, `dsync.user.updated`, `dsync.user.deleted` |

> 默认 dev 端口为 **3003**（见 `PORT` / `package.json`），勿与 PLM 的 3000 混淆。

本地 Webhook 调试： [ngrok](https://ngrok.com) 或 WorkOS CLI 转发到 `localhost:3003`。

### 4. 登录行为

| 环境 | 行为 |
|------|------|
| 开发（无 `STRATOS_REQUIRE_AUTH`） | 演示账号 + SSO 按钮（若已配 WorkOS） |
| `STRATOS_REQUIRE_AUTH=1` + WorkOS 已配 | **仅 SSO**；演示登录 API/UI 关闭 |
| `STRATOS_REQUIRE_AUTH=1` + 无 WorkOS | 演示登录仍可用（启动时会警告，不推荐生产） |

路由：

- `GET /api/auth/workos` — 跳转 AuthKit
- `GET /api/auth/callback` — OAuth 回调、签发 session
- `POST /api/auth/workos/webhook` — Directory Sync 用户入库

### 5. 上线检查清单

- [ ] `STRATOS_REQUIRE_AUTH=1`
- [ ] `STRATOS_SESSION_SECRET` ≥ 32 字符
- [ ] `WORKOS_CLIENT_ID` + `WORKOS_API_KEY`
- [ ] 生产 Redirect URI 与 `WORKOS_REDIRECT_URI` 一致
- [ ] Webhook 密钥与 Dashboard 一致
- [ ] `npm run workos:check` 无阻塞项
- [ ] `GET /api/health` 中 `workos.configured: true`

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
