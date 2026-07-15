---
description: StratOS 上线部署 — 预检、构建、数据库迁移、发布、探活
---

上线前先在本地把代码门禁跑绿，再在生产服务器执行发布。工作目录始终为仓库根 `/Users/tiechuishan/Documents/StratOS`（生产服务器为部署目录，如 `C:\StratOS`）。

# 阶段 1 · 本地门禁（发布前必须全绿）

以下步骤在开发机执行，任一失败则**停止**，先修复再继续。

// turbo
1. 类型检查：`npx tsc --noEmit`

// turbo
2. Lint 零警告：`npx eslint app components --max-warnings 0`

// turbo
3. 字号棘轮闸门：`npm run check:type-drift`

// turbo
4. 单元测试：`npm test`（期望 `# fail 0`）

// turbo
5. 端到端冒烟：`npx playwright test`（期望 0 failed）

// turbo
6. 生产构建：`npm run build`（必须成功结束）

# 阶段 2 · 推送代码

7. 确认工作区干净且已提交：`git status -sb`
8. 推送到远端：`git push origin main`
   - 注意：提交时用 `git add <具体文件>`，**不要用 `git add -A`**，避免卷入未完成的在制品。

# 阶段 3 · 生产服务器发布

在生产服务器（Windows Server，部署目录如 `C:\StratOS`）执行。

9. 拉取最新代码 / 解压发布包到部署目录。

10. 补齐生产环境变量 `.env.production`，以下 4 项**必须**存在（参照 `deploy/windows/env.production.example`）：
    - `STRATOS_PUBLIC_URL` — 生产域名，如 `https://stratos.example.com`
    - `WORKOS_REDIRECT_URI` — 必须与 WorkOS Dashboard 登记的 `https://your-domain/api/auth/callback` 完全一致
    - `WORKOS_WEBHOOK_SECRET` — Directory Sync webhook 密钥
    - `DATABASE_URL` — PostgreSQL 连接串
    另外确认 `WORKOS_CLIENT_ID`、`WORKOS_API_KEY` 已设置。

11. 安装依赖并生成 Prisma 客户端：
    ```
    npm ci
    npx prisma generate
    ```

12. 数据库迁移（**关键，勿跳过**）：
    ```
    npx prisma migrate deploy
    ```
    这会 apply 所有未执行的 migration。Windows 部署脚本历史上用 `prisma db push`，但生产**优先用 `migrate deploy`** 以保留迁移历史。

13. 构建并启动：
    ```
    npm run build
    npm start
    ```
    （`npm start` 监听 3003 端口；Windows 上按 `deploy/windows/README.md` 用 `.\scripts\Deploy.ps1` 起服务 + Nginx 反代。）

# 阶段 4 · 上线后验证

14. 生产预检 + HTTP 探活：
    ```
    npm run preflight -- --http
    ```
    期望：Go-live checklist 全 ✓、`/api/health` 返回健康。

15. 浏览器人工抽查关键路径：
    - `/login` → WorkOS SSO 登录成功
    - `/command`（总览 / A3 全景 tab）
    - `/execution`（兑现 / 分析 / 明细 tab）
    - `/finance`、`/market`、`/strategy/input`
    - 一页纸打印/导出：`/print/panorama`

# 回滚

若上线后异常：
16. 切回上一个正常 tag/commit：`git checkout <上一个正常commit>`，重跑阶段 3 的第 12–13 步。数据库迁移一般向前兼容；如迁移引发问题，需针对性回滚该 migration（谨慎，先备份）。
