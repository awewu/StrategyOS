"use client";

/**
 * Closed-loop orientation bar — shows where the current page sits in the
 * strategy loop（定→解→行→察→断→复）and where to go next. Renders only on
 * lifecycle pages so users always know「我在哪一环、下一步去哪」.
 * @see docs/STRATOS-ROLE-OPERATION-LOOPS.md Part C2/D
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LIFECYCLE, getHubForPathname } from "@/lib/nav/hubs";
import { canAccessHub } from "@/lib/auth/permissions";
import { useRole } from "@/lib/context/role-context";

export function LoopGuide() {
  const pathname = usePathname();
  const { role } = useRole();
  const currentHub = getHubForPathname(pathname);
  if (!currentHub?.stage) return null;

  const stages = NAV_LIFECYCLE.filter((h) => canAccessHub(role, h.id));
  const currentIndex = stages.findIndex((h) => h.id === currentHub.id);
  if (currentIndex < 0) return null;

  const next = stages[(currentIndex + 1) % stages.length];

  return (
    <nav className="stratos-loop-guide print:hidden" aria-label="战略闭环定位">
      <ol className="stratos-loop-guide__track">
        {stages.map((hub, i) => {
          const active = i === currentIndex;
          return (
            <li key={hub.id} className="stratos-loop-guide__node">
              <Link
                href={hub.defaultHref}
                className={`stratos-loop-guide__pill ${active ? "stratos-loop-guide__pill--active" : ""}`}
                aria-current={active ? "step" : undefined}
                title={hub.label}
              >
                <span className="stratos-loop-guide__stage">{hub.stage}</span>
                <span className="stratos-loop-guide__label">{hub.shortLabel}</span>
              </Link>
              {i < stages.length - 1 ? (
                <span className="stratos-loop-guide__arrow" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {next && next.id !== currentHub.id ? (
        <Link href={next.defaultHref} className="stratos-loop-guide__next">
          下一步 · {next.label} →
        </Link>
      ) : null}
    </nav>
  );
}
