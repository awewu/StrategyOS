import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { typography } from "@/lib/brand/typography";

const BORDER: Record<string, string> = {
  financial: "border-l-[var(--bsc-financial)]",
  customer:  "border-l-[var(--bsc-customer)]",
  process:   "border-l-[var(--bsc-process)]",
  learning:  "border-l-[var(--bsc-learning)]",
};

const DIM_COLOR: Record<string, string> = {
  financial: "var(--bsc-financial)",
  customer:  "var(--bsc-customer)",
  process:   "var(--bsc-process)",
  learning:  "var(--bsc-learning)",
};

export function BscCards({
  cards,
}: {
  cards: Array<{
    key: string; label: string; satisfaction: string;
    target: string; light: TrafficLight;
  }>;
}) {
  return (
    <section>
      <div className={`${typography.h3} mb-3`}>BSC 四维度 · 四个满意</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.key}
            className={`rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-4 border-l-[3px] ${BORDER[c.key]} ${
              c.light === "red" ? "ring-1 ring-[var(--signal-red)]/35" : ""
            }`}
          >
            {/* satisfaction label */}
            <div className="text-[var(--type-label)] font-medium tracking-[0.1em]"
              style={{ color: DIM_COLOR[c.key] + "b0" }}>
              {c.satisfaction}
            </div>
            {/* dimension name + signal */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: DIM_COLOR[c.key] }}>
                {c.label}
              </span>
              <TrafficLightDot signal={c.light} />
            </div>
            {/* target */}
            <p className="mt-2.5 font-data text-[var(--type-caption)] tabular-nums text-[var(--color-text-muted)] leading-tight">
              {c.target}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
