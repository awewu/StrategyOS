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
    red: "border-[var(--signal-red)]/30 bg-[var(--signal-red)]/8 text-[var(--signal-red)]",
    yellow:
      "border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/8 text-[var(--signal-yellow)]",
    green: "border-emerald-500/30 bg-emerald-500/8 text-emerald-400",
  };

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 rounded-lg border px-4 py-2.5 text-sm ${signalStyles[meta.signal]}`}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">
          {meta.source === "demo" ? "演示数据模式" : "数据新鲜度"}
        </span>
        <span className="text-[var(--color-text-primary)]">{meta.message}</span>
        {meta.source === "database" && meta.lastUpdates.activePeriod && (
          <span className="text-xs text-[var(--color-text-muted)]">
            周期 {meta.lastUpdates.activePeriod}
          </span>
        )}
      </div>
      <button
        type="button"
        className="shrink-0 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        onClick={() => setDismissed(true)}
      >
        关闭
      </button>
    </div>
  );
}
