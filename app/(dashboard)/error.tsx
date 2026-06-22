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
      <div className="surface-elevated w-full max-w-lg rounded-2xl border border-[var(--signal-red)]/25 bg-[var(--signal-red)]/5 px-8 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--signal-red)]">
          页面加载失败
        </p>
        <h1 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
          此模块暂时不可用
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          可能是数据库连接或数据格式异常。请重试；若持续出现，请联系管理员并附上错误摘要。
        </p>
        {error.message && (
          <p className="mt-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-raised)] px-3 py-2 font-mono text-left text-[11px] text-[var(--color-text-muted)]">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">Ref: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--surface-border)] px-5 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-black/[0.03]"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
