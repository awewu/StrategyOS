"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type MarketTab = "landscape" | "workbench" | "swot" | "intel";

const TAB_ITEMS: { key: MarketTab; label: string }[] = [
  { key: "landscape", label: "格局快照" },
  { key: "workbench", label: "竞争台" },
  { key: "swot", label: "SWOT 推演" },
  { key: "intel", label: "情报流 · Hermes" },
];

export function MarketTabs({
  landscape,
  workbench,
  swot,
  intel,
  initialTab = "landscape",
}: {
  landscape: React.ReactNode;
  workbench: React.ReactNode;
  swot: React.ReactNode;
  intel: React.ReactNode;
  initialTab?: MarketTab;
}) {
  const searchParams = useSearchParams();
  const active: MarketTab =
    (searchParams.get("tab") as MarketTab) ?? initialTab;

  const tabClass = (isActive: boolean) =>
    "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " +
    (isActive
      ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)]">
        {TAB_ITEMS.map(({ key, label }) => {
          const params = new URLSearchParams(searchParams.toString());
          if (key === "landscape") {
            params.delete("tab");
          } else {
            params.set("tab", key);
          }
          const href = `/market${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <Link
              key={key}
              href={href}
              scroll={false}
              className={tabClass(active === key)}
            >
              {label}
            </Link>
          );
        })}
        <Link
          href="/market/config"
          className="ml-auto border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ⚙ 配置
        </Link>
      </div>
      {active === "landscape" ? landscape : active === "workbench" ? workbench : active === "swot" ? swot : intel}
    </div>
  );
}
