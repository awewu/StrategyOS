"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ExecTab = "commit" | "analysis" | "detail";

const TAB_ITEMS: { key: ExecTab; label: string }[] = [
  { key: "commit", label: "兑现" },
  { key: "analysis", label: "分析" },
  { key: "detail", label: "明细" },
];

export function ExecutionTabs({
  commit,
  analysis,
  detail,
}: {
  commit: React.ReactNode;
  analysis: React.ReactNode;
  detail: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const active: ExecTab = (searchParams.get("tab") as ExecTab) ?? "commit";

  const tabClass = (isActive: boolean) =>
    "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " +
    (isActive
      ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)]">
        {TAB_ITEMS.map(({ key, label }) => {
          const params = new URLSearchParams(searchParams.toString());
          if (key === "commit") {
            params.delete("tab");
          } else {
            params.set("tab", key);
          }
          const href = `/execution${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <Link key={key} href={href} scroll={false} className={tabClass(active === key)}>
              {label}
            </Link>
          );
        })}
      </div>
      {active === "commit" ? commit : active === "analysis" ? analysis : detail}
    </div>
  );
}
