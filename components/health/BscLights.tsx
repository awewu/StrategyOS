import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

const DIMS = [
  { key: "financial", name: "财务", satisfaction: "股东满意", color: "var(--bsc-financial)", border: "border-l-[var(--bsc-financial)]" },
  { key: "customer",  name: "客户", satisfaction: "客户满意", color: "var(--bsc-customer)",  border: "border-l-[var(--bsc-customer)]"  },
  { key: "process",   name: "流程", satisfaction: "社会满意", color: "var(--bsc-process)",   border: "border-l-[var(--bsc-process)]"   },
  { key: "learning",  name: "学习", satisfaction: "员工满意", color: "var(--bsc-learning)",  border: "border-l-[var(--bsc-learning)]"  },
] as const;

export function BscLights({ lights }: { lights: Record<(typeof DIMS)[number]["key"], TrafficLight> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DIMS.map((d) => (
        <div
          key={d.key}
          className={`rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-4 border-l-[3px] ${d.border} ${
            lights[d.key] === "red" ? "ring-1 ring-[var(--signal-red)]/35" : ""
          }`}
        >
          <div className="text-[0.65rem] font-medium uppercase tracking-[0.1em]"
            style={{ color: d.color + "b0" }}>
            {d.satisfaction}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: d.color }}>{d.name}</span>
            <TrafficLightDot signal={lights[d.key]} showLabel />
          </div>
        </div>
      ))}
    </div>
  );
}
