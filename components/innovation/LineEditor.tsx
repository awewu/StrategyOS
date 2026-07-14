"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { LineView } from "@/lib/innovation/views";
import { DEFAULT_GATE_THRESHOLDS } from "@/lib/innovation/views";

const inp =
  "w-full rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none";

const STAGES = [
  { value: "introduction", label: "导入" },
  { value: "growth", label: "成长" },
  { value: "maturity", label: "成熟" },
  { value: "decline", label: "衰退" },
];

const PROBLEMS = [
  { value: "pmf_unvalidated", label: "PMF 未验证" },
  { value: "tech_immature", label: "技术不成熟" },
  { value: "manufacturing_rampup", label: "量产爬坡" },
  { value: "cost_pressure", label: "成本压力" },
  { value: "channel_gtm", label: "渠道/GTM" },
  { value: "substitution_threat", label: "替代威胁" },
];

type WeightRow = { key: string; weight: number };

export function LineEditor({
  line,
  onClose,
  onSaved,
}: {
  line: Partial<LineView> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(line?.name ?? "");
  const [stage, setStage] = useState(line?.lifecycleStage ?? "introduction");
  const [problems, setProblems] = useState<string[]>(line?.dominantProblems ?? []);
  const [weights, setWeights] = useState<WeightRow[]>(
    Object.entries(line?.fAxisWeights ?? {}).map(([key, weight]) => ({ key, weight: Number(weight) })),
  );
  const [thresholds, setThresholds] = useState({
    ...DEFAULT_GATE_THRESHOLDS,
    ...(line?.gateThresholds ?? {}),
  });
  const [evidenceBar, setEvidenceBar] = useState(line?.evidenceBar ?? 4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) { setError("产品线名称必填"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/innovation/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: line?.id,
        name: name.trim(),
        lifecycleStage: stage,
        dominantProblems: problems,
        fAxisWeights: Object.fromEntries(weights.filter((w) => w.key.trim()).map((w) => [w.key.trim(), w.weight])),
        gateThresholds: thresholds,
        evidenceBar,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `保存失败(${res.status})`);
      return;
    }
    onSaved();
  }

  return (
    <Modal onClose={onClose} size="lg" title={line?.id ? "编辑产品线画像" : "新建产品线画像"} subtitle="内核不变 · 画像可配——权重与阈值只影响本线的引擎行为">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">产品线名称</label>
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="例如:某产品线" />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">生命周期</label>
            <div className="mt-1 flex gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={`rounded-md px-2.5 py-1 text-xs ${stage === s.value ? "bg-[var(--color-accent)] text-white" : "border border-[var(--surface-border)] text-[var(--color-text-secondary)]"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">主导问题(可多选)</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PROBLEMS.map((p) => {
                const active = problems.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setProblems((cur) => (active ? cur.filter((x) => x !== p.value) : [...cur, p.value]))
                    }
                    className={`rounded-full px-2.5 py-1 text-xs ${active ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]" : "border border-[var(--surface-border)] text-[var(--color-text-muted)]"}`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-text-secondary)]">F 轴权重(死穴在哪,权重压哪)</label>
              <button
                type="button"
                onClick={() => setWeights((cur) => [...cur, { key: "", weight: 0.2 }])}
                className="text-xs text-[var(--color-accent)]"
              >
                + 维度
              </button>
            </div>
            <div className="mt-1 space-y-2">
              {weights.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inp}
                    placeholder="维度 key(如 material/mrl/cost)"
                    value={w.key}
                    onChange={(e) => setWeights((cur) => cur.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                  />
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    className={`${inp} w-24`}
                    value={w.weight}
                    onChange={(e) =>
                      setWeights((cur) => cur.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setWeights((cur) => cur.filter((_, j) => j !== i))}
                    className="rounded px-2 py-1 text-xs text-[var(--signal-red)]"
                  >
                    删
                  </button>
                </div>
              ))}
              {weights.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">未配置 → 引擎按等权计算</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">回收期阈值(年)</label>
              <input
                type="number"
                step="0.5"
                className={inp}
                value={thresholds.maxPaybackYears}
                onChange={(e) => setThresholds((t) => ({ ...t, maxPaybackYears: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">ROIC−WACC 门槛</label>
              <input
                type="number"
                step="0.01"
                className={inp}
                value={thresholds.minRoicOverWacc}
                onChange={(e) => setThresholds((t) => ({ ...t, minRoicOverWacc: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">最低分(D/F/V)</label>
              <input
                type="number"
                className={inp}
                value={thresholds.minScore}
                onChange={(e) => setThresholds((t) => ({ ...t, minScore: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">证据门槛(L1–L6)</label>
              <input
                type="number"
                min="1"
                max="6"
                className={inp}
                value={evidenceBar}
                onChange={(e) => {
                  const bar = Math.min(6, Math.max(1, Number(e.target.value)));
                  setEvidenceBar(bar);
                  setThresholds((t) => ({ ...t, minEvidenceLevel: bar as typeof t.minEvidenceLevel }));
                }}
              />
            </div>
          </div>

          {error && <p className="text-xs text-[var(--signal-red)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
              取消
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存画像"}
            </button>
          </div>
        </div>
    </Modal>
  );
}
