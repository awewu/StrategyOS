import { brand } from "@/lib/brand/tokens";

/** Compact vertical lockup for the dark sidebar rail — Rhautt. + 瑞合瑞德 */
export function RhauttSidebarLogo() {
  return (
    <>
      <span className="stratos-sidebar__rhautt" aria-hidden>
        {brand.rhautt.wordmark}
      </span>
      <span className="stratos-sidebar__rhautt-accent" aria-hidden />
      <span className="stratos-sidebar__group">{brand.sidebarLabelZh}</span>
    </>
  );
}
