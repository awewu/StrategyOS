"use client";

import { useState } from "react";
import { ChinaStrategyOnePager } from "@/components/strategy/ChinaStrategyOnePager";
import { StrategySummaryPanel } from "@/components/strategy/StrategySummaryPanel";
import { ThreeStackPanel } from "@/components/strategy/ThreeStackPanel";
import type { OnePagerRecord } from "@/lib/strategy/one-pager-store";
import type { getStrategyBundle } from "@/lib/data/strategy-data";

type StrategyBundle = Awaited<ReturnType<typeof getStrategyBundle>>;

export function StrategyPageTabs({
  bundle,
  onePager,
  capSummary,
  period,
}: {
  bundle: StrategyBundle;
  onePager: OnePagerRecord;
  capSummary: string;
  period: string;
}) {
  const [tab, setTab] = useState<"view" | "onepager">("view");

  return (
    <div className="stratos-section-gap flex flex-col">
      <div className="flex gap-2 border-b border-black/[0.06] pb-2">
        <button
          type="button"
          onClick={() => setTab("view")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "view"
              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          看战略
        </button>
        <button
          type="button"
          onClick={() => setTab("onepager")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "onepager"
              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          董事会一页纸
        </button>
      </div>

      {tab === "view" ? (
        <div className="space-y-8">
          <StrategySummaryPanel
            diagnosis={bundle.diagnosis}
            brandCards={bundle.brandCards}
            ics={bundle.investmentCases}
            productBets={bundle.productBets}
            gtmBets={bundle.gtmBets}
            bscCards={bundle.bscCards}
            period={period}
          />
          <ThreeStackPanel
            ics={bundle.investmentCases}
            productBets={bundle.productBets}
            gtmBets={bundle.gtmBets}
            capSummary={capSummary}
          />
        </div>
      ) : (
        <ChinaStrategyOnePager initial={onePager} />
      )}
    </div>
  );
}
