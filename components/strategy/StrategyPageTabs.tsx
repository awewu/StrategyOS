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
    <div className="stratos-page">
      <div className="stratos-segment">
        <button
          type="button"
          onClick={() => setTab("view")}
          className={`stratos-segment__item ${tab === "view" ? "stratos-segment__item--active" : ""}`}
        >
          看战略
        </button>
        <button
          type="button"
          onClick={() => setTab("onepager")}
          className={`stratos-segment__item ${tab === "onepager" ? "stratos-segment__item--active" : ""}`}
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
