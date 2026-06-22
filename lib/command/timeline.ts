import type { getCommandDeckBundle } from "@/lib/data/strategy-data";
import { CURRENT_PERIOD } from "@/lib/constants";

export type TimelineMilestone = {
  id: string;
  label: string;
  period: string;
  kind: "snapshot" | "meeting" | "gate";
  status: "done" | "active" | "upcoming";
  detail?: string;
};

type SnapshotLike = { code: string; period: string; status: "FROZEN" | "WORKING"; rate: number };

const MEETING_MILESTONES: Omit<TimelineMilestone, "status">[] = [
  { id: "mtg-mid", label: "年中战略会", period: "2026-Q2", kind: "meeting", detail: "三栈资源配置 · 年中复盘" },
  { id: "mtg-rehearsal", label: "Q3 彩排", period: "2026-Q3", kind: "gate", detail: "SPBP · 情景推演" },
  { id: "mtg-year", label: "年底战略会", period: "2026-Q4", kind: "meeting", detail: "定稿 · 版本冻结" },
];

function snapshotStatus(status: SnapshotLike["status"], period: string): TimelineMilestone["status"] {
  if (status === "FROZEN") return "done";
  if (period.includes(CURRENT_PERIOD) || period.includes("2026-H2")) return "active";
  return "upcoming";
}

export function buildStrategicTimeline(snapshots: SnapshotLike[]): TimelineMilestone[] {
  const fromSnapshots: TimelineMilestone[] = snapshots.map((s) => ({
    id: `snap-${s.code}`,
    label: s.status === "WORKING" ? "战略版本 · 编制中" : "战略版本 · 已冻结",
    period: s.period,
    kind: "snapshot",
    status: snapshotStatus(s.status, s.period),
    detail: `${s.code} · deliberate ${s.rate}%`,
  }));

  const meetings: TimelineMilestone[] = MEETING_MILESTONES.map((m) => ({
    ...m,
    status: m.period === "2026-Q2" ? "active" : m.period === "2026-Q3" ? "upcoming" : "upcoming",
  }));

  return [...fromSnapshots, ...meetings].sort((a, b) => a.period.localeCompare(b.period));
}

export type CommandDeck = Awaited<ReturnType<typeof getCommandDeckBundle>>;
