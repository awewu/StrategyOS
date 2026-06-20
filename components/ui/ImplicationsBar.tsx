import { appleTypography, mckinseySections } from "@/lib/brand/apple-mckinsey";
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
          : "surface-glass rounded-xl border border-white/[0.06] px-5 py-4"
      }
      aria-labelledby="implications-title"
    >
      <div className="flex flex-wrap items-start gap-4 md:gap-6">
        <div className="min-w-[7rem] shrink-0">
          <h3
            id="implications-title"
            className={`${appleTypography.label} ${
              isPrint ? "text-[var(--color-accent)]" : "text-[var(--color-accent-gold)]"
            }`}
          >
            {mckinseySections.implications.id} · {mckinseySections.implications.labelZh}
          </h3>
          <p className={`${typography.caption} mt-1 ${isPrint ? "text-[#828c8d]" : ""}`}>
            {mckinseySections.implications.hint}
          </p>
        </div>
        <ul className="flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <li
              key={item}
              className={`${appleTypography.bodyQuiet} text-sm ${
                isPrint ? "text-[#cdd1d2]" : "text-[var(--color-text-primary)]/85"
              }`}
            >
              <span
                className={`mr-2 ${isPrint ? "text-[var(--color-accent)]" : "text-[var(--color-accent-gold)]"}`}
                aria-hidden
              >
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
