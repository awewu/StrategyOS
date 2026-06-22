import { typography } from "@/lib/brand/typography";

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
          ? "rounded-xl border border-[#0a1628]/10 bg-[#faf8f5] px-5 py-4"
          : "stratos-card stratos-card--padded"
      }
      aria-labelledby="implications-title"
    >
      <div className="flex flex-wrap items-start gap-4 md:gap-6">
        <div className="min-w-[7rem] shrink-0">
          <h3
            id="implications-title"
            className={`text-title ${isPrint ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}
          >
            战略含义
          </h3>
          <p className={`${typography.caption} mt-0.5 ${isPrint ? "text-[#828c8d]" : ""}`}>
            对组织与资源的连带影响
          </p>
        </div>
        <ul className="flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <li
              key={item}
              className={`text-sm leading-relaxed ${
                isPrint ? "text-[#cdd1d2]" : "text-[var(--color-text-secondary)]"
              }`}
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
