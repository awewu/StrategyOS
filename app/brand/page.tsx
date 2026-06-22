import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand/tokens";

const ASSETS = [
  { file: "stratos-brandkit-3x3.png", title: "Brand Kit 3×3", desc: "VI 总览板" },
  { file: "stratos-logo-2x2.png", title: "Logo 2×2", desc: "Mark 定稿 · 尺寸规范" },
  { file: "stratos-a3-panorama-light.png", title: "A3 一页纸", desc: "战略会张贴 Light" },
  { file: "stratos-light-mode-board.png", title: "Light Board", desc: "董事会 PDF 主题" },
] as const;

export default function BrandGalleryPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-deep)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-accent)]">
              StratOS Brand Gallery
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--color-accent)]">{brand.taglineZh}</p>
            <p className="text-xs italic text-[var(--color-text-muted)]">{brand.taglineEn}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {brand.positioningZh} · {brand.fullName} · VI v1.1 ·{" "}
              <Link href="/print/panorama" className="text-[var(--color-accent)] hover:underline">
                打印一页纸 →
              </Link>
            </p>
          </div>
          <Link href="/command" className="text-sm text-[#828c8d] hover:text-[var(--color-text-primary)]">
            ← 指挥舱
          </Link>
        </header>

        <section className="mb-10 flex items-center gap-6 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
          <Image src="/logo-mark.svg" alt="" width={80} height={80} />
          <Image src="/icon.svg" alt="" width={48} height={48} />
          <div>
            <p className="text-xl font-semibold">{brand.name}</p>
            <p className="text-[var(--color-accent)]">{brand.taglineZh}</p>
            <p className="text-sm italic text-[var(--color-text-muted)]">{brand.taglineEn}</p>
          </div>
        </section>

        <div className="grid gap-8">
          {ASSETS.map((a) => (
            <figure key={a.file} className="overflow-hidden rounded-lg border border-[var(--surface-border)]">
              <div className="border-b border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-4 py-3">
                <figcaption className="font-medium">{a.title}</figcaption>
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
