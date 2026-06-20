import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ceo = await prisma.user.upsert({
    where: { email: "ceo@rheem.cn" },
    update: {},
    create: { name: "铁山", email: "ceo@rheem.cn", role: "ceo" },
  });

  await prisma.user.upsert({
    where: { email: "vp@rheem.cn" },
    update: {},
    create: { name: "毕韬", email: "vp@rheem.cn", role: "vp" },
  });
  await prisma.user.upsert({
    where: { email: "pm@rheem.cn" },
    update: {},
    create: { name: "张健", email: "pm@rheem.cn", role: "pm" },
  });
  await prisma.user.upsert({
    where: { email: "staff@rheem.cn" },
    update: {},
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
  const srcRinnaiSite = await prisma.intelSource.upsert({
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
  const srcCarrierPatent = await prisma.intelSource.upsert({
    where: { id: "src-carrier-patent" },
    update: {},
    create: { id: "src-carrier-patent", competitor: "开利", kind: "patent", url: null, cadenceDays: 30, lastScrapedAt: null, health: "empty" },
  });
  const srcHaierSite = await prisma.intelSource.upsert({
    where: { id: "src-haier-site" },
    update: {},
    create: { id: "src-haier-site", competitor: "海尔", kind: "official_site", url: "https://www.haier.com", cadenceDays: 7, lastScrapedAt: new Date("2026-06-17"), health: "active" },
  });
  const srcMideaChannel = await prisma.intelSource.upsert({
    where: { id: "src-midea-channel" },
    update: {},
    create: { id: "src-midea-channel", competitor: "美的", kind: "channel", url: null, cadenceDays: 14, lastScrapedAt: null, health: "empty" },
  });

  const signalSeeds = [
    { id: "sig-1", sourceId: srcSmithSite.id, competitor: "史密斯", dimension: "product" as const, title: "推出 AI 净恒温热泵两联供新品", summary: "史密斯发布主打「AI 控温 + 净水联动」的热泵两联供，定位高端，瞄准南方采暖+热水一体场景，与我方 V4 热泵产品化窗口直接重叠。", impact: "threat" as const, relevance: 92, sourceLabel: "史密斯官网 newsroom 2026-06-15", capturedAt: new Date("2026-06-17"), linkedAssumptionCode: "H2", linkedActionCode: "V4" },
    { id: "sig-2", sourceId: srcSmithSite.id, competitor: "史密斯", dimension: "gtm" as const, title: "华东酒店渠道加速签约", summary: "Q2 华东酒店工程渠道新签约约 300 家，明显领先行业，配套专项返利政策。我方同期约 62 家。", impact: "threat" as const, relevance: 88, sourceLabel: "渠道调研 2026-06-10", capturedAt: new Date("2026-06-12"), linkedAssumptionCode: "H5", linkedActionCode: "V1" },
    { id: "sig-3", sourceId: srcRinnaiSocial.id, competitor: "林内", dimension: "brand" as const, title: "签约新代言人，主攻年轻家庭", summary: "林内启用新生代代言人并投放梯媒+短视频组合，品牌调性年轻化，抢占新装修家庭心智。", impact: "neutral" as const, relevance: 54, sourceLabel: "公众号/梯媒监测 2026-06-08", capturedAt: new Date("2026-06-14") },
    { id: "sig-4", sourceId: srcCarrierPress.id, competitor: "开利", dimension: "strategy" as const, title: "区域并购整合暖通服务商", summary: "开利收购一家华南暖通安装服务商，补强工程交付与售后网络，强化 B 端一体化能力。", impact: "threat" as const, relevance: 76, sourceLabel: "行业媒体 2026-06-13", capturedAt: new Date("2026-06-15"), linkedActionCode: "V1" },
    { id: "sig-5", sourceId: srcHaierSite.id, competitor: "海尔", dimension: "product" as const, title: "三联供集成方案铺市", summary: "海尔推「采暖+热水+净水」三联供集成方案，绑定智能家居生态，主打整装渠道。", impact: "opportunity" as const, relevance: 61, sourceLabel: "海尔官网 2026-06-16", capturedAt: new Date("2026-06-17") },
    { id: "sig-6", sourceId: srcSmithFiling.id, competitor: "史密斯", dimension: "strategy" as const, title: "财报披露：热泵营收同比高增", summary: "最新季报披露中国区热泵品类营收同比双位数增长，明确加大产能与研发投入指引。", impact: "threat" as const, relevance: 70, sourceLabel: "AO Smith 季报 2026-Q1", capturedAt: new Date("2026-06-01"), linkedAssumptionCode: "H2" },
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

  console.log("StratOS seed complete (Phase 3.10 · full entity wiring)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
