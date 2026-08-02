# StratOS · 创新底座蓝图（Innovation Engine）

**日期：** 2026-07-14 · **状态：** 架构总纲（评审稿）
**定位：** 创新引领的**元工具**——一套方法论内核,配合可编辑的产品线画像,自适应地牵引「产品创新 + 技术可行性」的论证与门径决策。

---

## 〇、一句话与铁律

> **创新底座 = 把「想要 × 能做 × 划算」量化并门径化的引擎;它读产品线画像自适应,任何数据/因素变化都能重算。**

**架构铁律(不可违背):**
```
方法论内核(代码 · 纯函数 · 不变 · 不含任何产品名/具体数字)
        ▲ 只读取
        │
因素与画像(数据 · DB/可配 · 团队编辑 · 随便变)
```
代码里**不允许出现**任何具体产品线的名称、权重、阈值、经济参数——它们全是行数据。换产品线、改因素 = 改数据,**代码零改动**。

---

## 一、三力科学模型 D × F × V

不合成单一「假分」,而是三轴 + 红黄绿清单(对齐「Gate 清单 > 假分数」):

| 轴 | 含义 | 科学工具 |
|----|------|---------|
| **Desirability 想要** | 客户真需要吗 | JTBD → ODI 机会分 = 重要度 + max(重要度−满意度,0);Kano;WTP |
| **Feasibility 能做** | 技术做得出吗 | TRL 1–9 + MRL 量产成熟 + 成本学习曲线 + 供应链 + 团队;各维**可配权重** |
| **Viability 划算** | 划算吗 | 经济性:回收期、ROIC vs WACC;接 CapStack/FPA |

F 轴维度与权重来自**产品线画像**,不写死——不同线死穴不同(材料/量产/成本/PMF)。

---

## 二、论证引擎（举证,不是打分）

每个论断用 **Toulmin 结构** + **证据分级**,保证 D/F/V 背后有可追溯链条:

```
Claim 论点 ─ Grounds 证据(带来源) ─ Warrant 推理 ─ Rebuttal 反证 ─ Qualifier 限定
```

**证据 6 级金字塔(论证强度 = 最短板):**

| 级 | 证据类型 |
|----|---------|
| L6 | 实测 / 量产数据 |
| L5 | 原型 / 中试 |
| L4 | 仿真 / 建模 |
| L3 | 可比先例 / 类比 |
| L2 | 专家判断 |
| L1 | 假设 / 据说 |

规矩:`evidenceStrength(claim) = min(证据级别)`;**低于画像 `evidenceBar` 的论断不得过对应 Gate**。

**技术论证六维**(F 轴深化):原理 · TRL 晋级路径(每级 exit criteria)· MRL 量产 · 成本学习曲线 · 供应链卡脖子 · 团队能力。
**产品论证**(D 轴):JTBD 证据 · 10x 论断 · 护城河 · WTP · 证伪条件。
**杀手假设**:标出「错了就全垮」的假设,最便宜实验优先证伪 → 映射 `Assumption` + `/compass` 审计。

---

## 三、门径管理 Stage-Gate + 实物期权（创新引领但不赌命）

```
Discovery → Scoping → Business Case → Development → Testing → Launch
每闸口:论证达标(证据级别)+ 经济性 → kill / go
go 时只承诺「下一笔」金额(实物期权,分段投,保留放弃权)
approved 时:budget_tag → FPA CapStack ON
```

**一票否决**(硬阻断,任一触发即 blocker):证据低于门槛 · 杀手假设未证伪 · ROIC < WACC · 回收期超阈值 · 关键能力单点卡脖子未解。

Gate 阈值全部来自**产品线画像**:新兴线宽进严出,成熟线卡成本量产。

---

## 四、产品线画像（内核不变 · 画像可配）

`ProductLineProfile` 是一等实体,团队编辑:

| 字段 | 说明 |
|------|------|
| lineId · name · lifecycleStage | 产品线与生命周期 |
| dominantProblems[] | 引用问题类型库 |
| **fAxisWeights** | F 各维权重(材料/量产/成本/供应链/团队/原理…可扩) |
| **gateThresholds** | 各闸口过关线(回收期、ROIC 门槛…) |
| **evidenceBar** | 过 Gate 最低证据级别 |

**问题类型库**(可扩枚举,每类型预置论证重点):PMF 未验证 · 技术不成熟 · 量产爬坡 · 成本压力 · 渠道/GTM · 替代威胁。

---

## 五、能力缺口 → build / buy / partner（M&A 接口）

`recommendSourcing(gaps, window)` 动态产出:
- 缺口小 + 有能力 + 时间够 → **build**
- 缺口大 + 时间窗紧 → **buy**(→ `/ma` 标的池)
- 中间态 / 需外部资源 → **partner**

**M&A 是 Feasibility 的一条 buy 路径,不是独立冲动。** sourcing 方向由引擎按当前缺口动态算出,不在代码里写「买什么」。

---

## 六、下游全从底座取数（为什么是「底座」）

```
产业调研(拐点判断) ──输入──▶ 创新底座 D×F×V + 论证 + Gate ──▶ 产品路线图排序
                                    │                        ├─▶ Invest Gate / CapStack / FPA
                                    │                        ├─▶ 战略展望三层面(按 horizon)
                                    └─ build/buy/partner ────┴─▶ M&A 标的池 → 投后协同当承诺追踪(坚守脊梁)
全程读 ProductLineProfile,行为随线自适应
```

---

## 七、软件架构:内核=纯函数,因素=数据

### 纯函数内核(`lib/innovation/`,零硬编码)
```ts
computePayback(i): number                 // 溢价/日转移量/天数/价差/效率 → 回收年数
computeFeasibility(dims, weights): number // 维度得分 + 可配权重 → F 分
computeDesirability(odi, kano, wtp): number
computeViability(econ): number
evidenceStrength(levels): EvidenceLevel   // = min
evaluateGate(scores, evidence, thresholds, killers): { verdict, blockers }
recommendSourcing(gaps, window): ("build"|"buy"|"partner")[]
```
任一函数**不含任何产品名/具体数字**;所有取值从入参(即数据)进入。

### 数据(DB/可配,团队编辑)
`ProductLineProfile` · `ProblemType` · `Claim` · `Evidence` · `KillerAssumption` · 经济性入参。
变了会怎样:价差变 → 回收期重算 → Gate 可能翻转;死穴迁移 → sourcing 建议改变;新产品线 → 建一行 profile,流水线照跑,**零代码**。

### 案例只进测试,不进 seed
真实案例(如某储能产品线)**仅作单元测试夹具**,用来证明「因素变→输出跟着变」,**不写入生产代码或数据库**。

### 与现有范式一致
照抄 `lib/stratos/`(bayes/monte-carlo 纯函数+测试)、`lib/execution/commitment-summary.ts` 的做法:**`lib/innovation/` 纯函数 + `*.test.ts` + 画像存 DB**。

---

## 八、分期

| 阶段 | 内容 |
|------|------|
| **P0** | `lib/innovation/` 纯函数引擎 + 类型 + 参数化测试(案例仅 fixture) |
| P1 | `ProductLineProfile`/`Claim`/`Evidence`/`Assumption` 数据模型 + 团队编辑 UI |
| P2 | 独立 `/innovation` 工作台:三力雷达 · 门径漏斗 · TRL/成本雷达 · sourcing 决策 |
| P3 | 接口:M&A buy 路径(`/ma`)· 产业调研输入 · Invest Gate/FPA · 投后协同承诺追踪 |

---

## 九、验收(泛化性达成)

1. 代码内**无任何产品名/权重/阈值/经济常量**;
2. 改数据(价差/溢价/死穴/画像)→ 输出自动重算,**代码不动**;
3. 新增产品线 = 一行 profile,流水线照跑;
4. 论证强度 = 证据最短板,低于门槛不过 Gate;
5. sourcing(build/buy/partner)由缺口**动态产出**;
6. 真实案例只在测试里,生产零 seed。

---

## 十、与 M&A 模块的联动(2026-07-14)

创新底座是 `/ma` 并购模块的**上游**:

- `recommendSourcing` 判定 **buy** → `/innovation` 详情抽屉一键"发起交易",预填并购论点(能力/缺口原因/来源下注)跳转 `/ma?new=1&dealType=acquisition`;
- 判定 **partner** → 同上,`dealType=jv`;
- M&A 侧复用同一套证据分级(L1–L6)与"最短板"纪律:协同逐条挂证据级,`evaluateDealGate` 与创新 Gate 同构(阈值来自 `MaDealTypeProfile` 形态画像)。

详见 `docs/STRAT_MA.md` §八。
