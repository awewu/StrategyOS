export function ImplicationsBar({
  items,
  variant = "dark",
}: {
  items: string[];
  variant?: "dark" | "print";
}) {
  if (items.length === 0) return null;

  const isPrint = variant === "print";

  return (
    <section
      className={
        isPrint
          ? "stratos-print-card stratos-print-card--muted-bg px-5 py-4"
          : "stratos-card stratos-card--padded"
      }
      aria-labelledby="implications-title"
    >
      <div className="flex flex-wrap items-start gap-5 md:gap-8">
        <div className="min-w-[8rem] shrink-0">
          <h2
            id="implications-title"
            className={`stratos-section-title ${isPrint ? "text-[var(--color-accent)]" : ""}`}
          >
            战略含义
          </h2>
          <p className={`stratos-section-desc ${isPrint ? "stratos-print-muted" : ""}`}>
            对组织与资源的连带影响
          </p>
        </div>
        <ul className="flex flex-1 flex-col gap-2.5">
          {items.map((item) => (
            <li
              key={item}
              className={`stratos-prose ${isPrint ? "stratos-print-body" : ""}`}
            >
              <span className="mr-2 text-[var(--color-accent)]" aria-hidden>
                →
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
