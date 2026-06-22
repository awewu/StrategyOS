"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StratOS global]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-full bg-[var(--color-bg-deep)] antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--signal-red)]/25 bg-white px-8 py-10 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--signal-red)]">
              StratOS 异常
            </p>
            <h1 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
              应用遇到未恢复错误
            </h1>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              请刷新页面或返回首页。若问题持续，请检查服务日志与环境配置。
            </p>
            {error.digest && (
              <p className="mt-4 text-[10px] text-[var(--color-text-muted)]">Ref: {error.digest}</p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white"
              >
                重试
              </button>
              <Link
                href="/"
                className="rounded-lg border border-[var(--surface-border)] px-5 py-2 text-sm text-[var(--color-text-secondary)]"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
