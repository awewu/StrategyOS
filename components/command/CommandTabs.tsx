import { StratosTabNav } from "@/components/ui/StratosTabNav";

/** 指挥舱「总览」页内视图切换：总览 / A3 全景。
 *  兄弟页（议题 / 罗盘）由侧栏（桌面）与 HubSubNav（移动端）承担，不在此重复。 */
export function CommandTabs({ active }: { active: "overview" | "a3" }) {
  return (
    <StratosTabNav
      tabs={[
        { href: "/command", label: "总览", active: active === "overview" },
        { href: "/command?tab=a3", label: "董事会 A3 全景", active: active === "a3" },
      ]}
    />
  );
}
