"use client";

import { useState } from "react";
import type { HermesScanResult } from "@/lib/market-intel/types";

export function HermesPanel({
  agent,
  lastScan,
  sourcesActive,
  sourcesTotal,
}: {
  agent: { name: string; role: string };
  lastScan: HermesScanResult;
  sourcesActive: number;
  sourcesTotal: number;
}) {
  const [scan, setScan] = useState<HermesScanResult>(lastScan);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);

  async function runScan() {
    setRunning(true);
    try {
      const res = await fetch("/api/market/scan", { method: "POST" });
      if (res.ok) setScan((await res.json()) as HermesScanResult);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--surface-panel)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-dim)] font-data text-sm font-semibold text-[var(--color-accent)]"
            title="Hermes 常驻智能体"
          >
            H
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-title">{agent.name}</h2>
              <span className="rounded-full bg-[var(--color-accent-dim)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--color-accent)]">
                常驻 · 持续追踪
              </span>
            </div>
            <p className="mt-0.5 text-caption">{agent.role}</p>
          </div>
        </div>
        <button
          onClick={runScan}
          disabled={running}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {running ? "扫描中…" : "立即扫描"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <Stat label="来源" value={`${scan.sourcesActive}/${scan.sourcesScanned}`} sub="活跃 / 登记" />
        <Stat label="本期信号" value={String(scan.newSignals)} sub="归一化产出" />
        <Stat label="覆盖" value={`${Math.round((sourcesActive / Math.max(sourcesTotal, 1)) * 100)}%`} sub="来源健康率" />
        <Stat label="最近扫描" value={scan.ranAt.slice(5, 10)} sub={scan.llmEngine === "llm" ? "LLM 引擎" : "规则引擎"} />
      </div>

      {scan.highlights.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {scan.highlights.map((h, i) => (
            <li key={i} className="text-sm text-[var(--color-text-secondary)]">
              · {h}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-xs text-[var(--color-accent)] hover:underline"
      >
        {open ? "收起扫描日志" : "查看扫描日志"}
      </button>
      {open && (
        <div className="mt-2 space-y-1 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] p-3 font-data text-xs text-[var(--color-text-muted)]">
          {scan.log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 py-3">
      <div className="text-label">{label}</div>
      <div className="mt-1 font-data text-xl tabular-nums text-[var(--color-text-primary)]">{value}</div>
      <div className="text-caption">{sub}</div>
    </div>
  );
}
