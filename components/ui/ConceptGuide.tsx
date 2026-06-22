import { getConcepts } from "@/lib/learn/concepts";

/**
 * 概念解读模块 — 放在页面底部，向员工科普本页用到的战略方法论。
 * 使用原生 <details> 折叠，无需客户端 JS。
 */
export function ConceptGuide({
  ids,
  title = "概念解读 · 方法论原理",
  subtitle = "本页用到的战略理论工具——原理、思维逻辑与在系统中的工作方式。点击展开。",
}: {
  ids: string[];
  title?: string;
  subtitle?: string;
}) {
  const concepts = getConcepts(ids);
  if (concepts.length === 0) return null;

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <div className="mb-1 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-3.5 w-1 rounded-full bg-[var(--color-accent)]"
        />
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">{subtitle}</p>

      <div className="divide-y divide-[var(--surface-border)]">
        {concepts.map((c) => (
          <details key={c.id} className="group py-3">
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{c.origin}</span>
              </span>
              <span className="select-none text-xs text-[var(--color-text-muted)] transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="mt-2 space-y-2.5 pl-3 text-sm leading-relaxed">
              <p className="font-medium text-[var(--color-accent)]">{c.tagline}</p>

              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  原理与思维逻辑
                </span>
                <p className="mt-0.5">{c.principle}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  在 StratOS 中如何工作
                </span>
                <p className="mt-0.5">{c.howItWorks}</p>
              </div>

              {c.keyQuestion ? (
                <p className="rounded-md border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.06] px-3 py-2 text-[13px]">
                  <span className="text-[var(--color-text-muted)]">关键一问 · </span>
                  {c.keyQuestion}
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
