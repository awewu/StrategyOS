/**
 * 竞争研究工作台数据加载层。
 * 服务端读取，组装三维竞争立方体 + 产品对比 + 研究画布 + 赢丢单。
 */
import { prisma } from "@/lib/db";

export interface WorkbenchData {
  productLines: { id: string; code: string; name: string }[];
  regions: { id: string; code: string; name: string; parentId: string | null }[];
  brands: {
    id: string; name: string; nameEn: string | null; tier: string;
    threatLevel: string; competitorType: string; positioning: string | null;
  }[];
  cells: {
    id: string; productLineId: string; regionId: string; competitorId: string;
    threatLevel: string; ourPosition: string;
    marketShareEst: number | null; priceIndexUs: number | null;
    dealerCountComp: number | null; dealerCountUs: number | null;
    summary: string | null; editedManually: boolean;
  }[];
  hotProducts: {
    id: string; brandId: string | null; productLineId: string | null;
    name: string; modelCode: string | null; hotRank: number;
    hotSignalNote: string | null; hotSignalAt: string | null; salesVelocity: string | null;
  }[];
}

export async function loadWorkbench(): Promise<WorkbenchData | null> {
  try {
    const [productLines, regions, brands, cells, hotProducts] = await Promise.all([
      prisma.mktProductLine.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.salesRegion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.competitorBrand.findMany({ where: { active: true }, orderBy: [{ tier: "asc" }, { sortOrder: "asc" }] }),
      prisma.competitiveCell.findMany(),
      prisma.competitorProduct.findMany({
        where: { isOurs: false, tracked: true, hotRank: { not: null } },
        orderBy: { hotRank: "asc" },
      }),
    ]);
    if (productLines.length === 0) return null;
    return {
      productLines: productLines.map((p) => ({ id: p.id, code: p.code, name: p.name })),
      regions: regions.map((r) => ({ id: r.id, code: r.code, name: r.name, parentId: r.parentId })),
      brands: brands.map((b) => ({
        id: b.id, name: b.name, nameEn: b.nameEn, tier: b.tier,
        threatLevel: b.threatLevel, competitorType: b.competitorType, positioning: b.positioning,
      })),
      cells: cells.map((c) => ({
        id: c.id, productLineId: c.productLineId, regionId: c.regionId, competitorId: c.competitorId,
        threatLevel: c.threatLevel, ourPosition: c.ourPosition,
        marketShareEst: c.marketShareEst ? Number(c.marketShareEst) : null,
        priceIndexUs: c.priceIndexUs ? Number(c.priceIndexUs) : null,
        dealerCountComp: c.dealerCountComp, dealerCountUs: c.dealerCountUs,
        summary: c.summary, editedManually: c.editedManually,
      })),
      hotProducts: hotProducts.map((p) => ({
        id: p.id, brandId: p.brandId, productLineId: p.productLineId,
        name: p.name, modelCode: p.modelCode, hotRank: p.hotRank!,
        hotSignalNote: p.hotSignalNote, hotSignalAt: p.hotSignalAt?.toISOString().slice(0, 10) ?? null,
        salesVelocity: p.salesVelocity,
      })),
    };
  } catch {
    return null;
  }
}

export interface CellDetail {
  cell: WorkbenchData["cells"][number] | null;
  products: {
    id: string; name: string; isOurs: boolean; modelCode: string | null;
    priceMin: number | null; priceMax: number | null; lifecycle: string | null;
    specs: { key: string; label: string; unit: string | null; valueNum: number | null; valueText: string | null; position: string | null; higherBetter: boolean; weight: number }[];
  }[];
  research: {
    id: string; dimension: string; subtopic: string; status: string;
    findings: string | null; confidence: number; sourceReliability: string | null;
    infoCredibility: number | null; origin: string; editedManually: boolean;
    ownerName: string | null; lastReviewedAt: string | null;
  }[];
  winLoss: {
    id: string; outcome: string; projectName: string | null; dealSizeCny: number | null;
    lossReason: string | null; winReason: string | null; customerType: string | null; recordedAt: string;
  }[];
  priceHistory: { period: string; value: number }[];
  dealerHistory: { period: string; value: number }[];
}

export async function loadCellDetail(productLineId: string, regionId: string, competitorId: string): Promise<CellDetail | null> {
  try {
    const cell = await prisma.competitiveCell.findUnique({
      where: { productLineId_regionId_competitorId: { productLineId, regionId, competitorId } },
    });

    // 产品对比：我方该产品线 + 该竞品该产品线
    const products = await prisma.competitorProduct.findMany({
      where: {
        productLineId,
        OR: [{ isOurs: true }, { brandId: competitorId }],
      },
      include: { specs: { include: { dimension: true } } },
      orderBy: { sortOrder: "asc" },
    });

    const research = await prisma.researchItem.findMany({
      where: { brandId: competitorId },
      orderBy: [{ dimension: "asc" }, { sortOrder: "asc" }],
    });

    const winLoss = await prisma.winLossRecord.findMany({
      where: { regionId, competitorId, productLineId },
      orderBy: { recordedAt: "desc" },
    });

    const priceProducts = products.filter((p) => !p.isOurs).map((p) => p.id);
    const priceHistory = priceProducts.length > 0
      ? await prisma.competitorMetricPoint.findMany({
          where: { productId: { in: priceProducts }, metricKey: "price_cny" },
          orderBy: { period: "asc" },
        })
      : [];
    const dealerHistory = await prisma.competitorMetricPoint.findMany({
      where: { brandId: competitorId, regionId, metricKey: "dealer_count" },
      orderBy: { period: "asc" },
    });

    return {
      cell: cell ? {
        id: cell.id, productLineId: cell.productLineId, regionId: cell.regionId, competitorId: cell.competitorId,
        threatLevel: cell.threatLevel, ourPosition: cell.ourPosition,
        marketShareEst: cell.marketShareEst ? Number(cell.marketShareEst) : null,
        priceIndexUs: cell.priceIndexUs ? Number(cell.priceIndexUs) : null,
        dealerCountComp: cell.dealerCountComp, dealerCountUs: cell.dealerCountUs,
        summary: cell.summary, editedManually: cell.editedManually,
      } : null,
      products: products.map((p) => ({
        id: p.id, name: p.name, isOurs: p.isOurs, modelCode: p.modelCode,
        priceMin: p.priceMin ? Number(p.priceMin) : null, priceMax: p.priceMax ? Number(p.priceMax) : null,
        lifecycle: p.lifecycle,
        specs: p.specs.map((s) => ({
          key: s.dimension.key, label: s.dimension.label, unit: s.dimension.unit,
          valueNum: s.valueNum ? Number(s.valueNum) : null, valueText: s.valueText,
          position: s.position, higherBetter: s.dimension.higherBetter, weight: s.dimension.weight,
        })),
      })),
      research: research.map((r) => ({
        id: r.id, dimension: r.dimension, subtopic: r.subtopic, status: r.status,
        findings: r.findings, confidence: r.confidence, sourceReliability: r.sourceReliability,
        infoCredibility: r.infoCredibility, origin: r.origin, editedManually: r.editedManually,
        ownerName: r.ownerName, lastReviewedAt: r.lastReviewedAt ? r.lastReviewedAt.toISOString().slice(0, 10) : null,
      })),
      winLoss: winLoss.map((w) => ({
        id: w.id, outcome: w.outcome, projectName: w.projectName,
        dealSizeCny: w.dealSizeCny ? Number(w.dealSizeCny) : null,
        lossReason: w.lossReason, winReason: w.winReason, customerType: w.customerType,
        recordedAt: w.recordedAt.toISOString().slice(0, 10),
      })),
      priceHistory: priceHistory.map((p) => ({ period: p.period, value: Number(p.value) })),
      dealerHistory: dealerHistory.map((d) => ({ period: d.period, value: Number(d.value) })),
    };
  } catch {
    return null;
  }
}
