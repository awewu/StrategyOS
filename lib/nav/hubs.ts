/**
 * StratOS navigation hubs — single source of truth for AppNav + HubSubNav + ⌘K.
 */

import type { NavIconId } from "@/components/shell/NavIcons";

export type NavChild = { href: string; label: string };

export type NavHub = {
  id: string;
  label: string;
  shortLabel: string;
  icon: NavIconId;
  defaultHref: string;
  children: NavChild[];
};

export type NavStandalone = {
  id: string;
  label: string;
  shortLabel: string;
  icon: NavIconId;
  href: string;
};

export const NAV_HUBS: NavHub[] = [
  {
    id: "posture",
    label: "战略态势",
    shortLabel: "态势",
    icon: "posture",
    defaultHref: "/command",
    children: [
      { href: "/command", label: "总览 · 指挥舱" },
      { href: "/inbox", label: "议题 Inbox" },
      { href: "/compass", label: "战略罗盘" },
      { href: "/strategy", label: "一页纸" },
      { href: "/outlook", label: "战略展望" },
      { href: "/board", label: "董事会包" },
    ],
  },
  {
    id: "formulate",
    label: "战略制定",
    shortLabel: "制定",
    icon: "formulate",
    defaultHref: "/strategy/input",
    children: [
      { href: "/strategy/input", label: "编制战略" },
      { href: "/versions", label: "历史版本 · 对照" },
      { href: "/mandates", label: "战略职责" },
    ],
  },
  {
    id: "portfolio",
    label: "增长与投资组合",
    shortLabel: "增长",
    icon: "portfolio",
    defaultHref: "/innovation",
    children: [
      { href: "/innovation", label: "创新底座 · 内生（build）" },
      { href: "/ma", label: "并购 · 外延（buy）" },
    ],
  },
  {
    id: "operate",
    label: "运行监测",
    shortLabel: "监测",
    icon: "operate",
    defaultHref: "/monitor/bu",
    children: [
      { href: "/cockpit", label: "坚守驾驶舱" },
      { href: "/monitor/functions", label: "职能体系" },
      { href: "/monitor/bu", label: "事业部" },
      { href: "/monitor/health", label: "集团健康" },
      { href: "/execution", label: "执行 · 全览" },
      { href: "/reports", label: "报告中心 · OPS" },
    ],
  },
  {
    id: "tools",
    label: "工具",
    shortLabel: "工具",
    icon: "tools",
    defaultHref: "/council",
    children: [
      { href: "/council", label: "战略会（彩排 · 准入 · 会议）" },
      { href: "/tools/import", label: "数据导入" },
    ],
  },
];

export const NAV_STANDALONE: NavStandalone[] = [
  {
    id: "decode",
    label: "战略解码",
    shortLabel: "解码",
    icon: "decode",
    href: "/decode",
  },
  {
    id: "finance",
    label: "FPA",
    shortLabel: "FPA",
    icon: "finance",
    href: "/finance",
  },
  {
    id: "market",
    label: "市场洞察",
    shortLabel: "市场",
    icon: "market",
    href: "/market",
  },
  {
    id: "culture",
    label: "企业文化",
    shortLabel: "文化",
    icon: "culture",
    href: "/culture",
  },
];

/** 侧栏底部：监测 → 工具 */
export const NAV_MONITOR_HUB = NAV_HUBS.find((h) => h.id === "operate")!;
export const NAV_TOOLS_HUB = NAV_HUBS.find((h) => h.id === "tools")!;

export const NAV_PRIMARY_HUBS = NAV_HUBS.filter(
  (h) => h.id !== "operate" && h.id !== "tools",
);

export const NAV_ACCESS = {
  id: "access",
  href: "/admin/access",
  label: "访问管理",
  shortLabel: "访问",
  icon: "access" as NavIconId,
};

/** Exact match for one-pager; exclude /strategy/input. */
export function matchesNavRoute(pathname: string, href: string): boolean {
  const pathOnly = href.split("?")[0]!;
  if (pathOnly === "/strategy") return pathname === "/strategy";
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export function hubContainsPath(hub: NavHub, pathname: string): boolean {
  if (hub.id === "operate") {
    if (pathname.startsWith("/monitor/")) return true;
    if (pathname === "/execution" || pathname.startsWith("/execution/")) return true;
  }
  if (hub.id === "tools") {
    if (pathname === "/rehearsal" || pathname === "/gates" || pathname.startsWith("/tools/meeting")) return true;
  }
  if (hub.id === "posture" && matchesNavRoute(pathname, "/outlook")) return true;
  if (hub.id === "posture" && matchesNavRoute(pathname, "/inbox")) return true;
  return hub.children.some((c) => matchesNavRoute(pathname, c.href));
}

export function getHubForPathname(pathname: string): NavHub | null {
  return NAV_HUBS.find((h) => hubContainsPath(h, pathname)) ?? null;
}

export function isStandaloneActive(pathname: string, href: string): boolean {
  return matchesNavRoute(pathname, href);
}

/** ⌘K palette section order — aligned with UI_VI §4.7 hub grouping */
export const PALETTE_GROUPS = ["指挥", "战略", "执行", "财务", "工具", "管理"] as const;
export type PaletteGroup = (typeof PALETTE_GROUPS)[number];

const HUB_PALETTE_GROUP: Record<string, PaletteGroup> = {
  posture: "指挥",
  formulate: "战略",
  portfolio: "战略",
  operate: "执行",
  tools: "工具",
};

function paletteGroupForStandalone(id: string): PaletteGroup {
  if (id === "finance") return "财务";
  if (id === "decode") return "战略";
  return "战略";
}

export function flattenNavLinks(): { href: string; label: string; group: PaletteGroup }[] {
  const out: { href: string; label: string; group: PaletteGroup }[] = [];
  for (const hub of NAV_HUBS) {
    const group = HUB_PALETTE_GROUP[hub.id] ?? "工具";
    for (const c of hub.children) {
      out.push({ href: c.href, label: `${hub.label} · ${c.label}`, group });
    }
  }
  for (const s of NAV_STANDALONE) {
    out.push({ href: s.href, label: s.label, group: paletteGroupForStandalone(s.id) });
  }
  out.push(
    { href: "/council?tab=rehearsal", label: "战略会 · 彩排", group: "工具" },
    { href: "/council?tab=gates", label: "战略会 · 准入 Gate", group: "工具" },
    { href: "/council?tab=meeting", label: "战略会 · 会议工具", group: "工具" },
    { href: "/decode?tab=hoshin", label: "战略解码 · X-Matrix", group: "战略" },
    { href: "/finance?tab=forecast", label: "FPA · 5 年展望", group: "财务" },
    { href: "/finance/ledger", label: "FPA · 总账中台", group: "财务" },
  );
  return out;
}
