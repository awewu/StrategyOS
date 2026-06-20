"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/context/role-context";
import { ROLES, type RoleKey } from "@/lib/constants";

const BASE_LINKS = [
  { href: "/command", label: "指挥舱" },
  { href: "/strategy", label: "看战略" },
  { href: "/execution", label: "看执行" },
  { href: "/health", label: "看健康" },
  { href: "/decode", label: "StratDecode · Hoshin" },
  { href: "/decode?tab=stratsim", label: "StratSim · 反馈环推演" },
  { href: "/api/print/panorama?lang=zh", label: "下载中文董事会 PDF" },
  { href: "/finance", label: "FPA 财务" },
  { href: "/finance?tab=capital", label: "FPA 资本 Tab" },
  { href: "/finance?tab=forecast", label: "FPA 5 年展望" },
  { href: "/finance?tab=scenarios", label: "SPBP 情景" },
  { href: "/finance?tab=ma", label: "M&A 管道" },
  { href: "/rehearsal", label: "Q3 战略会彩排" },
  { href: "/api/print/panorama", label: "下载董事会 PDF" },
  { href: "/versions", label: "版本库 · 反事实" },
  { href: "/reports", label: "报告中心" },
  { href: "/gates", label: "Gate 清单" },
  { href: "/print/panorama", label: "董事会一页纸" },
  { href: "/brand", label: "Brand Gallery" },
];

export function CommandPalette({ showAccess = false }: { showAccess?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { role } = useRole();

  const links = [
    ...BASE_LINKS,
    ...(showAccess || role === "ceo" || role === "staff"
      ? [{ href: "/admin/access", label: "访问管理 · 审计日志" }]
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
    l.label.toLowerCase().includes(q.toLowerCase())
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
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
