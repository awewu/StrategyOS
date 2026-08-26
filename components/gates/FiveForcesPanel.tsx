"use client";

import { useState } from "react";
import type { FiveForceRecord, ThreatLevel } from "@/lib/gates/five-forces";

const LEVEL_COLOR: Record<ThreatLevel, string> = {
  critical: "var(--signal-red)",
  high: "var(--signal-red)",
  medium: "var(--signal-yellow)",
  low: "var(--signal-green)",
};

const LEVEL_LABEL: Record<ThreatLevel, string> = {
  critical: "极高",
  high: "高",
  medium: "中",
  low: "低",
};

export function FiveForcesPanel({
  records: initialRecords,
  source,
}: {
  records: FiveForceRecord[];
  source: "database" | "demo";
}) {
  const [records, setRecords] = useState<FiveForceRecord[]>(initialRecords);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const highCount = records.filter((r) => ["critical", "high"].includes(r.threatLevel) && !r.mitigated).length;

  function updateRecord(force: string, patch: Partial<FiveForceRecord>) {
    setRecords((prev) => prev.map((r) => (r.force === force ? { ...r, ...patch } : r)));
  }

  async function save(record: FiveForceRecord) {
    setSaving((prev) => ({ ...prev, [record.force]: true }));
    setNotes((prev) => ({ ...prev, [record.force]: "" }));
    try {
      const r = await fetch("/api/gates/five-forces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record: {
            force: record.force,
            threatLevel: record.threatLevel,
            evidence: record.evidence,
            linkedAssumptionCode: record.linkedAssumptionCode,
            owner: record.owner,
            mitigated: record.mitigated,
            note: record.note,
          },
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setNotes((prev) => ({ ...prev, [record.force]: "已保存" }));
      } else {
        setNotes((prev) => ({ ...prev, [record.force]: d.error ?? "保存失败" }));
      }
    } catch {
      setNotes((prev) => ({ ...prev, [record.force]: "网络错误" }));
    } finally {
      setSaving((prev) => ({ ...prev, [record.force]: false }));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">白话版波特五力 · 战略风险清单</h2>
          <p className="text-caption">
            五力不是行业报告，而是战略会风险项。未缓解的高/极高威胁 {highCount} 项。
          </p>
        </div>
        <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-caption">
          {source === "database" ? "已持久化" : "Demo"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {records.map((r) => (
          <div
            key={r.force}
            className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4"
            style={{ borderLeft: `3px solid ${LEVEL_COLOR[r.threatLevel]}` }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{r.label}</h3>
                <p className="text-caption">{r.plain}</p>
              </div>
              <span
                className="rounded px-1.5 py-0.5 text-[var(--type-label)] text-white"
                style={{ background: LEVEL_COLOR[r.threatLevel] }}
              >
                {LEVEL_LABEL[r.threatLevel]}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={r.threatLevel}
                  onChange={(e) => updateRecord(r.force, { threatLevel: e.target.value as ThreatLevel })}
                  className="rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">极高</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={r.mitigated}
                    onChange={(e) => updateRecord(r.force, { mitigated: e.target.checked })}
                  />
                  已缓解
                </label>
              </div>

              <input
                type="text"
                value={r.evidence ?? ""}
                placeholder="证据 / 信号来源"
                onChange={(e) => updateRecord(r.force, { evidence: e.target.value })}
                className="w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={r.linkedAssumptionCode ?? ""}
                  placeholder="关联假设编号"
                  onChange={(e) => updateRecord(r.force, { linkedAssumptionCode: e.target.value })}
                  className="flex-1 rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                />
                <input
                  type="text"
                  value={r.owner ?? ""}
                  placeholder="负责人"
                  onChange={(e) => updateRecord(r.force, { owner: e.target.value })}
                  className="flex-1 rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                />
              </div>

              <input
                type="text"
                value={r.note ?? ""}
                placeholder="备注 / 缓解动作"
                onChange={(e) => updateRecord(r.force, { note: e.target.value })}
                className="w-full rounded border border-[var(--surface-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
              />

              <div className="flex items-center justify-between">
                <span className="text-caption">
                  {notes[r.force] && <span className="text-[var(--color-accent)]">{notes[r.force]}</span>}
                </span>
                <button
                  type="button"
                  disabled={saving[r.force]}
                  onClick={() => void save(r)}
                  className="rounded-md bg-[var(--color-accent)] px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving[r.force] ? "保存中…" : "保存"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
