"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionPayload } from "@/lib/auth/config";
import { brand } from "@/lib/brand/tokens";
import { RoleSwitcher } from "@/components/shell/RoleSwitcher";
import { useRole, roleLabel } from "@/lib/context/role-context";

const NAV_PRIMARY = [
  { href: "/command",   label: "指挥舱",   abbr: "舱" },
  { href: "/strategy",  label: "看战略",   abbr: "战" },
  { href: "/strategy/input", label: "录战略", abbr: "录" },
  { href: "/execution", label: "看执行",   abbr: "执" },
  { href: "/health",    label: "看健康",   abbr: "健" },
  { href: "/market",    label: "市场洞察", abbr: "市" },
  { href: "/finance",   label: "FPA",      abbr: "财" },
  { href: "/versions",  label: "版本库",   abbr: "版" },
  { href: "/reports",   label: "报告",     abbr: "报" },
] as const;

const NAV_SECONDARY = [
  { href: "/decode",    label: "解码",     abbr: "码" },
  { href: "/rehearsal", label: "彩排",     abbr: "排" },
  { href: "/gates",     label: "Gate",    abbr: "G"  },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href ||
    (href !== "/command" && pathname.startsWith(href));
}

export function AppNav({ session }: { session?: SessionPayload | null }) {
  const pathname = usePathname();
  const { role } = useRole();
  const showAccess = role === "ceo" || role === "staff";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-14 flex-col border-r border-[var(--surface-border)] bg-[var(--color-bg-surface)]">
      {/* Logo */}
      <Link href="/command" className="flex h-14 items-center justify-center border-b border-[var(--surface-border)] shrink-0" title={brand.name}>
        <Image src="/logo-mark.svg" alt={brand.name} width={28} height={28} priority />
      </Link>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-3 px-1.5">
        {NAV_PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                active
                  ? "bg-[var(--color-accent-gold-dim)] text-[var(--color-accent-gold)]"
                  : "text-[var(--color-text-muted)] hover:bg-black/[0.05] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {item.abbr}
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded bg-[var(--surface-elevated)] px-2 py-1 text-[11px] text-[var(--color-text-primary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--color-accent-gold)]" />
              )}
            </Link>
          );
        })}

        <div className="my-2 h-px bg-[var(--surface-border)]" />

        {NAV_SECONDARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                active
                  ? "bg-black/[0.06] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-black/[0.05] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {item.abbr}
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded bg-[var(--surface-elevated)] px-2 py-1 text-[11px] text-[var(--color-text-primary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}

        {showAccess && (
          <Link
            href="/admin/access"
            title="访问管理"
            className={`group relative flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
              pathname.startsWith("/admin/access")
                ? "bg-black/[0.06] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-black/[0.05] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            访
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded bg-[var(--surface-elevated)] px-2 py-1 text-[11px] text-[var(--color-text-primary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              访问管理
            </span>
          </Link>
        )}
      </nav>

      {/* Bottom: role + cmd */}
      <div className="flex flex-col items-center gap-1.5 border-t border-[var(--surface-border)] py-3 px-1.5">
        <RoleSwitcher compact />
        <kbd
          title="⌘K 命令面板"
          className="flex h-9 w-9 cursor-default items-center justify-center rounded-md text-[10px] text-[var(--color-text-muted)] hover:bg-black/[0.05]"
        >
          ⌘K
        </kbd>
      </div>
    </aside>
  );
}
