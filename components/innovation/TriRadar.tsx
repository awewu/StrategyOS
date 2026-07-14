"use client";

const AXES = [
  { key: "d", label: "想要 D", angle: 90 },
  { key: "f", label: "能做 F", angle: 210 },
  { key: "v", label: "划算 V", angle: 330 },
] as const;

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function trianglePath(cx: number, cy: number, r: number): string {
  return AXES.map((a, i) => {
    const [x, y] = polar(cx, cy, r, a.angle);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

export function TriRadar({
  d,
  f,
  v,
  size = 120,
  showLabels = false,
  tone = "accent",
}: {
  d: number;
  f: number;
  v: number;
  size?: number;
  showLabels?: boolean;
  tone?: "accent" | "green" | "yellow" | "red";
}) {
  const pad = showLabels ? 26 : 8;
  const cx = size / 2;
  const cy = size / 2 + (showLabels ? 4 : 2);
  const R = size / 2 - pad;
  const values: Record<string, number> = { d, f, v };
  const toneVar =
    tone === "green"
      ? "var(--signal-green)"
      : tone === "yellow"
        ? "var(--signal-yellow)"
        : tone === "red"
          ? "var(--signal-red)"
          : "var(--color-accent)";

  const valuePath =
    AXES.map((a, i) => {
      const r = (Math.max(0, Math.min(100, values[a.key])) / 100) * R;
      const [x, y] = polar(cx, cy, Math.max(r, 2), a.angle);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {[0.33, 0.66, 1].map((k) => (
        <path
          key={k}
          d={trianglePath(cx, cy, R * k)}
          fill="none"
          stroke="var(--surface-border)"
          strokeWidth={k === 1 ? 1.2 : 0.7}
        />
      ))}
      {AXES.map((a) => {
        const [x, y] = polar(cx, cy, R, a.angle);
        return <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--surface-border)" strokeWidth={0.5} />;
      })}
      <path d={valuePath} fill={toneVar} fillOpacity={0.18} stroke={toneVar} strokeWidth={1.6} strokeLinejoin="round" />
      {AXES.map((a) => {
        const r = (Math.max(0, Math.min(100, values[a.key])) / 100) * R;
        const [x, y] = polar(cx, cy, Math.max(r, 2), a.angle);
        return <circle key={a.key} cx={x} cy={y} r={2.4} fill={toneVar} />;
      })}
      {showLabels &&
        AXES.map((a) => {
          const [x, y] = polar(cx, cy, R + 15, a.angle);
          return (
            <text
              key={a.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              {a.label} {Math.round(values[a.key])}
            </text>
          );
        })}
    </svg>
  );
}
