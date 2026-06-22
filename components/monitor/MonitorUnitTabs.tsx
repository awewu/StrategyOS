"use client";

import Link from "next/link";
import type { OrgSlice } from "@/lib/monitor/org-slices";

export function MonitorUnitTabs({
  basePath,
  slices,
  activeId,
}: {
  basePath: "/monitor/functions" | "/monitor/bu";
  slices: OrgSlice[];
  activeId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)] pb-3">
      {slices.map((s) => {
        const active = s.id === activeId;
        return (
          <Link
            key={s.id}
            href={`${basePath}?unit=${s.id}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:bg-black/[0.04] hover:text-[var(--color-text-primary)]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
