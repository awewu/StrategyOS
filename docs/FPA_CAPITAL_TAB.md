# StratOS · FPA 财务页 · 资本 Tab 交互规范

**版本：** v1.0 · 2026-06-14  
**实现：** `app/(dashboard)/finance/page.tsx` · `components/finance/CapitalTab.tsx`  
**关联：** [STRAT_CAPITAL §9](./STRAT_CAPITAL.md) · [BLUEPRINT §16.1](./STRATOS_BLUEPRINT.md#161-fpa-脊梁--三栈--budget_tag-物理勾连)

---

## 一、页面结构

```
FPA 财务 (/finance)
├── Tab: 总览（B-A-F · 四品牌 P&L · runway）
└── Tab: 资本 ★ MVP+   ← 本文档
    ├── CapStack 摘要卡
    ├── CAPEX B-A-F 条
    ├── 三层面 / 五类 / 四品牌 分布
    ├── 现金波峰时间线
    ├── 投资管道 Kanban
    ├── 产能缺口反推
    └── budget_tag ↔ Bet 展开面板
```

**角色：** CEO 只读 · staff 可编辑 IC 金额 / 导入 Sheet10·12。

---

## 二、CapStack 摘要卡

| 元素 | 数据源 | 交互 |
|------|--------|------|
| CAPEX B-A-F 条 | `CapStackPeriod` | 悬停显示三态数值（Mono 字体） |
| 三层面 H1/H2/H3 | `byHorizonJson` | 点击筛选下方管道 |
| 现金波峰 | `cashPeakMonth` + `cashPeakAmount` | 点击滚动至波峰时间线 |
| runway 波峰后 | `runwayAfterPeak` | <3 月 → 珊瑚红 + 链至 HealthAssertion |

---

## 三、投资管道 Kanban

**列：** `review` · `approved` · `post_invest` · `killed`

**卡片字段：** code · title · capexTotal · IRR · horizon · gate_status · budget_tag

**交互：**

| 动作 | 行为 |
|------|------|
| 点击卡片 | 右侧抽屉：IC 详情 + 挂载 Hx/Vx + FPA Toggle |
| 拖拽 review→approved | 触发 Gate 校验；无 budget_tag → **阻塞** |
| approved→killed | 确认弹窗 → `syncBetFpaToggle` → Forecast OFF + ghost 线 |
| 点击 budget_tag | 高亮 FPA 行对应 `FpaBudgetLine` |

---

## 四、budget_tag ↔ FPA Toggle 展开面板

```
┌─ FPA 行: IC-2026-01 RUUD 渠道中心 ──────────────────────┐
│ B ¥2800万  A ¥1200万  F ¥2600万  [Toggle ON ●]          │
│ ▼ 挂载 Bet (1)                                            │
│   InvestmentCase IC-2026-01 · approved · capex ¥2800万    │
│   ProductBet PB-V4-2026 · linked_ic · Toggle ON           │
└───────────────────────────────────────────────────────────┘

Toggle OFF (killed):
│ F ¥0  [Toggle OFF ○]  ghost: ¥2600万 (2026-05 killed)     │
```

**规则：**

- Toggle 只读于 CEO；staff 通过 IC gate_status 间接控制  
- ghost 线：灰色虚线，仅 diff 页与资本 Tab 可见  
- 同一 `budget_tag` 多 Bet 挂载 → 列表展示，Forecast 取 sum(approved)

---

## 五、产能缺口反推

| 字段 | 展示 |
|------|------|
| demand / capacity / gap | 三数字 + 利用率条 |
| gap_action | invest / outsource / defer_demand 标签 |
| linked IC | 可点击跳转管道卡片 |

**预警：** utilization <75% 黄 · <60% 红 · gap >20% 变 → StratDiff #22 候选

---

## 六、现金波峰时间线

- X 轴：FY 各月  
- Y 轴：累计 CAPEX 支出 + 现金余额曲线（双轴）  
- 波峰月：琥珀金竖线标注  
- 与 `CashPosition.runwayMonths` 联动：波峰后 runway 数字

---

## 七、Sheet 导入入口（staff）

| Sheet | 按钮位置 | 解析后刷新 |
|-------|----------|------------|
| Sheet10 投资 | 管道区右上 | IC 列表 + CapStack committed |
| Sheet12 固资摘要 | 产能区右上 | CapacitySnapshot |
| Sheet1 财务 | 总览 Tab | CashPosition → 触发 HealthAssertion |

---

## 八、与看战略摘要条联动

看战略 CapStack 一行文案 = 资本 Tab 摘要 API：

```
GET /api/fpa/capital-summary?period=2026-FY
→ "FY CAPEX 1.2亿 · H2 28% · 9月波峰 · 缺口1.7万台"
```

点击该行 → `/finance?tab=capital`

---

*Wireframe 已实现于 `components/finance/CapitalTab.tsx`*
