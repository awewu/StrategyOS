import { StratosTabNav } from "@/components/ui/StratosTabNav";

/** 战略总览模块内分区：看战略 / 一页纸 / 5 年展望（URL 驱动，单层导航） */
export function StrategyTabs({ active }: { active: "view" | "onepager" | "outlook" }) {
  return (
    <StratosTabNav
      tabs={[
        { href: "/strategy", label: "看战略 · 三栈", active: active === "view" },
        { href: "/strategy?tab=onepager", label: "战略一页纸", active: active === "onepager" },
        { href: "/strategy/outlook", label: "战略展望（3–5 年）", active: active === "outlook" },
      ]}
    />
  );
}
