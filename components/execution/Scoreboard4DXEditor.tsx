"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Scoreboard4DX } from "@/components/execution/Scoreboard4DX";
import type { ScoreboardConfigPayload, ResolvedScoreboard } from "@/lib/execution/scoreboard-access";
import type { ObjectiveView } from "@/lib/data/entity-getters";
import type { KeyResult } from "@/lib/types/stratos";

export function Scoreboard4DXEditor({
  initialConfig,
  derivedConfig,
  objectives,
  allKrs,
  scoreboard,
  source,
}: {
  initialConfig: ScoreboardConfigPayload;
  derivedConfig: ScoreboardConfigPayload;
  objectives: ObjectiveView[];
  allKrs: KeyResult[];
  scoreboard: ResolvedScoreboard;
  source: "database" | "derived";
}) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const leadingOptions = allKrs.filter((k) => k.isLeadingIndicator);
  const laggingOptions = allKrs.filter((k) => !k.isLeadingIndicator);

  function toggleKr(field: "leadingKrIds" | "laggingKrIds", id: string) {
    setConfig((prev) => {
      const ids = prev[field];
      return {
        ...prev,
        [field]: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
      };
    });
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/execution/scoreboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("4DX 记分板已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function resetDerived() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/execution/scoreboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (!res.ok) throw new Error("重置失败");
      setConfig(derivedConfig);
      setEditing(false);
      setMsg("已恢复自动推导记分板");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "重置失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-caption">
          4DX 记分板 {source === "database" ? "· 已自定义" : "· 诊断推导"}
        </span>
        {msg ? <span className="text-xs text-[var(--signal-green-text)]">{msg}</span> : null}
        {editing ? (
          <>
            <button
              type="button"
              className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-xs"
              onClick={() => {
                setConfig(initialConfig);
                setEditing(false);
              }}
            >
              取消
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs text-white disabled:opacity-50"
              onClick={() => void save()}
            >
              {busy ? "保存中…" : "保存"}
            </button>
          </>
        ) : (
          <>
            {source === "database" ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-xs"
                onClick={() => void resetDerived()}
              >
                恢复推导
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-[var(--color-accent)]/40 px-3 py-1.5 text-xs text-[var(--color-accent)]"
              onClick={() => setEditing(true)}
            >
              编辑记分板
            </button>
          </>
        )}
      </div>

      {editing ? (
        <section className="space-y-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-6">
          <label className="block text-caption">
            WIG 目标（Objective）
            <select
              className="mt-1 w-full rounded-lg border border-[var(--surface-border)] bg-transparent px-2 py-1.5 text-sm"
              value={config.wigObjectiveId ?? ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  wigObjectiveId: e.target.value || null,
                }))
              }
            >
              <option value="">使用诊断 crux（默认）</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">领先指标 KR</p>
            <div className="flex flex-wrap gap-2">
              {leadingOptions.map((kr) => (
                <label key={kr.id} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={config.leadingKrIds.includes(kr.id)}
                    onChange={() => toggleKr("leadingKrIds", kr.id)}
                  />
                  {kr.title}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">滞后指标 KR</p>
            <div className="flex flex-wrap gap-2">
              {laggingOptions.length === 0 ? (
                <span className="text-caption">暂无滞后 KR</span>
              ) : (
                laggingOptions.map((kr) => (
                  <label key={kr.id} className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={config.laggingKrIds.includes(kr.id)}
                      onChange={() => toggleKr("laggingKrIds", kr.id)}
                    />
                    {kr.title}
                  </label>
                ))
              )}
            </div>
          </div>
        </section>
      ) : (
        <Scoreboard4DX scoreboard={scoreboard} />
      )}
    </div>
  );
}
