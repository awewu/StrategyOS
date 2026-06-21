import { PrismaClient } from "@prisma/client";
import { getAllSeries } from "../lib/health/ops-metrics";

const prisma = new PrismaClient();

async function main() {
  const ceo = await prisma.user.upsert({
    where: { email: "ceo@rheem.cn" },
    update: { orgUnitId: null, projectCode: null },
    create: { name: "铁山", email: "ceo@rheem.cn", role: "ceo" },
  });

  await prisma.user.upsert({
    where: { email: "vp@rheem.cn" },
    update: { orgUnitId: "org-exec-hw", projectCode: null },
    create: { name: "毕韬", email: "vp@rheem.cn", role: "vp", orgUnitId: "org-exec-hw" },
  });
  await prisma.user.upsert({
    where: { email: "pm@rheem.cn" },
    update: { orgUnitId: "org-exec-hw", projectCode: "V4" },
    create: { name: "张健", email: "pm@rheem.cn", role: "pm", orgUnitId: "org-exec-hw", projectCode: "V4" },
  });
  await prisma.user.upsert({
    where: { email: "staff@rheem.cn" },
    update: { orgUnitId: null, projectCode: null },
    create: { name: "战略组", email: "staff@rheem.cn", role: "staff" },
  });

  await prisma.strategicDiagnosis.upsert({
    where: { id: "seed-diag-fy26" },
    update: {},
    create: {
      id: "seed-diag-fy26",
      period: "2026-FY",
      challengeStatement: "从 1 亿到 2.5 亿，渠道扩张与产品化能力不同步",
      bottleneckType: "capability",
      rootCauses: ["热泵平台未冻结", "渠道签约慢于产能", "四品牌资源分散"],
      crux: "热泵产品化 12 个月内能否成立",
      validUntil: new Date("2026-12-31"),
      status: "approved",
      approvedById: ceo.id,
      approvedAt: new Date(),
    },
  });

  await prisma.investmentCase.upsert({
    where: { code: "IC-2026-01" },
    update: {},
    create: {
      code: "IC-2026-01",
      title: "RUUD 华东渠道中心",
      type: "brand",
      horizon: "H1",
      period: "2026-FY",
      capexTotal: 2800,
      expectedIrr: 0.18,
      gateStatus: "approved",
      budgetTag: "IC-2026-01",
      fpaToggle: "on",
      approvedById: ceo.id,
      approvedAt: new Date(),
    },
  });

  const haExisting = await prisma.healthAssertion.findFirst({
    where: { assertionType: "runway", active: true },
  });
  if (!haExisting) {
    await prisma.healthAssertion.create({
      data: {
        assertionType: "runway",
        active: true,
        triggeredAt: new Date(),
        message: "一票否决：现金 runway 2.1 月",
        metricValue: 2.1,
        thresholdValue: 3,
      },
    });
  }

  await prisma.capStackPeriod.upsert({
    where: { period: "2026-FY" },
    update: {},
    create: {
      period: "2026-FY",
      capexBudget: 12000,
      capexCommitted: 9500,
      capexSpent: 9000,
      opexInvestmentBudget: 800,
      byHorizonJson: { H1: 62, H2: 28, H3: 10 },
      byBrandJson: { RUUD: 35, HENGRE: 30, RUIMEI: 25, TECH_HOME: 10 },
      byTypeJson: { strategic: 20, capacity: 40, technology: 25, brand: 10, people: 5 },
      cashPeakMonth: "2026-09",
      cashPeakAmount: 3200,
      runwayAfterPeak: 2.8,
    },
  });

  const fpaExisting = await prisma.fpaPeriod.findFirst({
    where: { period: "2026-FY", scope: "company" },
  });
  if (!fpaExisting) {
    await prisma.fpaPeriod.create({
      data: {
        period: "2026-FY",
        scope: "company",
        revenueBudget: 6000,
        revenueActual: 5120,
        revenueForecast: 5800,
        profitBudget: 880,
        profitActual: 720,
        profitForecast: 820,
        financialSignal: "red",
      },
    });
  }

  const cashExisting = await prisma.cashPosition.findFirst({ where: { period: "2026-FY" } });
  if (!cashExisting) {
    await prisma.cashPosition.create({
      data: {
        period: "2026-FY",
        asOfDate: new Date("2026-06-01"),
        cashBalance: 1680,
        monthlyBurn: 800,
        runwayMonths: 2.1,
        cashPeakMonth: "2026-09",
        cashPeakAmount: 3200,
        runwayAfterPeak: 2.8,
      },
    });
  }

  // Phase 3+ · M&A · SPBP · TechSignal
  const maCount = await prisma.maPipelineItem.count();
  if (maCount === 0) {
    await prisma.maPipelineItem.createMany({
      data: [
        {
          name: "苏南区域经销商整合",
          direction: "channel",
          stage: "dd",
          synergyThesis: "华东酒店渠道密度 + 服务网络",
          valuationRange: "800–1200 万",
          linkedAssumptionCodes: ["H5"],
          integrationMilestone100d: "D30 品牌切换 · D60 库存并表 · D100 KPI 对齐",
        },
        {
          name: "热泵控制芯片 JV",
          direction: "jv",
          stage: "screen",
          synergyThesis: "V4 平台差异化 + 供应链安全",
          valuationRange: "待定",
          linkedAssumptionCodes: ["H2"],
        },
      ],
    });
  }

  await prisma.spbpScenario.upsert({
    where: { code: "sc-base" },
    update: {},
    create: {
      code: "sc-base",
      name: "基准",
      probability: 55,
      drivers: ["酒店 1200 家", "V4 Q4 上市"],
      revenueImpact: 5800,
      profitImpact: 820,
      runwayMonths: 2.1,
      linkedAssumptionCodes: ["H5"],
    },
  });
  await prisma.spbpScenario.upsert({
    where: { code: "sc-opt" },
    update: {},
    create: {
      code: "sc-opt",
      name: "乐观",
      probability: 20,
      drivers: ["科技住宅超预期", "史密斯不降价"],
      revenueImpact: 6400,
      profitImpact: 980,
      runwayMonths: 3.2,
      linkedAssumptionCodes: ["H2"],
    },
  });
  await prisma.spbpScenario.upsert({
    where: { code: "sc-pess" },
    update: {},
    create: {
      code: "sc-pess",
      name: "悲观",
      probability: 25,
      drivers: ["V4 延迟 2Q", "竞品降价"],
      revenueImpact: 5200,
      profitImpact: 580,
      runwayMonths: 1.4,
      linkedAssumptionCodes: ["H2", "H5"],
    },
  });

  const tsCount = await prisma.techSignalRecord.count();
  if (tsCount === 0) {
    await prisma.techSignalRecord.createMany({
      data: [
        {
          title: "V4 变频控制算法",
          domain: "heat_pump",
          trl: 6,
          source: "研发月报 2026-05",
          horizon: "H2",
          linkedProjectCode: "V4",
          urgency: "act",
        },
        {
          title: "自研主控芯片预研",
          domain: "controls",
          trl: 3,
          source: "TechSignal 扫描",
          horizon: "H3",
          linkedProjectCode: "V6",
          urgency: "watch",
        },
      ],
    });
  }

  const sheetReport = await prisma.report.findFirst({
    where: { reportType: "SHEET_IMPORT" },
  });
  if (!sheetReport) {
    await prisma.report.create({
      data: {
        reportType: "SHEET_IMPORT",
        period: "2026-05",
        title: "Sheet1 财务 Excel",
      },
    });
  }

  const logCount = await prisma.usageLog.count();
  if (logCount === 0) {
    await prisma.usageLog.createMany({
      data: [
        {
          userId: ceo.id,
          userEmail: ceo.email,
          action: "login",
          resource: ceo.email,
          metadata: { method: "seed", role: "ceo" },
        },
        {
          userId: ceo.id,
          userEmail: ceo.email,
          action: "report_parse",
          resource: "rpt-sheet1-may",
          metadata: { engine: "rules", seed: true },
        },
        {
          userEmail: "staff@rheem.cn",
          action: "pdf_download",
          resource: "stratos-panorama-2026-FY.pdf",
          metadata: { seed: true },
        },
      ],
    });
  }

  // Phase 3.10 · full entity seed
  const pm = await prisma.user.findUnique({ where: { email: "pm@rheem.cn" } });
  const vp = await prisma.user.findUnique({ where: { email: "vp@rheem.cn" } });

  if ((await prisma.brandStrategyCard.count()) === 0) {
    await prisma.brandStrategyCard.createMany({
      data: [
        {
          brandCode: "RUUD",
          period: "2026-FY",
          winningAspiration: "华东热泵高端份额前三",
          whereToPlayJson: { summary: "酒店·家用·华东经销商" },
          howToWin: "V4 平台化 + 不停业改造方案",
          mustHaveCapabilities: ["热泵平台", "渠道服务"],
          linkedBscDimensionIds: [],
          linkedObjectiveIds: [],
        },
        {
          brandCode: "HENGRE",
          period: "2026-FY",
          winningAspiration: "核心经销商深度覆盖",
          whereToPlayJson: { summary: "区县组团·存量升级" },
          howToWin: "渠道升级 + 服务响应 48h",
          mustHaveCapabilities: ["渠道数字化"],
          linkedBscDimensionIds: [],
          linkedObjectiveIds: [],
        },
        {
          brandCode: "RUIMEI",
          period: "2026-FY",
          winningAspiration: "工程渠道稳健增长",
          whereToPlayJson: { summary: "商业工程·北方区域" },
          howToWin: "总包绑定 + 验收通过率",
          mustHaveCapabilities: ["工程交付"],
          linkedBscDimensionIds: [],
          linkedObjectiveIds: [],
        },
        {
          brandCode: "TECH_HOME",
          period: "2026-FY",
          winningAspiration: "科技住宅标杆项目",
          whereToPlayJson: { summary: "高端住宅·一线都市" },
          howToWin: "系统方案 + 样板房体验",
          mustHaveCapabilities: ["系统方案"],
          linkedBscDimensionIds: [],
          linkedObjectiveIds: [],
        },
      ],
    });
  }

  await prisma.investmentCase.upsert({
    where: { code: "IC-2026-04" },
    update: {},
    create: {
      code: "IC-2026-04",
      title: "V4 热泵产线技改",
      type: "capacity",
      horizon: "H2",
      period: "2026-FY",
      capexTotal: 4500,
      expectedIrr: 0.16,
      gateStatus: "review",
      budgetTag: "IC-2026-04",
      fpaToggle: "off",
    },
  });

  const ic04 = await prisma.investmentCase.findUnique({ where: { code: "IC-2026-04" } });

  if ((await prisma.project.count()) === 0 && pm && vp) {
    await prisma.project.createMany({
      data: [
        {
          code: "V4",
          name: "热泵新品上市",
          ownerId: pm.id,
          cynefinDomain: "complex",
          horizon: "H2",
          progressPercent: 52,
          budgetTotal: 150,
          budgetSpent: 95,
          riskLevel: "high",
          status: "active",
        },
        {
          code: "V1",
          name: "恒热渠道升级",
          ownerId: vp.id,
          cynefinDomain: "complicated",
          horizon: "H1",
          progressPercent: 78,
          budgetTotal: 180,
          budgetSpent: 120,
          riskLevel: "low",
          status: "active",
        },
        {
          code: "V6",
          name: "区域 M&A 预研",
          cynefinDomain: "complex",
          horizon: "H3",
          progressPercent: 0,
          budgetTotal: 50,
          budgetSpent: 0,
          riskLevel: "medium",
          status: "active",
        },
      ],
    });
  }

  if ((await prisma.assumption.count()) === 0) {
    await prisma.assumption.createMany({
      data: [
        {
          code: "H2",
          content: "史密斯 Q3 不降价",
          assumptionType: "product",
          cynefinDomain: "complex",
          result: "pending",
        },
        {
          code: "H5",
          content: "酒店签约全年 ≥1200 家",
          assumptionType: "gtm",
          cynefinDomain: "complicated",
          result: "pending",
        },
      ],
    });
  }

  if ((await prisma.productBet.count()) === 0) {
    await prisma.productBet.createMany({
      data: [
        {
          title: "H2：V4 平台化",
          period: "2026-FY",
          horizon: "H2",
          gateStatus: "approved",
          budgetTag: "PB-V4-2026",
          fpaToggle: "on",
        },
        {
          title: "H3：科技住宅系统方案",
          period: "2026-FY",
          horizon: "H3",
          gateStatus: "review",
          budgetTag: "PB-TECH-2026",
          fpaToggle: "off",
        },
      ],
    });
  }

  if ((await prisma.gtmBet.count()) === 0) {
    await prisma.gtmBet.createMany({
      data: [
        {
          title: "2026 酒店签约 1200 家",
          period: "2026-FY",
          gateStatus: "approved",
          budgetTag: "GB-HOTEL-2026",
          fpaToggle: "on",
        },
      ],
    });
  }

  if ((await prisma.capacitySnapshot.count()) === 0 && ic04) {
    await prisma.capacitySnapshot.create({
      data: {
        period: "2026-FY",
        demandUnits: 42000,
        capacityUnits: 25300,
        utilizationPct: 92,
        gapUnits: 16700,
        gapAction: "invest",
        linkedInvestmentCaseId: ic04.id,
        recordedAt: new Date(),
      },
    });
  }

  if ((await prisma.healthSignal.count()) === 0) {
    await prisma.healthSignal.createMany({
      data: [
        { period: "2026-FY", dimension: "financial", signal: "red", recordedAt: new Date() },
        { period: "2026-FY", dimension: "customer", signal: "green", recordedAt: new Date() },
        { period: "2026-FY", dimension: "process", signal: "yellow", recordedAt: new Date() },
        { period: "2026-FY", dimension: "learning", signal: "green", recordedAt: new Date() },
        {
          period: "2026-FY",
          dimension: "kpi",
          signal: "yellow",
          kpiName: "季度营收",
          kpiValue: "1,280 万",
          kpiTarget: "1,500 万",
          recordedAt: new Date(),
        },
        {
          period: "2026-FY",
          dimension: "kpi",
          signal: "red",
          kpiName: "项目准时率",
          kpiValue: "70%",
          kpiTarget: "≥85%",
          recordedAt: new Date(),
        },
      ],
    });
  }

  if ((await prisma.customerSegment.count()) === 0) {
    const hotel = await prisma.customerSegment.create({
      data: {
        code: "SEG-HOTEL",
        name: "酒店",
        priority: "focus",
        horizon: "H1",
      },
    });
    await prisma.coverageSnapshot.create({
      data: {
        period: "2026-FY",
        segmentCode: hotel.code,
        targetCount: 1200,
        actualCount: 820,
        forecastCount: 1100,
        recordedAt: new Date(),
      },
    });
    await prisma.segmentEconomics.create({
      data: {
        segmentId: hotel.id,
        period: "2026-FY",
        ltvCacRatio: 18,
        signal: "yellow",
      },
    });
  }

  // ── Execution layer: tensions / maturity / market evidence / positions ──────
  if ((await prisma.executionTension.count()) === 0) {
    await prisma.executionTension.createMany({
      data: [
        { period: "2026-FY", projectCode: "V4", projectName: "热泵新品上市", tensionType: "capability", signal: "样机测试通过率 72%，目标 100%，已延期两个月", diagnosis: "产品化能力缺口——热泵系统集成经验不足，非执行懈怠", recommendation: "引入外部集成顾问，并行建立内部能力，而非单纯催进度", severity: "high", linkedKr: "V4 样机测试通过率" },
        { period: "2026-FY", projectCode: "V1", projectName: "恒热渠道升级", tensionType: "direction", signal: "KR 达成 78%，但签约量同比未增长", diagnosis: "KR 度量渠道覆盖数量，战略目标是签约质量，方向错位", recommendation: "将 KR 从「覆盖家数」改为「A 级经销商占比 + 单店产出」", severity: "medium", linkedAssumptionCode: "H5", linkedKr: "Q2 华东新签 80 家" },
        { period: "2026-FY", projectCode: "V6", projectName: "区域 M&A 预研", tensionType: "adaptation", signal: "预研进度 0%，竞争格局出现不确定信号", diagnosis: "H2 假设（史密斯不降价）如失效，M&A 估值逻辑根本改变", recommendation: "触发 Diagnosis 重检，评估假设前提是否仍成立后再推进", severity: "high", linkedAssumptionCode: "H2" },
        { period: "2026-FY", projectCode: "V4", projectName: "热泵新品上市", tensionType: "resource", signal: "V4 预算执行 63%，已超支，挤压其他 H1 项目可用资源", diagnosis: "资本分配与优先级倒置，高优先级项目超支未经 Gate 审批", recommendation: "将 V4 追加预算纳入 IC Gate 正式审批，重配 CapStack H2 资源", severity: "medium" },
      ],
    });
  }
  if ((await prisma.executionMaturity.count()) === 0) {
    await prisma.executionMaturity.createMany({
      data: [
        { period: "2026-FY", projectCode: "V4", projectName: "热泵新品上市", owner: "张健", milestoneOnTimeRate: 0.42, assumptionHitRate: 0.55, responseLatencyDays: 18, budgetTotal: 150, tensionType: "capability", horizon: "H2" },
        { period: "2026-FY", projectCode: "V1", projectName: "恒热渠道升级", owner: "毕韬", milestoneOnTimeRate: 0.82, assumptionHitRate: 0.70, responseLatencyDays: 6, budgetTotal: 180, tensionType: "direction", horizon: "H1" },
        { period: "2026-FY", projectCode: "V6", projectName: "区域M&A预研", owner: "战略组", milestoneOnTimeRate: 0.10, assumptionHitRate: 0.30, responseLatencyDays: 45, budgetTotal: 50, tensionType: "adaptation", horizon: "H3" },
      ],
    });
  }
  if ((await prisma.marketEvidence.count()) === 0) {
    await prisma.marketEvidence.createMany({
      data: [
        { period: "2026-FY", actionLabel: "攻酒店渠道（华东）", actionCode: "V1", linkedAssumptionCode: "H5", evidenceText: "Q2 华东酒店新签 62 家，同期史密斯约 300 家。渠道容量约 2000 家，我方渗透率 3.1%。", evidenceSource: "销售周报 2026-06-10 · 竞品调研", recordedBy: "毕韬", recordedAt: new Date("2026-06-12"), verdict: "assumption_failed", verdictNote: "假设 H5（年签约 ≥1200 家）按当前速度无法兑现，市场竞争强度高于预期" },
        { period: "2026-FY", actionLabel: "V4 热泵产品化上市", actionCode: "V4", linkedAssumptionCode: "H2", verdict: "empty" },
        { period: "2026-FY", actionLabel: "RUUD 价格执行（不跟降）", linkedAssumptionCode: "H2", evidenceText: "Q2 RUUD ASP +2.1% vs Q1，史密斯同期下调 3%。溢价守住，但导致部分价格敏感客户流失约 8%。", evidenceSource: "财务月报 2026-05 · 客户流失分析", recordedBy: "CFO", recordedAt: new Date("2026-06-05"), verdict: "effective", verdictNote: "价格策略有效，但需监控客户流失率是否持续扩大" },
        { period: "2026-FY", actionLabel: "恒热华南区县级渠道下沉", actionCode: "V1", verdict: "empty" },
        { period: "2026-FY", actionLabel: "区域 M&A 标的市场格局", actionCode: "V6", linkedAssumptionCode: "H2", verdict: "empty" },
      ],
    });
  }
  if ((await prisma.competitivePosition.count()) === 0) {
    await prisma.competitivePosition.createMany({
      data: [
        { period: "2026-FY", competitor: "史密斯", dimension: "华东酒店渠道签约量（Q2）", ourValue: "62 家", theirValue: "约 300 家", delta: "落后 238 家 (-79%)", evidenceSource: "竞品调研 2026-06", recordedBy: "毕韬", recordedAt: new Date("2026-06-12") },
        { period: "2026-FY", competitor: "博世", dimension: "华东热泵产品 ASP", ourValue: "¥18,200", theirValue: null },
        { period: "2026-FY", competitor: "史密斯", dimension: "全国营收增速（YoY）" },
        { period: "2026-FY", competitor: "林内", dimension: "华南家用热水器市占率" },
      ],
    });
  }

  // ── Commitments (team-entered, owner by name) ───────────────────────────────
  if ((await prisma.commitment.count()) === 0) {
    await prisma.commitment.createMany({
      data: [
        { ownerName: "张健",   promiseTo: "研发中心", content: "V4 样机完成 EMC 测试",         deadline: new Date("2026-05-31"), status: "in_progress", linkedProjectCode: "V4" },
        { ownerName: "毕韬",   promiseTo: "销售管理", content: "华东新增 A 级经销商 ≥15 家",   deadline: new Date("2026-06-30"), status: "completed",   linkedProjectCode: "V1" },
        { ownerName: "CFO",   promiseTo: "财务",     content: "CapStack H2 预算重配方案提交", deadline: new Date("2026-06-14"), status: "in_progress", linkedProjectCode: "V4" },
        { ownerName: "战略组", promiseTo: "战略",     content: "M&A 目标标的初步尽调报告",    deadline: new Date("2026-06-30"), status: "in_progress", linkedProjectCode: "V6" },
        { ownerName: "张健",   promiseTo: "研发中心", content: "V4 供应商定点确认",           deadline: new Date("2026-03-31"), status: "completed",   linkedProjectCode: "V4" },
        { ownerName: "毕韬",   promiseTo: "销售管理", content: "酒店渠道专项培训完成",        deadline: new Date("2026-04-30"), status: "in_progress", linkedAssumptionCode: "H5" },
        { ownerName: "HR",    promiseTo: "人力资源", content: "研发关键岗位招募完成 80%",     deadline: new Date("2026-06-30"), status: "in_progress", linkedProjectCode: "V4" },
        { ownerName: "COO",   promiseTo: "运营",     content: "供应链产能缺口应对方案",       deadline: new Date("2026-06-30"), status: "pending" },
      ],
    });
  }

  // ── Ops health metrics: materialize 72-month series into DB ─────────────────
  if ((await prisma.opsMetricActual.count()) === 0) {
    const series = getAllSeries();
    const data = series.flatMap((s) =>
      s.points.map((p) => ({
        metricId: s.metricId,
        month: p.month,
        actual: p.actual,
        planned: p.planned,
      }))
    );
    await prisma.opsMetricActual.createMany({ data, skipDuplicates: true });
  }

  console.log("StratOS seed complete (Phase 3.10 · full entity wiring)");
  // ── Market Intelligence (Hermes) seed ──────────────────────────────────────
  const srcSmithSite = await prisma.intelSource.upsert({
    where: { id: "src-smith-site" },
    update: {},
    create: { id: "src-smith-site", competitor: "史密斯", kind: "official_site", url: "https://www.aosmith.com.cn", cadenceDays: 7, lastScrapedAt: new Date("2026-06-17"), health: "active" },
  });
  const srcSmithFiling = await prisma.intelSource.upsert({
    where: { id: "src-smith-filing" },
    update: {},
    create: { id: "src-smith-filing", competitor: "史密斯", kind: "filing", url: "https://www.aosmith.com/investors", cadenceDays: 30, lastScrapedAt: new Date("2026-06-01"), health: "active" },
  });
  const _srcRinnaiSite = await prisma.intelSource.upsert({
    where: { id: "src-rinnai-site" },
    update: {},
    create: { id: "src-rinnai-site", competitor: "林内", kind: "official_site", url: "https://www.rinnai.com.cn", cadenceDays: 7, lastScrapedAt: new Date("2026-06-16"), health: "active" },
  });
  const srcRinnaiSocial = await prisma.intelSource.upsert({
    where: { id: "src-rinnai-social" },
    update: {},
    create: { id: "src-rinnai-social", competitor: "林内", kind: "social", url: null, cadenceDays: 14, lastScrapedAt: new Date("2026-05-20"), health: "stale" },
  });
  const srcCarrierPress = await prisma.intelSource.upsert({
    where: { id: "src-carrier-press" },
    update: {},
    create: { id: "src-carrier-press", competitor: "开利", kind: "press", url: "https://www.corporate.carrier.com/news", cadenceDays: 14, lastScrapedAt: new Date("2026-06-15"), health: "active" },
  });
  const _srcCarrierPatent = await prisma.intelSource.upsert({
    where: { id: "src-carrier-patent" },
    update: {},
    create: { id: "src-carrier-patent", competitor: "开利", kind: "patent", url: null, cadenceDays: 30, lastScrapedAt: null, health: "empty" },
  });
  const srcHaierSite = await prisma.intelSource.upsert({
    where: { id: "src-haier-site" },
    update: {},
    create: { id: "src-haier-site", competitor: "海尔", kind: "official_site", url: "https://www.haier.com", cadenceDays: 7, lastScrapedAt: new Date("2026-06-17"), health: "active" },
  });
  const _srcMideaChannel = await prisma.intelSource.upsert({
    where: { id: "src-midea-channel" },
    update: {},
    create: { id: "src-midea-channel", competitor: "美的", kind: "channel", url: null, cadenceDays: 14, lastScrapedAt: null, health: "empty" },
  });
  const srcSmithRecruit = await prisma.intelSource.upsert({
    where: { id: "src-smith-recruit" },
    update: {},
    create: { id: "src-smith-recruit", competitor: "史密斯", kind: "recruitment", url: "https://www.aosmith.com.cn/careers", cadenceDays: 14, lastScrapedAt: new Date("2026-06-16"), health: "active" },
  });
  const srcSmithPatent = await prisma.intelSource.upsert({
    where: { id: "src-smith-patent" },
    update: {},
    create: { id: "src-smith-patent", competitor: "史密斯", kind: "patent", url: null, cadenceDays: 30, lastScrapedAt: new Date("2026-06-10"), health: "active" },
  });
  const _srcCarrierRecruit = await prisma.intelSource.upsert({
    where: { id: "src-carrier-recruit" },
    update: {},
    create: { id: "src-carrier-recruit", competitor: "开利", kind: "recruitment", url: null, cadenceDays: 14, lastScrapedAt: null, health: "empty" },
  });

  const signalSeeds = [
    { id: "sig-1", sourceId: srcSmithSite.id, competitor: "史密斯", dimension: "product" as const, title: "推出 AI 净恒温热泵两联供新品", summary: "史密斯发布主打「AI 控温 + 净水联动」的热泵两联供，定位高端，瞄准南方采暖+热水一体场景，与我方 V4 热泵产品化窗口直接重叠。", impact: "threat" as const, relevance: 92, sourceLabel: "史密斯官网 newsroom 2026-06-15", capturedAt: new Date("2026-06-17"), linkedAssumptionCode: "H2", linkedActionCode: "V4" },
    { id: "sig-2", sourceId: srcSmithSite.id, competitor: "史密斯", dimension: "gtm" as const, title: "华东酒店渠道加速签约", summary: "Q2 华东酒店工程渠道新签约约 300 家，明显领先行业，配套专项返利政策。我方同期约 62 家。", impact: "threat" as const, relevance: 88, sourceLabel: "渠道调研 2026-06-10", capturedAt: new Date("2026-06-12"), linkedAssumptionCode: "H5", linkedActionCode: "V1" },
    { id: "sig-3", sourceId: srcRinnaiSocial.id, competitor: "林内", dimension: "brand" as const, title: "签约新代言人，主攻年轻家庭", summary: "林内启用新生代代言人并投放梯媒+短视频组合，品牌调性年轻化，抢占新装修家庭心智。", impact: "neutral" as const, relevance: 54, sourceLabel: "公众号/梯媒监测 2026-06-08", capturedAt: new Date("2026-06-14") },
    { id: "sig-4", sourceId: srcCarrierPress.id, competitor: "开利", dimension: "strategy" as const, title: "区域并购整合暖通服务商", summary: "开利收购一家华南暖通安装服务商，补强工程交付与售后网络，强化 B 端一体化能力。", impact: "threat" as const, relevance: 76, sourceLabel: "行业媒体 2026-06-13", capturedAt: new Date("2026-06-15"), linkedActionCode: "V1" },
    { id: "sig-5", sourceId: srcHaierSite.id, competitor: "海尔", dimension: "product" as const, title: "三联供集成方案铺市", summary: "海尔推「采暖+热水+净水」三联供集成方案，绑定智能家居生态，主打整装渠道。", impact: "opportunity" as const, relevance: 61, sourceLabel: "海尔官网 2026-06-16", capturedAt: new Date("2026-06-17") },
    { id: "sig-6", sourceId: srcSmithFiling.id, competitor: "史密斯", dimension: "strategy" as const, title: "财报披露：热泵营收同比高增", summary: "最新季报披露中国区热泵品类营收同比双位数增长，明确加大产能与研发投入指引。", impact: "threat" as const, relevance: 70, sourceLabel: "AO Smith 季报 2026-Q1", capturedAt: new Date("2026-06-01"), linkedAssumptionCode: "H2" },
    { id: "sig-7", sourceId: srcSmithRecruit.id, competitor: "史密斯", dimension: "product" as const, title: "招聘热泵变频控制工程师 20+ 名", summary: "史密斯华东研发中心密集招聘热泵变频控制、压缩机匹配岗位 20 余名，jd 明确提到「新一代 R290 环保冷媒平台」，技术路线先于产品发布约 9 个月。", impact: "threat" as const, relevance: 84, sourceLabel: "史密斯招聘官网 2026-06-16", capturedAt: new Date("2026-06-16"), linkedAssumptionCode: "H2", verdict: "supported" as const, evidence: "新一代 R290 环保冷媒平台" },
    { id: "sig-8", sourceId: srcSmithPatent.id, competitor: "史密斯", dimension: "product" as const, title: "专利公开：R290 微通道换热结构", summary: "史密斯公开一项 R290 微通道换热器专利，指向更高能效与更小充注量，是其下一代热泵平台的核心技术储备。", impact: "threat" as const, relevance: 79, sourceLabel: "专利检索 2026-06-10", capturedAt: new Date("2026-06-10"), linkedAssumptionCode: "H2", verdict: "supported" as const, evidence: "R290 微通道换热器" },
  ];
  for (const s of signalSeeds) {
    await prisma.intelSignal.upsert({ where: { id: s.id }, update: {}, create: s });
  }

  const trackSeeds = [
    { competitor: "史密斯", product: "AI 净恒温热泵两联供（高端）", gtm: "华东酒店渠道激进签约 + 专项返利", brand: "维持专业高端，工程口碑投放", strategy: "热泵产能/研发加投，季报指引明确", momentum: "up", momentumNote: "四维度全面活跃，热泵+渠道双线施压，本期威胁等级最高" },
    { competitor: "林内", product: null, gtm: null, brand: "新代言人 + 梯媒短视频年轻化", strategy: null, momentum: "flat", momentumNote: "仅捕捉到品牌动作，产品/GTM/战略三维度为盲区，社媒来源已超期" },
    { competitor: "开利", product: null, gtm: null, brand: null, strategy: "并购华南暖通服务商，补强 B 端交付", momentum: "up", momentumNote: "战略层并购信号明确，但产品/专利来源缺失，技术动向盲区" },
    { competitor: "海尔", product: "三联供集成方案绑定智能家居", gtm: "整装渠道铺市", brand: null, strategy: null, momentum: "up", momentumNote: "生态化打法值得借鉴，可作为我方整装渠道机会参考" },
    { competitor: "美的", product: null, gtm: null, brand: null, strategy: null, momentum: "flat", momentumNote: "渠道情报来源从未抓到数据，全维度盲区 —— 对该对手缺乏任何把控" },
  ];
  for (const t of trackSeeds) {
    await prisma.competitorTrack.upsert({ where: { competitor: t.competitor }, update: t, create: t });
  }


  // 爆款产品信号（史密斯热泵更新）
  await prisma.competitorProduct.update({
    where: { id: "smith-hp-ai" },
    data: {
      hotRank: 1,
      hotSignalNote: "天猫双11预售首日即售罄，热泵品类搜索量+180%，小红书种草笔记3.2万篇，主打「AI净水联动」场景教育成功",
      hotSignalAt: new Date("2026-06-15"),
      salesVelocity: "rising",
    },
  });

  // ── 竞争研究工作台 seed ───────────────────────────────────────────────────────

  // 产品线（挂事业部暂用 null，OrgUnit seed 在前面已建）
  const plHeatPump = await prisma.mktProductLine.upsert({
    where: { code: "heat_pump" },
    update: {},
    create: { code: "heat_pump", name: "热泵两联供", sortOrder: 1 },
  });
  const plGasHW = await prisma.mktProductLine.upsert({
    where: { code: "gas_hw" },
    update: {},
    create: { code: "gas_hw", name: "燃气热水器", sortOrder: 2 },
  });
  const plCAC = await prisma.mktProductLine.upsert({
    where: { code: "central_ac" },
    update: {},
    create: { code: "central_ac", name: "中央空调", sortOrder: 3 },
  });

  // 销售大区
  const regNational = await prisma.salesRegion.upsert({
    where: { code: "national" },
    update: {},
    create: { code: "national", name: "全国", sortOrder: 0 },
  });
  const regEast = await prisma.salesRegion.upsert({
    where: { code: "east" },
    update: {},
    create: { code: "east", name: "华东大区", parentId: regNational.id, sortOrder: 1 },
  });
  const regSouth = await prisma.salesRegion.upsert({
    where: { code: "south" },
    update: {},
    create: { code: "south", name: "华南大区", parentId: regNational.id, sortOrder: 2 },
  });
  const regNorth = await prisma.salesRegion.upsert({
    where: { code: "north" },
    update: {},
    create: { code: "north", name: "华北大区", parentId: regNational.id, sortOrder: 3 },
  });
  const regSW = await prisma.salesRegion.upsert({
    where: { code: "southwest" },
    update: {},
    create: { code: "southwest", name: "西南大区", parentId: regNational.id, sortOrder: 4 },
  });

  // 细分品类（挂到产品线父节点下）
  // 省级大区（挂到大区下）
  const provinces = [
    // 华东
    { code: "prov_sh", name: "上海", parentCode: "east", sort: 1 },
    { code: "prov_js", name: "江苏", parentCode: "east", sort: 2 },
    { code: "prov_zj", name: "浙江", parentCode: "east", sort: 3 },
    { code: "prov_ah", name: "安徽", parentCode: "east", sort: 4 },
    { code: "prov_sd", name: "山东", parentCode: "east", sort: 5 },
    { code: "prov_fj", name: "福建", parentCode: "east", sort: 6 },
    // 华南
    { code: "prov_gd", name: "广东", parentCode: "south", sort: 1 },
    { code: "prov_gx", name: "广西", parentCode: "south", sort: 2 },
    { code: "prov_hainan", name: "海南", parentCode: "south", sort: 3 },
    // 华北
    { code: "prov_bj", name: "北京", parentCode: "north", sort: 1 },
    { code: "prov_tj", name: "天津", parentCode: "north", sort: 2 },
    { code: "prov_hb", name: "河北", parentCode: "north", sort: 3 },
    { code: "prov_hn", name: "河南", parentCode: "north", sort: 4 },
    { code: "prov_sx", name: "山西", parentCode: "north", sort: 5 },
    // 西南
    { code: "prov_sc", name: "四川", parentCode: "southwest", sort: 1 },
    { code: "prov_cq", name: "重庆", parentCode: "southwest", sort: 2 },
    { code: "prov_yn", name: "云南", parentCode: "southwest", sort: 3 },
    { code: "prov_gz", name: "贵州", parentCode: "southwest", sort: 4 },
  ];
  const regionMap: Record<string, string> = {
    east: regEast.id, south: regSouth.id, north: regNorth.id, southwest: regSW.id,
  };
  for (const p of provinces) {
    await prisma.salesRegion.upsert({
      where: { code: p.code },
      update: {},
      create: { code: p.code, name: p.name, parentId: regionMap[p.parentCode], sortOrder: p.sort },
    });
  }

  const subHeatPump6 = await prisma.mktProductLine.upsert({
    where: { code: "hp_6kw" },
    update: {},
    create: { code: "hp_6kw", name: "热泵 6kW（小型家用）", parentId: plHeatPump.id, sortOrder: 1 },
  });
  const subHeatPump10 = await prisma.mktProductLine.upsert({
    where: { code: "hp_10kw" },
    update: {},
    create: { code: "hp_10kw", name: "热泵 10kW（中型/公寓）", parentId: plHeatPump.id, sortOrder: 2 },
  });
  const subHeatPumpDual = await prisma.mktProductLine.upsert({
    where: { code: "hp_dual" },
    update: {},
    create: { code: "hp_dual", name: "热泵两联供（采暖+热水）", parentId: plHeatPump.id, sortOrder: 3 },
  });
  await prisma.mktProductLine.upsert({
    where: { code: "gas_16l" },
    update: {},
    create: { code: "gas_16l", name: "燃热 16L（标准家用）", parentId: plGasHW.id, sortOrder: 1 },
  });
  await prisma.mktProductLine.upsert({
    where: { code: "gas_20l" },
    update: {},
    create: { code: "gas_20l", name: "燃热 20L（大流量）", parentId: plGasHW.id, sortOrder: 2 },
  });
  await prisma.mktProductLine.upsert({
    where: { code: "gas_instant" },
    update: {},
    create: { code: "gas_instant", name: "燃热即热型（高端）", parentId: plGasHW.id, sortOrder: 3 },
  });
  await prisma.mktProductLine.upsert({
    where: { code: "cac_vrf" },
    update: {},
    create: { code: "cac_vrf", name: "中央空调 VRF（多联机）", parentId: plCAC.id, sortOrder: 1 },
  });
  await prisma.mktProductLine.upsert({
    where: { code: "cac_duct" },
    update: {},
    create: { code: "cac_duct", name: "中央空调 风管机", parentId: plCAC.id, sortOrder: 2 },
  });
  void subHeatPump6; void subHeatPump10; void subHeatPumpDual;


  // 竞品品牌库
  const bSmith = await prisma.competitorBrand.upsert({
    where: { name: "史密斯" },
    update: {},
    create: { name: "史密斯", nameEn: "A.O.Smith", tier: "core", threatLevel: "critical", hq: "美国/中国上市", positioning: "高端品质，工程口碑，热泵高增长", sortOrder: 1 },
  });
  const bRinnai = await prisma.competitorBrand.upsert({
    where: { name: "林内" },
    update: {},
    create: { name: "林内", nameEn: "Rinnai", tier: "core", threatLevel: "high", hq: "日本", positioning: "燃热专家，年轻化转型", sortOrder: 2 },
  });

  // 林内爆款产品（20L燃热）
  await prisma.competitorProduct.upsert({
    where: { id: "rinnai-gas-20l-e34" },
    update: {},
    create: {
      id: "rinnai-gas-20l-e34",
      brandId: bRinnai.id,
      productLineId: plGasHW.id,
      name: "林内 E34 星耀零冷水 20L",
      modelCode: "RUS-20QE34AFFMV",
      priceMin: 0.38, priceMax: 0.52,
      lifecycle: "主力",
      tracked: true,
      hotRank: 2,
      hotSignalNote: "京东燃热20L品类连续6个月TOP2，零冷水功能差异化显著，短视频投放精准触达新装修人群，月销4000+台",
      hotSignalAt: new Date("2026-06-10"),
      salesVelocity: "stable",
      positioning: "零冷水+节能标杆，年轻家庭首选",
      sortOrder: 1,
    },
  });

  const bCarrier = await prisma.competitorBrand.upsert({
    where: { name: "开利" },
    update: {},
    create: { name: "开利", nameEn: "Carrier", tier: "core", threatLevel: "high", hq: "美国", positioning: "B端工程专家，一体化交付", sortOrder: 3 },
  });
  const bHaier = await prisma.competitorBrand.upsert({
    where: { name: "海尔" },
    update: {},
    create: { name: "海尔", nameEn: "Haier", tier: "watch", threatLevel: "medium", hq: "中国", positioning: "智能家居生态绑定，三联供一体化", sortOrder: 4 },
  });
  const _bMidea = await prisma.competitorBrand.upsert({
    where: { name: "美的" },
    update: {},
    create: { name: "美的", nameEn: "Midea", tier: "watch", threatLevel: "medium", hq: "中国", positioning: "全品类覆盖，渠道广度", sortOrder: 5 },
  });
  await prisma.competitorBrand.upsert({
    where: { name: "小米生态" },
    update: {},
    create: { name: "小米生态", competitorType: "new_entrant", tier: "watch", threatLevel: "medium", positioning: "IoT生态跨界，颠覆者", sortOrder: 6 },
  });

  // 规格维度（热泵产品线）
  const specs = [
    { key: "cop_heating", label: "制热 COP", unit: "W/W", higherBetter: true, weight: 3, sortOrder: 1 },
    { key: "capacity_kw", label: "制热量", unit: "kW", higherBetter: true, weight: 2, sortOrder: 2 },
    { key: "noise_db", label: "噪音", unit: "dB(A)", higherBetter: false, weight: 2, sortOrder: 3 },
    { key: "min_temp_c", label: "最低运行温度", unit: "°C", higherBetter: false, weight: 2, sortOrder: 4 },
    { key: "price_cny", label: "终端价", unit: "万元", higherBetter: false, weight: 2, sortOrder: 5 },
    { key: "warranty_y", label: "整机保修", unit: "年", higherBetter: true, weight: 1, sortOrder: 6 },
    { key: "smart_grade", label: "智能化等级", unit: "级(1-5)", higherBetter: true, weight: 1, sortOrder: 7 },
  ];
  const specDims: Record<string, { id: string }> = {};
  for (const s of specs) {
    const d = await prisma.productSpecDimension.upsert({
      where: { productLineId_key: { productLineId: plHeatPump.id, key: s.key } },
      update: {},
      create: { productLineId: plHeatPump.id, ...s },
    });
    specDims[s.key] = d;
  }

  // 我方基准产品（热泵）
  const ourHP = await prisma.competitorProduct.upsert({
    where: { id: "our-hp-v4" },
    update: {},
    create: { id: "our-hp-v4", isOurs: true, productLineId: plHeatPump.id, name: "Rheem V4 热泵两联供", modelCode: "V4-20HP", priceMin: 2.8, priceMax: 3.5, lifecycle: "新品", tracked: true, lastVerifiedAt: new Date("2026-06-01"), sortOrder: 0 },
  });

  // 竞品产品（史密斯热泵）
  const smithHP = await prisma.competitorProduct.upsert({
    where: { id: "smith-hp-ai" },
    update: {},
    create: { id: "smith-hp-ai", brandId: bSmith.id, productLineId: plHeatPump.id, name: "史密斯 AI 净恒温热泵两联供", modelCode: "HPA-20AI", priceMin: 3.2, priceMax: 4.0, lifecycle: "新品", tracked: true, positioning: "AI控温+净水联动，高端定位", launchDate: new Date("2026-06"), sortOrder: 1 },
  });

  // 规格值（我方 vs 史密斯，热泵）
  const specValues = [
    { productId: ourHP.id, key: "cop_heating", valueNum: 4.2, position: "parity" as const },
    { productId: ourHP.id, key: "capacity_kw", valueNum: 20, position: "parity" as const },
    { productId: ourHP.id, key: "noise_db", valueNum: 52, position: "parity" as const },
    { productId: ourHP.id, key: "min_temp_c", valueNum: -25, position: "lead" as const },
    { productId: ourHP.id, key: "price_cny", valueNum: 3.2, position: "lead" as const },
    { productId: ourHP.id, key: "warranty_y", valueNum: 3, position: "lag" as const },
    { productId: ourHP.id, key: "smart_grade", valueNum: 3, position: "lag" as const },
    { productId: smithHP.id, key: "cop_heating", valueNum: 4.3, position: "parity" as const },
    { productId: smithHP.id, key: "capacity_kw", valueNum: 20, position: "parity" as const },
    { productId: smithHP.id, key: "noise_db", valueNum: 51, position: "parity" as const },
    { productId: smithHP.id, key: "min_temp_c", valueNum: -22, position: "lag" as const },
    { productId: smithHP.id, key: "price_cny", valueNum: 3.6, position: "lag" as const },
    { productId: smithHP.id, key: "warranty_y", valueNum: 5, position: "lead" as const },
    { productId: smithHP.id, key: "smart_grade", valueNum: 5, position: "lead" as const },
  ];
  for (const v of specValues) {
    const dim = specDims[v.key];
    if (!dim) continue;
    await prisma.productSpecValue.upsert({
      where: { productId_dimensionId: { productId: v.productId, dimensionId: dim.id } },
      update: { valueNum: v.valueNum, position: v.position },
      create: { productId: v.productId, dimensionId: dim.id, valueNum: v.valueNum, position: v.position },
    });
  }

  // 价格历史时间序列（史密斯热泵，6个月）
  const priceHistory = [
    { period: "2026-01", value: 3.9 }, { period: "2026-02", value: 3.9 },
    { period: "2026-03", value: 3.8 }, { period: "2026-04", value: 3.7 },
    { period: "2026-05", value: 3.6 }, { period: "2026-06", value: 3.6 },
  ];
  for (const ph of priceHistory) {
    await prisma.competitorMetricPoint.upsert({
      where: { id: "ph-smith-hp-" + ph.period },
      update: {},
      create: { id: "ph-smith-hp-" + ph.period, productId: smithHP.id, metricKey: "price_cny", value: ph.value, period: ph.period, source: "渠道调研" },
    });
  }

  // 渠道签约数时间序列（史密斯华东）
  const dealerHistory = [
    { period: "2026-01", value: 120 }, { period: "2026-02", value: 155 },
    { period: "2026-03", value: 190 }, { period: "2026-04", value: 230 },
    { period: "2026-05", value: 268 }, { period: "2026-06", value: 300 },
  ];
  for (const dh of dealerHistory) {
    await prisma.competitorMetricPoint.upsert({
      where: { id: "dc-smith-east-" + dh.period },
      update: {},
      create: { id: "dc-smith-east-" + dh.period, brandId: bSmith.id, regionId: regEast.id, metricKey: "dealer_count", value: dh.value, period: dh.period, source: "渠道调研" },
    });
  }

  // 三维竞争单元（热泵 × 华东 × 史密斯 — 最高威胁战场）
  const _cell1 = await prisma.competitiveCell.upsert({
    where: { productLineId_regionId_competitorId: { productLineId: plHeatPump.id, regionId: regEast.id, competitorId: bSmith.id } },
    update: {},
    create: {
      productLineId: plHeatPump.id, regionId: regEast.id, competitorId: bSmith.id,
      threatLevel: "critical", ourPosition: "lag",
      marketShareEst: 18.5, priceIndexUs: 89, dealerCountComp: 300, dealerCountUs: 62,
      summary: "华东热泵战场史密斯处于绝对优势，渠道密度5倍于我方，AI新品直接打V4窗口期。",
    },
  });
  await prisma.competitiveCell.upsert({
    where: { productLineId_regionId_competitorId: { productLineId: plHeatPump.id, regionId: regSouth.id, competitorId: bHaier.id } },
    update: {},
    create: {
      productLineId: plHeatPump.id, regionId: regSouth.id, competitorId: bHaier.id,
      threatLevel: "medium", ourPosition: "parity",
      summary: "华南热泵海尔以整装渠道生态绑定为主，与我方客户群有一定区分。",
    },
  });
  await prisma.competitiveCell.upsert({
    where: { productLineId_regionId_competitorId: { productLineId: plCAC.id, regionId: regEast.id, competitorId: bCarrier.id } },
    update: {},
    create: {
      productLineId: plCAC.id, regionId: regEast.id, competitorId: bCarrier.id,
      threatLevel: "high", ourPosition: "lag",
      summary: "华东中央空调B端工程市场开利通过并购强化交付能力，直接威胁我方商用增长路径。",
    },
  });

  // 研究画布（事业部主建基线）
  const researchItems = [
    { brandId: bSmith.id, dimension: "product" as const, subtopic: "技术路线：AI控温与净水联动", status: "current" as const, findings: "史密斯将AI云端学习与净水模块深度集成，构建差异化护城河。专利申请量2025年同比+40%，主要集中在热泵控制算法和净水换热一体化。", confidence: 82, sourceReliability: "B", infoCredibility: 2, reviewEveryDays: 30, origin: "hermes" },
    { brandId: bSmith.id, dimension: "gtm" as const, subtopic: "华东酒店工程渠道结构", status: "current" as const, findings: "华东酒店渠道Q2新签300家，搭配专项返利政策(约12%)，酒店工程经理团队从8人扩至23人。核心策略：帮助酒店做ROI测算，缩短决策周期。", confidence: 88, sourceReliability: "C", infoCredibility: 2, reviewEveryDays: 14, origin: "manual", editedManually: true },
    { brandId: bSmith.id, dimension: "brand" as const, subtopic: "品牌定位与传播", status: "stale" as const, findings: "维持专业高端工程口碑，暂未发现大型消费者品牌动作。", confidence: 60, sourceReliability: "C", infoCredibility: 3, reviewEveryDays: 60, origin: "hermes" },
    { brandId: bSmith.id, dimension: "strategy" as const, subtopic: "中国区增长战略与资本投入", status: "current" as const, findings: "Q1财报：中国区热泵营收同比+35%，明确指引加大产能投资，研发预算+28%。长期战略：热泵+净水+服务三条腿。", confidence: 95, sourceReliability: "A", infoCredibility: 1, reviewEveryDays: 30, origin: "manual", editedManually: true },
    { brandId: bRinnai.id, dimension: "brand" as const, subtopic: "年轻化品牌转型", status: "in_progress" as const, findings: "新代言人+梯媒/短视频投放组合，目标抢占新装修家庭。具体投放金额未知，需深入研究。", confidence: 55, sourceReliability: "C", infoCredibility: 3, reviewEveryDays: 30, origin: "hermes" },
    { brandId: bCarrier.id, dimension: "strategy" as const, subtopic: "华南暖通服务商并购整合", status: "current" as const, findings: "收购华南一家暖通安装服务商（估值约3000万），补强工程交付与售后，B端一体化能力显著提升。", confidence: 78, sourceReliability: "B", infoCredibility: 2, reviewEveryDays: 30, origin: "hermes" },
  ];
  for (const item of researchItems) {
    const existing = await prisma.researchItem.findFirst({ where: { brandId: item.brandId, dimension: item.dimension, subtopic: item.subtopic } });
    if (!existing) {
      await prisma.researchItem.create({ data: { ...item, sortOrder: researchItems.indexOf(item) } });
    }
  }

  // 赢丢单记录（大区录入）
  const wlRecords = [
    { outcome: "loss" as const, regionId: regEast.id, competitorId: bSmith.id, productLineId: plHeatPump.id, projectName: "杭州某五星酒店热泵改造", dealSizeCny: 85_0000, lossReason: "史密斯提供了不停业改造方案+5年保修，我方只能做停业施工，保修3年。决策关键是施工方案。", customerType: "酒店工程", recordedAt: new Date("2026-06-10") },
    { outcome: "win" as const, regionId: regEast.id, competitorId: bSmith.id, productLineId: plHeatPump.id, projectName: "南京高端住宅小区热泵供暖", dealSizeCny: 220_0000, winReason: "最低运行温度-25°C远优于史密斯的-22°C，在南京冬季极端场景下有说服力。价格优势约15%。", customerType: "住宅工程", recordedAt: new Date("2026-06-05") },
    { outcome: "loss" as const, regionId: regSouth.id, competitorId: bHaier.id, productLineId: plHeatPump.id, projectName: "广州精装楼盘热水+采暖打包", dealSizeCny: 180_0000, lossReason: "海尔整装渠道绑定，开发商已与海尔签整装合作协议，我方无法单独进入。需要在整装渠道建立关系。", customerType: "精装楼盘", recordedAt: new Date("2026-06-08") },
  ];
  for (const wl of wlRecords) {
    const existing = await prisma.winLossRecord.findFirst({ where: { projectName: wl.projectName } });
    if (!existing) await prisma.winLossRecord.create({ data: wl });
  }

  // Battlecard（事业部维护，面向一线销售）
  await prisma.battlecard.upsert({
    where: { competitorId_productLineId: { competitorId: bSmith.id, productLineId: plHeatPump.id } },
    update: {},
    create: {
      competitorId: bSmith.id, productLineId: plHeatPump.id,
      headline: "在极端温度场景和性价比上打赢史密斯",
      ourStrengths: ["-25°C极端运行温度领先3°C", "价格低15-20%，ROI周期短", "本土服务响应更快"],
      theirWeaknesses: ["AI概念溢价但功能实用性待验证", "保修5年但服务响应慢（全国网点少）", "整体方案捆绑，客户灵活性差"],
      traps: ["用5年保修和AI功能对比", "拿渠道规模说服客户选大品牌", "诱导客户只看制热COP不看极端温度工况"],
      responses: ["让客户做极端温度工况测算（-25°C vs -22°C实际差距）", "算实际ROI：我方低价+快速施工 vs 史密斯高价+长施工周期", "提供本地服务案例和4小时响应承诺"],
    },
  });

  // ── Versions: snapshots + strategy patterns + diff records ─────────────
  const diagRow = await prisma.strategicDiagnosis.findFirst({ where: { id: "seed-diag-fy26" } });
  const capStackRow = await prisma.capStackPeriod.findFirst({ where: { period: "2026-FY" } });
  const cashRow = await prisma.cashPosition.findFirst({ where: { period: "2026-FY" } });

  const snFY25 = await prisma.strategicSnapshot.upsert({
    where: { code: "SS-2025-FY" },
    update: {},
    create: {
      code: "SS-2025-FY", period: "2025-FY", snapshotType: "FY", status: "FROZEN",
      frozenAt: new Date("2026-01-15"), frozenById: ceo.id,
      bscLightsAtFreeze: { financial: "yellow", customer: "green", process: "yellow", learning: "green" },
      stateJson: { revenue: 4800, profit: 620, runway: 3.2, challenge: "从5000到8000万，热泵平台待产品化" },
    },
  });
  await prisma.strategyPattern.upsert({
    where: { snapshotId: snFY25.id },
    update: {},
    create: {
      snapshotId: snFY25.id, deliberateRealizationRate: 68,
      emergentPatterns: [{ title: "区县经销商自发组团签约", impact: "positive" }],
      unrealizedItems: [{ title: "热泵双联供区域扩张计划", reason: "产品化延迟" }],
      serendipitousItems: [{ title: "西南工程渠道超预期", source: "自发渠道" }],
      learningPrompts: ["渠道扩张速度超过产品准备速度说明什么？", "意外的西南增长如何转化为有意战略？"],
      computedAt: new Date("2026-01-15"),
    },
  });

  const snFY26 = await prisma.strategicSnapshot.upsert({
    where: { code: "SS-2026-FY" },
    update: {},
    create: {
      code: "SS-2026-FY", period: "2026-FY", snapshotType: "FY", status: "FROZEN",
      frozenAt: new Date("2026-06-21"), frozenById: ceo.id,
      diagnosisId: diagRow?.id,
      capStackPeriodId: capStackRow?.id,
      cashPositionId: cashRow?.id,
      bscLightsAtFreeze: { financial: "red", customer: "yellow", process: "yellow", learning: "green" },
      stateJson: { revenue: 6000, profit: 880, runway: 2.1, challenge: "从1亿到2.5亿，渠道扩张与产品化能力不同步" },
    },
  });
  await prisma.strategyPattern.upsert({
    where: { snapshotId: snFY26.id },
    update: {},
    create: {
      snapshotId: snFY26.id, deliberateRealizationRate: 54,
      emergentPatterns: [
        { title: "酒店渠道工程经理模式在华东自发形成正向飞轮，未列入原始战略", impact: "positive" },
        { title: "史密斯降价倒逼V4上市节奏加快", impact: "mixed" },
      ],
      unrealizedItems: [
        { title: "RUUD华北渠道中心Q1建立", reason: "资金流转延迟" },
        { title: "热泵V4 Q2量产", reason: "控制算法未冻结" },
      ],
      serendipitousItems: [{ title: "西南政府热泵补贴政策窗口", source: "政策红利" }],
      learningPrompts: ["执行成熟度54%的根源是能力不足还是承诺不够认真？", "史密斯的进攻速度是系统性威胁还是一次性冲刺？"],
      computedAt: new Date("2026-06-21"),
    },
  });

  const diffCount = await prisma.diffRecord.count();
  if (diffCount === 0) {
    await prisma.diffRecord.createMany({
      data: [
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "BSC_TARGET", severity: "critical", title: "营收目标从4800万提升至6000万（+25%），执行资源未同步扩充", detail: "目标调升但团队规模和渠道密度不变，执行张力显著上升" },
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "PROJECT_MIGRATE", severity: "critical", title: "V4热泵量产里程碑从Q2延迟至Q4，华东攻势窗口期收窄", detail: "控制算法冻结延迟是根本原因" },
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "EMERGENT_PATTERN", severity: "warning", title: "酒店渠道工程经理模式在华东自发形成正向飞轮，未列入原始战略", formationType: "emergent", detail: "建议转为刻意战略：复制华东模型到华南" },
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "ASSUMPTION_FAILED", severity: "critical", title: "史密斯不降价假设失效：H1价格下调8%，渠道渗透超预期", detail: "V4价格优势从15%压缩至7%，ROI论据需重算" },
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "RESOURCE_REALLOC", severity: "warning", title: "CapStack H1比例从55%提升至62%，H3从15%压缩至10%", detail: "热泵自研芯片TRL3项目面临搁置风险" },
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "UNREALIZED", severity: "warning", title: "华北渠道中心计划连续两期未实现，转为unrealized pattern", formationType: "unrealized" },
        { fromSnapshotId: snFY25.id, toSnapshotId: snFY26.id, category: "DELIBERATE_RATE_DROP", severity: "warning", title: "刻意实现率从68%下降至54%，低于预警线60%", detail: "14ppt下降集中在流程/能力维度" },
      ],
    });
  }

  // ── 战略职责主线 + 会议时点 + 当期责任切片 ──────────────────────────
  const meetingMid = await prisma.strategyMeeting.upsert({
    where: { id: "seed-meeting-2025-mid" },
    update: {},
    create: {
      id: "seed-meeting-2025-mid",
      title: "2025 年中战略会",
      meetingType: "MID_YEAR", period: "2025-FY",
      meetingDate: new Date("2025-07-15"), status: "ARCHIVED",
      agenda: "热泵产品化进度 · 华东渠道扩张 · 现金流", notes: "V4 列为一号战略议题",
    },
  });
  const meetingEnd = await prisma.strategyMeeting.upsert({
    where: { id: "seed-meeting-2025-end" },
    update: {},
    create: {
      id: "seed-meeting-2025-end",
      title: "2025 年底战略会",
      meetingType: "YEAR_END", period: "2025-FY",
      meetingDate: new Date("2026-01-10"), status: "ARCHIVED",
      agenda: "年度复盘 · 2026 目标设定 · 职责移交", notes: "V4 延期，职责移交新负责人",
    },
  });
  const meetingMid26 = await prisma.strategyMeeting.upsert({
    where: { id: "seed-meeting-2026-mid" },
    update: {},
    create: {
      id: "seed-meeting-2026-mid",
      title: "2026 年中战略会",
      meetingType: "MID_YEAR", period: "2026-FY",
      meetingDate: new Date("2026-07-15"), status: "INVITING",
      agenda: "V4 量产交账 · 史密斯降价应对 · 现金 runway",
    },
  });

  const mV4 = await prisma.strategyMandate.upsert({
    where: { code: "M-V4" },
    update: {},
    create: {
      code: "M-V4", title: "热泵 V4 产品化与上市", theme: "产品化能力",
      description: "V4 两联供从控制算法冻结到量产认证到渠道铺货全链路，是从1亿到2.5亿的核心议题。",
      status: "AT_RISK", linkedProjectCode: "V4", linkedAssumptionCode: "P3", sortOrder: 1,
    },
  });
  const mChannel = await prisma.strategyMandate.upsert({
    where: { code: "M-CH" },
    update: {},
    create: {
      code: "M-CH", title: "华东酒店工程渠道飞轮", theme: "渠道扩张",
      description: "酒店工程经理模式在华东跑通后向全国复制，是营收增长的主引擎。",
      status: "ACTIVE", linkedAssumptionCode: "P4", sortOrder: 2,
    },
  });
  const mCash = await prisma.strategyMandate.upsert({
    where: { code: "M-CASH" },
    update: {},
    create: {
      code: "M-CASH", title: "现金 runway 与融资", theme: "资本",
      description: "维持现金 runway 在安全线以上，保障增长期运营资金。",
      status: "AT_RISK", linkedAssumptionCode: "P5", sortOrder: 3,
    },
  });

  const holdings = [
    // V4 主线: 年中张健认领 -> 年底延期移交 -> 2026年中新人交账
    { id: "h-v4-1", mandateId: mV4.id, meetingId: meetingMid.id, holderName: "张健", holderRole: "热水事业部负责人", status: "DELIVERED", commitment: "Q4 完成 V4 样机测试，通过率 100%", deadline: new Date("2025-12-31"), deliveryNote: "样机测试通过率 72%，未达标，控制算法未冻结", invitedAt: new Date("2025-07-01"), attendedAt: new Date("2025-07-15") },
    { id: "h-v4-2", mandateId: mV4.id, meetingId: meetingEnd.id, holderName: "张健", holderRole: "热水事业部负责人", status: "HANDED_OVER", commitment: "—", handoverNote: "因事业部调整，V4 职责移交", handoverToName: "李伟", invitedAt: new Date("2025-12-20"), attendedAt: new Date("2026-01-10") },
    { id: "h-v4-3", mandateId: mV4.id, meetingId: meetingMid26.id, holderName: "李伟", holderRole: "热泵产品部负责人", status: "CLAIMED", commitment: "Q4 量产认证 + 华东首批 50 家渠道铺货", deadline: new Date("2026-12-31"), invitedAt: new Date("2026-07-01") },
    // 渠道主线
    { id: "h-ch-1", mandateId: mChannel.id, meetingId: meetingMid.id, holderName: "王芳", holderRole: "华东大区总经理", status: "DELIVERED", commitment: "华东酒店渠道新签 300 家", deadline: new Date("2025-12-31"), deliveryNote: "实际新签 268 家，接近目标", invitedAt: new Date("2025-07-01"), attendedAt: new Date("2025-07-15") },
    { id: "h-ch-2", mandateId: mChannel.id, meetingId: meetingMid26.id, holderName: "王芳", holderRole: "华东大区总经理", status: "CLAIMED", commitment: "华东模式复制到华南，华南新签 120 家", deadline: new Date("2026-12-31"), invitedAt: new Date("2026-07-01") },
    // 现金主线
    { id: "h-cash-1", mandateId: mCash.id, meetingId: meetingEnd.id, holderName: "陈静", holderRole: "财务负责人", status: "MISSED", commitment: "维持 runway > 3 个月", deadline: new Date("2026-06-30"), deliveryNote: "runway 跌至 2.1 月，触发一票否决", invitedAt: new Date("2025-12-20"), attendedAt: new Date("2026-01-10") },
    { id: "h-cash-2", mandateId: mCash.id, meetingId: meetingMid26.id, holderName: "陈静", holderRole: "财务负责人", status: "CLAIMED", commitment: "Q3 完成一轮融资，runway 恢复至 6 个月", deadline: new Date("2026-09-30"), invitedAt: new Date("2026-07-01") },
  ];
  for (const h of holdings) {
    await prisma.mandateHolding.upsert({ where: { id: h.id }, update: {}, create: h as never });
  }
  await prisma.strategyMandate.update({ where: { id: mV4.id }, data: { originMeetingId: meetingMid.id } });

  const { CHINA_STRATEGY_SUMMARY } = await import("../lib/strategy/china-strategy-summary");
  await prisma.strategyOnePager.upsert({
    where: { slug: "china-summary" },
    update: {},
    create: {
      slug: "china-summary",
      status: "DRAFT",
      contentJson: { ...CHINA_STRATEGY_SUMMARY, footerBrand: "Rhautt", pageNumber: 2 } as object,
    },
  });

  console.log("StratOS seed complete (Phase 4.0 · versions + three-stack wired)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
