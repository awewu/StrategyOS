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

export function LoginForm({ workosReady }: { workosReady: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const errorParam = searchParams.get("error");

  async function signIn(email: string) {
    setLoading(email);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setLoading(null);
      return;
    }
    const next = searchParams.get("next") ?? "/command";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center">
        <Image src="/logo-mark.svg" alt="" width={56} height={56} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold text-[var(--color-accent-gold)]">
          {brand.name}
        </h1>
        <p className="text-sm text-[var(--color-accent-gold)]">{brand.taglineZh}</p>
        <p className="text-xs italic text-[var(--color-text-muted)]">{brand.taglineEn}</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">战略网络登录 · 30 人核心层</p>
      </div>

      {errorParam && (
        <p className="rounded bg-[#8b0e04]/10 px-3 py-2 text-center text-sm text-[#8b0e04]">
          登录失败：{errorParam}
        </p>
      )}

      {workosReady && (
        <a
          href={`/api/auth/workos?next=${encodeURIComponent(searchParams.get("next") ?? "/command")}`}
          className="flex w-full items-center justify-center rounded-lg border border-[var(--color-accent-gold)]/50 bg-[var(--color-accent-gold)]/10 py-3 text-sm font-medium text-[var(--color-accent-gold)]"
        >
          Enterprise SSO · WorkOS
        </a>
      )}

      <div className="space-y-2">
        {DEMO_USERS.map((u) => (
          <button
            key={u.email}
            type="button"
            disabled={loading !== null}
            onClick={() => signIn(u.email)}
            className="flex w-full items-center justify-between rounded-lg border border-black/10 bg-[var(--color-bg-surface)] px-4 py-3 text-left text-sm hover:border-[var(--color-accent-gold)]/40 disabled:opacity-50"
          >
            <span>
              {u.name}
              <span className="ml-2 text-[var(--color-text-muted)]">{u.email}</span>
            </span>
            <span className="text-xs text-[var(--color-accent-gold)]">{u.role}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-black/10 p-4 text-xs text-[var(--color-text-muted)]">
        <p className="font-medium text-[var(--color-text-primary)]">Enterprise SSO</p>
        {workosReady ? (
          <p className="mt-1">WorkOS 已配置 — 使用上方 SSO 或演示账号。</p>
        ) : (
          <p className="mt-1">
            配置 WORKOS_CLIENT_ID + WORKOS_API_KEY 后启用 AuthKit。
          </p>
        )}
        <p className="mt-2">
          强制登录：<code className="text-[var(--color-accent-gold)]">STRATOS_REQUIRE_AUTH=1</code>
        </p>
      </div>
    </div>
  );
}
