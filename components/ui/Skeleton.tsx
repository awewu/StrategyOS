/**
 * 骨架屏原语 — 基于 globals.css 的 .stratos-skeleton（呼吸式 shimmer，
 * prefers-reduced-motion 下自动降级为静态色块）。
 *
 * Skeleton：单个占位块；SkeletonText：多行文本占位；
 * SkeletonCard：卡片占位；PageSkeleton：路由级 loading.tsx 通用骨架。
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={"stratos-skeleton " + className} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={"space-y-2 " + className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="stratos-skeleton h-3.5"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={
        "rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5 space-y-3 " +
        className
      }
    >
      <div className="stratos-skeleton h-4 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

/** 路由级通用骨架：页头 + KPI 行 + 两栏内容区 */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="加载中" className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="stratos-skeleton h-6 w-48" />
        <div className="stratos-skeleton h-3.5 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
            <div className="stratos-skeleton h-3 w-16" />
            <div className="stratos-skeleton h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
