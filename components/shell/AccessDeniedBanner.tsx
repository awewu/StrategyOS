"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function AccessDeniedBanner() {
  const params = useSearchParams();
  const denied = params.get("denied") === "1";
  const [dismissed, setDismissed] = useState(false);

  if (!denied || dismissed) return null;

  return (
    <div
      className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/8 px-4 py-3 text-sm"
      role="alert"
    >
      <p className="text-[var(--color-text-primary)]">
        当前角色无权访问该页面，已跳转到你的默认工作台。
      </p>
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
