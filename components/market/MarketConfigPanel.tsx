"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IntelSourcesEditor } from "@/components/market/IntelSourcesEditor";
import type { SourceKind } from "@/lib/market-intel/types";

type Region = { id: string; name: string; code: string; parentId: string | null; active: boolean; sortOrder: number };
type ProductLine = { id: string; name: string; code: string; parentId: string | null; description: string | null; active: boolean; sortOrder: number };
type Brand = { id: string; name: string; nameEn: string | null; tier: string; threatLevel: string; competitorType: string; positioning: string | null; active: boolean };
type Product = {
  id: string; brandId: string | null; productLineId: string | null; name: string;
  modelCode: string | null; priceMin: number | null; priceMax: number | null;
  lifecycle: string | null; positioning: string | null; tracked: boolean;
  hotRank: number | null; hotSignalNote: string | null; hotSignalAt: string | null;
  salesVelocity: string | null; sortOrder: number;
};
type IntelSource = {
  id: string; competitor: string; kind: SourceKind;
  url: string | null; cadenceDays: number; active: boolean;
  health: "active" | "stale" | "empty";
};

type Tab = "regions" | "products" | "brands" | "hotproducts" | "sources";

export function MarketConfigPanel({ regions: init_r, productLines: init_p, brands: init_b, products: init_prod, sources: init_s }: {
  regions: Region[]; productLines: ProductLine[]; brands: Brand[]; products: Product[]; sources: IntelSource[];
}) {
  const [tab, setTab] = useState<Tab>("regions");
  const [regions, setRegions] = useState(init_r);
  const [productLines, setProductLines] = useState(init_p);
  const [brands, setBrands] = useState(init_b);
  const [products, setProducts] = useState(init_prod);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ── helpers ────────────────────────────────────────────────────────────────
  async function apiPost(path: string, body: object) {
    setSaving(true); setMsg("");
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error ?? "保存失败"); return null; }
      return d;
    } catch { setMsg("网络错误"); return null; }
    finally { setSaving(false); }
  }
  async function apiDel(path: string, id: string) {
    setSaving(true); setMsg("");
    try {
      const r = await fetch(`${path}?id=${id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); setMsg(d.error ?? "删除失败"); return false; }
      return true;
    } catch { setMsg("网络错误"); return false; }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--surface-border)]">
        {(["regions", "products", "brands", "hotproducts", "sources"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-5 py-2.5 text-sm font-medium border-b-2 transition-colors " + (tab === t
              ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            )}>
            {t === "regions" ? "大区 / 省级" : t === "products" ? "产品品类" : t === "brands" ? "竞品品牌" : t === "hotproducts" ? "重点产品 / 爆款" : "情报来源"}
          </button>
        ))}
      </div>

      {msg && <p className="rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{msg}</p>}

      {tab === "regions" && (
        <RegionsEditor regions={regions} setRegions={setRegions} saving={saving} post={apiPost} del={apiDel} />
      )}
      {tab === "products" && (
        <ProductLinesEditor lines={productLines} setLines={setProductLines} saving={saving} post={apiPost} del={apiDel} />
      )}
      {tab === "brands" && (
        <BrandsEditor brands={brands} setBrands={setBrands} saving={saving} post={apiPost} del={apiDel} />
      )}
      {tab === "hotproducts" && (
        <HotProductsEditor products={products} setProducts={setProducts} brands={brands} productLines={productLines} saving={saving} post={apiPost} del={apiDel} />
      )}
      {tab === "sources" && (
        <IntelSourcesEditor sources={init_s} saving={saving} post={apiPost} del={apiDel} />
      )}
    </div>
  );
}

// ── Regions ──────────────────────────────────────────────────────────────────

function RegionsEditor({ regions, setRegions, saving, post, del }: {
  regions: Region[];
  setRegions: (r: Region[]) => void;
  saving: boolean;
  post: (p: string, b: object) => Promise<unknown>;
  del: (p: string, id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Partial<Region>>({});
  const [editing, setEditing] = useState<string | null>(null);

  function startNew(parentId?: string) {
    setEditing("new");
    setForm({ parentId: parentId ?? null, active: true, sortOrder: 999 });
  }
  function startEdit(r: Region) { setEditing(r.id); setForm({ ...r }); }
  function cancel() { setEditing(null); setForm({}); }

  async function save() {
    const d = await post("/api/market/region", form) as { ok: boolean; region: Region } | null;
    if (!d) return;
    setRegions(editing === "new"
      ? [...regions, d.region]
      : regions.map((r) => r.id === editing ? d.region : r));
    cancel();
  }
  async function remove(id: string) {
    if (!confirm("删除后该大区/省下的所有竞争数据也将失效，确认删除？")) return;
    const ok = await del("/api/market/region", id);
    if (ok) setRegions(regions.filter((r) => r.id !== id));
  }

  // Build tree: 大区 level (parentId = national), then provinces
  const national = regions.find((r) => r.parentId === null);
  const zones = regions.filter((r) => r.parentId === national?.id);
  function provincesOf(zoneId: string) { return regions.filter((r) => r.parentId === zoneId); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-caption">销售大区 → 省级树形结构。大区行主导竞争分析，省级作下探。</p>
        <button onClick={() => startNew(national?.id)} disabled={saving}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
          + 新增大区
        </button>
      </div>

      {zones.map((zone) => (
        <div key={zone.id} className="rounded-lg border border-[var(--surface-border)]">
          <div className="flex items-center gap-3 border-b border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-2.5">
            <span className="font-medium text-[var(--color-text-primary)]">{zone.name}</span>
            <span className="text-caption">{zone.code}</span>
            <span className={zone.active ? "ml-auto text-xs text-[var(--signal-green)]" : "ml-auto text-xs text-[var(--color-text-muted)]"}>{zone.active ? "启用" : "停用"}</span>
            <button onClick={() => startEdit(zone)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
            <button onClick={() => remove(zone.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
            <button onClick={() => startNew(zone.id)} className="text-xs text-[var(--color-accent)] hover:underline">+ 省</button>
          </div>
          <div className="divide-y divide-[var(--surface-border)]">
            {provincesOf(zone.id).map((prov) => (
              <div key={prov.id} className="flex items-center gap-3 px-4 py-2 pl-8 text-sm">
                <span className="text-[var(--color-text-secondary)]">{prov.name}</span>
                <span className="text-caption">{prov.code}</span>
                <span className={prov.active ? "ml-auto text-xs text-[var(--signal-green)]" : "ml-auto text-xs text-[var(--color-text-muted)]"}>{prov.active ? "启用" : "停用"}</span>
                <button onClick={() => startEdit(prov)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
                <button onClick={() => remove(prov.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
              </div>
            ))}
            {provincesOf(zone.id).length === 0 && (
              <p className="px-4 py-2 pl-8 text-caption">暂无省级区域</p>
            )}
          </div>
        </div>
      ))}

      {editing && (
        <FormModal title={editing === "new" ? "新增区域" : "编辑区域"} onCancel={cancel} onSave={save} saving={saving}>
          <Field label="名称 *"><input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="代码 * (英文/下划线)"><input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} /></Field>
          <Field label="上级区域">
            <select value={form.parentId ?? ""} onChange={(e) => setForm({ ...form, parentId: e.target.value || null })} className={inputCls}>
              <option value="">— 顶级（不推荐，通常选全国或大区）</option>
              {regions.filter((r) => r.id !== editing).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="排序"><input type="number" value={form.sortOrder ?? 999} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} className={inputCls} /></Field>
          <Field label="状态">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              启用
            </label>
          </Field>
        </FormModal>
      )}
    </div>
  );
}

// ── Product Lines ─────────────────────────────────────────────────────────────

function ProductLinesEditor({ lines, setLines, saving, post, del }: {
  lines: ProductLine[];
  setLines: (l: ProductLine[]) => void;
  saving: boolean;
  post: (p: string, b: object) => Promise<unknown>;
  del: (p: string, id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Partial<ProductLine>>({});
  const [editing, setEditing] = useState<string | null>(null);

  const topLines = lines.filter((l) => l.parentId === null);
  function subsOf(parentId: string) { return lines.filter((l) => l.parentId === parentId); }

  function startNew(parentId?: string) { setEditing("new"); setForm({ parentId: parentId ?? null, active: true, sortOrder: 999 }); }
  function startEdit(l: ProductLine) { setEditing(l.id); setForm({ ...l }); }
  function cancel() { setEditing(null); setForm({}); }

  async function save() {
    const d = await post("/api/market/productline", form) as { ok: boolean; line: ProductLine } | null;
    if (!d) return;
    setLines(editing === "new" ? [...lines, d.line] : lines.map((l) => l.id === editing ? d.line : l));
    cancel();
  }
  async function remove(id: string) {
    if (!confirm("删除后该品类下的竞品数据也将失效，确认？")) return;
    const ok = await del("/api/market/productline", id);
    if (ok) setLines(lines.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-caption">产品线 → 细分品类树。顶层为事业部主建；细分品类挂载其下。</p>
        <button onClick={() => startNew()} disabled={saving}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
          + 新增产品线
        </button>
      </div>

      {topLines.map((pl) => (
        <div key={pl.id} className="rounded-lg border border-[var(--surface-border)]">
          <div className="flex items-center gap-3 border-b border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-2.5">
            <span className="font-medium text-[var(--color-text-primary)]">{pl.name}</span>
            <span className="text-caption">{pl.code}</span>
            <span className={pl.active ? "ml-auto text-xs text-[var(--signal-green)]" : "ml-auto text-xs text-[var(--color-text-muted)]"}>{pl.active ? "启用" : "停用"}</span>
            <button onClick={() => startEdit(pl)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
            <button onClick={() => remove(pl.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
            <button onClick={() => startNew(pl.id)} className="text-xs text-[var(--color-accent)] hover:underline">+ 细分</button>
          </div>
          <div className="divide-y divide-[var(--surface-border)]">
            {subsOf(pl.id).map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2 pl-8 text-sm">
                <span className="text-[var(--color-text-secondary)]">{sub.name}</span>
                <span className="text-caption">{sub.code}</span>
                {sub.description && <span className="text-caption truncate max-w-[200px]">{sub.description}</span>}
                <span className={sub.active ? "ml-auto text-xs text-[var(--signal-green)]" : "ml-auto text-xs text-[var(--color-text-muted)]"}>{sub.active ? "启用" : "停用"}</span>
                <button onClick={() => startEdit(sub)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
                <button onClick={() => remove(sub.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
              </div>
            ))}
            {subsOf(pl.id).length === 0 && <p className="px-4 py-2 pl-8 text-caption">暂无细分品类</p>}
          </div>
        </div>
      ))}

      {editing && (
        <FormModal title={editing === "new" ? "新增品类" : "编辑品类"} onCancel={cancel} onSave={save} saving={saving}>
          <Field label="名称 *"><input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="代码 * (英文/下划线)"><input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} /></Field>
          <Field label="描述"><input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value || null })} className={inputCls} /></Field>
          <Field label="父级产品线（留空 = 顶层）">
            <select value={form.parentId ?? ""} onChange={(e) => setForm({ ...form, parentId: e.target.value || null })} className={inputCls}>
              <option value="">— 顶层产品线</option>
              {lines.filter((l) => l.id !== editing && l.parentId === null).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </Field>
          <Field label="排序"><input type="number" value={form.sortOrder ?? 999} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} className={inputCls} /></Field>
          <Field label="状态">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />启用</label>
          </Field>
        </FormModal>
      )}
    </div>
  );
}

// ── Brands ────────────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = { core: "核心竞品", watch: "观察", peripheral: "边缘" };
const THREAT_LABEL: Record<string, string> = { critical: "极高", high: "高", medium: "中", low: "低" };

function BrandsEditor({ brands, setBrands, saving, post, del }: {
  brands: Brand[];
  setBrands: (b: Brand[]) => void;
  saving: boolean;
  post: (p: string, b: object) => Promise<unknown>;
  del: (p: string, id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Partial<Brand>>({});
  const [editing, setEditing] = useState<string | null>(null);

  function startNew() { setEditing("new"); setForm({ tier: "watch", threatLevel: "medium", competitorType: "existing", active: true }); }
  function startEdit(b: Brand) { setEditing(b.id); setForm({ ...b }); }
  function cancel() { setEditing(null); setForm({}); }

  async function save() {
    const d = await post("/api/market/brand", form) as { success: boolean; brand: Brand } | null;
    if (!d) return;
    setBrands(editing === "new" ? [...brands, d.brand] : brands.map((b) => b.id === editing ? d.brand : b));
    cancel();
  }
  async function remove(id: string) {
    if (!confirm("删除竞品将同时删除其产品、研究记录和竞争单元，确认？")) return;
    const ok = await del("/api/market/brand", id);
    if (ok) setBrands(brands.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-caption">竞品品牌库。核心竞品出现在竞争战场图列；观察/边缘用于情报追踪。</p>
        <button onClick={startNew} disabled={saving}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
          + 新增竞品
        </button>
      </div>

      <div className="rounded-lg border border-[var(--surface-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)]">
              <th className="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">品牌</th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">层级</th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">威胁</th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">定位</th>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">状态</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {brands.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">
                  {b.name}
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{TIER_LABEL[b.tier] ?? b.tier}</td>
                <td className="px-4 py-2.5">
                  <span className={
                    b.threatLevel === "critical" ? "text-[var(--signal-red)]" :
                    b.threatLevel === "high" ? "text-[var(--signal-red)]/70" :
                    "text-[var(--color-text-muted)]"
                  }>{THREAT_LABEL[b.threatLevel] ?? b.threatLevel}</span>
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-secondary)] max-w-[200px] truncate">{b.positioning ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs">{b.active ? <span className="text-[var(--signal-green)]">启用</span> : <span className="text-[var(--color-text-muted)]">停用</span>}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(b)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
                    <button onClick={() => remove(b.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormModal title={editing === "new" ? "新增竞品" : "编辑竞品"} onCancel={cancel} onSave={save} saving={saving}>
          <Field label="品牌名称 *"><input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="英文名">
            <input value={form.nameEn ?? ""} onChange={(e) => setForm({ ...form, nameEn: e.target.value || null })} className={inputCls} />
          </Field>
          <Field label="层级">
            <select value={form.tier ?? "watch"} onChange={(e) => setForm({ ...form, tier: e.target.value })} className={inputCls}>
              <option value="core">核心竞品</option>
              <option value="watch">观察</option>
              <option value="peripheral">边缘</option>
            </select>
          </Field>
          <Field label="威胁等级">
            <select value={form.threatLevel ?? "medium"} onChange={(e) => setForm({ ...form, threatLevel: e.target.value })} className={inputCls}>
              <option value="critical">极高</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </Field>
          <Field label="类型">
            <select value={form.competitorType ?? "existing"} onChange={(e) => setForm({ ...form, competitorType: e.target.value })} className={inputCls}>
              <option value="existing">现有竞品</option>
              <option value="new_entrant">新进入者</option>
              <option value="substitute">替代品</option>
            </select>
          </Field>
          <Field label="定位摘要"><input value={form.positioning ?? ""} onChange={(e) => setForm({ ...form, positioning: e.target.value || null })} className={inputCls} /></Field>
          <Field label="状态">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />启用</label>
          </Field>
        </FormModal>
      )}
    </div>
  );
}

// ── Hot Products / 重点产品与爆款信号 ─────────────────────────────────────────

const VELOCITY_LABEL: Record<string, string> = { rising: "上升", stable: "稳定", declining: "下滑" };

function HotProductsEditor({ products, setProducts, brands, productLines, saving, post, del }: {
  products: Product[];
  setProducts: (p: Product[]) => void;
  brands: Brand[];
  productLines: ProductLine[];
  saving: boolean;
  post: (p: string, b: object) => Promise<unknown>;
  del: (p: string, id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Partial<Product>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [onlyHot, setOnlyHot] = useState(false);

  const brandName = (id: string | null) => brands.find((b) => b.id === id)?.name ?? "—";
  const lineName = (id: string | null) => productLines.find((l) => l.id === id)?.name ?? "—";
  const shown = onlyHot ? products.filter((p) => p.hotRank != null) : products;

  function startNew() { setEditing("new"); setForm({ tracked: true, sortOrder: 999 }); }
  function startEdit(p: Product) { setEditing(p.id); setForm({ ...p }); }
  function cancel() { setEditing(null); setForm({}); }

  async function save() {
    const d = await post("/api/market/product", form) as { ok: boolean; product: Product } | null;
    if (!d) return;
    const norm: Product = {
      ...d.product,
      priceMin: d.product.priceMin != null ? Number(d.product.priceMin) : null,
      priceMax: d.product.priceMax != null ? Number(d.product.priceMax) : null,
      hotSignalAt: d.product.hotSignalAt ? String(d.product.hotSignalAt).slice(0, 10) : null,
    };
    setProducts(editing === "new" ? [...products, norm] : products.map((p) => p.id === editing ? norm : p));
    cancel();
  }
  async function remove(id: string) {
    if (!confirm("删除该重点产品及其爆款信号，确认？")) return;
    const ok = await del("/api/market/product", id);
    if (ok) setProducts(products.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-caption">竞品重点产品库。设置爆款排名(hotRank)与信号文字后，将出现在竞争战场图的「爆款信号追踪」面板。</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={onlyHot} onChange={(e) => setOnlyHot(e.target.checked)} className="accent-[var(--color-accent)]" />
            只看爆款
          </label>
          <button onClick={startNew} disabled={saving}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
            + 新增产品
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--surface-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)]">
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)] w-10">🔥</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">产品</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">品牌</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">品类</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">价格(万)</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">动销</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {shown.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5">
                  {p.hotRank != null ? <span className="rounded bg-[var(--signal-yellow)]/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--signal-yellow)]">#{p.hotRank}</span> : <span className="text-[var(--color-text-muted)]">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-[var(--color-text-primary)]">{p.name}</div>
                  {p.modelCode && <div className="text-[11px] text-[var(--color-text-muted)]">{p.modelCode}</div>}
                </td>
                <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{brandName(p.brandId)}</td>
                <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{lineName(p.productLineId)}</td>
                <td className="px-3 py-2.5 font-data text-[var(--color-text-secondary)]">
                  {p.priceMin != null ? `${p.priceMin}${p.priceMax != null && p.priceMax !== p.priceMin ? `–${p.priceMax}` : ""}` : "—"}
                </td>
                <td className="px-3 py-2.5 text-xs">
                  {p.salesVelocity ? <span className={p.salesVelocity === "rising" ? "text-[var(--signal-red)]" : p.salesVelocity === "declining" ? "text-[var(--signal-green)]" : "text-[var(--color-text-muted)]"}>{VELOCITY_LABEL[p.salesVelocity] ?? p.salesVelocity}</span> : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(p)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
                    <button onClick={() => remove(p.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">暂无产品</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormModal title={editing === "new" ? "新增重点产品" : "编辑重点产品"} onCancel={cancel} onSave={save} saving={saving}>
          <Field label="产品名称 *"><input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="型号"><input value={form.modelCode ?? ""} onChange={(e) => setForm({ ...form, modelCode: e.target.value || null })} className={inputCls} /></Field>
          <Field label="品牌">
            <select value={form.brandId ?? ""} onChange={(e) => setForm({ ...form, brandId: e.target.value || null })} className={inputCls}>
              <option value="">— 选择品牌</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="所属品类">
            <select value={form.productLineId ?? ""} onChange={(e) => setForm({ ...form, productLineId: e.target.value || null })} className={inputCls}>
              <option value="">— 选择品类</option>
              {productLines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="价格下限(万)"><input type="number" value={form.priceMin ?? ""} onChange={(e) => setForm({ ...form, priceMin: e.target.value ? +e.target.value : null })} className={inputCls} /></Field>
            <Field label="价格上限(万)"><input type="number" value={form.priceMax ?? ""} onChange={(e) => setForm({ ...form, priceMax: e.target.value ? +e.target.value : null })} className={inputCls} /></Field>
          </div>
          <Field label="定位"><input value={form.positioning ?? ""} onChange={(e) => setForm({ ...form, positioning: e.target.value || null })} className={inputCls} /></Field>
          <div className="my-1 border-t border-dashed border-[var(--surface-border)] pt-2 text-xs font-semibold text-[var(--signal-yellow)]">🔥 爆款信号（留空 hotRank = 非爆款）</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="爆款排名 (1=最热)"><input type="number" value={form.hotRank ?? ""} onChange={(e) => setForm({ ...form, hotRank: e.target.value ? +e.target.value : null })} className={inputCls} /></Field>
            <Field label="动销趋势">
              <select value={form.salesVelocity ?? ""} onChange={(e) => setForm({ ...form, salesVelocity: e.target.value || null })} className={inputCls}>
                <option value="">—</option>
                <option value="rising">上升</option>
                <option value="stable">稳定</option>
                <option value="declining">下滑</option>
              </select>
            </Field>
          </div>
          <Field label="信号采集日期"><input type="date" value={form.hotSignalAt ?? ""} onChange={(e) => setForm({ ...form, hotSignalAt: e.target.value || null })} className={inputCls} /></Field>
          <Field label="爆款信号说明">
            <textarea value={form.hotSignalNote ?? ""} onChange={(e) => setForm({ ...form, hotSignalNote: e.target.value || null })} rows={3}
              placeholder="如：京东燃热20L品类连续6个月TOP2，零冷水功能差异化显著，月销4000+台"
              className={inputCls + " resize-none"} />
          </Field>
          <Field label="持续追踪">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tracked ?? true} onChange={(e) => setForm({ ...form, tracked: e.target.checked })} />纳入追踪</label>
          </Field>
        </FormModal>
      )}
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      {children}
    </div>
  );
}

function FormModal({ title, children, onCancel, onSave, saving }: {
  title: string; children: React.ReactNode;
  onCancel: () => void; onSave: () => void; saving: boolean;
}) {
  return (
    <Modal onClose={onCancel} size="md" title={title}>
        <div className="space-y-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-[var(--surface-border)] px-4 py-1.5 text-sm hover:bg-black/[0.04]">取消</button>
          <button onClick={onSave} disabled={saving}
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
    </Modal>
  );
}
