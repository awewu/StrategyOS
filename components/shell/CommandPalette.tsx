"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdmin, filterNavHref } from "@/lib/auth/permissions";
import { useRole } from "@/lib/context/role-context";
import { flattenNavLinks, PALETTE_GROUPS, type PaletteGroup } from "@/lib/nav/hubs";

const EXTRA_LINKS: { href: string; label: string; group: PaletteGroup; adminOnly?: boolean }[] = [
  { href: "/admin/org", label: "组织架构管理", group: "管理", adminOnly: true },
  { href: "/finance?tab=capital", label: "FPA · 资本", group: "财务" },
  { href: "/finance?tab=forecast", label: "FPA · 5 年展望", group: "财务" },
  { href: "/finance?tab=scenarios", label: "SPBP 情景", group: "财务" },
  { href: "/ma", label: "并购 · 资本交易", group: "财务" },
  { href: "/api/print/panorama?lang=zh", label: "下载中文董事会 PDF", group: "工具" },
  { href: "/api/print/panorama", label: "下载董事会 PDF", group: "工具" },
  { href: "/command", label: "指挥舱 · 态势板", group: "指挥" },
  { href: "/council?tab=rehearsal", label: "Q3 彩排", group: "工具" },
  { href: "/print/panorama", label: "董事会 A3 全景 · 打印视图", group: "指挥" },
  { href: "/brand", label: "Brand Gallery", group: "工具" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { role } = useRole();

  const links = [
    ...flattenNavLinks().filter((l) => filterNavHref(role, l.href)),
    ...EXTRA_LINKS.filter((l) => !("adminOnly" in l && l.adminOnly) || isAdmin(role)).filter((l) =>
      filterNavHref(role, l.href),
    ),
    ...(isAdmin(role)
      ? [{ href: "/admin/access", label: "访问管理", group: "管理" as PaletteGroup }]
      : []),
  ];

  const groupOrder = (g: PaletteGroup) => {
    const i = PALETTE_GROUPS.indexOf(g);
    return i === -1 ? PALETTE_GROUPS.length : i;
  };

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

  const filtered = links
    .filter((l) => l.label.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => groupOrder(a.group) - groupOrder(b.group) || a.label.localeCompare(b.label, "zh"));

  const grouped = filtered.reduce<Map<PaletteGroup, typeof filtered>>((acc, link) => {
    const bucket = acc.get(link.group) ?? [];
    bucket.push(link);
    acc.set(link.group, bucket);
    return acc;
  }, new Map());

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="跳转模块… ⌘K"
          className="w-full border-b border-[var(--surface-border)] bg-transparent px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-72 overflow-y-auto py-2">
          {PALETTE_GROUPS.filter((g) => grouped.has(g)).map((group) => (
            <li key={group}>
              <p className="px-4 pb-1 pt-2 text-[var(--type-label)] font-semibold tracking-[0.12em] text-[var(--color-accent)]">
                {group}
              </p>
              <ul>
                {grouped.get(group)!.map((l) => (
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
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
