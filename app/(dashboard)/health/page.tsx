import { redirect } from "next/navigation";

/** Legacy URL — 保留书签与外链，跳转到集团健康 */
export default function HealthLegacyPage() {
  redirect("/monitor/health");
}
