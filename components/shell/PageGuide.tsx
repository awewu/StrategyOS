"use client";

/**
 * On-page「本板块工作原理与流程」explainer. Data-driven from lib/nav/page-guides.ts,
 * auto-rendered by DashboardShell keyed on the current route — no per-page edits.
 * Collapsed by default (native <details>) so it helps newcomers without crowding
 * power users. VI: reuses existing surface tokens, no new colors.
 */
import { usePathname } from "next/navigation";
import { getPageGuide } from "@/lib/nav/page-guides";
import { roleToLevel } from "@/lib/auth/permissions";
import { useRole } from "@/lib/context/role-context";

export function PageGuide() {
  const pathname = usePathname();
  const { role } = useRole();
  const guide = getPageGuide(pathname);
  if (!guide) return null;

  // Read-only roles (observer / board, level 0) can't perform the steps —
  // label the flow as reference so they aren't misled.
  const readOnly = roleToLevel(role) === 0;

  return (
    <details className="stratos-page-guide print:hidden">
      <summary className="stratos-page-guide__summary">
        <span className="stratos-page-guide__badge" aria-hidden>
          i
        </span>
        <span className="stratos-page-guide__summary-text">本板块工作原理与流程</span>
        <span className="stratos-page-guide__purpose">{guide.purpose}</span>
        <span className="stratos-page-guide__chevron" aria-hidden>
          ›
        </span>
      </summary>
      <div className="stratos-page-guide__body">
        <div className="stratos-page-guide__block">
          <p className="stratos-page-guide__label">工作原理</p>
          <p className="stratos-page-guide__text">{guide.principle}</p>
        </div>
        <div className="stratos-page-guide__block">
          <p className="stratos-page-guide__label">
            操作流程{readOnly ? "（你的角色为只读，以下供参考）" : ""}
          </p>
          <ol className="stratos-page-guide__steps">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="stratos-page-guide__block">
          <p className="stratos-page-guide__label">谁来用</p>
          <p className="stratos-page-guide__text">{guide.roles}</p>
          {guide.io ? (
            <>
              <p className="stratos-page-guide__label stratos-page-guide__label--spaced">输入 · 输出</p>
              <p className="stratos-page-guide__text">{guide.io}</p>
            </>
          ) : null}
        </div>
      </div>
    </details>
  );
}
