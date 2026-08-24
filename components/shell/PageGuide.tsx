"use client";

/**
 * On-page「本板块工作原理与流程」explainer. Data-driven from lib/nav/page-guides.ts,
 * auto-rendered by DashboardShell keyed on the current route — no per-page edits.
 * Collapsed by default (native <details>) so it helps newcomers without crowding
 * power users. VI: reuses existing surface tokens, no new colors.
 */
import { usePathname } from "next/navigation";
import { getPageGuide } from "@/lib/nav/page-guides";
import { pageAccessPosture, type PageAccessPosture } from "@/lib/auth/permissions";
import { useRole } from "@/lib/context/role-context";

/** Posture → how to frame the「操作流程」for this viewer on this page. */
const STEPS_SUFFIX: Record<PageAccessPosture, string> = {
  none: "（超出你当前权限，以下供参考）",
  readonly: "（你的角色为只读，以下供参考）",
  scoped: "（你可操作，数据范围限于你负责的单元/项目）",
  company: "",
};

/** Posture → a one-line note on the viewer's data scope. */
const SCOPE_NOTE: Record<PageAccessPosture, string> = {
  none: "你当前无法在此板块执行操作。",
  readonly: "你以只读视角查看，不参与本板块的操作。",
  scoped: "你看到的是本单元/本项目范围的数据，非全集团口径。",
  company: "你以全集团口径查看与操作本板块。",
};

export function PageGuide() {
  const pathname = usePathname();
  const { role } = useRole();
  const guide = getPageGuide(pathname);
  if (!guide) return null;

  // Tailor the explainer to the viewer's actual posture on this page
  // (none / readonly / own-scope / full-company), not just a binary read-only.
  const posture = pageAccessPosture(role, pathname);

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
          <p className="stratos-page-guide__label">操作流程{STEPS_SUFFIX[posture]}</p>
          <ol className="stratos-page-guide__steps">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="stratos-page-guide__block">
          <p className="stratos-page-guide__label">谁来用</p>
          <p className="stratos-page-guide__text">{guide.roles}</p>
          <p className="stratos-page-guide__text stratos-page-guide__scope">{SCOPE_NOTE[posture]}</p>
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
