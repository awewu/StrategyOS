import type { TrafficLight } from "@/lib/types/stratos";

const MAP: Record<TrafficLight, { bg: string; glow: string; label: string }> = {
  green: { bg: "bg-[#1f8a45]", glow: "shadow-[0_0_8px_#1f8a45]", label: "正常" },
  yellow: { bg: "bg-[#f9a825]", glow: "shadow-[0_0_8px_#f9a825]", label: "关注" },
  red: { bg: "bg-[#8b0e04]", glow: "shadow-[0_0_8px_#8b0e04]", label: "预警" },
};

export function TrafficLightDot({ signal, showLabel }: { signal: TrafficLight; showLabel?: boolean }) {
  const s = MAP[signal];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${s.bg} ${s.glow}`} />
      {showLabel && <span className="text-xs text-[var(--color-text-muted)]">{s.label}</span>}
    </span>
  );
}

export function TrafficLightBar({ signal }: { signal: TrafficLight }) {
  const border =
    signal === "red"
      ? "ring-2 ring-[#8b0e04]"
      : signal === "yellow"
        ? "ring-1 ring-[#f9a825]/60"
        : "";
  return <div className={`rounded-lg ${border}`} />;
}
