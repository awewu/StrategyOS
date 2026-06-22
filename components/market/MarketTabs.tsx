"use client";

import { useState } from "react";
import Link from "next/link";

type MarketTab = "landscape" | "workbench" | "swot" | "intel";

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
  const [tab, setTab] = useState<MarketTab>(initialTab);
  const tabClass = (active: boolean) =>
    "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " +
    (active
      ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)]">
        <button type="button" onClick={() => setTab("landscape")} className={tabClass(tab === "landscape")}>
          格局快照
        </button>
        <button type="button" onClick={() => setTab("workbench")} className={tabClass(tab === "workbench")}>
          竞争台
        </button>
        <button type="button" onClick={() => setTab("swot")} className={tabClass(tab === "swot")}>
          SWOT 推演
        </button>
        <button type="button" onClick={() => setTab("intel")} className={tabClass(tab === "intel")}>
          情报流 · Hermes
        </button>
        <Link
          href="/market/config"
          className="ml-auto border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ⚙ 配置
        </Link>
      </div>
      {tab === "landscape" ? landscape : tab === "workbench" ? workbench : tab === "swot" ? swot : intel}
    </div>
  );
}
