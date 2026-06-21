"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/auth/permissions";
import { useRole } from "@/lib/context/role-context";
import { flattenNavLinks } from "@/lib/nav/hubs";

const EXTRA_LINKS = [
  { href: "/admin/org", label: "组织架构管理", group: "管理", minLevel: 4 as const, adminOnly: true },
  { href: "/decode?tab=stratsim", label: "战略解码 · 反馈环", group: "战略解码" },
  { href: "/finance?tab=capital", label: "FPA · 资本", group: "FPA" },
  { href: "/finance?tab=forecast", label: "FPA · 5 年展望", group: "FPA" },
  { href: "/finance?tab=scenarios", label: "SPBP 情景", group: "FPA" },
  { href: "/finance?tab=ma", label: "M&A 管道", group: "FPA" },
  { href: "/api/print/panorama?lang=zh", label: "下载中文董事会 PDF", group: "工具" },
  { href: "/api/print/panorama", label: "下载董事会 PDF", group: "工具" },
  { href: "/print/panorama", label: "董事会一页纸", group: "工具" },
  { href: "/brand", label: "Brand Gallery", group: "工具" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { role } = useRole();

  const links = [
    ...flattenNavLinks(),
    ...EXTRA_LINKS.filter((l) => !("adminOnly" in l && l.adminOnly) || isAdmin(role)),
    ...(isAdmin(role)
      ? [{ href: "/admin/access", label: "访问管理", group: "管理" }]
      : []),
  ];

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  if (!open) return null;

  const filtered = links.filter((l) =>
    l.label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-black/10 bg-[var(--color-bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="跳转模块… ⌘K"
          className="w-full border-b border-black/10 bg-transparent px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-64 overflow-y-auto py-2">
          {filtered.map((l) => (
            <li key={l.href}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-black/[0.04]"
                onClick={() => {
                  router.push(l.href);
                  setOpen(false);
                  setQ("");
                }}
              >
                <span className="block text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {l.group}
                </span>
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
