import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

const DIMS = [
  { key: "financial", name: "财务", satisfaction: "股东满意", color: "var(--bsc-financial)" },
  { key: "customer", name: "客户", satisfaction: "客户满意", color: "var(--bsc-customer)" },
  { key: "process", name: "流程", satisfaction: "社会满意", color: "var(--bsc-process)" },
  { key: "learning", name: "学习", satisfaction: "员工满意", color: "var(--bsc-learning)" },
] as const;

export function BscLights({ lights }: { lights: Record<(typeof DIMS)[number]["key"], TrafficLight> }) {
  return (
    <div className="stratos-slot-grid lg:grid-cols-4">
      {DIMS.map((d) => (
        <div
          key={d.key}
          className={`stratos-card stratos-card--padded ${
            lights[d.key] === "red" ? "ring-1 ring-[var(--signal-red)]/35" : ""
          }`}
          style={{ borderLeft: `3px solid ${d.color}` }}
        >
          <div className="label-xs" style={{ color: d.color }}>
            {d.satisfaction}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-subsection font-semibold" style={{ color: d.color }}>
              {d.name}
            </span>
            <TrafficLightDot signal={lights[d.key]} showLabel />
          </div>
        </div>
      ))}
    </div>
  );
}
