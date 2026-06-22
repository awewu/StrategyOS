"use client";

import { useState, type ReactNode } from "react";

export function CommandBoardShell({ children }: { children: ReactNode }) {
  const [lightPreview, setLightPreview] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-[var(--color-text-muted)]">
          态势板 · UI_VI §4.3 十二列网格
        </p>
        <button
          type="button"
          className={`stratos-btn px-3 py-1.5 text-xs ${lightPreview ? "stratos-btn--primary" : "stratos-btn--ghost"}`}
          onClick={() => setLightPreview((v) => !v)}
          aria-pressed={lightPreview}
        >
          {lightPreview ? "退出 Light 预览" : "Light 预览 · 董事会主题"}
        </button>
      </div>
      <div
        data-theme={lightPreview ? "print" : undefined}
        className={
          lightPreview
            ? "rounded-xl border border-[var(--print-border,var(--surface-border))] bg-[var(--color-bg-deep)] p-4 shadow-sm transition-colors"
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
