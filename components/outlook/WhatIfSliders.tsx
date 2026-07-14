"use client";

import { useMemo, useState } from "react";
import {
  priceCutImpact,
  segmentBeatImpact,
  v4DelayImpact,
} from "@/lib/stratos/driver-model";
import type { FpaSummary } from "@/lib/types/stratos";

function fmt(n: number, suffix = "万"): string {
  const r = Math.round(n);
  return `${r > 0 ? "+" : ""}${r} ${suffix}`;
}

function toneFor(n: number): string {
  if (n > 0) return "var(--signal-green)";
  if (n < 0) return "var(--signal-red)";
  return "var(--color-text-muted)";
}

/** 轻量 what-if：driver-model 弹性系数 × 滑杆，即时看营收/利润/runway 冲击 */
export function WhatIfSliders({ fpa }: { fpa: FpaSummary }) {
  const [v4Quarters, setV4Quarters] = useState(0);
  const [segmentBeat, setSegmentBeat] = useState(0);
  const [priceCut, setPriceCut] = useState(0);

  const total = useMemo(() => {
    const a = v4DelayImpact(fpa, v4Quarters);
    const b = segmentBeatImpact(fpa, segmentBeat / 100);
    const c = priceCutImpact(fpa, priceCut / 100);
    return {
      revenue: a.revenueDeltaM + b.revenueDeltaM + c.revenueDeltaM,
      profit: a.profitDeltaM + b.profitDeltaM + c.profitDeltaM,
      runway: a.runwayDeltaMonths + b.runwayDeltaMonths + c.runwayDeltaMonths,
    };
  }, [fpa, v4Quarters, segmentBeat, priceCut]);

  const projectedRunway = fpa.cashRunwayMonths + total.runway;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="label-xs">V4 延期（季度）· {v4Quarters}</span>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={v4Quarters}
            onChange={(e) => setV4Quarters(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
        <label className="block">
          <span className="label-xs">酒店/大项目签约超预期 · +{segmentBeat}%</span>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={segmentBeat}
            onChange={(e) => setSegmentBeat(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
        <label className="block">
          <span className="label-xs">全线降价 · -{priceCut}%</span>
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={priceCut}
            onChange={(e) => setPriceCut(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--surface-border)] p-4">
          <p className="label-xs">营收冲击</p>
          <p className="mt-1 font-data text-xl tabular-nums" style={{ color: toneFor(total.revenue) }}>
            {fmt(total.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--surface-border)] p-4">
          <p className="label-xs">利润冲击</p>
          <p className="mt-1 font-data text-xl tabular-nums" style={{ color: toneFor(total.profit) }}>
            {fmt(total.profit)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--surface-border)] p-4">
          <p className="label-xs">Runway</p>
          <p
            className="mt-1 font-data text-xl tabular-nums"
            style={{ color: projectedRunway < 3 ? "var(--signal-red)" : toneFor(total.runway) }}
          >
            {projectedRunway.toFixed(1)} 月
            <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
              ({total.runway >= 0 ? "+" : ""}{total.runway.toFixed(1)})
            </span>
          </p>
        </div>
      </div>

      <p className="text-caption">
        弹性系数锚定当期 FPA 预测（营收 F {Math.round(fpa.revenueForecast)} 万）· 单驱动线性近似，交叉效应不建模
        {projectedRunway < 3 ? " · ⚠ 该组合击穿 3 个月 runway 红线" : ""}
      </p>
    </div>
  );
}
