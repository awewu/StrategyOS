# StratOS · StratDiff 30 类判定规则

**版本：** v1.0 · 2026-06-14  
**实现：** `lib/stratos/strat-diff.ts`  
**关联：** [REPORT_FORMATS §6](./REPORT_FORMATS.md) · [THEORY_IMPORTS I2](./THEORY_IMPORTS.md) · [OBJECT_MODEL](./OBJECT_MODEL.md)

---

## 一、对比输入

```typescript
interface DiffInput {
  from: SnapshotStatePayload;  // 较早快照 stateJson
  to: SnapshotStatePayload;    // 较晚快照 stateJson
  reportsBetween?: Report[];   // 两快照间月报/季报（Mintzberg #15–17）
}
```

**规定对比组合：** 年中 vs 年底 · 年底 vs 年底 · 可选三年 drift。

---

## 二、Mintzberg 四类（#15–18）· 详细判定

### 2.1 前置：对象 formation 标签

每个 deliberate 对象在 **from 快照** 存在且在 **to 快照** 仍存在的，参与「实现率」计算：

| object_type | deliberate 判定 |
|-------------|-----------------|
| `key_result` | from 中存在且 linked 到 approved objective |
| `project` | status ∈ {active, completed} 且 progress > 0 |
| `investment_case` | gate_status = approved |
| `product_bet` / `gtm_bet` | gate_status = approved |

### 2.2 #15 涌现模式识别（EMERGENT_PATTERN）

**触发条件（满足任一）：**

1. 月报 §8 `strategy_patterns[]` 中 `formation_type=emergent` 且 `linked_okr=[]`  
2. to 快照 `StrategyPattern.emergentPatterns` 新增条目，且 **from 快照无同名 title**  
3. to 中某 KR/Vx 的 `revenue_actual` 或 coverage 显著贡献，但 **from 快照 OKR 树无对应 O/KR**

**算法：**

```
FOR each report §8 pattern WHERE formation_type = emergent:
  IF pattern.linked_okr is empty OR not in from.deliberate_set:
    EMIT diff #15 {
      title: pattern.title,
      formationType: emergent,
      severity: medium,
      evidenceReportIds: [report.id],
      suggestDeliberate: pattern.suggest_deliberate ?? true
    }

FOR each item in to.strategyPattern.emergentPatterns:
  IF item.title NOT IN from.strategyPattern.emergentPatterns.titles:
    EMIT diff #15 (dedupe by title)
```

**UI 高亮：** 琥珀金左边框 + 「涌现」角标；diff 页置顶 Mintzberg 章。

### 2.3 #16 未实现意图（UNREALIZED）

**触发条件：**

1. from 快照 deliberate 对象在 to 中 **消失或 gate_status→killed/rejected**  
2. from 中 `project.status=active` 且 progress=0，to 中仍为 active 且 progress=0（跨整段对比期无启动）  
3. from OKR-KR 在 to 中被 **删除** 且无替换 KR 映射

**算法：**

```
deliberate_from = extractDeliberateObjects(from)
FOR each obj in deliberate_from:
  to_obj = findInTo(obj)
  IF to_obj is null OR to_obj.gate_status in (killed, rejected):
    EMIT diff #16 { objectType, objectId, title, severity: medium }

FOR each vx in from.projects WHERE vx.status=active AND vx.progress=0:
  IF to.projects[vx.id].progress=0 AND monthsBetween > 6:
    EMIT diff #16 { title: "Vx 未启动: {vx.code}" }
```

### 2.4 #17 偶成成果（SERENDIPITOUS）

**触发条件：**

1. 月报 §8 `formation_type=serendipitous`  
2. to 快照 revenue/profit **超预期** 且 **无对应 deliberate KR 达成**（FPA actual ↑ >15% vs budget，且 linked KR 未 green）  
3. `StrategyPattern.serendipitousItems` 新增

**算法：**

```
FOR each report §8 WHERE formation_type = serendipitous:
  EMIT diff #17 { title, evidenceReportIds, severity: medium }

IF to.fpa.revenueActual / to.fpa.revenueBudget > 1.15:
  unattributed = revenueDelta NOT explained by deliberate KR achievements
  IF unattributed > threshold(5% revenue):
    EMIT diff #17 { title: "营收超预期且无 deliberate 归因", fpaImpactNote }
```

**学习提示：** 自动追加 `learningPrompts`：「偶成是否写入下版 deliberate？」

### 2.5 #18 刻意实现率骤降（DELIBERATE_RATE_DROP）

**触发条件：**

```
rate_from = from.strategyPattern.deliberateRealizationRate
rate_to   = to.strategyPattern.deliberateRealizationRate
delta     = rate_to - rate_from

IF delta <= -15 percentage points:
  severity = high
ELSE IF delta <= -10:
  severity = warning
ELSE:
  skip

EMIT diff #18 {
  title: "刻意实现率 {rate_from}% → {rate_to}%",
  beforeJson: { rate: rate_from },
  afterJson: { rate: rate_to },
  severity
}
```

**deliberateRealizationRate 计算：**

```
deliberate_set = deliberate objects at from snapshot still tracked in to
achieved = count WHERE:
  KR: currentValue meets target OR confidence >= 0.8
  Vx: progress >= 80 OR status=completed
  IC/Bet: gate_status in (approved, post_invest) AND fpaToggle=on
rate = achieved / len(deliberate_set) * 100
```

---

## 三、全 30 类速查

| # | DiffCategory | 判定摘要 | 默认严重度 |
|---|--------------|----------|------------|
| 1 | BSC_TARGET | BscMeasure.target 变化 >5% | high |
| 2 | OKR_REPLACE | O 下 KR 集合 Jaccard <0.5 | high |
| 3 | PROJECT_MIGRATE | Vx status/progress 跨阈值变 | medium |
| 4 | ASSUMPTION_FAILED | Hx result→failed | high |
| 5 | ASSUMPTION_NEW | to 新增 Hx 不在 from | medium |
| 6 | DOCTRINE_BREACH | DoctrineAudit.pass=false 计数增 | high |
| 7 | HEALTH_LIGHT | 任一 BSC 维灯恶化 | medium |
| 8 | COMMITMENT_DROP | 兑现率降 >10pp | medium |
| 9 | SATISFACTION_FAIL | 四满意校验失败项增 | high |
| 10 | RESOURCE_REALLOC | budget_tag 金额迁移 >10% | medium |
| 11 | COMPETITOR_EVENT | CompetitorIntel impact=high 新增 | high |
| 12 | INTENT_CHANGE | MissionVision / challenge 文本变 | critical |
| 13 | FPA_FORECAST | Forecast vs Budget 偏差 >10% | high |
| 14 | CASH_RUNWAY | runway 跨 3 月安全线 | critical |
| 15 | EMERGENT_PATTERN | §2.2 | medium |
| 16 | UNREALIZED | §2.3 | medium |
| 17 | SERENDIPITOUS | §2.4 | medium |
| 18 | DELIBERATE_RATE_DROP | §2.5 | high |
| 19 | IC_CHANGE | IC gate_status 变 | high |
| 20 | CAPSTACK_CHANGE | byHorizon 分布变 >10pp | high |
| 21 | CAPSTACK_CHANGE | cashPeakMonth/amount 变 | high |
| 22 | CAPACITY_GAP | gapUnits 变 >20% | high |
| 23 | ROADMAP_SLIP | targetQuarter 延后 ≥1Q | medium |
| 24 | PRODUCT_BET_CHANGE | ProductBet gate/horizon 变 | high |
| 25 | COMP_GAP_CHANGE | GapStatus 恶化 | medium |
| 26 | PRODUCT_MIX_CHANGE | H3 占比变 >5pp | medium |
| 27 | SEGMENT_PRIORITY | Segment priority 变 | high |
| 28 | CHANNEL_CELL_CHANGE | BrandChannelCell role 变 | medium |
| 29 | COVERAGE_TARGET | targetCoverage 变 >15% | medium |
| 30 | LTV_CAC_DETERIORATION | ltvCacRatio 跨红阈 | high |

---

## 四、输出与 UI

1. **排序：** critical → high → warning → info；同 severity 内 Mintzberg #15–18 优先  
2. **指挥舱 Top3：** 取 severity 加权分最高的 3 条  
3. **版本库页：** 先 **变化清单**，再下钻 before/after JSON  
4. **StrategyPattern 章：** 与 #15–18 diff 联动展示 learningPrompts  

---

*实现见 `computeStratDiff(from, to, reports)` · 单元测试见 `lib/stratos/strat-diff.test.ts`*
