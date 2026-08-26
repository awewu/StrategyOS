"use client";

import { useEffect, useState } from "react";
import type { DataSourceMeta } from "@/lib/data/data-source-meta";

export function DataSourceBanner() {
  const [meta, setMeta] = useState<DataSourceMeta | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/data-source")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) setMeta(data as DataSourceMeta);
      })
      .catch(() => {
        // Silent failure — banner is non-critical UX.
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!meta || dismissed) return null;
  if (meta.signal === "green" && meta.source === "database") return null;

  const signalStyles = {
    red: "border-[var(--signal-red)]/30 bg-[var(--signal-red)]/8 text-[var(--signal-red-text)]",
    yellow:
      "border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/8 text-[var(--signal-yellow-text)]",
    green: "border-[var(--signal-green)]/25 bg-[var(--signal-green)]/10 text-[var(--signal-green-text)]",
  };
  // 演示数据是「提示」而非「风险」——用琥珀，红色全站只留给激活的闭环步骤
  const tone = meta.source === "demo" ? "yellow" : meta.signal;

  return (
    <div
      className={`mb-3 flex items-start justify-between gap-4 rounded-lg border px-3.5 py-2 text-caption ${signalStyles[tone]}`}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">
          {meta.source === "demo"
            ? "演示数据模式"
            : (meta.demoFallbacks?.length ?? 0) > 0
              ? "部分演示数据"
              : "数据新鲜度"}
        </span>
        <span className="text-[var(--color-text-secondary)]">{meta.message}</span>
        {meta.source === "database" && meta.lastUpdates.activePeriod && (
          <span className="text-caption">
            周期 {meta.lastUpdates.activePeriod}
          </span>
        )}
      </div>
      <button
        type="button"
        className="shrink-0 text-caption hover:text-[var(--color-text-primary)]"
        onClick={() => setDismissed(true)}
      >
        关闭
      </button>
    </div>
  );
}
