# StratOS · 对象模型（MVP+ 伪代码与 Prisma 映射）

**版本：** v1.0 · 2026-06-14  
**关联：** [STRATOS_BLUEPRINT](./STRATOS_BLUEPRINT.md) · [SKELETON_AND_FLESH](./SKELETON_AND_FLESH.md) · [THEORY_IMPORTS](./THEORY_IMPORTS.md) · `prisma/schema.prisma`

---

## 一、设计原则

1. **Working → Frozen：** 会前编辑 `WorkingVersion`；战略会定稿调用 `freezeSnapshot()` 生成只读 `StrategicSnapshot`。  
2. **budget_tag 命名空间：** `KR-*` · `IC-*` · `PB-*` · `GB-*` · `VX-*` — 统一挂载 FPA Forecast Toggle。  
3. **快照含账：** 每次快照必须冻结 FPA（B-A-F）、CapStack、活跃 `HealthAssertion`。  
4. **JSON 补位：** 复杂聚合（Mintzberg 列表、CapStack 分布）用 `Json` 字段，避免 MVP+ 过度规范化。

**Prisma 源文件：** [`../prisma/schema.prisma`](../prisma/schema.prisma)

---

## 二、枚举（共享）

```typescript
// lib/types/stratos-enums.ts

export type PeriodCode = `${number}-FY` | `${number}-H1` | `${number}-Q${1|2|3|4}`;

export type SnapshotType = "H1" | "FY" | "EVENT";
export type SnapshotStatus = "FROZEN" | "SUPERSEDED";
export type WorkingVersionStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED";

export type BottleneckType = "capability" | "market" | "organization" | "capital";
export type DiagnosisStatus = "draft" | "approved";

export type BrandCode = "RUIMEI" | "HENGRE" | "RUUD" | "TECH_HOME";
export type CynefinDomain = "clear" | "complicated" | "complex" | "chaotic";

export type BetGateStatus =
  | "draft"
  | "review"
  | "approved"
  | "rejected"
  | "killed"
  | "post_invest"
  | "deferred";

export type FpaToggle = "on" | "off" | "deferred";

export type Horizon = "H1" | "H2" | "H3";

export type InvestmentType =
  | "strategic"
  | "capacity"
  | "technology"
  | "brand"
  | "people";

export type HealthAssertionType = "runway" | "compliance" | "talent" | "brand";
export type TrafficLight = "green" | "yellow" | "red";

export type StrategyFormationType =
  | "deliberate"
  | "emergent"
  | "unrealized"
  | "serendipitous";

export type DiffCategory =
  | "BSC_TARGET"
  | "OKR_REPLACE"
  | "PROJECT_MIGRATE"
  | "ASSUMPTION_FAILED"
  | "ASSUMPTION_NEW"
  | "DOCTRINE_BREACH"
  | "HEALTH_LIGHT"
  | "COMMITMENT_DROP"
  | "SATISFACTION_FAIL"
  | "RESOURCE_REALLOC"
  | "COMPETITOR_EVENT"
  | "INTENT_CHANGE"
  | "FPA_FORECAST"
  | "CASH_RUNWAY"
  | "EMERGENT_PATTERN"
  | "UNREALIZED"
  | "SERENDIPITOUS"
  | "DELIBERATE_RATE_DROP"
  | "IC_CHANGE"
  | "CAPSTACK_CHANGE"
  | "CAPACITY_GAP"
  | "IC_ROI_DEVIATION"
  | "ROADMAP_SLIP"
  | "PRODUCT_BET_CHANGE"
  | "COMP_GAP_CHANGE"
  | "PRODUCT_MIX_CHANGE"
  | "SEGMENT_PRIORITY"
  | "CHANNEL_CELL_CHANGE"
  | "COVERAGE_TARGET"
  | "LTV_CAC_DETERIORATION";
```

---

## 三、版本核心 · StrategicSnapshot 族

### 3.1 WorkingVersion（会前推演）

```typescript
interface WorkingVersion {
  id: string;
  period: PeriodCode;           // "2026-H1"
  label: string;                // "2026 年中战略会 · 工作版 v3"
  status: WorkingVersionStatus;
  basedOnSnapshotId?: string;   // copy from 2026-FY-STRATEGIC
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// 规则：同一 period 仅一条 status=IN_REVIEW 可同时存在（软约束）
```

### 3.2 StrategicSnapshot（战略会定稿 · 只读）

```typescript
interface StrategicSnapshot {
  id: string;
  code: string;                 // "2026-H1-STRATEGIC" — unique
  period: PeriodCode;
  snapshotType: SnapshotType;
  status: SnapshotStatus;

  // 冻结元数据
  frozenAt: Date;
  frozenById: string;
  workingVersionId?: string;    // 来源工作版
  meetingNotes?: string;

  // 冻结指针（approved 实体 ID，冻结时刻）
  diagnosisId?: string;
  capStackPeriodId?: string;
  cashPositionId?: string;
  strategyPatternId?: string;

  // 健康态 overlay（§16.2）
  healthAssertionIds: string[]; // 冻结时 active 的断言
  bscLightsAtFreeze: Record<"financial"|"customer"|"process"|"learning", TrafficLight>;

  // 全量备份（diff / 审计 / 导出）
  stateJson: SnapshotStatePayload;

  createdAt: Date;
}

/**  denormalized payload — freezeSnapshot() 组装 */
interface SnapshotStatePayload {
  diagnosis: StrategicDiagnosis;
  brandCards: BrandStrategyCard[];
  objectives: Objective[];
  keyResults: KeyResult[];
  projects: Project[];
  assumptions: Assumption[];
  investmentCases: InvestmentCase[];
  productBets: ProductBet[];
  gtmBets: GtmBet[];
  fpaPeriod: FpaPeriod;
  fpaBrandPnls: FpaBrandPnl[];
  capStack: CapStackPeriod;
  cash: CashPosition;
  strategyPattern: StrategyPattern;
  healthAssertions: HealthAssertion[];
  robustness?: RobustnessScore;
}
```

### 3.3 StrategyPattern（Mintzberg · 每快照一条）

```typescript
interface StrategyPattern {
  id: string;
  snapshotId: string;           // 1:1 StrategicSnapshot
  deliberateRealizationRate: number; // 0–100

  emergentPatterns: Array<{
    title: string;
    formationType: "emergent";
    evidenceReportIds: string[];
    fpaImpactNote?: string;
    suggestDeliberate: boolean;
  }>;

  unrealizedItems: Array<{
    objectType: "objective" | "key_result" | "project" | "investment_case" | "product_bet" | "gtm_bet";
    objectId: string;
    title: string;
  }>;

  serendipitousItems: Array<{
    objectType: string;
    objectId: string;
    title: string;
    evidenceReportIds?: string[];
  }>;

  learningPrompts: string[];
  computedAt: Date;
}
```

### 3.4 DiffRecord（StratDiff · 30 类）

```typescript
interface DiffRecord {
  id: string;
  fromSnapshotId: string;
  toSnapshotId: string;
  category: DiffCategory;       // 映射 #1–30
  severity: "info" | "warning" | "critical";
  title: string;
  detail?: string;
  objectType?: string;
  objectId?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  formationType?: StrategyFormationType; // #15–18 专用
  createdAt: Date;
}
```

---

## 四、认知层 · I1 / I3

### 4.1 StrategicDiagnosis（Rumelt）

```typescript
interface StrategicDiagnosis {
  id: string;
  period: PeriodCode;
  challengeStatement: string;   // ≤80
  bottleneckType: BottleneckType;
  rootCauses: string[];         // 3–5
  crux: string;                 // ≤120
  linkedAssumptionIds: string[];
  linkedBscMeasureIds: string[];
  fpaRationale?: string;
  validUntil: Date;
  status: DiagnosisStatus;
  approvedById?: string;
  approvedAt?: Date;
  workingVersionId?: string;
}

// 约束：每 period 至多 1 条 status=approved
// ProductBet.successCriteria / killCriteria 须可追溯到 crux
```

### 4.2 BrandStrategyCard（Playing to Win ×4）

```typescript
interface BrandStrategyCard {
  id: string;
  brandCode: BrandCode;
  period: PeriodCode;
  winningAspiration: string;    // ≤60
  whereToPlay: {
    regions: string[];
    channels: string[];
    segments: string[];
    narrative: string;
  };
  howToWin: string;             // ≤200
  mustHaveCapabilities: string[];
  linkedBscDimensionIds: string[];
  linkedObjectiveIds: string[];
  fpaAnchor?: string;
  workingVersionId?: string;
}
```

---

## 五、三栈 · Bet 族（含 budget_tag）

### 5.1 InvestmentCase（CapStack）

```typescript
interface InvestmentCase {
  id: string;
  code: string;                 // "IC-2026-01"
  title: string;
  type: InvestmentType;
  horizon: Horizon;
  linkedVxId?: string;
  linkedAssumptionIds: string[];
  linkedOkrIds: string[];
  capexTotal?: Decimal;
  opexAnnual?: Decimal;
  expectedIrr?: Decimal;
  paybackMonths?: number;
  npv?: Decimal;
  strategicFitScore?: number;   // 0–100 检查清单加权
  gateStatus: BetGateStatus;
  budgetTag: string;            // 必填 · 通常 = code
  fpaToggle: FpaToggle;
  doctrineAuditId?: string;
  cynefinDomain?: CynefinDomain;
  approvedAt?: Date;
  approvedById?: string;
  period: PeriodCode;
  workingVersionId?: string;
}
```

### 5.2 ProductBet（ProdStack）

```typescript
interface ProductBet {
  id: string;
  title: string;
  productLineIds: string[];
  horizon: Horizon;
  linkedDiagnosisCrux?: string; // 冗余 crux 文本或 FK
  linkedVxIds: string[];
  linkedIcId?: string;
  successCriteria: string[];    // 3 条
  killCriteria: string[];       // 2 条
  budgetTag?: string;           // 推荐 PB-V4-2026
  fpaToggle: FpaToggle;
  gateStatus: BetGateStatus;
  doctrineInnovateAuditId?: string;
  cynefinDomain?: CynefinDomain;
  period: PeriodCode;
  workingVersionId?: string;
}
```

### 5.3 GtmBet（GtmStack）

```typescript
interface GtmBet {
  id: string;
  title: string;
  segmentId?: string;
  brandChannelCellId?: string;
  successCriteria: string[];
  killCriteria: string[];
  linkedAssumptionIds: string[];
  linkedIcId?: string;
  budgetTag?: string;           // 推荐 GB-HOTEL-2026
  fpaToggle: FpaToggle;
  gateStatus: BetGateStatus;
  doctrineTags: ("invest" | "deliver")[];
  period: PeriodCode;
  workingVersionId?: string;
}
```

### 5.4 Bet → FPA Toggle 状态机

```typescript
function syncBetFpaToggle(bet: InvestmentCase | ProductBet | GtmBet): FpaToggle {
  switch (bet.gateStatus) {
    case "approved":
    case "post_invest":
      return "on";
    case "rejected":
    case "killed":
      return "off";              // Forecast 归零，保留 ghost 线供 diff
    case "deferred":
      return "deferred";
    default:
      return bet.fpaToggle;
  }
}

/** FPA 行展开「挂载 Bet」 */
interface FpaBudgetLine {
  id: string;
  fpaPeriodId: string;
  budgetTag: string;            // 唯一键（period 内）
  label: string;
  scope: "company" | BrandCode;
  lineType: "revenue" | "capex" | "opex" | "rd" | "channel";
  amountBudget: Decimal;
  amountActual: Decimal;
  amountForecast: Decimal;
  fpaToggle: FpaToggle;
  ghostForecast?: Decimal;      // killed 前的预测，供 StratDiff
  linkedBetType?: "investment_case" | "product_bet" | "gtm_bet" | "key_result";
  linkedBetId?: string;
}
```

---

## 六、HealthAssertion（§16.2 · 一票否决）

```typescript
interface HealthAssertion {
  id: string;
  assertionType: HealthAssertionType;
  active: boolean;              // 同一 type 至多一条 active=true（软约束）

  // 触发上下文
  triggeredAt: Date;
  sourceReportId?: string;
  sourceImportBatch?: string;   // Sheet1 Excel batch id

  // 断言内容
  message: string;              // "现金 runway 2.1 月"
  metricValue?: Decimal;
  thresholdValue?: Decimal;
  remedialVxId?: string;

  // 解除
  clearedAt?: Date;
  clearedByReportId?: string;
  ceoExceptionNote?: string;    // 快照前强制例外
  ceoExceptionById?: string;
  ceoExceptionAt?: Date;

  // 快照冻结副本
  snapshotId?: string;          // 若在某次快照中冻结
}

/** 入库节点强制断言 */
async function runHealthAssertions(ctx: {
  trigger: "MON_RPT" | "QTR_REV" | "SHEET1_IMPORT" | "PRE_SNAPSHOT";
  reportId?: string;
  cashRunwayMonths?: number;
  majorIncidentFlag?: boolean;
  coreTalentChurnPct?: number;
}): Promise<HealthAssertion[]> {
  const triggered: HealthAssertion[] = [];

  if (ctx.cashRunwayMonths != null && ctx.cashRunwayMonths < 3) {
    triggered.push(await upsertAssertion({
      assertionType: "runway",
      active: true,
      message: `现金 runway ${ctx.cashRunwayMonths} 月`,
      metricValue: ctx.cashRunwayMonths,
      thresholdValue: 3,
      sourceReportId: ctx.reportId,
    }));
  }
  // compliance / talent / brand 同理…
  return triggered;
}

async function assertHealthBeforeSnapshot(): Promise<void> {
  const active = await db.healthAssertion.findMany({ where: { active: true } });
  const withoutException = active.filter(a => !a.ceoExceptionNote);
  if (withoutException.length > 0) {
    throw new SnapshotBlockedError(withoutException);
  }
}
```

---

## 七、执行层 · Vx / Hx / OKR（MVP+ 扩展字段）

```typescript
interface Project {
  id: string;
  code: string;                 // V1–V10
  name: string;
  ownerId?: string;
  cynefinDomain: CynefinDomain; // MVP+ 必填
  horizon?: Horizon;            // Phase 2 正式
  budgetTag?: string;           // VX-V4-2026
  investmentCaseId?: string;
  budgetTotal?: Decimal;
  budgetSpent?: Decimal;
  budgetRemaining?: Decimal;    // computed
  progressPercent?: number;
  currentMilestone?: string;
  riskLevel: "none" | "low" | "medium" | "high";
  status: "active" | "completed" | "paused";
  period: PeriodCode;
}

interface Assumption {
  id: string;
  code: string;                 // H1, H2…
  content: string;
  assumptionType?: "general" | "product" | "gtm" | "capital";
  cynefinDomain: CynefinDomain;
  linkedProjectId?: string;
  fpaDriver?: string;           // 驱动变量名
  validationMethod?: string;
  result: "pending" | "validated" | "failed";
  failureImpact?: string;
  mitigation?: string;
  period: PeriodCode;
}

interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  doctrineTag?: "invest" | "innovate" | "deliver";
  budgetTag: string;            // 必填或 UI 标黄
  bscMeasureId?: string;
  projectId?: string;
  targetValue?: string;
  currentValue?: string;
  confidence?: number;          // 0–1
  isLeadingIndicator: boolean;    // complex 域 Vx 优先
  period: PeriodCode;
}
```

---

## 八、FPA 脊梁

```typescript
interface FpaPeriod {
  id: string;
  period: PeriodCode;
  scope: "company" | BrandCode;
  revenueBudget: Decimal;
  revenueActual: Decimal;
  revenueForecast: Decimal;
  profitBudget: Decimal;
  profitActual: Decimal;
  profitForecast: Decimal;
  cashBudget?: Decimal;
  cashActual?: Decimal;
  cashForecast?: Decimal;
  linkedAssumptionIds: string[];
  varianceBa?: Decimal;         // computed
  varianceBf?: Decimal;
  financialSignal: TrafficLight;
}

interface CashPosition {
  id: string;
  asOfDate: Date;
  cashBalance: Decimal;
  monthlyBurn: Decimal;
  runwayMonths: Decimal;        // cashBalance / monthlyBurn
  cashPeakMonth?: string;
  cashPeakAmount?: Decimal;
  runwayAfterPeak?: Decimal;
  period: PeriodCode;
}

interface CapStackPeriod {
  id: string;
  period: PeriodCode;
  capexBudget: Decimal;
  capexCommitted: Decimal;
  capexSpent: Decimal;
  opexInvestmentBudget: Decimal;
  byHorizonJson: Record<Horizon, Decimal>;
  byBrandJson: Record<BrandCode, Decimal>;
  byTypeJson: Record<InvestmentType, Decimal>;
  cashPeakMonth?: string;
  cashPeakAmount?: Decimal;
  runwayAfterPeak?: Decimal;
}
```

---

## 九、freezeSnapshot() 伪代码（核心服务）

```typescript
async function freezeSnapshot(input: {
  period: PeriodCode;
  snapshotType: SnapshotType;
  workingVersionId: string;
  frozenById: string;
  meetingNotes?: string;
}): Promise<StrategicSnapshot> {
  // 1. 断言复检（§16.2）
  await runHealthAssertions({ trigger: "PRE_SNAPSHOT", /* … */ });
  await assertHealthBeforeSnapshot();

  // 2. 收集 approved 实体
  const diagnosis = await requireApprovedDiagnosis(input.period);
  const state = await buildSnapshotStatePayload(input.period, input.workingVersionId);

  // 3. 计算 Mintzberg 聚合
  const pattern = await computeStrategyPattern(state, input.period);

  // 4. 事务写入
  return db.$transaction(async (tx) => {
    const cash = await tx.cashPosition.findFirst({ where: { period: input.period } });
    const capStack = await tx.capStackPeriod.findFirst({ where: { period: input.period } });
    const activeAssertions = await tx.healthAssertion.findMany({ where: { active: true } });

    const snapshot = await tx.strategicSnapshot.create({
      data: {
        code: `${input.period}-${input.snapshotType}-STRATEGIC`,
        period: input.period,
        snapshotType: input.snapshotType,
        status: "FROZEN",
        frozenAt: new Date(),
        frozenById: input.frozenById,
        workingVersionId: input.workingVersionId,
        meetingNotes: input.meetingNotes,
        diagnosisId: diagnosis.id,
        capStackPeriodId: capStack?.id,
        cashPositionId: cash?.id,
        healthAssertionIds: activeAssertions.map(a => a.id),
        bscLightsAtFreeze: await computeBscLights(input.period),
        stateJson: state,
        strategyPattern: { create: pattern },
      },
    });

    // 5. 标记断言冻结副本
    await tx.healthAssertion.updateMany({
      where: { id: { in: activeAssertions.map(a => a.id) } },
      data: { snapshotId: snapshot.id },
    });

    await tx.workingVersion.update({
      where: { id: input.workingVersionId },
      data: { status: "ARCHIVED" },
    });

    return snapshot;
  });
}
```

---

## 十、ER 关系简图

```
WorkingVersion ──basedOn──> StrategicSnapshot
        │
        ├── StrategicDiagnosis (approved, 1 per period)
        ├── BrandStrategyCard ×4
        ├── InvestmentCase ──budgetTag──> FpaBudgetLine
        ├── ProductBet      ──budgetTag──> FpaBudgetLine
        ├── GtmBet          ──budgetTag──> FpaBudgetLine
        ├── Objective ──> KeyResult ──budgetTag──> FpaBudgetLine
        └── Project ──> Assumption

StrategicSnapshot ──1:1──> StrategyPattern
StrategicSnapshot ──diff──> DiffRecord ──> StrategicSnapshot

Report ──triggers──> HealthAssertion ──blocks──> freezeSnapshot()
CashPosition ──feeds──> HealthAssertion (runway)
```

---

## 十一、落表分期（Prisma migration 建议）

| 批次 | 表 | 说明 |
|------|-----|------|
| **P0** | `working_versions`, `strategic_snapshots`, `strategy_patterns`, `diff_records`, `strategic_diagnoses`, `brand_strategy_cards`, `health_assertions` | 版本 + 认知 + 否决 |
| **P1** | `investment_cases`, `cap_stack_periods`, `product_lines`, `product_bets`, `customer_segments`, `gtm_bets`, `fpa_budget_lines` | 三栈 + FPA 勾连 |
| **P2** | `bsc_*`, `objectives`, `key_results`, `project_financials`, `execution_scoreboard_configs` | OKR 树 + 4DX |
| **P3** | 扩展已有 `projects`, `assumptions`, `commitments` | 字段迁移 |

当前 `schema.prisma` 已包含 **P0 + P1 核心表** 及 **扩展后的 Project / Assumption**。

---

## 十二、瑞合瑞德示例实例

```typescript
const diagnosisFY26: StrategicDiagnosis = {
  id: "diag-001",
  period: "2026-FY",
  challengeStatement: "从 1 亿到 2.5 亿，渠道扩张与产品化能力不同步",
  bottleneckType: "capability",
  rootCauses: ["热泵平台未冻结", "渠道签约节奏慢于产能", "四品牌资源分散"],
  crux: "热泵产品化 12 个月内能否成立",
  linkedAssumptionIds: ["hx-h2-smith-price"],
  linkedBscMeasureIds: [],
  validUntil: new Date("2026-12-31"),
  status: "approved",
};

const productBetV4: ProductBet = {
  id: "pb-001",
  title: "H2：V4 平台化",
  productLineIds: ["pl-v4-heatpump"],
  horizon: "H2",
  linkedDiagnosisCrux: diagnosisFY26.crux,
  linkedVxIds: ["proj-v4"],
  successCriteria: ["Q3 样机通过", "Q4 小批量", "RUUD 首单交付"],
  killCriteria: ["Q3 未过测", "成本超目标 20%"],
  budgetTag: "PB-V4-2026",
  fpaToggle: "on",
  gateStatus: "approved",
  period: "2026-FY",
};

const runwayAssertion: HealthAssertion = {
  id: "ha-001",
  assertionType: "runway",
  active: true,
  triggeredAt: new Date("2026-05-31"),
  sourceReportId: "rpt-2026-05",
  message: "现金 runway 2.1 月",
  metricValue: 2.1,
  thresholdValue: 3,
};
```

---

*已实现：`lib/stratos/*` · `npm test` · `npm run db:migrate`*
