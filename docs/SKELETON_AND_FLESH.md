# StratOS · 骨架与血肉

**版本：** v1.2 · 2026-06-14  
**入口文档：** [STRATOS_BLUEPRINT.md](./STRATOS_BLUEPRINT.md)（产品总纲 v1.1）  
**一页纸：** [ONE_PAGE_PANORAMA.md](./ONE_PAGE_PANORAMA.md)  
**变更：** v1.2 三栈 + §16 三大闭环对象（HealthAssertion · budget_tag）

---

## 一、总图

```
                    ┌─────────────────────────────────┐
                    │         血肉（可生长）            │
                    │  UI · 报告 · StratFinance 深推演   │
                    └───────────────┬─────────────────┘
                                    │ 挂载
                    ┌───────────────▼─────────────────┐
                    │    FPA 财务脊梁（贯穿，非旁路）     │
                    │  B-A-F · 现金流 · 品牌P&L · 假设驱动 │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │         骨架（先定死）            │
                    │  逻辑 · 对象 · 节律 · 版本 · 稳健性 │
                    └─────────────────────────────────┘
```

**研讨原则：** 骨架错了，后面全错；血肉可以 Phase 2、3 慢慢长。

---

## 二、骨架（Skeleton）— 7 根支柱 + FPA 脊梁

骨架 = StratOS 的 **宪法**。开发前先定，定后少改。

> **FPA（Financial Planning & Analysis · 财务战略分析）** 在 StratOS 中不是「财务模块」，而是 **把战略翻译成数字、把数字反馈给战略** 的贯穿层。  
> 对应 v5.4 定稿：**FPA 贯穿全模块**；界面层叫 **StratFinance**，骨架层叫 **FPA 脊梁**。

---

### FPA 脊梁 · 贯穿逻辑（横切各层）

```
                    Doctrine（Invest to Growth ←→ FPA 投资效率）
                              │
         四个满意 · BSC ──────┼── 财务维 = 股东满意 = FPA 主锚点
                              │
    ┌─────────────────────────▼─────────────────────────┐
    │              FPA 脊梁（每季 / 每次快照必冻结）          │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
    │  │ B-A-F   │  │ 多品牌  │  │ Vx ROI  │  │ 现金流  │ │
    │  │预算实际预测│  │  P&L   │  │ 项目财务 │  │ 安全线  │ │
    │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
    │         ↑ 假设驱动变量（增长率/毛利率/费用率…）           │
    └─────────────────────────┬─────────────────────────┘
                              │
              OKR（KR 绑预算标签 · 无预算 KR 标黄）
                              │
              V1–V10（预算/投入/剩余/产出/ROI）
                              │
              快照 + StratDiff（财务目标/预测/假设变化）
                              │
              StratRobust R4 底线 + 现金流一票否决
```

**FPA 四句话（产品定调）：**

1. **战略必有钱：** 每个 OKR-O、每个 Vx，必须能回答「花多少钱、产出多少财务结果」。  
2. **钱必有三态：** 预算（Budget）· 实际（Actual）· 预测（Forecast）— **B-A-F 闭环**。  
3. **假设驱动数：** 财务预测不凭空填，挂战略假设 Hx（如「酒店签约 1200 家」→ 营收驱动）。  
4. **快照必含账：** 年中/年底战略快照 = 战略状态 + **同期 FPA 状态** 一起冻结。

**B-A-F 闭环（骨架级）：**

| 态 | 更新来源 | 节律 |
|----|----------|------|
| **B** Budget | 年底战略会定稿 | 年度 |
| **A** Actual | 月报/季报财务段、Excel 导入 | 月/季 |
| **F** Forecast | 职能滚动预测（H1 后修全年） | 季/年中会 |

**偏差规则（骨架）：** |Actual−B|/B 或 |F−B|/B 超阈值 → 财务维变黄/变红 → 可触发战略会议题。

**现金流一票否决（骨架）：** 现金 < 3 个月运营支出 → 健康度强制危险，覆盖综合分。

**否决触发机制（v1.1 锁定 · 非实时）：** 见 [BLUEPRINT §16.2](./STRATOS_BLUEPRINT.md#162-一票否决--强制断言非实时-api)。月报/季报/Sheet 导入时 **Assertion**；指挥舱 **硬阻断条**；快照前复检。

---

### 支柱 1.5 · 三栈 ↔ FPA 勾连（v1.1 锁定）

**`budget_tag` 命名空间（统一）：** `KR-*` · `IC-*` · `PB-*` · `GB-*` · `VX-*`

| 来源 | budget_tag | FPA Toggle |
|------|------------|------------|
| InvestmentCase | **必填** | approved→Forecast ON；killed→OFF（ghost 线） |
| ProductBet | 推荐 | 同上 |
| GtmBet | 推荐 | 同上 |
| KeyResult | 必填或标黄 | 已有规则 |

详 [BLUEPRINT §16.1](./STRATOS_BLUEPRINT.md#161-fpa-脊梁--三栈--budget_tag-物理勾连)。

---

### 支柱 1.6 · Cynefin 执行消费（v1.1 锁定）

| 域 | Vx 看板主轴 | 4DX |
|----|-------------|-----|
| complicated | KPI/成果 | 滞后 KR |
| complex | 领先指标 | **优先 WIG 领先池** |
| chaotic | 48h 行动项 | 不统计年度 KPI |

详 [BLUEPRINT §16.3](./STRATOS_BLUEPRINT.md#163-cynefin-域--看执行消费规则) · [THEORY_IMPORTS](./THEORY_IMPORTS.md#五-i4--cynefin-情境标签)。

---

### 支柱 1 · 战略逻辑栈（Logic Stack）

自上而下四层，**顺序不可颠倒**；**FPA 脊梁横切 L1–L3**：

| 层 | 名称 | 回答的问题 | 系统对象 | FPA 挂载 |
|----|------|------------|----------|----------|
| L0 | **Doctrine 三支柱** | 我们靠什么赢？ | `doctrine_audit` | Invest 决策须过 **FPA 投资可行性** |
| L1 | **四个满意 × BSC** | 底线是什么？ | `bsc_map`, `satisfaction_check` | **财务维** = 股东满意 KPI 集 |
| L2 | **OKR** | 这季度推什么？ | `objective`, `key_result` | 每个 KR → `budget_tag` + `fpa_link` |
| L3 | **执行载体** | 仗怎么打？ | `project`, `assumption`, `commitment` | 每个 Vx → `project_financials` |

**挂载规则（骨架级约束）：**
- 每个 `key_result` → 必须挂 `bsc_measure` 或说明例外
- 每个 `key_result` → **必须有 `budget_tag` 或标黄「无预算绑定」**
- 每个 `key_result` → 可选挂 `project`（Vx）
- 每个 `project` → **必须有 `budget_total` / `budget_spent` / `budget_remaining`**
- 每个 `project` → 至少挂 1 条 `assumption` 或标记「无假设」
- 每个 `assumption` → 若影响财务，须挂 `fpa_driver`（驱动变量名）
- 每个 `objective` → 必须通过 `satisfaction_check`（四满意校验）
- 每笔重大 `decision` → 必须通过 `doctrine_audit` + **FPA 可行性摘要**

---

### 支柱 2 · 时间节律（Rhythm）

| 脉冲 | 周期 | 骨架动作 | 产出 |
|------|------|----------|------|
| 月 | 每月 | 部门 `MON-RPT` 入库 | 脉搏信号 |
| 季 | 每季 | 部门 `QTR-REV` + 公司季报 | `quarter_intel_pack` |
| **半年** | **6 月** | **战略会 → 快照** + **FPA：H1 决算 + 全年 Forecast 修订 + 敏感性** | `{YYYY}-H1-STRATEGIC` |
| **年** | **12 月** | **战略会 → 快照** + **FPA：年度决算 + 下年 Budget + 12 月现金流预测** | `{YYYY}-FY-STRATEGIC` |
| 事件 | 触发式 | 竞品/假设失效录入 | `event_snapshot`（可选） |

**骨架约束：** 全系统围绕 **两次战略会快照** 组织；月/季报是 **向快照输送情报的管道**，不是独立产品目标。

---

### 支柱 3 · 版本与快照（Version Core）

```
                    ┌──────────────────┐
  2025-FY-STRATEGIC │                  │
                    ▼                  │
  2026-H1-STRATEGIC ◄──── 年中战略会    │
                    │                  │  StratDiff
  2026-FY-STRATEGIC ◄──── 年底战略会    │  （12 类变化）
                    │                  │
  2027-H1-STRATEGIC │                  ▼
                    └──────────► StratRobust（5 维稳健性）
```

**骨架对象：**

| 对象 | 说明 |
|------|------|
| `strategic_snapshot` | 战略会定稿瞬间的 **只读** 全量状态（**含 FPA 快照**） |
| `working_version` | 会前推演中的 **可编辑** 工作版 |
| `report_artifact` | 月报/季报原文 + 解析后的结构化记录 |
| `diff_record` | 两快照之间的 12 类变化清单 |
| `robustness_score` | R1–R5 五维稳健性 + 综合分 |

**骨架约束：** 快照 **不可改**；只能 `copy → working_version` 再编辑。

---

### 支柱 4 · 核心对象模型（Entity Model）

最小完备 **15 类对象**（MVP 必须建表；原 12 + FPA 3）；**MVP+ 增至 19 类**（+4 理论导入对象/配置）：

```
User ──role──> ceo | vp | pm | staff | observer

StrategicDiagnosis     # Rumelt 诊断 ★MVP+（每 period 一条 approved）
BrandStrategyCard      # Playing to Win WTP/HTW ×4 品牌 ★MVP+
StrategyPattern        # Mintzberg 快照聚合 ★MVP+
ExecutionScoreboardConfig  # 4DX 式 WIG+领先指标视图配置 ★MVP+

MissionVision          # 使命愿景（单例/按年）
BscDimension ×4        # 财务/客户/流程/学习 + 四个满意标签
BscMeasure             # 年度衡量指标
Objective              # OKR-O
KeyResult              # OKR-KR + doctrine_tag + budget_tag
Project (V1–V10)       # 项目群 + cynefin_domain ★MVP+ · horizon(H1/H2/H3) Phase 2
ProjectFinancials      # Vx：预算/已投入/剩余/产出/ROI ★FPA
Assumption (H1–Hn)     # 战略假设 + fpa_driver + cynefin_domain ★FPA ★MVP+
FpaPeriod              # 按月季度的 B-A-F 记录 ★FPA
FpaBrandPnl            # 四品牌 P&L 行（瑞美/恒热/RUUD/科技住宅）★FPA
CashPosition           # 现金余额 +  runway 月数 ★FPA
Commitment             # 承诺
HealthSignal           # 维度灯 + KPI 值 + 周期
HealthAssertion        # 一票否决断言（入库触发 · 指挥舱硬阻断）★v1.1
Report                 # MON-RPT / QTR-REV 元数据+解析体
StrategicSnapshot      # 快照根（含 fpa_snapshot_id）
DoctrineAudit          # 决策审计记录
```

**FpaPeriod 核心字段（骨架）：**

| 字段组 | 字段 | 说明 |
|--------|------|------|
| 标识 | period, scope(company/brand) | 2026-Q2, brand-RUUD |
| B-A-F | revenue/profit/cash 各 _budget/_actual/_forecast | 三元组 |
| 驱动 | linked_assumption_ids | 挂假设 |
| 偏差 | variance_ba, variance_bf | 系统自动算 |
| 灯 | financial_signal | green/yellow/red |

**关系骨架（ER 语义）：**

```
MissionVision
    └── BscDimension ──has──> BscMeasure ──feeds──> Objective
                              Objective ──has──> KeyResult ──budget_tag──> FpaPeriod
                              KeyResult ──maps──> Project ──has──> ProjectFinancials
                              Project ──depends──> Assumption ──may_drive──> FpaPeriod
                              FpaBrandPnl ──rolls_up──> FpaPeriod (company)
                              CashPosition ──feeds──> HealthSignal(financial)
Report ──updates──> KeyResult | Project | Assumption | Commitment | HealthSignal | FpaPeriod
StrategicSnapshot ──freezes──> 以上全部 + FpaPeriod + FpaBrandPnl + CashPosition + RobustnessScore
```

---

### 支柱 5 · 三个看板（View Trinity）

全产品只有 **三个 CEO 级视图**，所有模块最终汇入此处：

| 视图 | 骨架问题 | 最小展示单元 | FPA 呈现 |
|------|----------|--------------|----------|
| **看战略** | 打什么仗？ | **诊断顶栏** + 四品牌 WTP/HTW + BSC 四卡 + OKR 树 + Doctrine | 财务维卡片：**年度 B + 关键假设** |
| **看执行** | 打到哪了？ | **4DX 记分板（WIG+领先指标）** + Vx 看板 + 假设 + ≤3 预警 + 承诺 | 每 Vx：**预算执行率 + ROI**；KR 无预算标黄 |
| **看健康** | 打得怎样？ | 四灯 + 8 KPI + 稳健性 + 趋势 | **B-A-F 条 + 现金 runway + 四品牌 P&L 简表** |

**骨架约束：** 新功能必须声明 **汇入哪个视图**；不许另起第四个主入口。

---

### 支柱 6 · 稳健性与对比（StratDiff + StratRobust）

这是 StratOS **区别于普通 OKR 工具** 的骨架能力，MVP 就要有 **简版**：

**StratDiff — 12 类变化（骨架枚举，不可随意增删）：**

1. BSC 目标值调整  
2. OKR 目标替换  
3. 项目状态迁移  
4. 假设失效  
5. 新假设新增  
6. Doctrine 违背决策  
7. 健康度维度变灯  
8. 承诺兑现率下降  
9. 四个满意校验失败  
10. 资源重新分配（含 **Vx/品牌预算迁移**）  
11. 竞争重大事件  
12. 战略意图表述变更  
13. **FPA 预测修订**（Forecast 大幅调整或 Actual 显著偏离 Budget）  
14. **现金流安全线跨越**（runway 跌破/恢复 3 个月）  
15. **涌现模式识别**（Mintzberg emergent）★MVP+  
16. **未实现意图**（unrealized）★MVP+  
17. **偶成成果**（serendipitous）★MVP+  
18. **刻意实现率骤降**（deliberate_realization_rate）★MVP+  

**StratRobust — 5+1 维稳健性：**

| 维 | 输入 | FPA 贡献 |
|----|------|----------|
| R1 方向 | 快照间 BSC/愿景 diff | 财务目标是否频繁改 without 假设支撑 |
| R2 逻辑 | 假设失效 + OKR–Vx 断链 | 假设失效 → FPA 驱动变量是否同步修订 |
| R3 执行 | 承诺兑现率 + 项目准时率 | **预算执行率、Forecast 准确度** |
| R4 底线 | 四满意 + BSC 维度持续恶化 | **B-A-F 偏差扩大、现金 runway** |
| R5 精神 | Doctrine 审计通过率 | Invest 类决策 **FPA IRR/NPV 是否达标** |
| R6 学习 | StrategyPattern 涌现吸收率 | emergent/serendipitous 是否写入下版 deliberate ★MVP+ 可选 |

---

### 支柱 7 · 角色与边界（Governance）

| 角色 | 骨架权限 |
|------|----------|
| CEO / 董事会视角 | 三看板全读 + 快照批准 + 预警确认 |
| VP | 本事业部 OKR/Vx + 季报审批 |
| PM | 本 Vx 更新 + 月报 §3 |
| 职能 staff | 报告上传、数据录入、快照生成操作 |
| observer | 三看板只读 |

**边界（骨架声明）：** 不接 ERP 实时同步 · 不做全员 OKR · 不做日常任务管理。

---

## 三、血肉（Flesh）— 可分期生长

血肉 = 挂在骨架上的 **功能、界面、内容、智能**。可以瘦启动，逐步长胖。

### 3.1 血肉分层

```
┌─────────────────────────────────────────────────────────┐
│  L3 智能血肉（后期）                                      │
│  AI 战略顾问 · 11 领域 Agent · 概率推演 · 自动报告润色      │
├─────────────────────────────────────────────────────────┤
│  L2 引擎血肉（v4.x 扩展）                                 │
│  StratFinance 深推演 · StratCapital · Growth · Product    │
│  （5年模型 · 9格敏感性 · 情景蒙特卡洛 · 投资评分卡）          │
├─────────────────────────────────────────────────────────┤
│  L1 交互血肉（MVP 主战场）                                │
│  三看板 UI · FPA 简版(B-A-F) · 报告 · 快照 · diff · PDF   │
├─────────────────────────────────────────────────────────┤
│  L0 内容血肉（客户填什么）                                │
│  瑞合使命愿景 · BSC 目标值 · V1–V10 定义 · 假设清单 · 品牌  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 MVP 血肉清单（2026 Q3 战略会）

| 模块 | 血肉功能 | 依赖骨架 |
|------|----------|----------|
| 登录与角色 | 5 角色 | 支柱 7 |
| 看战略页 | **诊断** + **ProdStack** + **GtmStack** + 四品牌 WTP/HTW + BSC + OKR + Doctrine | [STRAT_PRODUCT](./STRAT_PRODUCT.md) · [STRAT_GTM](./STRAT_GTM.md) |
| 看执行页 | **4DX 记分板** + Vx 看板 + **Cynefin 角标** + 假设 + 预警 + 承诺 | 支柱 1、4、FPA |
| 看健康页 | 四灯 + 8 KPI + **B-A-F 条 + 现金 runway** + 稳健性 | 支柱 5、6、FPA |
| FPA 录入 | 公司/四品牌 B-A-F · 现金 · Vx 预算 · **CapStack/IC 资本 Tab** | FPA + CapStack 脊梁 |
| 报告中心 | 月报/季报模板下载、上传、解析确认 | 支柱 2、4 |
| 快照 | 创建 H1/FY 快照、列表、只读浏览 | 支柱 3 |
| 对比 | 两快照 diff（MVP 8 类 → MVP+ 含 #15–18 共 12 类） | 支柱 6 |
| 输出 | CEO/董事会 1 页 PDF | 支柱 5 |
| 录入 | ~30 字段 + **FPA 核心 12 字段** + 财务 Excel | 支柱 4、FPA |

### 3.3 Phase 2+ 血肉（FPA / 资本加深）

- **StratFinance 深推演：** 5 年模型 · 9 格敏感性 · 乐观/基准/悲观 · 12 月现金流曲线  
- **StratCapital Phase 2：** M&A 管道 · 产线摘要 · Real Options · 投后偏离（**MVP+ 已含 IC/CapStack/产能**，见 [STRAT_CAPITAL.md](./STRAT_CAPITAL.md)）  
- **StratProduct MVP+：** ProdStack / JTBD / Roadmap / ProductBet（见 [STRAT_PRODUCT.md](./STRAT_PRODUCT.md)）  
- **三层面 Vx 组合（I6）· Hoshin X-Matrix 视图（I7）**  
- AI 财务推演 Agent（基于快照问「若毛利率 -5%？」）  
- 13 Sheet 全量 · 营销/产品/前瞻引擎  

---

## 四、骨架 × 血肉 对照矩阵

| 骨架支柱 | MVP 血肉 | 后期血肉 |
|----------|----------|----------|
| 逻辑栈 | 四满意校验 UI、Doctrine 审计表单 | 决策过滤器全自动 |
| 节律 | 月报/季报上传 + 日历提醒 | 自动催办、会议议程生成 |
| 版本快照 | H1/FY 一键快照 | 事件快照、分支推演 |
| 对象模型 | 15 类 CRUD + 挂载校验 + FPA 对象 | 图数据库因果链 |
| 三看板 | 静态 + 手动更新 + B-A-F 条 | 实时滚动、Drill-down |
| UI/VI | Dark 指挥舱 + 四卡 + 语义灯色（见 UI_VI.md） | ⌘K · 五角色 · 雷达 · 动效全套 |
| Diff + Robust | 8 类 diff + R1–R5（含 FPA） | 全 14 类 + 归因 AI |
| FPA 脊梁 | B-A-F 录入 + 现金 + 四品牌 P&L | 5年模型 + 敏感性 + 情景 |
| 角色 | 5 角色 | 品牌标签、细粒度（可选） |

---

## 五、信息流向（血肉如何喂骨架）

```
部门月报 ──解析──> 更新 KR / Vx / 假设 / 承诺 / Doctrine 信号
                    │
季度复盘 ──合成──>  quarter_intel_pack
                    │
职能录入 ──补充──>  HealthSignal / BscMeasure 实际值
财务录入 ──补充──>  FpaPeriod / FpaBrandPnl / CashPosition  ★
                    │
         ┌──────────▼──────────┐
         │   working_version    │  ← 战略会前推演
         └──────────┬──────────┘
                    │ CEO 批准
         ┌──────────▼──────────┐
         │  strategic_snapshot  │  ← 年中 / 年底定稿
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ StratDiff + Robust   │  ← 找变化、算稳健性
         └─────────────────────┘
```

---

## 六、页面骨架（IA · Information Architecture）

```
StratOS
├── 首页（CEO 驾驶舱）────── 稳健性 + 三灯摘要 + Top3 变化 + Top3 预警
├── 看战略 ── 诊断 | ProdStack | **GtmStack** | WTP/HTW | BSC | OKR | Doctrine
├── 看执行 ── 4DX 记分板 | Vx 看板 | 假设 | 承诺 | 预警
├── 看健康 ── 四维度 | 8 KPI | **B-A-F & 现金** | 趋势 | 四满意
├── FPA 财务 ── 公司 B-A-F | 四品牌 P&L | Vx 财务 | **资本 Tab（CapStack/IC/产能）**
├── 报告中心 ── 月报 | 季报 | 上传 | 解析确认
├── 版本库 ── 快照列表 | 对比 | diff 报告
└── 设置 ── 用户 | 部门 | Vx 定义 | 假设库（staff）
```

**研讨点：** MVP 是否 need 独立「录入」页，还是分散在各看板 inline 编辑？  
**推荐：** 看板只读展示 + staff 在「报告中心/设置」录入 —— CEO 屏保持干净。

---

## 七、待研讨决策（5 题）

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| 1 | 快照粒度 | 仅 H1+FY / 加 Q 季快照 | 仅 H1+FY（骨架简单） |
| 2 | 月报解析 | 全自动 / AI 抽取+人工确认 | 人工确认（MVP） |
| 3 | OKR 编辑权 | 仅 VP+ / 全员提案 | VP 定、PM 提案 KR |
| 4 | 稳健性综合分 | 展示 / 仅展示五维 | 五维为主，综合分为辅 |
| 5 | MVP diff 范围 | 6 类 / 8 类 / 14 类全开 | **8 类（含 FPA 预测修订 + 现金流）** |
| 6 | MVP FPA 深度 | 仅 B-A-F+现金 / 含四品牌P&L | **含四品牌 P&L** |

---

## 八、一句话定稿

> **骨架 = 四层战略逻辑 + FPA 财务脊梁 + 两次快照 + 十五对象 + 三看板 + diff 与稳健性。**  
> **血肉 = 报告与 FPA 喂数字，三看板给人看，快照留历史，diff 找变化（含财务预测修订），稳健性判战略是否还站得住。**

**FPA 在 StratOS 中的一句话：** 战略不是漂亮幻灯片，是 **B-A-F 闭环路**；Invest to Growth 不是口号，是 **每一笔预算和预测可追溯到假设与 OKR**。

下一步研讨建议：**逐条过「支柱 4 对象模型」字段定义**，或 **画 CEO 首页线框**。
