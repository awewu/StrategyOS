import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

type BscCardLike = {
  key: string;
  label: string;
  satisfaction: string;
  target?: string;
  light: TrafficLight;
};

const DIMS = [
  { key: "financial", color: "var(--bsc-financial)" },
  { key: "customer", color: "var(--bsc-customer)" },
  { key: "process", color: "var(--bsc-process)" },
  { key: "learning", color: "var(--bsc-learning)" },
] as const;

export function BscLights({
  lights,
  cards,
}: {
  lights: Record<(typeof DIMS)[number]["key"], TrafficLight>;
  cards?: BscCardLike[];
}) {
  const items: BscCardLike[] =
    cards ??
    DIMS.map((d) => ({
      key: d.key,
      label: d.key === "financial" ? "财务" : d.key === "customer" ? "客户" : d.key === "process" ? "流程" : "学习",
      satisfaction:
        d.key === "financial"
          ? "股东满意"
          : d.key === "customer"
            ? "客户满意"
            : d.key === "process"
              ? "社会满意"
              : "员工满意",
      light: lights[d.key],
    }));

  return (
    <div className="stratos-slot-grid lg:grid-cols-4">
      {items.map((d) => {
        const color = DIMS.find((x) => x.key === d.key)?.color ?? "var(--color-accent)";
        const signal = lights[d.key as keyof typeof lights] ?? d.light;
        return (
          <div
            key={d.key}
            className={`stratos-card stratos-card--padded ${
              signal === "red" ? "ring-1 ring-[var(--signal-red)]/35" : ""
            }`}
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="label-xs" style={{ color }}>
              {d.satisfaction}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-subsection font-semibold" style={{ color }}>
                {d.label}
              </span>
              <TrafficLightDot signal={signal} showLabel />
            </div>
            {d.target ? (
              <p className="mt-2 text-caption text-[var(--color-text-muted)]">{d.target}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
