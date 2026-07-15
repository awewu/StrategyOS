import { StratosTabNav } from "@/components/ui/StratosTabNav";

/** 指挥舱模块内分区：总览 / 议题 / 罗盘 */
export function CommandTabs({ active }: { active: "overview" | "issues" | "compass" }) {
  return (
    <StratosTabNav
      tabs={[
        { href: "/command", label: "总览", active: active === "overview" },
        { href: "/command/issues", label: "议题", active: active === "issues" },
        { href: "/command/compass", label: "战略罗盘", active: active === "compass" },
      ]}
    />
  );
}
