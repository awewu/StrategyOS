# StratOS · 并购模块蓝图（StratMA）

**日期：** 2026-07-14 · **状态：** 策划稿（待评审）
**定位：** 独立模块，把 M&A 从「一张看板」升级为「贯穿战略→筛选→估值→尽调→交易→整合→投后」的科学工具。

---

## 〇、一句话

> **StratMA = 用一条纪律链把并购从「拍脑袋买」变成「有据可溯、有价可算、买后必守」。**
> 它是 CapStack「Invest to Growth」的重型子系统：每一笔交易都挂 crux、走 Gate、算得清经济性、买后追协同兑现。

与现有模块的关系：
- **它是 InvestmentCase 的重型形态** —— 走 **Invest Gate** + **Doctrine「投资驱动增长」审计** + `budget_tag → FPA CapStack Toggle`。
- **投后协同兑现 = 承诺坚守在并购上的应用** —— 复用 `Commitment / linkedKrId` 脊梁,让「说好的协同」逾期即示警。

---

## 一、现状与差距

| 维度 | 现状（MaPipelineItem） | 差距 |
|------|----------------------|------|
| 载体 | `/finance` 一个 tab | ❌ 非独立模块 |
| 数据 | 方向/阶段/一句论点/估值**文本串**/100天一句话 | ❌ 无结构化经济性 |
| 估值 | 自由文本 | ❌ 无 DCF/可比/先例 |
| 协同 | 一句 thesis | ❌ 不可量化、无 ramp |
| 尽调 | 无 | ❌ 无红旗清单 |
| 交易经济性 | 无 | ❌ 无增厚/摊薄、ROIC、回收期 |
| 审批 | 无 | ❌ 不走 Gate/Doctrine |
| 整合 | 一条里程碑串 | ❌ 无工作流/负责人 |
| 投后 | 无 | ❌ 协同不追踪（买了不守） |
| 战略勾连 | `linkedAssumptionCodes` | ⚠️ 未挂 crux / CapStack / FPA |

---

## 二、科学框架：七阶段生命周期

```
① 战略与寻源 Sourcing      —— 并购论点挂 crux/三层面;标的雷达
② 筛选 Screening           —— 战略适配评分卡 + 初步估值 → Go/No-Go Gate
③ 尽职调查 Due Diligence   —— 多工作流清单 + 红旗登记 + 先决条件
④ 估值与结构 Valuation     —— DCF/可比/先例 三角 + 协同调整 + 交易结构
⑤ 谈判与审批 Approval      —— Term Sheet + Invest Gate + Doctrine 审计 + budget_tag
⑥ 整合 PMI                —— 工作流×负责人×里程碑 + 协同捕获追踪 + TSA
⑦ 投后价值 Post-close     —— 协同兑现 vs 承诺（坚守）+ 交易复盘 → 快照/diff
```

### 各阶段的「科学工具」

**② 战略适配评分卡（加权，输出风险清单而非单一胜算）**
- 维度:契合 crux · 填补能力缺口 · 三层面归属(H1/H2/H3) · WTP/HTW 一致 · 渠道/技术/品牌协同强度 · 文化契合。
- 产出:雷达图 + **红黄绿风险清单**（对齐「Gate 清单 > 假分数」）。

**④ 估值三角（Football Field）**
- **DCF**:WACC 折现、终值、敏感性(WACC×增长)。
- **交易可比 Comps**:EV/EBITDA、EV/Sales。
- **先例交易 Precedent**:控制权溢价。
- 输出:低/基/高区间条 + 协同调整后价值上限（walk-away price）。

**协同量化模型（可量、有节律）**
- 收入协同 + 成本协同,分 **run-rate** 与 **爬坡曲线**(Y1/Y2/Y3 实现%)。
- 一次性整合成本;**协同 NPV**;协同占对价比例（越高越危险 = 靠协同撑估值）。

**交易经济性（真数字，非假分）**
- 增厚/摊薄(accretion/dilution)、**ROIC vs WACC 门槛**、IRR、回收期、EV/协同倍数。
- **一票红线**:ROIC<WACC 或 靠协同>50% 撑估值 → Gate 硬警示。

**③ 尽调红旗登记册 + 先决条件追踪**
- 工作流:商业/财务/税务/法律/技术IP/人力/运营/ESG/文化(9 条)。
- 每条:发现 · 严重度 · 状态 · 是否 deal-breaker;先决条件(CP) 逐条 close。

**⑥ PMI 工作流追踪**
- 8 条工作流(治理/财务/商务/产品技术/供应链/人力文化/IT/品牌),每条挂负责人 + 里程碑 + **协同捕获% 追踪**;TSA 过渡服务。

**⑦ 投后协同兑现（坚守应用)**
- 每条协同承诺 = 一条 `Commitment`(挂 `linkedKrId` → KR → BSC),逾期即在**坚守驾驶舱**示警。
- 交易 scorecard:协同实现 vs 承诺、估值假设 vs 实际 → 进 **StratDiff / 快照**,形成并购史学。

---

## 三、数据模型（新增，独立于 InvestmentCase 但可互链）

> 采用「一主 + 多子」结构；MVP 可先建主表 + 2 子表，逐期扩。

| 模型 | 关键字段 | 阶段 |
|------|---------|------|
| **MaDeal**（主，替代 MaPipelineItem） | name · direction · stage · dealLead · **linkedCrux** · targetProfileJson · **budgetTag** · gateStatus · period | 全程 |
| **MaScreeningScore** | dealId · dimension · weight · score · note | ② |
| **MaValuation** | dealId · method(dcf/comps/precedent) · low/base/high · wacc · evEbitda · walkAwayPrice | ④ |
| **MaSynergy** | dealId · type(revenue/cost) · runRate · rampY1/Y2/Y3 · oneTimeCost · npv | ④/⑦ |
| **MaDealEconomics** | dealId · accretionDilution · roic · wacc · irr · paybackYears · synergyPctOfPrice | ④ |
| **MaDdItem** | dealId · workstream · finding · severity · dealBreaker · status | ③ |
| **MaConditionPrecedent** | dealId · item · status · owner · dueDate | ③/⑤ |
| **MaIntegrationWorkstream** | dealId · workstream · owner · synergyCapturePct | ⑥ |
| **MaMilestone** | dealId · workstreamId? · title · owner · dueDate · status（可复用/映射 Commitment） | ⑥/⑦ |

**复用而非造轮子:**
- 里程碑/协同兑现 **映射 `Commitment`**(owner/deadline/status + `linkedKrId`),直接进坚守驾驶舱。
- `budgetTag → FpaBudgetLine` 勾连,gate approved 时 FPA Toggle ON。
- gateStatus 复用 `BetGateStatus` 枚举 + 走现有 `/gates`（Invest）。

---

## 四、路由与导航（独立模块）

- **新增 `/ma`**（L2/L3）— 独立并购工作台,从 `/finance` tab **迁出**。
- 子视图（Tab 或分段）:管道看板 · 交易详情(七阶段) · 筛选评分 · 估值 · 协同 · 尽调红旗 · 整合 · 投后。
- 导航:放入 **formulate（战略制定）hub** 或新增「资本」入口;⌘K 收录。
- **并购一页纸**（自动汇编）:某笔交易的 SCR（论点/估值/协同/风险/Gate/整合进度）—— 复用 panorama view-model 思路。

---

## 五、与 StratOS 命题对齐

| 命题 | M&A 落点 |
|------|---------|
| **坚守** | 投后协同承诺逾期即示警(挂 KR→BSC) |
| **Gate 清单 > 假分数** | 筛选/尽调输出风险清单;仅交易经济性用真数字 |
| **三栈 · CapStack** | M&A 是 Invest 主战场,挂 budget_tag→FPA |
| **Doctrine** | 走「投资驱动增长」审计 |
| **史学 · StratDiff** | 并购管道/估值假设变化入 diff + 快照 |
| **一票否决** | ROIC<WACC、协同>50%撑价、DD deal-breaker → 硬警示 |

---

## 六、分期路线

| 阶段 | 内容 | 风险 |
|------|------|------|
| **P0** | 独立 `/ma` 模块骨架:`MaDeal` 扩展模型 + 管道看板迁移 + 交易详情(论点/方向/阶段/dealLead/挂 crux) | 中(schema) |
| **P1** | 科学量化核心:筛选评分卡 + 估值三角 + 协同模型 + 交易经济性(ROIC/回收/增厚) | 中 |
| **P2** | 尽调红旗登记 + CP 追踪 + Invest Gate/Doctrine 联动 + budget_tag→FPA | 中 |
| **P3** | PMI 工作流 + 投后协同兑现(接坚守脊梁,映射 Commitment) | 中 |
| **P4** | 并购一页纸(自动汇编) + 纳入 StratDiff/快照 | 中 |

---

## 七、验收标准（体系化达成）

1. 每笔交易可**从 crux 追溯到为什么买**;
2. 估值有**三方法三角 + walk-away 价**,不再是文本串;
3. 协同**可量化 + 有爬坡曲线 + 有 NPV**;
4. 交易经济性给出 **ROIC vs WACC / 回收期 / 增厚摊薄**,红线自动示警;
5. 尽调有**红旗登记 + deal-breaker 标记 + CP 关闭追踪**;
6. 审批**走 Invest Gate + Doctrine**,approved 后 `budget_tag` 进 FPA;
7. 整合有**工作流×负责人×里程碑**;
8. **投后协同当作承诺追踪**,逾期进坚守驾驶舱;
9. 并购变化**进 StratDiff / 快照**,形成史学。
