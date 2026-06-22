import type { getCommandDeckBundle } from "@/lib/data/strategy-data";

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

/** Map period strings like 2026-Q2 / 2026-H1 / 2026-FY to a numeric sort key. */
function periodSortKey(p: string): number {
  const m = p.match(/^(\d{4})-(Q\d|H\d|FY)$/);
  if (!m) return 0;
  const year = parseInt(m[1], 10);
  const suffix = m[2];
  let offset: number;
  if (suffix === "FY") offset = 4;
  else if (suffix.startsWith("H")) offset = suffix === "H1" ? 2 : 4;
  else offset = parseInt(suffix.slice(1), 10);
  return year * 10 + offset;
}

function snapshotStatus(
  status: SnapshotLike["status"],
  period: string,
  activePeriod: string,
): TimelineMilestone["status"] {
  if (status === "FROZEN") return "done";
  if (period.includes(activePeriod)) return "active";
  return periodSortKey(period) > periodSortKey(activePeriod) ? "upcoming" : "done";
}

export function buildStrategicTimeline(
  snapshots: SnapshotLike[],
  activePeriod: string,
): TimelineMilestone[] {
  const fromSnapshots: TimelineMilestone[] = snapshots.map((s) => ({
    id: `snap-${s.code}`,
    label: s.status === "WORKING" ? "战略版本 · 编制中" : "战略版本 · 已冻结",
    period: s.period,
    kind: "snapshot",
    status: snapshotStatus(s.status, s.period, activePeriod),
    detail: `${s.code} · deliberate ${s.rate}%`,
  }));

  const activeKey = periodSortKey(activePeriod);
  const meetings: TimelineMilestone[] = MEETING_MILESTONES.map((m) => {
    const key = periodSortKey(m.period);
    const status: TimelineMilestone["status"] =
      key === activeKey ? "active" : key > activeKey ? "upcoming" : "done";
    return { ...m, status };
  });

  return [...fromSnapshots, ...meetings].sort((a, b) => a.period.localeCompare(b.period));
}

export type CommandDeck = Awaited<ReturnType<typeof getCommandDeckBundle>>;
