import React from "react";

/**
 * 统一空状态 — 基于 globals.css 的 .stratos-empty（虚线卡片）。
 *
 * 用法：
 *   <EmptyState title="暂无交易" hint="点击右上角「新建交易」开始" />
 *   <EmptyState title="暂无数据" action={<button …>去导入</button>} />
 */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className = "",
}: {
  /** 可选顶部图标 / emoji */
  icon?: React.ReactNode;
  title: string;
  /** 次级引导文案 */
  hint?: string;
  /** 可选行动按钮 */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"stratos-empty " + className}>
      {icon && <div className="mb-2 text-2xl opacity-60">{icon}</div>}
      <div className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</div>
      {hint && <div className="mt-1 text-caption">{hint}</div>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
