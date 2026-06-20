# StratOS 战略推演系统 MVP 产品规格

## 1. MVP 定位

StratOS 不是 OKR/KPI 工具，也不是方法论展示屏，而是面向约 300 人企业、30 人核心层的战略会议与经营复盘系统。第一版产品只解决一条主闭环：

`议题 -> 证据 -> 决策 -> 责任清单 -> 快照冻结 -> StratDiff 复盘`

会议工作台是主入口：核心用户先完成“今天这场会要做出什么决定”，再进入三栈、FPA 和 StratDiff。

## 2. 核心对象

### StrategicSnapshot

战略快照是系统的历史锚点，每次月报、季度会、H1/FY 评审均可冻结。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `snapshot_id` | string | 快照唯一编号 |
| `period` | enum | `monthly` / `quarterly` / `h1` / `fy` |
| `rumelt_challenge` | string | 80 字以内核心挑战 |
| `doctrine_version` | string | 当前战略原则版本 |
| `commitments` | StrategicCommitment[] | 三栈战略选择集合 |
| `assertions` | AssertionResult[] | 底线断言结果 |
| `fpa_case_id` | string | 关联 FPA 版本 |
| `created_at` | datetime | 冻结时间 |

### StrategicCommitment

`InvestmentCase`、`ProductCommitment`、`GtmCommitment` 继承同一套战略选择基类。工程层早期保留 `bets` 兼容字段，产品与 API 对外逐步迁移为 `commitments`。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `commitment_id` | string | 选择编号 |
| `stack` | enum | `cap` / `prod` / `gtm` |
| `title` | string | 选择名称 |
| `hypothesis` | string | 选择假设 |
| `owner_id` | string | 负责人 |
| `status` | enum | `watch` / `success` / `kill` / `scale` |
| `budget_tag` | string? | 连接 FPA 的可选预算标签 |
| `cynefin_domain` | enum | `clear` / `complicated` / `complex` / `chaotic` |
| `evidence` | Evidence[] | 证据集合 |

## 3. StrategicCommitment 与 FPA 的物理勾连

隐性卡点的闭环规则：

1. 每个 StrategicCommitment 可选择绑定 `budget_tag`。
2. `budget_tag` 对应 FPA 中的预算科目、现金流项或 P&L 行。
3. 战略选择状态从 `watch` 变为 `success` 或 `kill` 时，FPA 自动生成一条可开关的预测曲线。
4. 未绑定 `budget_tag` 的 StrategicCommitment 仍可存在，但不得在系统中展示为“已形成财务联动”。
5. FPA 视图必须支持按 `cap`、`prod`、`gtm` 三栈过滤曲线。

## 4. 一票否决 Assertion 机制

因为 MVP 不接实时 ERP/CRM/API，一票否决不是实时流处理，而是强制断言。

触发点：

1. Excel 导入完成。
2. 月报数据更新。
3. 季度战略会快照冻结。
4. H1/FY 快照冻结。

首批断言：

| 断言 | 阈值 | 触发结果 |
| --- | --- | --- |
| 现金 Runway | `< 3 月` | CEO 指挥舱全局硬阻断 |
| 核心 SKU 毛利 | `< 25%` | 进入红灯健康度 |
| 现金流缺口 | `> 预算 8%` | FPA 风险高亮 |
| 渠道集中度 | `> 35%` | GTM 栈黄灯 |

断言结果必须写入 `StrategicSnapshot`，不能仅作为临时 UI 状态。

## 5. Cynefin 到执行监控的消费方式

项目与假设对象必须带 `cynefin_domain`，执行看板据此选择监控标准。

| Cynefin 域 | 适用对象 | 默认监控 |
| --- | --- | --- |
| `clear` | 标准化动作 | SLA、完成率、异常数 |
| `complicated` | 专业工程/运营项目 | KPI、里程碑、交付结果 |
| `complex` | 探索型战略选择 | 领先指标、学习速度、假设证伪 |
| `chaotic` | 危机处理 | 战时动作、响应时间、止损状态 |

## 6. StratDiff 规则方向

MVP 先实现 3 类高价值 Diff，后续扩展到 30 类：

1. `Deliberate Drift`：原定战略因底线断言或外部变化发生偏移。
2. `Emergent Lift`：非计划中的业务结果形成新机会。
3. `Unrealized Commitment`：战略选择未达证据阈值，需 kill、转向或继续学习。

## 7. 当前静态原型

当前仓库已从静态原型升级为可运行的轻量全栈 MVP：

| 文件 | 作用 |
| --- | --- |
| `index.html` | StratOS MVP 主界面 |
| `styles.css` | 产品视觉系统与响应式布局 |
| `app.js` | 场景切换、FPA 曲线、断言、快照交互 |
| `server.js` | API、RBAC、快照冻结、审计日志 |
| `data/store.json` | 本地持久化状态 |
| `data/audit.log` | 使用日志 |

打开方式：

直接打开 `index.html` 可进入离线演示模式；运行 `npm start` 后访问 `http://localhost:3100` 可进入 API 持久化模式。
