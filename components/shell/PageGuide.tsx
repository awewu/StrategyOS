"use client";

/**
 * On-page「本板块工作原理与流程」explainer. Data-driven from lib/nav/page-guides.ts,
 * auto-rendered by DashboardShell keyed on the current route — no per-page edits.
 * Collapsed by default (native <details>) so it helps newcomers without crowding
 * power users. VI: reuses existing surface tokens, no new colors.
 */
import { usePathname } from "next/navigation";
import { getPageGuide } from "@/lib/nav/page-guides";

export function PageGuide() {
  const pathname = usePathname();
  const guide = getPageGuide(pathname);
  if (!guide) return null;

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
          <p className="stratos-page-guide__label">操作流程</p>
          <ol className="stratos-page-guide__steps">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        {guide.handoff ? (
          <div className="stratos-page-guide__block">
            <p className="stratos-page-guide__label">上下游衔接</p>
            <p className="stratos-page-guide__text">{guide.handoff}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}
