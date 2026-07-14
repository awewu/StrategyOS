"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { brand } from "@/lib/brand/tokens";

const DEMO_USERS = [
  { email: "ceo@rheem.cn", name: "铁山", role: "CEO" },
  { email: "vp@rheem.cn", name: "毕韬", role: "VP" },
  { email: "pm@rheem.cn", name: "张健", role: "PM" },
  { email: "staff@rheem.cn", name: "战略组", role: "Staff" },
];

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: "SSO 状态校验失败，请重试。",
  missing_code: "SSO 未返回授权码。",
  workos_exchange_failed: "SSO 登录交换失败，请检查 WorkOS 配置。",
  tandem_exchange_failed: "Tandem SSO 登录交换失败，请稍后重试或联系管理员。",
  demo_disabled: "演示登录已禁用，请使用企业 SSO。",
};

export function LoginForm({
  workosReady,
  tandemReady,
  demoLoginAllowed,
  requireAuth,
}: {
  workosReady: boolean;
  tandemReady: boolean;
  demoLoginAllowed: boolean;
  requireAuth: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorParam = searchParams.get("error");

  const next = searchParams.get("next") ?? "/command";
  const displayError =
    error ??
    (errorParam ? (ERROR_MESSAGES[errorParam] ?? `登录失败：${errorParam}`) : null);

  async function signIn(email: string) {
    setLoading(email);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setLoading(null);
      if (res.status === 403) {
        setError(ERROR_MESSAGES.demo_disabled);
      } else {
        setError("登录失败，请重试。");
      }
      return;
    }
    router.push(next);
    router.refresh();
  }

  const showDemo = demoLoginAllowed;
  const showWorkos = workosReady;
  const needsWorkosConfig = requireAuth && !workosReady;

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center">
        <Image src="/logo-mark.svg" alt="" width={56} height={56} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold text-[var(--color-accent)]">
          {brand.name}
        </h1>
        <p className="text-sm text-[var(--color-accent)]">{brand.taglineZh}</p>
        <p className="text-xs italic text-[var(--color-text-muted)]">{brand.taglineEn}</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">战略网络登录 · 30 人核心层</p>
      </div>

      {displayError && (
        <p className="rounded bg-[color-mix(in_srgb,var(--signal-red)_10%,transparent)] px-3 py-2 text-center text-sm text-[var(--signal-red)]">
          {displayError}
        </p>
      )}

      {needsWorkosConfig && (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--signal-red)_30%,transparent)] bg-[color-mix(in_srgb,var(--signal-red)_5%,transparent)] px-4 py-3 text-sm text-[var(--signal-red)]">
          <p className="font-medium">需要配置 WorkOS</p>
          <p className="mt-1 text-xs">
            已启用 <code>STRATOS_REQUIRE_AUTH=1</code>，但未检测到 WorkOS 密钥。生产环境请配置{" "}
            <code>WORKOS_CLIENT_ID</code> 与 <code>WORKOS_API_KEY</code>，或运行{" "}
            <code>npm run workos:check</code> 查看清单。
          </p>
        </div>
      )}

      {tandemReady && (
        <a
          href={`/api/auth/tandem?next=${encodeURIComponent(next)}`}
          className="flex w-full items-center justify-center rounded-lg border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 py-3 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
        >
          企业 SSO · Tandem
        </a>
      )}

      {showWorkos && (
        <a
          href={`/api/auth/workos?next=${encodeURIComponent(next)}`}
          className="flex w-full items-center justify-center rounded-lg border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 py-3 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
        >
          Enterprise SSO · WorkOS
        </a>
      )}

      {showDemo && (
        <div className="space-y-2">
          <p className="text-caption">演示账号（开发 / 无 SSO 时）</p>
          {DEMO_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              disabled={loading !== null}
              onClick={() => signIn(u.email)}
              className="flex w-full items-center justify-between rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-left text-sm hover:border-[var(--color-accent)]/40 disabled:opacity-50"
            >
              <span>
                {u.name}
                <span className="ml-2 text-[var(--color-text-muted)]">{u.email}</span>
              </span>
              <span className="text-xs text-[var(--color-accent)]">{u.role}</span>
            </button>
          ))}
        </div>
      )}

      {!showDemo && (showWorkos || tandemReady) && (
        <p className="text-center text-caption">
          演示登录已关闭 — 请使用上方企业 SSO 登录。
        </p>
      )}

      <div className="rounded-lg border border-[var(--surface-border)] p-4 text-caption">
        <p className="font-medium text-[var(--color-text-primary)]">Enterprise SSO</p>
        {workosReady ? (
          <p className="mt-1">WorkOS 已配置 — AuthKit SSO 可用。</p>
        ) : (
          <p className="mt-1">
            在 <code>.env</code> 中配置 <code>WORKOS_CLIENT_ID</code> +{" "}
            <code>WORKOS_API_KEY</code> 后启用 AuthKit。详见{" "}
            <code>docs/SETUP.md</code>。
          </p>
        )}
        <p className="mt-2">
          强制登录：<code className="text-[var(--color-accent)]">STRATOS_REQUIRE_AUTH=1</code>
          {requireAuth && (
            <span className="ml-1 text-[var(--color-accent)]">（已启用）</span>
          )}
        </p>
      </div>
    </div>
  );
}
