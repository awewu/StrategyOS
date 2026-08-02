# StratOS 生产级交付检查表

## 已落地

| 要求 | 当前证据 |
| --- | --- |
| 前端产品界面 | `index.html`, `styles.css`, `app.js` |
| 战略会工作台 | 议题队列、证据包、决策按钮、责任清单 |
| 后端 API | `server.js` |
| 前后端拉通 | 前端 API 优先调用 `/api/state`, `/api/commitments`, `/api/metrics`, `/api/snapshots`, `/api/audit`, `/api/users` |
| 离线演示回退 | `file://` 打开时使用本地状态，不阻塞评审 |
| 账户机制 | `users`, `rolePermissions`, 账户切换、账户治理面板 |
| RBAC | admin / finance / owner / viewer 权限矩阵 |
| 使用日志 | `data/audit.log`, `/api/audit`, 前端 Audit Trail |
| 复盘闭环 | Snapshot Ledger, StratDiff, action list, audit log |
| 部署工件 | `Dockerfile`, `docker-compose.yml`, `.env.example`, `README.md` |
| 架构说明 | `ARCHITECTURE.md`, `PRODUCT_SPEC.md` |

## 已验证

```bash
npm run check
npm run test:smoke
npm run test:api
```

覆盖范围：

1. `server.js` 与 `app.js` 语法检查。
2. 角色权限矩阵。
3. Assertion 规则。
4. StrategicCommitment 清洗。
5. 快照生成与 StratDiff。
6. public state 权限裁剪。
7. audit log append/read。
8. Docker / compose / env 文件存在性。
9. 产品文案中不再使用争议性战略术语。
10. API 路由权限与审计写入通过无端口模拟测试。

## 当前环境限制

当前 Codex 沙箱阻止监听本地端口，`npm start` 在本环境会触发 `listen EPERM`。因此本轮无法在沙箱内完成浏览器访问 `http://localhost:3100` 的端到端验证。

在本机终端或部署环境中运行：

```bash
npm start
```

然后访问：

```text
http://localhost:3100
```

## 上线前仍需补齐

1. 将 `data/store.json` 迁移到 PostgreSQL。
2. 接入企业 SSO / OIDC，替换 `x-stratos-user` 模拟登录。
3. 为快照增加不可变存储约束。
4. 增加 API 集成测试和浏览器端到端测试。
5. 增加 Excel 导入模板与解析器。
6. 增加备份、恢复和审计日志归档策略。
