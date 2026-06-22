"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StratOS dashboard]", error);
  }, [error]);

  return (
    <div className="stratos-section-gap flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="stratos-card stratos-card--padded w-full max-w-lg border-[var(--signal-red)]/25 bg-[color-mix(in_srgb,var(--signal-red)_5%,white)]">
        <p className="label-xs text-[var(--signal-red)]">页面加载失败</p>
        <h1 className="mt-2 text-title text-[var(--color-text-primary)]">此模块暂时不可用</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          可能是数据库连接或数据格式异常。请重试；若持续出现，请联系管理员。
        </p>
        {error.message ? (
          <p className="mt-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-raised)] px-3 py-2 font-mono text-left text-xs text-[var(--color-text-muted)]">
            {error.message}
          </p>
        ) : null}
        {error.digest ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Ref: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="stratos-btn stratos-btn--primary">
            重试
          </button>
          <Link href="/" className="stratos-btn">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
