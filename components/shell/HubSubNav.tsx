"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getHubForPathname, matchesNavRoute, type NavHub } from "@/lib/nav/hubs";

function HubTabs({ hub }: { hub: NavHub }) {
  const pathname = usePathname();

  return (
    <nav className="stratos-hub-subnav print:hidden" aria-label={`${hub.label} 子页面`}>
      <p className="stratos-hub-subnav__eyebrow">{hub.label}</p>
      <ul className="stratos-hub-subnav__list">
        {hub.children.map((item) => {
          const active = matchesNavRoute(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`stratos-hub-subnav__tab ${active ? "stratos-hub-subnav__tab--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function HubSubNav() {
  const pathname = usePathname();
  const hub = getHubForPathname(pathname);
  if (!hub) return null;
  return <HubTabs hub={hub} />;
}
