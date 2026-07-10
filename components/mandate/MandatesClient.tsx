"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Holding, Mandate, MandateBundle, Meeting } from "@/lib/mandate/types";
import {
  MANDATE_STATUS_LABEL, MEETING_TYPE_LABEL, MEETING_STATUS_LABEL, HOLDING_STATUS_LABEL,
  type MandateStatus, type HoldingStatus,
} from "@/lib/mandate/types";

const inp = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

const MANDATE_STATUS_COLOR: Record<MandateStatus, string> = {
  ACTIVE: "var(--signal-green)", AT_RISK: "var(--signal-red)",
  ON_HOLD: "var(--signal-yellow)", CLOSED: "var(--color-text-muted)",
};
const HOLDING_STATUS_COLOR: Record<HoldingStatus, string> = {
  CLAIMED: "var(--color-accent)", DELIVERED: "var(--signal-green)",
  HANDED_OVER: "var(--signal-yellow)", MISSED: "var(--signal-red)",
};

export function MandatesClient({ bundle, activePeriod }: { bundle: MandateBundle; activePeriod: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"mandates" | "meetings">("mandates");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [editMandate, setEditMandate] = useState<Partial<Mandate> | null>(null);
  const [editMeeting, setEditMeeting] = useState<Partial<Meeting> | null>(null);
  const [editHolding, setEditHolding] = useState<(Partial<Holding> & { mandateId: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantPickerOpen, setParticipantPickerOpen] = useState(false);
  const selectedParticipantIds = editMeeting?.participantUserIds ?? [];
  const selectedMeetingUsers = bundle.users.filter((user) =>
    selectedParticipantIds.includes(user.id),
  );
  const normalizedParticipantSearch = participantSearch.trim().toLowerCase();
  const participantCandidates = bundle.users
    .filter((user) => !selectedParticipantIds.includes(user.id))
    .filter((user) => !normalizedParticipantSearch ||
      `${user.name} ${user.role} ${user.orgUnitName ?? ""}`.toLowerCase().includes(normalizedParticipantSearch))
    .slice(0, 8);
  const flash = (kind: "ok" | "err", msg: string) => { setToast({ kind, msg }); setTimeout(() => setToast(null), 3500); };

  async function post(url: string, body: unknown, okMsg: string) {
    setSaving(true);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { flash("err", d.error ?? "保存失败"); return false; }
      flash("ok", okMsg); router.refresh(); return true;
    } catch { flash("err", "网络错误"); return false; }
    finally { setSaving(false); }
  }
  async function del(url: string) {
    try {
      const r = await fetch(url, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) { flash("err", d.error ?? "删除失败"); return; }
      flash("ok", "已删除"); router.refresh();
    } catch { flash("err", "网络错误"); }
  }

  function toggleParticipant(userId: string) {
    setEditMeeting((current) => {
      if (!current) return current;
      const selected = current.participantUserIds ?? [];
      const removing = selected.includes(userId);
      return {
        ...current,
        participantUserIds: removing ? selected.filter((id) => id !== userId) : [...selected, userId],
      };
    });
  }

  function openMeetingEditor(meeting: Partial<Meeting>) {
    setParticipantSearch("");
    setParticipantPickerOpen(false);
    setEditMeeting(meeting);
  }

  function closeMeetingEditor() {
    setParticipantSearch("");
    setParticipantPickerOpen(false);
    setEditMeeting(null);
  }

  function updateTodo(index: number, patch: Partial<NonNullable<Meeting["todos"]>[number]>) {
    setEditMeeting((current) => {
      if (!current) return current;
      const todos = [...(current.todos ?? [])];
      todos[index] = { ...todos[index], ...patch };
      return { ...current, todos };
    });
  }

  function addTodo() {
    setEditMeeting((current) => current ? {
      ...current,
      todos: [...(current.todos ?? []), {
        title: "", ownerUserId: null, ownerName: null, dueDate: null, completed: false,
      }],
    } : current);
  }

  function removeTodo(index: number) {
    setEditMeeting((current) => current ? {
      ...current,
      todos: (current.todos ?? []).filter((_, i) => i !== index),
    } : current);
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-2 text-sm shadow-lg ${
          toast.kind === "ok" ? "border-[var(--signal-green)]/30 bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
            : "border-[var(--signal-red)]/30 bg-[var(--signal-red)]/10 text-[var(--signal-red)]"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-1">
          {([["mandates", "战略职责主线"], ["meetings", "会议存档"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`rounded-md px-4 py-1.5 text-sm transition-colors ${tab === id ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === "mandates" && (
          <button onClick={() => setEditMandate({ status: "ACTIVE" })}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white">+ 新建职责</button>
        )}
        {tab === "meetings" && (
          <button onClick={() => openMeetingEditor({
            meetingType: "TOPIC", status: "INVITING", period: activePeriod,
            planId: null, participantUserIds: [], participants: [], todos: [],
          })}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white">+ 新建会议</button>
        )}
      </div>

      {tab === "mandates" && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-muted)]">每条职责是跨会议延续的主线。下方时间线显示历次会议谁认领、交账或移交——人变,线不断。</p>
          {bundle.mandates.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--surface-border-strong)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              尚无战略职责。点击右上角「+ 新建职责」建立第一条主线。
            </div>
          )}
          {bundle.mandates.map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5"
              style={{ borderLeftColor: MANDATE_STATUS_COLOR[m.status], borderLeftWidth: 3 }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-data text-xs text-[var(--color-accent)]">{m.code}</span>
                    <span className="text-base font-medium text-[var(--color-text-primary)]">{m.title}</span>
                    <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: MANDATE_STATUS_COLOR[m.status] + "20", color: MANDATE_STATUS_COLOR[m.status] }}>
                      {MANDATE_STATUS_LABEL[m.status]}
                    </span>
                    {m.theme && <span className="text-xs text-[var(--color-text-muted)]">· {m.theme}</span>}
                  </div>
                  {m.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-2xl">{m.description}</p>}
                  <div className="mt-1 flex gap-3 text-xs text-[var(--color-text-muted)]">
                    {m.linkedProjectCode && <span>项目 {m.linkedProjectCode}</span>}
                    {m.linkedAssumptionCode && <span>假设 {m.linkedAssumptionCode}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditHolding({ mandateId: m.id })}
                    className="rounded px-2 py-1 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10">+ 认领记录</button>
                  <button onClick={() => setEditMandate(m)} className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.04]">改</button>
                  <button onClick={() => del(`/api/mandate?id=${m.id}`)} className="rounded px-2 py-1 text-xs text-[var(--signal-red)] hover:bg-[var(--signal-red)]/10">删</button>
                </div>
              </div>

              {/* Timeline of holdings */}
              {m.holdings.length > 0 && (
                <div className="mt-4 space-y-0 border-l border-[var(--surface-border)] pl-4 ml-1">
                  {m.holdings.map((h) => (
                    <div key={h.id} className="relative pb-4 last:pb-0">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-bg-surface)]"
                        style={{ backgroundColor: HOLDING_STATUS_COLOR[h.status] }} />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{h.meetingTitle}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{MEETING_TYPE_LABEL[h.meetingType]}</span>
                        <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: HOLDING_STATUS_COLOR[h.status] + "20", color: HOLDING_STATUS_COLOR[h.status] }}>
                          {HOLDING_STATUS_LABEL[h.status]}
                        </span>
                      </div>
                      <div className="mt-0.5 text-sm">
                        <span className="font-medium text-[var(--color-text-primary)]">{h.holderName}</span>
                        <span className="text-[var(--color-text-muted)]"> · {h.holderRole}</span>
                      </div>
                      {h.commitment && h.commitment !== "—" && (
                        <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">承诺: {h.commitment}{h.deadline && ` (截止 ${h.deadline})`}</div>
                      )}
                      {h.deliveryNote && <div className="mt-0.5 text-xs" style={{ color: h.status === "MISSED" ? "var(--signal-red)" : "var(--color-text-muted)" }}>交账: {h.deliveryNote}</div>}
                      {h.handoverNote && <div className="mt-0.5 text-xs text-[var(--signal-yellow)]">移交: {h.handoverNote}{h.handoverToName && ` → ${h.handoverToName}`}</div>}
                      <div className="mt-1 flex gap-2">
                        <button onClick={() => setEditHolding({ ...h })} className="text-[10px] text-[var(--color-accent)] hover:underline">更新</button>
                        <button onClick={() => del(`/api/mandate/holding?id=${h.id}`)} className="text-[10px] text-[var(--signal-red)] hover:underline">删</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "meetings" && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">会议是职责被认领/交账/移交的时点。邀请时注明角色与议题责任,存档后永久保留。</p>
          {bundle.meetings.map((mt) => (
            <div key={mt.id} className="flex items-center justify-between rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{mt.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{MEETING_TYPE_LABEL[mt.meetingType]} · {mt.period}</span>
                  <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)]">{MEETING_STATUS_LABEL[mt.status]}</span>
                  {mt.holdingCount > 0 && <span className="text-[10px] text-[var(--color-accent)]">{mt.holdingCount} 条职责认领</span>}
                  {mt.todos.length > 0 && <span className="text-[10px] text-[var(--color-accent)]">待办 {mt.todos.filter(todo => todo.completed).length}/{mt.todos.length}</span>}
                </div>
                {mt.planLabel && <p className="mt-1 text-xs text-[var(--color-accent)]">关联战略: {mt.planLabel}</p>}
                {mt.participants.length > 0 && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">参会人员: {mt.participants.map(p => p.name).join("、")}</p>}
                {mt.agenda && <p className="mt-1 text-xs text-[var(--color-text-muted)]">议程: {mt.agenda}</p>}
                {mt.meetingDate && <p className="text-xs text-[var(--color-text-muted)]">{mt.meetingDate}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => openMeetingEditor(mt)} className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.04]">改</button>
                <button onClick={() => del(`/api/meeting?id=${mt.id}`)} className="rounded px-2 py-1 text-xs text-[var(--signal-red)] hover:bg-[var(--signal-red)]/10">删</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandate modal */}
      {editMandate && (
        <Modal title={editMandate.id ? "编辑战略职责" : "新建战略职责"} onClose={() => setEditMandate(null)}>
          <div className="space-y-3">
            {!editMandate.id && <input className={inp} placeholder="编号 如 M-V4" value={editMandate.code ?? ""} onChange={e => setEditMandate({ ...editMandate, code: e.target.value })} />}
            <input className={inp} placeholder="职责标题" value={editMandate.title ?? ""} onChange={e => setEditMandate({ ...editMandate, title: e.target.value })} />
            <input className={inp} placeholder="所属战略主题 (可选)" value={editMandate.theme ?? ""} onChange={e => setEditMandate({ ...editMandate, theme: e.target.value })} />
            <textarea rows={2} className={inp} placeholder="职责说明 (可选)" value={editMandate.description ?? ""} onChange={e => setEditMandate({ ...editMandate, description: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <select className={inp} value={editMandate.status ?? "ACTIVE"} onChange={e => setEditMandate({ ...editMandate, status: e.target.value as MandateStatus })}>
                {Object.entries(MANDATE_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input className={inp} placeholder="项目码" value={editMandate.linkedProjectCode ?? ""} onChange={e => setEditMandate({ ...editMandate, linkedProjectCode: e.target.value })} />
              <input className={inp} placeholder="假设码" value={editMandate.linkedAssumptionCode ?? ""} onChange={e => setEditMandate({ ...editMandate, linkedAssumptionCode: e.target.value })} />
            </div>
          </div>
          <ModalActions saving={saving} onCancel={() => setEditMandate(null)} onSave={async () => { if (await post("/api/mandate", editMandate, "已保存")) setEditMandate(null); }} />
        </Modal>
      )}

      {/* Meeting modal */}
      {editMeeting && (
        <Modal title={editMeeting.id ? "编辑会议" : "新建会议"} onClose={closeMeetingEditor} wide>
          <div className="space-y-3">
            <input className={inp} placeholder="会议标题" value={editMeeting.title ?? ""} onChange={e => setEditMeeting({ ...editMeeting, title: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">关联战略 <span className="text-[var(--signal-red)]">*</span></label>
              <select className={inp} value={editMeeting.planId ?? ""} onChange={e => setEditMeeting({ ...editMeeting, planId: e.target.value || null })}>
                <option value="">— 选择战略 —</option>
                {bundle.plans.map(plan => <option key={plan.id} value={plan.id}>{plan.label} · {plan.status}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className={inp} value={editMeeting.meetingType ?? "TOPIC"} onChange={e => setEditMeeting({ ...editMeeting, meetingType: e.target.value as Meeting["meetingType"] })}>
                {Object.entries(MEETING_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input className={inp} placeholder="period 如 2026-FY" value={editMeeting.period ?? ""} onChange={e => setEditMeeting({ ...editMeeting, period: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className={inp} value={editMeeting.meetingDate ?? ""} onChange={e => setEditMeeting({ ...editMeeting, meetingDate: e.target.value })} />
              <select className={inp} value={editMeeting.status ?? "INVITING"} onChange={e => setEditMeeting({ ...editMeeting, status: e.target.value as Meeting["status"] })}>
                {Object.entries(MEETING_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <textarea rows={2} className={inp} placeholder="议程/主题" value={editMeeting.agenda ?? ""} onChange={e => setEditMeeting({ ...editMeeting, agenda: e.target.value })} />
            <textarea rows={2} className={inp} placeholder="纪要 (可选)" value={editMeeting.notes ?? ""} onChange={e => setEditMeeting({ ...editMeeting, notes: e.target.value })} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">参会人员 <span className="text-[var(--signal-red)]">*</span></label>
                <span className="text-xs text-[var(--color-text-muted)]">已选 {(editMeeting.participantUserIds ?? []).length} 人</span>
              </div>
              {selectedMeetingUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMeetingUsers.map(user => (
                    <span key={user.id} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-2 py-1 text-xs text-[var(--color-accent)]">
                      {user.name}
                      <button type="button" onClick={() => toggleParticipant(user.id)} className="ml-0.5 text-sm leading-none" title={`移除 ${user.name}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  className={inp}
                  placeholder="搜索姓名、角色或组织"
                  value={participantSearch}
                  onFocus={() => setParticipantPickerOpen(true)}
                  onBlur={() => setParticipantPickerOpen(false)}
                  onChange={e => { setParticipantSearch(e.target.value); setParticipantPickerOpen(true); }}
                />
                {participantPickerOpen && (
                  <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-1 shadow-lg">
                    {participantCandidates.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">没有匹配人员</div>
                    ) : participantCandidates.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { toggleParticipant(user.id); setParticipantSearch(""); setParticipantPickerOpen(true); }}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-black/[0.04]"
                      >
                        <span className="font-medium text-[var(--color-text-primary)]">{user.name}</span>
                        <span className="ml-3 text-[var(--color-text-muted)]">{user.role}{user.orgUnitName ? ` · ${user.orgUnitName}` : ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {editMeeting.id && (
              <div className="space-y-2 border-t border-[var(--surface-border)] pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">会议待办</div>
                    <div className="text-xs text-[var(--color-text-muted)]">修改会议时可新增、分派和完成待办</div>
                  </div>
                  <button type="button" onClick={addTodo} className="rounded-md border border-[var(--color-accent)] px-2.5 py-1 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5">+ 添加待办</button>
                </div>
                {(editMeeting.todos ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--surface-border)] p-4 text-center text-xs text-[var(--color-text-muted)]">暂无待办</div>
                )}
                {(editMeeting.todos ?? []).map((todo, index) => (
                  <div key={todo.id ?? `new-${index}`} className="rounded-lg border border-[var(--surface-border)] p-3">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" className="mt-2" checked={todo.completed} onChange={e => updateTodo(index, { completed: e.target.checked })} title="标记完成" />
                      <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_160px_140px]">
                        <input className={inp} placeholder="待办事项" value={todo.title} onChange={e => updateTodo(index, { title: e.target.value })} />
                        <TodoOwnerPicker
                          key={`${todo.id ?? `new-${index}`}-${todo.ownerUserId ?? "unassigned"}`}
                          users={bundle.users}
                          participantUserIds={selectedParticipantIds}
                          ownerUserId={todo.ownerUserId}
                          ownerName={todo.ownerName}
                          onChange={(owner) => updateTodo(index, {
                            ownerUserId: owner?.id ?? null,
                            ownerName: owner?.name ?? null,
                          })}
                        />
                        <input type="date" className={inp} value={todo.dueDate ?? ""} onChange={e => updateTodo(index, { dueDate: e.target.value || null })} />
                      </div>
                      <button type="button" onClick={() => removeTodo(index)} className="mt-1 rounded px-2 py-1 text-xs text-[var(--signal-red)] hover:bg-[var(--signal-red)]/10">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ModalActions saving={saving} onCancel={closeMeetingEditor} onSave={async () => { if (await post("/api/meeting", editMeeting, "已保存")) closeMeetingEditor(); }} />
        </Modal>
      )}

      {/* Holding modal */}
      {editHolding && (
        <Modal title={editHolding.id ? "更新认领记录" : "新增认领记录"} onClose={() => setEditHolding(null)}>
          <div className="space-y-3">
            {!editHolding.id && (
              <select className={inp} value={editHolding.meetingId ?? ""} onChange={e => setEditHolding({ ...editHolding, meetingId: e.target.value })}>
                <option value="">— 选择会议 —</option>
                {bundle.meetings.map(mt => <option key={mt.id} value={mt.id}>{mt.title}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="当期责任人姓名" value={editHolding.holderName ?? ""} onChange={e => setEditHolding({ ...editHolding, holderName: e.target.value })} />
              <input className={inp} placeholder="当期参会角色" value={editHolding.holderRole ?? ""} onChange={e => setEditHolding({ ...editHolding, holderRole: e.target.value })} />
            </div>
            <select className={inp} value={editHolding.status ?? "CLAIMED"} onChange={e => setEditHolding({ ...editHolding, status: e.target.value as HoldingStatus })}>
              {Object.entries(HOLDING_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea rows={2} className={inp} placeholder="本期承诺内容" value={editHolding.commitment ?? ""} onChange={e => setEditHolding({ ...editHolding, commitment: e.target.value })} />
            <input type="date" className={inp} value={editHolding.deadline ?? ""} onChange={e => setEditHolding({ ...editHolding, deadline: e.target.value })} />
            <textarea rows={2} className={inp} placeholder="交账说明 (如已交账)" value={editHolding.deliveryNote ?? ""} onChange={e => setEditHolding({ ...editHolding, deliveryNote: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="移交说明 (如换人)" value={editHolding.handoverNote ?? ""} onChange={e => setEditHolding({ ...editHolding, handoverNote: e.target.value })} />
              <input className={inp} placeholder="移交给谁" value={editHolding.handoverToName ?? ""} onChange={e => setEditHolding({ ...editHolding, handoverToName: e.target.value })} />
            </div>
          </div>
          <ModalActions saving={saving} onCancel={() => setEditHolding(null)} onSave={async () => { if (await post("/api/mandate/holding", editHolding, "已保存")) setEditHolding(null); }} />
        </Modal>
      )}
    </div>
  );
}

function TodoOwnerPicker({
  users,
  participantUserIds,
  ownerUserId,
  ownerName,
  onChange,
}: {
  users: MandateBundle["users"];
  participantUserIds: string[];
  ownerUserId?: string | null;
  ownerName?: string | null;
  onChange: (owner: MandateBundle["users"][number] | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedOwner = users.find((user) => user.id === ownerUserId);
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = [...users]
    .filter((user) => !normalizedQuery ||
      `${user.name} ${user.role} ${user.orgUnitName ?? ""}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) =>
      Number(participantUserIds.includes(b.id)) - Number(participantUserIds.includes(a.id)) ||
      a.name.localeCompare(b.name, "zh-CN"))
    .slice(0, 8);

  return (
    <div className="relative">
      <input
        className={inp}
        placeholder="搜索责任人"
        value={open ? query : selectedOwner?.name ?? ownerName ?? ""}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onBlur={() => setOpen(false)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-52 w-full min-w-56 overflow-y-auto rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-1 shadow-lg">
          {(ownerUserId || ownerName) && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(null); setQuery(""); setOpen(false); }}
              className="w-full rounded-md px-3 py-2 text-left text-xs text-[var(--color-text-muted)] hover:bg-black/[0.04]"
            >
              清除责任人
            </button>
          )}
          {candidates.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">没有匹配人员</div>
          ) : candidates.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(user); setQuery(""); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-black/[0.04]"
            >
              <span className="font-medium text-[var(--color-text-primary)]">{user.name}</span>
              <span className="ml-3 whitespace-nowrap text-[var(--color-text-muted)]">
                {user.role}{participantUserIds.includes(user.id) ? " · 参会" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6 shadow-xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onCancel} className="rounded-md border border-[var(--surface-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-black/[0.04]">取消</button>
      <button disabled={saving} onClick={onSave} className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "保存中…" : "保存"}</button>
    </div>
  );
}
