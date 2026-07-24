"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export interface ReadonlyRoadmapItem {
  id: string;
  roadmapTabId: string | null;
  roadmapTabName: string | null;
  track: string;
  title: string;
  startYear: number;
  startQ: number;
  endYear: number;
  endQ: number;
  milestone: string | null;
  color: string | null;
  imageAttachmentId: string | null;
  imageFilename: string | null;
}

interface RoadmapTab {
  id: string;
  name: string;
}

const DEFAULT_TAB_ID = "roadmap-default";
const DEFAULT_TAB_NAME = "路线图 1";
const QUARTERS = [1, 2, 3, 4];

const BAR_COLORS: Record<string, string> = {
  green: "border-[var(--signal-green)]/30 bg-[var(--signal-green)]/20",
  yellow: "border-[var(--signal-yellow)]/35 bg-[var(--signal-yellow)]/20",
  red: "border-[var(--signal-red)]/30 bg-[var(--signal-red)]/15",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTabs(rawTabs: unknown, items: ReadonlyRoadmapItem[]): RoadmapTab[] {
  const tabs = Array.isArray(rawTabs)
    ? rawTabs
        .map((rawTab, index) => {
          const tab = rawTab && typeof rawTab === "object" && !Array.isArray(rawTab)
            ? rawTab as Record<string, unknown>
            : {};
          return {
            id: text(tab.id) || (index === 0 ? DEFAULT_TAB_ID : `roadmap-tab-${index + 1}`),
            name: text(tab.name) || `路线图 ${index + 1}`,
          };
        })
        .filter((tab, index, list) => list.findIndex((item) => item.id === tab.id) === index)
    : [];

  if (tabs.length === 0) tabs.push({ id: DEFAULT_TAB_ID, name: DEFAULT_TAB_NAME });
  for (const item of items) {
    const tabId = text(item.roadmapTabId);
    if (tabId && !tabs.some((tab) => tab.id === tabId)) {
      tabs.push({ id: tabId, name: text(item.roadmapTabName) || `路线图 ${tabs.length + 1}` });
    }
  }
  return tabs;
}

function boundedQuarter(value: number): number {
  return Math.min(4, Math.max(1, Number.isFinite(value) ? value : 1));
}

export function ReadonlyRoadmapGantt({
  roadmapTabs,
  items,
  horizonStart,
  horizonEnd,
}: {
  roadmapTabs: unknown;
  items: ReadonlyRoadmapItem[];
  horizonStart: number;
  horizonEnd: number;
}) {
  const tabs = useMemo(() => normalizeTabs(roadmapTabs, items), [roadmapTabs, items]);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? DEFAULT_TAB_ID);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const firstTabId = tabs[0]?.id ?? DEFAULT_TAB_ID;
  const activeItems = items.filter((item) => (text(item.roadmapTabId) || firstTabId) === activeTab.id);

  const years = useMemo(() => {
    const itemYears = items.flatMap((item) => [item.startYear, item.endYear]).filter(Number.isFinite);
    const start = Math.min(horizonStart, ...itemYears);
    const end = Math.max(horizonEnd, ...itemYears);
    return Array.from({ length: Math.max(1, end - start + 1) }, (_, index) => start + index);
  }, [horizonEnd, horizonStart, items]);
  const quarters = years.flatMap((year) => QUARTERS.map((quarter) => ({ year, quarter })));
  const gridTemplateColumns = `minmax(150px, 180px) repeat(${quarters.length}, minmax(63px, 1fr))`;
  const minWidth = 180 + quarters.length * 63;
  const firstYear = years[0] ?? horizonStart;

  function quarterIndex(year: number, quarter: number): number {
    return (year - firstYear) * 4 + boundedQuarter(quarter) - 1;
  }

  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">暂无内容</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center overflow-x-auto border-b border-[var(--surface-border)]">
        {tabs.map((tab) => {
          const active = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`min-w-32 max-w-56 truncate border border-b-0 px-4 py-2 text-left text-sm ${
                active
                  ? "border-[var(--surface-border)] bg-[var(--color-bg-surface)] font-medium text-[var(--color-text-primary)]"
                  : "border-transparent bg-black/[0.02] text-[var(--color-text-muted)] hover:bg-black/[0.04]"
              }`}
              title={tab.name}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="max-w-full overflow-x-auto rounded border border-[var(--surface-border)] p-3">
        <div style={{ minWidth }}>
          <div className="grid items-center pb-2 text-xs text-[var(--color-text-muted)]" style={{ gridTemplateColumns }}>
            <div className="pr-3 font-medium text-[var(--color-text-secondary)]">轨道 · 节点</div>
            {quarters.map(({ year, quarter }) => (
              <div
                key={`${year}-${quarter}`}
                className={`border-l border-[var(--surface-border)] text-center ${quarter === 1 ? "font-semibold text-[var(--color-text-secondary)]" : ""}`}
              >
                {year} Q{quarter}
              </div>
            ))}
          </div>

          <div className="divide-y divide-[var(--surface-border)]/60 border-t border-[var(--surface-border)]">
            {activeItems.map((item) => {
              const startIndex = Math.max(0, Math.min(quarters.length - 1, quarterIndex(item.startYear, item.startQ)));
              const endIndex = Math.max(startIndex, Math.min(quarters.length - 1, quarterIndex(item.endYear, item.endQ)));
              const span = endIndex - startIndex + 1;
              const barColor = BAR_COLORS[text(item.color)] ?? "border-[var(--color-accent)]/25 bg-[var(--color-accent)]/15";
              return (
                <div key={item.id} className="grid min-h-12 items-center" style={{ gridTemplateColumns }}>
                  <div className="min-w-0 pr-3 text-xs text-[var(--color-text-secondary)]" title={`${item.track} · ${item.title}`}>
                    <span className="block truncate">{item.track} · {item.title}</span>
                  </div>
                  {quarters.map((quarter, index) => (
                    index === startIndex ? (
                      <div
                        key={`${quarter.year}-${quarter.quarter}`}
                        className={`my-1 flex min-h-9 items-center gap-2 overflow-hidden rounded border px-2 py-1 text-xs text-[var(--color-text-primary)] ${barColor}`}
                        style={{ gridColumn: `span ${span}` }}
                        title={item.milestone || item.title}
                      >
                        <span className="min-w-0 flex-1 truncate">{item.milestone || item.title}</span>
                        {item.imageAttachmentId ? (
                          <a
                            href={`/api/strategy/plan/attachment?id=${encodeURIComponent(item.imageAttachmentId)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-white/70 bg-white"
                            title={item.imageFilename || "查看图片"}
                          >
                            <Image
                              src={`/api/strategy/plan/attachment?id=${encodeURIComponent(item.imageAttachmentId)}`}
                              alt={item.imageFilename || item.title}
                              fill
                              sizes="32px"
                              unoptimized
                              className="object-contain p-0.5"
                            />
                          </a>
                        ) : null}
                      </div>
                    ) : index > startIndex && index <= endIndex ? null : (
                      <div key={`${quarter.year}-${quarter.quarter}`} className="h-full border-l border-[var(--surface-border)]/35" />
                    )
                  ))}
                </div>
              );
            })}
            {activeItems.length === 0 ? (
              <div className="flex min-h-16 items-center justify-center text-sm text-[var(--color-text-muted)]">该路线图暂无节点</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
