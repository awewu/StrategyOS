"use client";

import type { ValuationView } from "@/lib/ma/views";

const METHOD_LABEL: Record<string, string> = { dcf: "DCF", comps: "可比公司", precedent: "先例交易" };

export function FootballFieldChart({
  valuations,
  price,
  walkAway,
  width = 360,
}: {
  valuations: ValuationView[];
  price: number | null;
  walkAway: number | null;
  width?: number;
}) {
  if (valuations.length === 0) return null;

  const rowH = 30;
  const padTop = 8;
  const padBottom = 22;
  const labelW = 64;
  const height = padTop + valuations.length * rowH + padBottom;

  const values = [
    ...valuations.flatMap((v) => [v.low, v.high]),
    ...(price !== null ? [price] : []),
    ...(walkAway !== null ? [walkAway] : []),
  ];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (v: number) => labelW + ((v - min) / span) * (width - labelW - 12);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {valuations.map((v, i) => {
        const y = padTop + i * rowH + rowH / 2;
        return (
          <g key={v.id}>
            <text x={0} y={y + 3} fontSize={10} fill="var(--color-text-muted)">
              {METHOD_LABEL[v.method] ?? v.method}
            </text>
            <line x1={x(v.low)} y1={y} x2={x(v.high)} y2={y} stroke="var(--color-accent)" strokeWidth={10} strokeOpacity={0.25} strokeLinecap="round" />
            <line x1={x(v.base)} y1={y - 7} x2={x(v.base)} y2={y + 7} stroke="var(--color-accent)" strokeWidth={2.5} />
            <text x={x(v.low) - 3} y={y + 3} fontSize={9} textAnchor="end" fill="var(--color-text-muted)">{v.low.toLocaleString()}</text>
            <text x={x(v.high) + 3} y={y + 3} fontSize={9} fill="var(--color-text-muted)">{v.high.toLocaleString()}</text>
          </g>
        );
      })}
      {price !== null && (
        <g>
          <line x1={x(price)} y1={padTop - 2} x2={x(price)} y2={height - padBottom + 4} stroke="var(--signal-green)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={x(price)} y={height - 8} fontSize={9} textAnchor="middle" fill="var(--signal-green)">对价 {price.toLocaleString()}</text>
        </g>
      )}
      {walkAway !== null && (
        <g>
          <line x1={x(walkAway)} y1={padTop - 2} x2={x(walkAway)} y2={height - padBottom + 4} stroke="var(--signal-red)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={x(walkAway)} y={height - 8} fontSize={9} textAnchor="middle" fill="var(--signal-red)">walk-away {walkAway.toLocaleString()}</text>
        </g>
      )}
    </svg>
  );
}
