# StratSim · 反馈环推演规格（v0.8 MVP）

**位置：** `/decode` → Tab「StratSim · 反馈环」  
**引擎：** `lib/stratos/strat-sim.ts`  
**API：** `POST /api/strat-sim`

---

## 目的

在战略解码会上对 **R（增强）/ B（调节）/ D（延迟）** 三类反馈环做轻量 what-if，联动 FPA runway 预警，无需完整系统动力学建模。

## 参数（滑块）

| 参数 | 范围 | 含义 |
|------|------|------|
| `reinforceStrength` | 0–1 | R 环：签约 ↔ 口碑 正反馈强度 |
| `balanceStrength` | 0–1 | B 环：降价对份额/利润的调节强度 |
| `priceCut` | 0–0.5 | 降价力度 |
| `training` | 0–1 | 渠道培训投入 |
| `delayQuarters` | 1–4 | D 环：培训生效延迟（季度） |
| `horizonQuarters` | 4–12 | 推演长度（UI 默认 8） |

## 输出

每季度 `SimSnapshot`：

- 签约、口碑、利润、投入、中标率、现金 runway（月）
- `notes[]`：当季触发的环注记（如「B: 降价调节 → 份额↑ 利润↓」）

`simWarnings()` 在 trail 末端检查：

- runway &lt; 3 月 → HealthAssertion 级预警
- 口碑 &gt; 88 → R 环过热
- 利润 &lt; 600 → B 环压制利润

## 演示数据

`lib/stratos-demo-data.ts` → `feedbackLoops`（R/B/D 三条链）在面板顶部展示，与 `FeedbackLoopPanel` 静态卡片一致。

## API 示例

```bash
curl -X POST http://localhost:3000/api/strat-sim \
  -H 'Content-Type: application/json' \
  -d '{"horizonQuarters":8,"params":{"priceCut":0.3,"training":0.6}}'
```

## 导航

- ⌘K →「StratSim · 反馈环推演」→ `/decode?tab=stratsim`

## 后续（V6.3+）

- 与 Prisma `FeedbackLoop` 表持久化联动
- 多环耦合图、因果回路图导出
- 与 SPBP 情景参数双向同步
