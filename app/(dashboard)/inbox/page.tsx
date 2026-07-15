import { redirect } from "next/navigation";

/** 议题 Inbox 已拆分归位：告警/决策/前提/偏差 → 指挥舱议题；市场威胁 → 市场洞察 */
export default function InboxPage() {
  redirect("/command/issues");
}
