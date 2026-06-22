import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { brand } from "@/lib/brand/tokens";

const ASSETS = [
  { file: "stratos-brandkit-3x3.png", title: "Brand Kit 3×3", desc: "VI 总览板" },
  { file: "stratos-logo-2x2.png", title: "Logo 2×2", desc: "Mark 定稿 · 尺寸规范" },
  { file: "stratos-a3-panorama-light.png", title: "A3 一页纸", desc: "战略会张贴 Light" },
  { file: "stratos-light-mode-board.png", title: "Light Board", desc: "董事会 PDF 主题" },
] as const;

const TOKEN_SWATCHES = [
  { name: "Accent Gold", var: "--color-accent" },
  { name: "Deep BG", var: "--color-bg-deep" },
  { name: "Surface", var: "--color-bg-surface" },
  { name: "Text Primary", var: "--color-text-primary" },
  { name: "Signal Green", var: "--signal-green" },
  { name: "Signal Red", var: "--signal-red" },
] as const;

export default function BrandGalleryPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-deep)]">
      <div className="stratos-page mx-auto max-w-6xl py-10">
        <PageHeader
          eyebrow="Brand Gallery · VI v1.1"
          title="StratOS 品牌资产"
          subtitle={`${brand.positioningZh} · ${brand.fullName}`}
          actions={
            <Link href="/command" className="stratos-btn stratos-btn--ghost text-xs">
              ← 指挥舱
            </Link>
          }
        />

        <section className="stratos-card stratos-card--padded flex flex-wrap items-center gap-6">
          <Image src="/logo-mark.svg" alt="" width={80} height={80} />
          <Image src="/icon.svg" alt="" width={48} height={48} />
          <div>
            <p className="text-xl font-semibold text-[var(--color-text-primary)]">{brand.name}</p>
            <p className="text-[var(--color-accent)]">{brand.taglineZh}</p>
            <p className="text-sm italic text-[var(--color-text-muted)]">{brand.taglineEn}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              <Link href="/print/panorama" className="text-[var(--color-accent)] hover:underline">
                打印一页纸 →
              </Link>
            </p>
          </div>
        </section>

        <section className="stratos-card stratos-card--padded">
          <h2 className="stratos-section-title mb-4">Design Tokens</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TOKEN_SWATCHES.map((t) => (
              <div key={t.var} className="rounded-lg border border-[var(--surface-border)] p-3">
                <div
                  className="mb-2 h-10 rounded-md border border-[var(--surface-border)]"
                  style={{ background: `var(${t.var})` }}
                />
                <p className="text-xs font-medium text-[var(--color-text-primary)]">{t.name}</p>
                <p className="font-data text-[10px] text-[var(--color-text-muted)]">{t.var}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="stratos-section-gap flex flex-col">
          {ASSETS.map((a) => (
            <figure key={a.file} className="stratos-card overflow-hidden">
              <div className="border-b border-[var(--surface-border)] px-4 py-3">
                <figcaption className="font-medium text-[var(--color-text-primary)]">{a.title}</figcaption>
                <p className="text-xs text-[var(--color-text-muted)]">{a.desc}</p>
              </div>
              <Image
                src={`/brand/${a.file}`}
                alt={a.title}
                width={1400}
                height={875}
                className="w-full"
              />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
