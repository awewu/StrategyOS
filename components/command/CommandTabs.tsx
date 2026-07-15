import { StratosTabNav } from "@/components/ui/StratosTabNav";

/** 指挥舱模块内分区：总览 / 议题 / 罗盘 / A3 全景 */
export function CommandTabs({ active }: { active: "overview" | "issues" | "compass" | "a3" }) {
  return (
    <StratosTabNav
      tabs={[
        { href: "/command", label: "总览", active: active === "overview" },
        { href: "/command/issues", label: "议题", active: active === "issues" },
        { href: "/command/compass", label: "战略罗盘", active: active === "compass" },
        { href: "/command?tab=a3", label: "董事会 A3 全景", active: active === "a3" },
      ]}
    />
  );
}
