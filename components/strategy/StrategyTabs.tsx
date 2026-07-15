import { StratosTabNav } from "@/components/ui/StratosTabNav";

/** 战略总览模块内分区：一页纸 / 5 年展望 */
export function StrategyTabs({ active }: { active: "onepager" | "outlook" }) {
  return (
    <StratosTabNav
      tabs={[
        { href: "/strategy", label: "一页纸 · 三栈", active: active === "onepager" },
        { href: "/strategy/outlook", label: "战略展望（3–5 年）", active: active === "outlook" },
      ]}
    />
  );
}
