import type { GateChecklist, GateItem, GateStatus } from "@/lib/gates/checklists";

const STATUS: Record<GateStatus, { label: string; className: string }> = {
  pass: { label: "是", className: "text-[var(--signal-green)]" },
  fail: { label: "否", className: "text-[var(--signal-red)]" },
  partial: { label: "部分", className: "text-[var(--signal-yellow)]" },
};

function GateItemRow({ item }: { item: GateItem }) {
  const s = STATUS[item.status];
  return (
    <li className="flex gap-3 border-t border-black/[0.06] py-3 text-sm first:border-0">
      <span className={`w-10 shrink-0 font-medium ${s.className}`}>{s.label}</span>
      <div>
        <span>{item.label}</span>
        {item.note && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.note}</p>}
      </div>
    </li>
  );
}

export function GateChecklistPanel({ checklist }: { checklist: GateChecklist }) {
  const risks = checklist.items.filter((i) => i.status !== "pass");

  return (
    <section className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{checklist.title}</h3>
        {checklist.doctrine && (
          <span className="text-xs text-[var(--color-accent-gold)]">{checklist.doctrine}</span>
        )}
      </div>
      <ul>
        {checklist.items.map((item) => (
          <GateItemRow key={item.id} item={item} />
        ))}
      </ul>
      {risks.length > 0 && (
        <div className="mt-4 rounded border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5 px-3 py-2 text-xs">
          风险清单 {risks.length} 项 → 战略会议题候选
        </div>
      )}
    </section>
  );
}
