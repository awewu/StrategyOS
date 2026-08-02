# StratOS 生产化交付骨架

## 1. 当前交付形态

当前仓库已经从静态原型升级为一个轻量全栈 MVP：

| 层 | 文件 | 责任 |
| --- | --- | --- |
| 前端 | `index.html` / `styles.css` / `app.js` | CEO 指挥舱、三栈战略选择、FPA、Assertion、战略会、StratDiff、使用日志 |
| API | `server.js` | 静态文件服务、REST API、RBAC、快照冻结、审计日志 |
| 数据 | `data/store.json` | 本地持久化状态，后续可迁移 PostgreSQL |
| 审计 | `data/audit.log` | JSON Lines 使用日志，记录关键变更 |
| 初始数据 | `data/default-state.json` | 可重置的 Demo 种子数据 |

前端支持两种模式：

1. `file://` 打开：离线演示模式，不写入后端。
2. `http://localhost:3100` 打开：API 模式，所有关键操作写入 `store.json` 和 `audit.log`。

## 2. API 边界

| Method | Path | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/health` | 无 | 服务健康检查 |
| `GET` | `/api/state` | `read` | 获取当前战略工作区 |
| `PUT` | `/api/metrics` | `write` | 更新月报指标并重算断言 |
| `POST` | `/api/commitments` | `write` | 创建战略选择 |
| `PATCH` | `/api/commitments/:id/status` | `write` | 更新战略选择状态 |
| `PUT` | `/api/budget-lines` | `write` | 切换 FPA 预算曲线 |
| `POST` | `/api/snapshots` | `freeze` | 冻结月度/季度/H1/FY 快照并生成 StratDiff |
| `PUT` | `/api/meeting-step` | `write` | 更新战略会流程步骤 |
| `GET` | `/api/audit` | `audit` | 读取使用日志 |

`/api/bets` 作为兼容路由保留，产品与新集成应使用 `/api/commitments`。

## 3. 账户与权限

当前采用请求头 `x-stratos-user` 模拟登录态，用户存放在 `data/store.json`。

| 角色 | 权限 | 典型用户 |
| --- | --- | --- |
| `admin` | `read`, `write`, `freeze`, `audit`, `admin` | CEO / 战略负责人 |
| `finance` | `read`, `write`, `freeze`, `audit` | CFO / FP&A |
| `owner` | `read`, `write` | 产品、渠道、项目负责人 |
| `viewer` | `read` | 观察者、参会成员 |

生产化替换建议：

1. 使用企业 SSO / OIDC 登录。
2. 将 `x-stratos-user` 替换为服务端 session 或 JWT。
3. 引入 tenant 隔离：所有表必须带 `tenant_id`。
4. 审计日志使用 append-only 存储，不允许普通业务接口修改。

## 4. 使用日志

当前 `audit.log` 采用 JSON Lines，一行一个事件。

记录字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 请求级事件 ID |
| `at` | ISO 时间 |
| `method` / `path` | API 入口 |
| `userId` / `userRole` | 操作者 |
| `action` | 业务动作 |
| 业务字段 | 如 `betId`, `snapshotId`, `metrics`, `diffs` |

必须记录的动作：

1. 月报指标更新。
2. 战略选择创建。
3. 战略选择状态变化。
4. FPA 预算曲线切换。
5. 快照冻结。
6. 战略会步骤切换。

## 5. 部署路径

### 本地

```bash
npm run check
npm run test:smoke
npm start
```

访问：

```text
http://localhost:3100
```

### 单机/内网服务器

1. 安装 Node.js 20+。
2. 将仓库部署到服务器目录。
3. 复制 `.env.example` 为 `.env`，设置 `HOST` / `PORT`。本地建议 `HOST=127.0.0.1`，容器或内网部署使用 `HOST=0.0.0.0`。
4. 使用 `pm2`, `systemd`, Docker 或平台进程管理运行 `npm start`。
5. 将 `data/` 挂载到持久化磁盘。

### Docker

```bash
docker compose up --build
```

`docker-compose.yml` 会将本地 `data/` 挂载到容器内 `/app/data`，确保 `store.json` 和 `audit.log` 不随容器重建丢失。

### 数据库迁移

`data/store.json` 后续建议拆成表：

| 表 | 说明 |
| --- | --- |
| `tenants` | 企业/组织 |
| `users` | 用户与角色 |
| `strategic_commitments` | 三栈战略选择 |
| `metrics_snapshots` | 月报指标 |
| `strategic_snapshots` | 冻结快照 |
| `stratdiff_events` | 差分事件 |
| `audit_events` | 使用日志 |

## 6. 下一阶段生产要求

1. 接入真实 Excel 导入模板。
2. 将本地 JSON 存储替换成 PostgreSQL。
3. 引入登录、组织、权限管理 UI。
4. 建立快照不可变约束。
5. 给审计日志增加检索、筛选和导出。
6. 建立自动化测试：API、权限、快照差分、断言规则、前端关键流程。
