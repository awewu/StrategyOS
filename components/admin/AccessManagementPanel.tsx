"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth/config";
import { ACTION_LABELS, type UsageLogRecord } from "@/lib/audit/types";
import type { AccessUser } from "@/lib/data/access-data";
import { ROLES, type RoleKey } from "@/lib/constants";
import { roleLabel } from "@/lib/context/role-context";
import { typography } from "@/lib/brand/typography";

function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AccessManagementPanel({
  users,
  logs,
  session,
  effectiveRole,
}: {
  users: AccessUser[];
  logs: UsageLogRecord[];
  session: SessionPayload | null;
  effectiveRole: RoleKey;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={typography.h1}>访问管理</h1>
          <p className={`${typography.caption} mt-1`}>
            登录账号 · 当前会话 · 使用审计日志（最近 50 条）
          </p>
        </div>
        {session && (
          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="rounded border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.04] disabled:opacity-50"
          >
            {loggingOut ? "登出中…" : "登出当前会话"}
          </button>
        )}
      </div>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium">当前会话</h2>
        {session ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-text-muted)]">用户</dt>
              <dd>{session.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">邮箱</dt>
              <dd className="font-mono text-xs">{session.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">角色</dt>
              <dd>{roleLabel(session.role)}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">导航角色</dt>
              <dd>{roleLabel(effectiveRole)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            未登录 · 演示模式（导航角色：{roleLabel(effectiveRole)}）
          </p>
        )}
      </section>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium">用户列表</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
                <th className="pb-2 pr-4 font-normal">姓名</th>
                <th className="pb-2 pr-4 font-normal">邮箱</th>
                <th className="pb-2 pr-4 font-normal">角色</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--surface-border)]">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{u.email}</td>
                  <td className="py-2 pr-4">{ROLES[u.role]?.label ?? u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium">使用审计日志</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">暂无日志记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
                  <th className="pb-2 pr-3 font-normal">时间</th>
                  <th className="pb-2 pr-3 font-normal">用户</th>
                  <th className="pb-2 pr-3 font-normal">操作</th>
                  <th className="pb-2 pr-3 font-normal">资源</th>
                  <th className="pb-2 font-normal">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--surface-border)]">
                    <td className="py-2 pr-3 whitespace-nowrap font-mono text-xs">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="py-2 pr-3">{log.userEmail}</td>
                    <td className="py-2 pr-3">
                      {ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] ?? log.action}
                    </td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="py-2 font-mono text-xs text-[var(--color-text-muted)]">
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
