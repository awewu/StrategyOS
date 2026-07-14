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
          <div className="stratos-card stratos-card--padded w-full max-w-lg">
            <p className="label-xs text-[var(--signal-red)]">StratOS 异常</p>
            <h1 className="mt-2 text-title text-[var(--color-text-primary)]">应用遇到未恢复错误</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              请刷新页面或返回首页。若问题持续，请检查服务日志与环境配置。
            </p>
            {error.digest ? (
              <p className="mt-3 text-caption">Ref: {error.digest}</p>
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
      </body>
    </html>
  );
}
