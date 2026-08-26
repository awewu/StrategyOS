"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  href: string;
};

const DOT_COLOR: Record<Notification["severity"], string> = {
  critical: "var(--signal-red)",
  warning: "var(--signal-yellow)",
  info: "var(--color-text-muted)",
};

/** 站内通知铃铛：承诺逾期 / 预算待审 / critical 议题 / 该导数了 */
export function NotificationsBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/notifications");
        if (!r.ok) return;
        const j = (await r.json()) as { notifications?: Notification[] };
        if (!cancelled && Array.isArray(j.notifications)) setItems(j.notifications);
      } catch {
        /* silent */
      }
    }
    void load();
    const timer = window.setInterval(load, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasCritical = items.some((i) => i.severity === "critical");

  return (
    <div ref={ref} className="fixed right-5 top-5 z-40">
      <button
        type="button"
        aria-label={`通知 ${items.length} 条`}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-panel,white)] shadow-sm transition-colors hover:border-[var(--color-accent)]/40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--color-text-secondary)]">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {items.length > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-medium text-white"
            style={{ backgroundColor: hasCritical ? "var(--signal-red)" : "var(--signal-yellow)" }}
          >
            {items.length > 9 ? "9+" : items.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel,white)] p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-2 text-caption">无待办通知 — 一切在控</p>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-black/[0.04]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: DOT_COLOR[n.severity] }}
                />
                <span>{n.title}</span>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
