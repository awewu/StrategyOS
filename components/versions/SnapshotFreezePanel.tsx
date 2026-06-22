"use client";

import { useState } from "react";

export function SnapshotFreezePanel() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFreeze(bypassAssertion: boolean) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/snapshots/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: bypassAssertion ? "2026-FY-STRATEGIC" : "2026-FY-STRATEGIC-BLOCKED",
          period: "2026-FY",
          snapshotType: "FY",
          bypassAssertion,
          meetingNotes: bypassAssertion ? "CEO 例外：runway remedial Vx 已录" : undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        frozenAt?: string;
        deliberateRate?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "快照阻断");
        return;
      }
      setResult(
        `已冻结 ${data.code} · ${data.frozenAt?.slice(0, 10)} · 刻意率 ${data.deliberateRate}%`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-2 text-sm font-medium">快照定稿 · Snapshot Freeze</h2>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        战略会定稿后只读 · 含 FPA + 三栈 + HealthAssertion · 断言未解除则硬阻断 · 有 DB 时持久化
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleFreeze(true)}
          className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-bg-deep)] disabled:opacity-50"
        >
          冻结 2026-FY-STRATEGIC（已例外）
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleFreeze(false)}
          className="rounded border border-[var(--signal-red)]/50 px-4 py-2 text-sm text-[var(--signal-red)] disabled:opacity-50"
        >
          演示否决阻断
        </button>
      </div>
      {result && <p className="mt-3 text-sm text-[var(--signal-green)]">{result}</p>}
      {error && <p className="mt-3 text-sm text-[var(--signal-red)]">{error}</p>}
    </section>
  );
}
