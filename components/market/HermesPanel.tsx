"use client";

import { useState } from "react";
import type { HermesScanResult } from "@/lib/market-intel/types";

interface CurationDrop { competitor: string; dimension: string; title: string; reason: string }
interface Curation {
  kept: number;
  drops: number;
  rounds: number;
  dropList: CurationDrop[];
}
type ScanResponse = HermesScanResult & {
  curation?: Curation | null;
  didFetch?: boolean;
  inventorySignals?: number;
  llmConfigured?: boolean;
  error?: string;
};

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
  const [curation, setCuration] = useState<Curation | null>(null);
  const [scanMeta, setScanMeta] = useState<{
    didFetch: boolean;
    inventorySignals: number | null;
    llmConfigured: boolean | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/market/scan", { method: "POST" });
      const data = (await res.json().catch(() => null)) as ScanResponse | null;
      if (!res.ok) {
        setError(data?.error ?? `扫描失败：HTTP ${res.status}`);
        return;
      }
      if (!data) {
        setError("扫描失败：接口返回为空");
        return;
      }
      setScan(data);
      setCuration(data.curation ?? null);
      setScanMeta({
        didFetch: Boolean(data.didFetch),
        inventorySignals: typeof data.inventorySignals === "number" ? data.inventorySignals : null,
        llmConfigured: typeof data.llmConfigured === "boolean" ? data.llmConfigured : null,
      });
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
              <span className="rounded-full bg-[var(--color-accent-dim)] px-2 py-0.5 text-[11px] font-medium tracking-[0.06em] text-[var(--color-accent)]">
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
        <Stat label="本次新增" value={String(scan.newSignals)} sub={scanMeta?.inventorySignals != null ? `库存 ${scanMeta.inventorySignals} 条` : "归一化产出"} />
        <Stat label="覆盖" value={`${Math.round((sourcesActive / Math.max(sourcesTotal, 1)) * 100)}%`} sub="来源健康率" />
        <Stat
          label="最近扫描"
          value={scan.ranAt.slice(5, 10)}
          sub={
            scanMeta
              ? scanMeta.didFetch
                ? scan.llmEngine === "llm" ? "联网 + LLM" : "联网 + 规则"
                : scanMeta.llmConfigured ? "LLM 已配 · 无信息更新" : "规则引擎 · 无信息更新"
              : scan.llmEngine === "llm" ? "LLM 引擎" : "规则引擎"
          }
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-[var(--signal-red)]/25 bg-[color-mix(in_srgb,var(--signal-red)_6%,white)] p-3 text-sm text-[var(--signal-red)]">
          {error}
        </div>
      )}

      {scanMeta && !scanMeta.didFetch && (
        <div className="mt-4 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] p-3 text-caption">
          本次没有信息更新。上方摘要来自当前情报库存。
        </div>
      )}

      {scan.highlights.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {scan.highlights.map((h, i) => (
            <li key={i} className="text-sm text-[var(--color-text-secondary)]">
              · {h}
            </li>
          ))}
        </ul>
      )}

      {curation && (
        <div className="mt-4 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-[var(--color-text-primary)]">QC 反幻觉校验</span>
            <span className="text-[var(--signal-green)]">保留 {curation.kept}</span>
            <span className="text-[var(--signal-red)]">丢弃 {curation.drops}</span>
            <span className="text-[var(--color-text-muted)]">闭环 {curation.rounds} 轮</span>
            <span className="ml-auto text-[var(--color-text-muted)]">仅保留有原文佐证的信号</span>
          </div>
          {curation.dropList.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-[var(--surface-border)] pt-2">
              {curation.dropList.slice(0, 6).map((d, i) => (
                <li key={i} className="text-caption">
                  <span className="text-[var(--signal-red)]">丢弃</span> · {d.competitor} · {d.title}
                  <span className="ml-1 italic">（{d.reason}）</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-xs text-[var(--color-accent)] hover:underline"
      >
        {open ? "收起扫描日志" : "查看扫描日志"}
      </button>
      {open && (
        <div className="mt-2 space-y-1 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] p-3 font-data text-caption">
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
