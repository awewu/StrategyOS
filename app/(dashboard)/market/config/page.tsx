import { MarketConfigPanel } from "@/components/market/MarketConfigPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { prisma, safeDbQuery } from "@/lib/db";

export default async function MarketConfigPage() {
  await requireRouteAccess("/market/config");
  const [regions, productLines, brands, productsRaw, sourcesRaw] = await Promise.all([
    safeDbQuery(() => prisma.salesRegion.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), []),
    safeDbQuery(() => prisma.mktProductLine.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), []),
    safeDbQuery(() => prisma.competitorBrand.findMany({ orderBy: [{ tier: "asc" }, { sortOrder: "asc" }] }), []),
    safeDbQuery(() => prisma.competitorProduct.findMany({ where: { isOurs: false }, orderBy: [{ hotRank: "asc" }, { sortOrder: "asc" }] }), []),
    safeDbQuery(() => prisma.intelSource.findMany({ orderBy: { createdAt: "asc" } }), []),
  ]);
  const products = productsRaw.map((p) => ({
    id: p.id, brandId: p.brandId, productLineId: p.productLineId, name: p.name,
    modelCode: p.modelCode, priceMin: p.priceMin ? Number(p.priceMin) : null,
    priceMax: p.priceMax ? Number(p.priceMax) : null, lifecycle: p.lifecycle,
    positioning: p.positioning, tracked: p.tracked, hotRank: p.hotRank,
    hotSignalNote: p.hotSignalNote, hotSignalAt: p.hotSignalAt ? p.hotSignalAt.toISOString().slice(0, 10) : null,
    salesVelocity: p.salesVelocity, sortOrder: p.sortOrder,
  }));
  const sources = sourcesRaw.map((s) => ({
    id: s.id, competitor: s.competitor, kind: s.kind, url: s.url,
    cadenceDays: s.cadenceDays, active: s.active, health: s.health,
  }));
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="市场情报 · 配置"
        title="市场配置"
        subtitle="销售大区 / 品类 / 竞品品牌 / 重点产品 / Hermes 情报来源"
      />
      <MarketConfigPanel regions={regions} productLines={productLines} brands={brands} products={products} sources={sources} />
    </div>
  );
}
