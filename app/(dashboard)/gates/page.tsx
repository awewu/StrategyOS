import { redirect } from "next/navigation";

/** 兼容链：战略会准入已并入 /council 战略会 */
export default function GatesRedirect() {
  redirect("/council?tab=gates");
}
