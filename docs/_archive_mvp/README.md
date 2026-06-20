# StratOS 战略推演系统

轻量全栈 MVP，用于验证 Q3 战略会场景下的议题推进、证据确认、会议决策、责任清单、账户权限和使用日志。

## 运行

```bash
npm run check
npm run test:smoke
npm run test:api
npm start
```

访问：

```text
http://localhost:3100
```

直接打开 `index.html` 也能演示，但属于离线模式，不会写入后端和使用日志。

## Docker

```bash
docker compose up --build
```

访问：

```text
http://localhost:3100
```

## 当前能力

- 会议工作台：议题队列、证据包、会议结论、通过/退回/终止、责任清单。
- CEO 指挥舱：四灯健康度、断言阻断、核心挑战。
- 三栈战略选择：资本栈、产品栈、渠道栈同屏管理。
- FPA 联动：Budget_Tag 控制预测曲线接入。
- Assertion Engine：Runway、毛利、现金缺口、渠道集中度。
- StratDiff：快照之间自动生成战略差分事件。
- 战略会模式：诊断、选择、底线、承诺四步流程。
- 账户/RBAC：admin、finance、owner、viewer。
- 使用日志：关键操作写入 `data/audit.log`。

## 推荐使用路径

1. 进入“会议工作台”。
2. 从左侧选择一个待决议题。
3. 中间查看证据包，修改会议结论。
4. 点击“通过并分派”“退回补证据”或“终止”。
5. 右侧自动生成会后责任清单，后续进入快照和复盘。

## 验证

```bash
npm run check
npm run test:smoke
npm run test:api
```

`test:smoke` 覆盖：

- 角色权限。
- Assertion 规则。
- 战略选择清洗。
- 快照冻结。
- StratDiff 生成。
- 对外状态裁剪。

`test:api` 不监听端口，直接模拟 API 请求，覆盖：

- 只读用户读取状态。
- viewer 禁止读取审计日志。
- owner 可创建战略选择但不能冻结快照。
- finance 可冻结快照但不能治理账户。
- admin 可调整角色。
- 审计日志写入关键动作。

## 文档

- `PRODUCT_SPEC.md`：产品规格。
- `ARCHITECTURE.md`：前后端、账户、日志、部署和数据库迁移设计。
