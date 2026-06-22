import Link from "next/link";

export type TimelineMilestone = {
  id: string;
  label: string;
  period: string;
  kind: "snapshot" | "meeting" | "gate";
  status: "done" | "active" | "upcoming";
  detail?: string;
};

const STATUS_LABEL: Record<TimelineMilestone["status"], string> = {
  done: "已完成",
  active: "进行中",
  upcoming: "待启动",
};

const KIND_COLOR: Record<TimelineMilestone["kind"], string> = {
  snapshot: "var(--color-accent)",
  meeting: "var(--bsc-customer)",
  gate: "var(--bsc-process)",
};

export function StrategicTimeline({ milestones }: { milestones: TimelineMilestone[] }) {
  if (milestones.length === 0) return null;

  return (
    <section className="stratos-card stratos-card--padded" aria-label="战略时间轴">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="stratos-section-title">战略时间轴</h2>
          <p className="stratos-section-desc">版本快照 · 战略会 · Gate 彩排</p>
        </div>
        <Link href="/versions" className="text-xs text-[var(--color-accent)] hover:underline">
          版本库 →
        </Link>
      </header>
      <ol className="relative border-l border-[var(--surface-border)] pl-6">
        {milestones.map((m, i) => (
          <li key={m.id} className={`relative pb-6 ${i === milestones.length - 1 ? "pb-0" : ""}`}>
            <span
              className="absolute -left-[1.375rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-bg-deep)]"
              style={{
                background:
                  m.status === "done"
                    ? "var(--signal-green)"
                    : m.status === "active"
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
              }}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{m.label}</p>
              <span className="font-data text-xs text-[var(--color-text-muted)]">{m.period}</span>
            </div>
            {m.detail ? (
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.detail}</p>
            ) : null}
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                color: KIND_COLOR[m.kind],
                background: `color-mix(in srgb, ${KIND_COLOR[m.kind]} 12%, transparent)`,
              }}
            >
              {STATUS_LABEL[m.status]}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
