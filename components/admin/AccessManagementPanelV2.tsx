"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth/config";
import { ACTION_LABELS, type UsageLogRecord } from "@/lib/audit/types";
import type { ChainVerification } from "@/lib/audit/verify-chain";
import type { AccessUser } from "@/lib/data/access-data";
import { PROJECT_CODES, ROLES, type RoleKey } from "@/lib/constants";
import { roleLabel } from "@/lib/context/role-context";
import type { PermissionConfig } from "@/lib/auth/permission-config";
import { Select } from "@/components/ui/primitives";

type OrgUnitOption = { id: string; name: string; level: string };
type UserDraft = { role: RoleKey; orgScopeIds: string[]; projectCode: string };
type AccessTab = "users" | "audit";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function orgScopeSummary(ids: string[], orgUnits: OrgUnitOption[]): string {
  if (ids.length === 0) return "全公司/不限制";
  const names = ids
    .map((id) => orgUnits.find((unit) => unit.id === id)?.name ?? id)
    .filter(Boolean);
  if (names.length <= 2) return names.join("、");
  return `已选 ${names.length} 个组织`;
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = pageCount(total, pageSize);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-caption">
      <span>
        {start}-{end} / {total}
      </span>
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-1">
          每页
          <Select
            selectSize="sm"
            className="text-xs"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          条
        </label>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded border border-[var(--surface-border)] px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          上一页
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-[var(--surface-border)] px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

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

const SOURCE_LABELS: Record<ChainVerification["source"], string> = {
  database: "数据库",
  memory: "内存",
  empty: "空",
};

function IntegrityBadge({ integrity }: { integrity: ChainVerification }) {
  const ok = integrity.ok;
  const color = ok ? "var(--signal-green-text)" : "var(--signal-red-text)";
  const label = ok
    ? `链完整 · 已校验 ${integrity.checked} 条（${SOURCE_LABELS[integrity.source]}）`
    : `链异常 · 第 ${(integrity.break?.index ?? 0) + 1} 条 ${integrity.break?.reason ?? ""}`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
      }}
      title={ok ? "SHA-256 哈希链校验通过" : "哈希链校验失败"}
    >
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: color }} />
      {label}
    </span>
  );
}

export function AccessManagementPanelV2({
  users,
  logs,
  integrity,
  session,
  effectiveRole,
  permissionConfig,
  orgUnits,
}: {
  users: AccessUser[];
  logs: UsageLogRecord[];
  integrity: ChainVerification;
  session: SessionPayload | null;
  effectiveRole: RoleKey;
  permissionConfig: PermissionConfig;
  orgUnits: OrgUnitOption[];
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [openMode, setOpenMode] = useState(permissionConfig.openMode);
  const [savingOpenMode, setSavingOpenMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AccessTab>("users");
  const [usersPage, setUsersPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [auditPageSize, setAuditPageSize] = useState(DEFAULT_PAGE_SIZE);
  const pagedUsers = pageSlice(users, usersPage, usersPageSize);
  const pagedLogs = pageSlice(logs, auditPage, auditPageSize);

  async function handleOpenModeToggle(next: boolean) {
    setSavingOpenMode(true);
    const r = await fetch("/api/admin/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openMode: next }),
    });
    if (r.ok) {
      setOpenMode(next);
      router.refresh();
    }
    setSavingOpenMode(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function startEdit(user: AccessUser) {
    setError(null);
    setEditingUserId(user.id);
    setDraft({
      role: user.role,
      orgScopeIds: user.orgScopeIds?.length ? user.orgScopeIds : user.orgUnitId ? [user.orgUnitId] : [],
      projectCode: user.projectCode ?? "",
    });
  }

  async function saveUser(user: AccessUser) {
    if (!draft) return;
    setSavingUserId(user.id);
    setError(null);
    const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: draft.role,
        orgScopeIds: draft.orgScopeIds,
        projectCode: draft.projectCode || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "保存失败");
      setSavingUserId(null);
      return;
    }
    setEditingUserId(null);
    setDraft(null);
    setSavingUserId(null);
    router.refresh();
  }

  return (
    <div className="stratos-section-gap flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="stratos-section-title">访问管理</h1>
          <p className="stratos-section-desc mt-1">登录账号 · 权限分配 · 当前会话 · 使用审计日志（最近 50 条）</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/org"
            className="rounded border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.04]"
          >
            组织维护
          </a>
          {session && (
            <button type="button" disabled={loggingOut} onClick={handleLogout} className="rounded border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.04] disabled:opacity-50">
              {loggingOut ? "登出中..." : "登出当前会话"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)]">
        {[
          { id: "users" as const, label: `用户列表 (${users.length})` },
          { id: "audit" as const, label: `审计日志 (${logs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-2 text-sm ${
              activeTab === tab.id
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <>
      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium">当前会话</h2>
        {session ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[var(--color-text-muted)]">用户</dt><dd>{session.name}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">邮箱</dt><dd className="font-mono text-xs">{session.email}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">角色</dt><dd>{roleLabel(session.role)}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">导航角色</dt><dd>{roleLabel(effectiveRole)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">未登录 · 演示模式（导航角色：{roleLabel(effectiveRole)}）</p>
        )}
      </section>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">权限开关</h2>
            <p className="mt-1 text-caption">开放模式开启后，路由级别自动降低一档（observer 仍只读），用于 workshop / demo。</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-sm text-[var(--color-text-muted)]">开放模式</span>
            <button type="button" role="switch" aria-checked={openMode} disabled={savingOpenMode} onClick={() => handleOpenModeToggle(!openMode)} className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${openMode ? "bg-[var(--color-accent)]" : "bg-[var(--surface-border-strong)]"}`}>
              <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${openMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">用户列表</h2>
            <p className="mt-1 text-caption">CEO / CFO 可分配用户角色、组织范围和项目范围；已登录用户需重新登录刷新会话。</p>
          </div>
          {error && <p className="text-xs text-[var(--signal-red-text)]">{error}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
                <th className="pb-2 pr-4 font-normal">姓名</th><th className="pb-2 pr-4 font-normal">邮箱</th><th className="pb-2 pr-4 font-normal">角色</th><th className="pb-2 pr-4 font-normal">组织范围</th><th className="pb-2 pr-4 font-normal">项目范围</th><th className="pb-2 pr-4 font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => {
                const isEditing = editingUserId === u.id && draft;
                const isSelf = session?.userId === u.id;
                return (
                  <tr key={u.id} className="border-b border-[var(--surface-border)]">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{u.email}</td>
                    <td className="py-2 pr-4">
                      {isEditing ? (
                        <Select selectSize="sm" className="text-xs" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as RoleKey })}>
                          {Object.entries(ROLES).map(([role, meta]) => <option key={role} value={role}>{meta.label}</option>)}
                        </Select>
                      ) : ROLES[u.role]?.label ?? u.role}
                    </td>
                    <td className="py-2 pr-4">
                      {isEditing ? (
                        <details className="relative">
                          <summary className="min-w-[220px] cursor-pointer list-none rounded border border-[var(--surface-border)] bg-white px-2 py-1 text-xs">
                            {orgScopeSummary(draft.orgScopeIds, orgUnits)}
                          </summary>
                          <div className="absolute z-20 mt-1 grid max-h-56 min-w-[260px] gap-1 overflow-y-auto rounded border border-[var(--surface-border)] bg-white p-2 shadow-lg">
                            <button
                              type="button"
                              className="rounded px-2 py-1 text-left text-caption hover:bg-black/[0.04]"
                              onClick={() => setDraft({ ...draft, orgScopeIds: [] })}
                            >
                              全公司/不限制
                            </button>
                            {orgUnits.map((unit) => (
                              <label key={unit.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-black/[0.04]">
                                <input
                                  type="checkbox"
                                  checked={draft.orgScopeIds.includes(unit.id)}
                                  onChange={() => setDraft({ ...draft, orgScopeIds: toggleId(draft.orgScopeIds, unit.id) })}
                                />
                                <span className="truncate">{unit.name}</span>
                              </label>
                            ))}
                          </div>
                        </details>
                      ) : u.orgScopeNames?.length ? u.orgScopeNames.join("、") : u.orgUnitName ?? u.orgUnitId ?? "全公司/不限制"}
                    </td>
                    <td className="py-2 pr-4">
                      {isEditing ? (
                        <Select selectSize="sm" className="text-xs" value={draft.projectCode} onChange={(e) => setDraft({ ...draft, projectCode: e.target.value })}>
                          <option value="">不限制</option>
                          {PROJECT_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                        </Select>
                      ) : u.projectCode ?? "不限制"}
                    </td>
                    <td className="py-2 pr-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button type="button" disabled={savingUserId === u.id} onClick={() => saveUser(u)} className="rounded bg-[var(--color-accent)] px-2.5 py-1 text-xs text-white disabled:opacity-50">{savingUserId === u.id ? "保存中" : "保存"}</button>
                          <button type="button" disabled={savingUserId === u.id} onClick={() => { setEditingUserId(null); setDraft(null); setError(null); }} className="rounded border border-[var(--surface-border)] px-2.5 py-1 text-xs disabled:opacity-50">取消</button>
                        </div>
                      ) : (
                        <button type="button" disabled={isSelf} onClick={() => startEdit(u)} title={isSelf ? "不能修改当前登录账号" : "编辑权限"} className="rounded border border-[var(--surface-border)] px-2.5 py-1 text-xs hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50">编辑</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={usersPage}
          pageSize={usersPageSize}
          total={users.length}
          onPageChange={setUsersPage}
          onPageSizeChange={(next) => {
            setUsersPageSize(next);
            setUsersPage(1);
          }}
        />
      </section>
        </>
      )}

      {activeTab === "audit" && (
      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">使用审计日志</h2>
          <div className="flex flex-wrap items-center gap-2">
            <IntegrityBadge integrity={integrity} />
            <a href="/api/audit/export?format=csv" className="rounded border border-[var(--surface-border)] px-2.5 py-1 text-xs hover:bg-black/[0.04]">导出 CSV</a>
            <a href="/api/audit/export?format=json" className="rounded border border-[var(--surface-border)] px-2.5 py-1 text-xs hover:bg-black/[0.04]">导出 JSON</a>
          </div>
        </div>
        {logs.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">暂无日志记录</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]"><th className="pb-2 pr-3 font-normal">时间</th><th className="pb-2 pr-3 font-normal">用户</th><th className="pb-2 pr-3 font-normal">操作</th><th className="pb-2 pr-3 font-normal">资源</th><th className="pb-2 pr-3 font-normal">IP</th><th className="pb-2 font-normal">哈希</th></tr></thead>
              <tbody>
                {pagedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--surface-border)]">
                    <td className="py-2 pr-3 whitespace-nowrap font-mono text-xs">{formatTime(log.createdAt)}</td>
                    <td className="py-2 pr-3">{log.userEmail}</td>
                    <td className="py-2 pr-3">{ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] ?? log.action}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={log.resource}>{log.resource}</td>
                    <td className="py-2 pr-3 font-mono text-caption">{log.ip ?? "-"}</td>
                    <td className="py-2 font-mono text-caption" title={log.hash}>{log.hash ? log.hash.slice(0, 10) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={auditPage}
          pageSize={auditPageSize}
          total={logs.length}
          onPageChange={setAuditPage}
          onPageSizeChange={(next) => {
            setAuditPageSize(next);
            setAuditPage(1);
          }}
        />
      </section>
      )}
    </div>
  );
}
