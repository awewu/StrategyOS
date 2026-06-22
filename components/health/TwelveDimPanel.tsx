import { TrafficLightDot } from "@/components/ui/TrafficLight";
import {
  compositeTwelveDimScore,
  pillarLabels,
  twelveDimensions,
  type TwelveDimension,
} from "@/lib/health/twelve-dimensions";
import type { TrafficLight } from "@/lib/types/stratos";

export function TwelveDimPanel() {
  const score = compositeTwelveDimScore();
  const pillars = ["commitment", "values", "operations"] as const;

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)]">
          十二维健康度 · 战略部下钻
        </h2>
        <span className="font-data text-2xl text-[var(--color-accent)]">{score}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar}>
            <h3 className="mb-3 text-xs text-[var(--color-accent)]">
              {pillarLabels[pillar]}
            </h3>
            <ul className="space-y-2">
              {twelveDimensions
                .filter((d) => d.pillar === pillar)
                .map((d) => (
                  <DimRow key={d.id} dim={d} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function DimRow({ dim }: { dim: TwelveDimension }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span>{dim.name}</span>
      <span className="flex items-center gap-2 font-data text-xs">
        {dim.score}
        <TrafficLightDot signal={dim.signal as TrafficLight} />
      </span>
    </li>
  );
}
