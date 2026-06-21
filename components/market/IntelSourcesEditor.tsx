"use client";

import { useState } from "react";
import { SOURCE_LABEL } from "@/lib/market-intel/types";
import type { SourceKind } from "@/lib/market-intel/types";

type Source = {
  id: string; competitor: string; kind: SourceKind;
  url: string | null; cadenceDays: number; active: boolean;
  health: "active" | "stale" | "empty";
};

const HEALTH_COLOR: Record<string, string> = {
  active: "var(--signal-green)", stale: "var(--signal-yellow)", empty: "var(--signal-red)",
};
const HEALTH_LABEL: Record<string, string> = { active: "活跃", stale: "过时", empty: "空" };

const inputCls = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

export function IntelSourcesEditor({ sources: init, saving, post, del }: {
  sources: Source[];
  saving: boolean;
  post: (path: string, body: object) => Promise<unknown>;
  del: (path: string, id: string) => Promise<boolean>;
}) {
  const [sources, setSources] = useState(init);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Source>>({});

  function startNew() { setEditing("new"); setForm({ kind: "official_site", cadenceDays: 7, active: true }); }
  function startEdit(s: Source) { setEditing(s.id); setForm({ ...s }); }
  function cancel() { setEditing(null); setForm({}); }

  async function save() {
    const d = await post("/api/market/source", form) as { ok: boolean; source: Source } | null;
    if (!d) return;
    setSources(editing === "new" ? [...sources, d.source] : sources.map((s) => s.id === editing ? d.source : s));
    cancel();
  }

  async function remove(id: string) {
    if (!confirm("删除该情报来源及其关联信号，确认？")) return;
    const ok = await del("/api/market/source", id);
    if (ok) setSources(sources.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-caption text-sm text-[var(--color-text-muted)]">
          Hermes 情报来源库。招聘/专利为<strong>领先指标</strong>，财报公告为滞后指标。
        </p>
        <button onClick={startNew} disabled={saving}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
          + 新增来源
        </button>
      </div>

      <div className="rounded-lg border border-[var(--surface-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)]">
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">竞品</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">类型</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">URL</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">频率(天)</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-muted)]">健康</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {sources.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-40"}>
                <td className="px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{s.competitor}</td>
                <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{SOURCE_LABEL[s.kind]}</td>
                <td className="px-3 py-2.5 max-w-[200px] truncate text-xs text-[var(--color-text-muted)]">
                  {s.url ?? "—"}
                </td>
                <td className="px-3 py-2.5 font-data text-[var(--color-text-secondary)]">{s.cadenceDays}d</td>
                <td className="px-3 py-2.5">
                  <span className="text-xs font-medium" style={{ color: HEALTH_COLOR[s.health] }}>
                    ● {HEALTH_LABEL[s.health]}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(s)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
                    <button onClick={() => remove(s.id)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">暂无情报来源</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl border border-[var(--surface-border)] bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
              {editing === "new" ? "新增情报来源" : "编辑情报来源"}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">竞品名称 *</label>
                <input value={form.competitor ?? ""} onChange={(e) => setForm({ ...form, competitor: e.target.value })} className={inputCls} placeholder="如：史密斯" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">来源类型 *</label>
                <select value={form.kind ?? "official_site"} onChange={(e) => setForm({ ...form, kind: e.target.value as SourceKind })} className={inputCls}>
                  {(Object.keys(SOURCE_LABEL) as SourceKind[]).map((k) => (
                    <option key={k} value={k}>{SOURCE_LABEL[k]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">URL（可选）</label>
                <input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value || null })} className={inputCls} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">抓取频率（天）</label>
                <input type="number" min={1} value={form.cadenceDays ?? 7} onChange={(e) => setForm({ ...form, cadenceDays: +e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  启用
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={cancel} className="rounded-md border border-[var(--surface-border)] px-4 py-1.5 text-sm hover:bg-black/[0.04]">取消</button>
              <button onClick={save} disabled={saving} className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
