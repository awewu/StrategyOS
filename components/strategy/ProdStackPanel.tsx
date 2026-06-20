import { colors } from "@/lib/brand/tokens";

export function ProdStackPanel({
  horizon,
  roadmap,
  jtbd,
  gaps,
}: {
  horizon: { H1: number; H2: number; H3: number };
  roadmap: Array<{ lane: "now" | "next" | "later"; milestone: string; quarter: string }>;
  jtbd: Array<{ product: string; statement: string; segment: string }>;
  gaps: Array<{ competitor: string; dimension: string; status: string; closure: string }>;
}) {
  const lanes = ["now", "next", "later"] as const;
  const laneLabel = { now: "Now", next: "Next", later: "Later" };

  return (
    <section className="rounded-lg border border-[var(--stack-prod)]/30 bg-[var(--color-bg-surface)] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium" style={{ color: colors.stackProd }}>
          ProdStack · Innovate to Lead
        </h3>
        <span className="font-data text-xs text-[var(--color-text-muted)]">
          H1 {horizon.H1}% · H2 {horizon.H2}% · H3 {horizon.H3}%
        </span>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {lanes.map((lane) => (
          <div key={lane} className="rounded border border-black/10 bg-[var(--color-bg-deep)] p-3">
            <div className="mb-2 text-xs uppercase text-[var(--color-text-muted)]">{laneLabel[lane]}</div>
            {roadmap
              .filter((r) => r.lane === lane)
              .map((r) => (
                <div key={r.milestone} className="mb-2 text-sm">
                  <div>{r.milestone}</div>
                  <div className="font-data text-xs text-[var(--color-text-muted)]">{r.quarter}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs text-[var(--color-text-muted)]">JTBD</div>
          {jtbd.map((j) => (
            <p key={j.product} className="text-sm">
              <span className="text-[var(--color-accent-gold)]">{j.product}</span> · {j.statement}
            </p>
          ))}
        </div>
        <div>
          <div className="mb-2 text-xs text-[var(--color-text-muted)]">竞品差距</div>
          {gaps.map((g) => (
            <div key={g.competitor} className="flex justify-between text-sm">
              <span>{g.competitor} · {g.dimension}</span>
              <span className={g.status === "lagging" ? "text-[var(--signal-red)]" : ""}>
                {g.status} → {g.closure}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
