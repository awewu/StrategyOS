# StratOS · 战略管理章程

**版本：** v1.0 · 2026-06-22  
**状态：** 已锁定，作为产品总纲与工程实现的约束宪章  
**关联文档：** [STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md) · [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md) · [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md)

---

## 一、战略管理第一性原理

> **战略管理的核心是规避风险，强化执行；保障年度目标稳健达成，长期目标运行在正确的路径上。**

软件必须服务这一原则，而非仅成为数据展示工具。

---

## 二、四条防线（软件化机制）

| 防线 | 目的 | 落地机制 | 关键代码 |
|------|------|----------|----------|
| **1. 方向防线** | 确保长期路径正确 | Rumelt 诊断 → WTP/HTW → 三栈 Bet → 快照 | `lib/stratos/health-assertions.ts` · `StrategicDiagnosis` |
| **2. 资源防线** | 钱/产品/渠道配置与战略一致 | CapStack/ProdStack/GtmStack + `budget_tag` 与 FPA 勾连 | `prisma/schema.prisma` · `lib/data/strategy-data.ts` |
| **3. 执行防线** | 强化执行，月度纠偏 | 4DX 记分板 + OKR + Vx/Hx + 承诺库 | `lib/execution/scoreboard-access.ts` · `lib/stratos/agents.ts` |
| **4. 底线防线** | 一票否决，规避致命风险 | HealthAssertion 硬阻断 + Gate 风险清单 + Robust 评估 | `lib/stratos/health-assertions.ts` · `app/api/gates/route.ts` |

---

## 三、战略节律与数据闭环

```
月度 MON-RPT / 季度 QTR-REV / Sheet 导入
              ↓
    HealthAssertion 复检（现金/合规/人才/品牌）
              ↓
    WorkingVersion 迭代（可修改）
              ↓
    H1 / FY 战略会
              ↓
    StrategicSnapshot 冻结（不可改）
              ↓
    DiffRecord + StrategyPattern（Mintzberg）
              ↓
    下一版 deliberate 战略
```

---

## 四、关键决策原则

1. **Gate 清单 > 假分数**：Invest / Innovate / Deliver / 五事 / 五力 Gate 只输出风险清单，不输出综合胜算分。
2. **快照不可改**：战略会批准的版本必须冻结，作为 diff 与历史学习的基线。
3. **FPA 与三栈物理勾连**：每个重大 Bet（IC/Product/Gtm）必须挂载 `budget_tag`，状态变更驱动 FPA 预测曲线开关。
4. **一票否决硬阻断**：现金 runway < 3 月、重大合规/质量事故、核心团队流失 > 30%、品牌危机（NPS<0）触发硬阻断，CEO 例外需留痕。
5. **Cynefin 分轨执行**：不同域的项目/假设采用不同的监控与执行主轴，避免一刀切 KPI。

---

## 五、成功标准

- 100% 战略会使用 `/command` 或 `/rehearsal` 驱动议程
- 每个重大决策可追溯到 `InvestmentCase` / `ProductBet` / `GtmBet`
- H1/FY 快照含诊断 + 三栈 + FPA + 健康断言
- 月报/季报导入后自动触发 HealthAssertion 与执行信号
- 长期路径偏差通过 `StratDiff` + `StrategyPattern` 在两次战略会之间可见

---

*章程锁定日期：2026-06-22 · strategy-driven-platform*
