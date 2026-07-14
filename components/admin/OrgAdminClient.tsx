"use client";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";

type Level = "GROUP" | "EXECUTIVE" | "OPERATING_UNIT";

interface OrgUnit {
  id: string;
  name: string;
  nameEn: string | null;
  level: Level;
  parentId: string | null;
  sortOrder: number;
  planCount: number;
}

const LEVEL_LABEL: Record<Level, string> = {
  GROUP: "集团",
  EXECUTIVE: "事业部 / 体系",
  OPERATING_UNIT: "二级部门",
};

const inp = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

interface EditTarget {
  id?: string;
  name: string;
  nameEn: string;
  level: Level;
  parentId: string | null;
  sortOrder: number;
}

export function OrgAdminClient({ units }: { units: OrgUnit[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const flash = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const groups = units.filter((u) => u.level === "GROUP");
  const execs = units.filter((u) => u.level === "EXECUTIVE");
  const ops = units.filter((u) => u.level === "OPERATING_UNIT");

  const execsByGroup = useMemo(() => {
    const m: Record<string, OrgUnit[]> = {};
    for (const e of execs) (m[e.parentId ?? "_"] ??= []).push(e);
    return m;
  }, [execs]);
  const opsByExec = useMemo(() => {
    const m: Record<string, OrgUnit[]> = {};
    for (const o of ops) (m[o.parentId ?? "_"] ??= []).push(o);
    return m;
  }, [ops]);

  async function save() {
    if (!edit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/org-unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      const d = await res.json();
      if (!res.ok) { flash("err", d.error ?? "保存失败"); return; }
      flash("ok", edit.id ? "已更新" : "已新增");
      setEdit(null);
      router.refresh();
    } catch { flash("err", "网络错误"); }
    finally { setSaving(false); }
  }

  async function remove(u: OrgUnit) {
    if (!confirm(`确认删除「${u.name}」？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/org-unit?id=${encodeURIComponent(u.id)}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) { flash("err", d.error ?? "删除失败"); return; }
      flash("ok", "已删除");
      router.refresh();
    } catch { flash("err", "网络错误"); }
  }

  function newUnit(level: Level, parentId: string | null) {
    setEdit({ name: "", nameEn: "", level, parentId, sortOrder: 999 });
  }
  function editUnit(u: OrgUnit) {
    setEdit({ id: u.id, name: u.name, nameEn: u.nameEn ?? "", level: u.level, parentId: u.parentId, sortOrder: u.sortOrder });
  }

  function UnitRow({ u, depth }: { u: OrgUnit; depth: number }) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-black/[0.02]"
        style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-[var(--color-text-primary)] truncate">{u.name}</span>
          {u.nameEn && <span className="text-xs text-[var(--color-text-muted)] truncate">{u.nameEn}</span>}
          {u.planCount > 0 && (
            <span className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[11px] text-[var(--color-accent)]">
              {u.planCount} 份战略
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {u.level === "GROUP" && (
            <button onClick={() => newUnit("EXECUTIVE", u.id)}
              className="rounded px-2 py-1 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10">+ 事业部/体系</button>
          )}
          {u.level === "EXECUTIVE" && (
            <button onClick={() => newUnit("OPERATING_UNIT", u.id)}
              className="rounded px-2 py-1 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10">+ 二级部门</button>
          )}
          <button onClick={() => editUnit(u)}
            className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.04]">改</button>
          <button onClick={() => remove(u)}
            className="rounded px-2 py-1 text-xs text-[var(--signal-red)] hover:bg-[var(--signal-red)]/10">删</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-2 text-sm shadow-lg ${
          toast.kind === "ok"
            ? "border-[var(--signal-green)]/30 bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
            : "border-[var(--signal-red)]/30 bg-[var(--signal-red)]/10 text-[var(--signal-red)]"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">组织树</h2>
          {groups.length === 0 && (
            <button onClick={() => newUnit("GROUP", null)}
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs text-white">+ 新建集团</button>
          )}
        </div>

        <div className="space-y-0.5">
          {groups.map((g) => (
            <div key={g.id}>
              <UnitRow u={g} depth={0} />
              {(execsByGroup[g.id] ?? []).map((e) => (
                <div key={e.id}>
                  <UnitRow u={e} depth={1} />
                  {(opsByExec[e.id] ?? []).map((o) => (
                    <UnitRow key={o.id} u={o} depth={2} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          已挂战略计划的单位不可删除（保留历史）；有子部门的单位需先处理子部门。
        </p>
      </div>

      {edit && (
        <Modal onClose={() => setEdit(null)} size="md" title={`${edit.id ? "编辑" : "新增"} · ${LEVEL_LABEL[edit.level]}`}>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">名称</label>
                <input className={inp} value={edit.name} autoFocus
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  placeholder="例：空调事业部" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">英文名（可选）</label>
                <input className={inp} value={edit.nameEn}
                  onChange={(e) => setEdit({ ...edit, nameEn: e.target.value })}
                  placeholder="e.g. AC Division" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">层级</label>
                  <div className="rounded-md bg-black/[0.03] px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
                    {LEVEL_LABEL[edit.level]}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">排序</label>
                  <input type="number" className={inp} value={edit.sortOrder}
                    onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} />
                </div>
              </div>
              {edit.level !== "GROUP" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">上级</label>
                  <select className={inp} value={edit.parentId ?? ""}
                    onChange={(e) => setEdit({ ...edit, parentId: e.target.value || null })}>
                    <option value="">— 选择上级 —</option>
                    {(edit.level === "EXECUTIVE" ? groups : execs).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEdit(null)}
                className="rounded-md border border-[var(--surface-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-black/[0.04]">取消</button>
              <button disabled={saving} onClick={save}
                className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60">
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
}
