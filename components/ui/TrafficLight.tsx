import type { TrafficLight } from "@/lib/types/stratos";

const MAP: Record<TrafficLight, { bg: string; glow: string; label: string }> = {
  green: {
    bg: "bg-[var(--signal-green)]",
    glow: "shadow-[0_0_8px_var(--signal-green)]",
    label: "正常",
  },
  yellow: {
    bg: "bg-[var(--signal-yellow)]",
    glow: "shadow-[0_0_8px_var(--signal-yellow)]",
    label: "关注",
  },
  red: {
    bg: "bg-[var(--signal-red)]",
    glow: "shadow-[0_0_8px_var(--signal-red)]",
    label: "预警",
  },
};

export function TrafficLightDot({ signal, showLabel }: { signal: TrafficLight; showLabel?: boolean }) {
  const s = MAP[signal];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${s.bg} ${s.glow}`} />
      {showLabel && <span className="text-caption">{s.label}</span>}
    </span>
  );
}

export function TrafficLightBar({ signal }: { signal: TrafficLight }) {
  const border =
    signal === "red"
      ? "ring-2 ring-[var(--signal-red)]"
      : signal === "yellow"
        ? "ring-1 ring-[color-mix(in_srgb,var(--signal-yellow)_60%,transparent)]"
        : "";
  return <div className={`rounded-lg ${border}`} />;
}
