import { MarketConfigPanel } from "@/components/market/MarketConfigPanel";
import { prisma } from "@/lib/db";

export default async function MarketConfigPage() {
  const [regions, productLines, brands, productsRaw, sourcesRaw] = await Promise.all([
    prisma.salesRegion.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.mktProductLine.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.competitorBrand.findMany({ orderBy: [{ tier: "asc" }, { sortOrder: "asc" }] }),
    prisma.competitorProduct.findMany({ where: { isOurs: false }, orderBy: [{ hotRank: "asc" }, { sortOrder: "asc" }] }),
    prisma.intelSource.findMany({ orderBy: { createdAt: "asc" } }),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">市场配置</h1>
        <p className="text-sm text-[var(--color-text-muted)]">管理销售大区 / 省级、产品品类、竞品品牌、重点产品与爆款信号、Hermes 情报来源</p>
      </div>
      <MarketConfigPanel regions={regions} productLines={productLines} brands={brands} products={products} sources={sources} />
    </div>
  );
}
