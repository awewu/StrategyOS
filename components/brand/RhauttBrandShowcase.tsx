import { brand } from "@/lib/brand/tokens";

/** Rhautt group lockup previews for Brand Gallery */
export function RhauttBrandShowcase() {
  return (
    <section className="stratos-card stratos-card--padded">
      <h2 className="stratos-section-title mb-1">Rhautt 集团标识</h2>
      <p className="stratos-section-desc mb-6">
        官方字标 <span className="font-data">{brand.rhautt.wordmark}</span> · RGB 194·44·18 ·{" "}
        {brand.rhautt.taglineEn}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <figure className="overflow-hidden rounded-lg border border-[var(--surface-border)]">
          <figcaption className="border-b border-[var(--surface-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
            Sidebar · Dark rail
          </figcaption>
          <div
            className="flex flex-col items-center justify-center gap-0.5 px-4 py-8"
            style={{ background: "var(--sidebar-rail-bg)" }}
          >
            <span className="stratos-sidebar__rhautt">{brand.rhautt.wordmark}</span>
            <span className="stratos-sidebar__rhautt-accent" />
            <span className="stratos-sidebar__group">{brand.sidebarLabelZh}</span>
          </div>
        </figure>
        <figure className="overflow-hidden rounded-lg border border-[var(--surface-border)]">
          <figcaption className="border-b border-[var(--surface-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
            Brand · Light / print
          </figcaption>
          <div
            className="flex flex-col items-center justify-center gap-2 px-4 py-8"
            style={{ background: brand.rhautt.grey }}
          >
            <span className="rhautt-lockup--light">{brand.rhautt.wordmark}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              {brand.rhautt.taglineEn}
            </span>
          </div>
        </figure>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--surface-border)] px-3 py-2">
          <span className="h-6 w-6 rounded" style={{ background: brand.rhautt.red }} aria-hidden />
          <span className="text-xs">
            <span className="font-medium">Rhautt Red</span>
            <span className="ml-2 font-data text-[var(--color-text-muted)]">{brand.rhautt.red}</span>
          </span>
        </div>
        <a
          href="/brand/rhautt-wordmark-dark.svg"
          className="stratos-btn stratos-btn--ghost text-xs"
          download
        >
          下载 SVG
        </a>
      </div>
    </section>
  );
}
