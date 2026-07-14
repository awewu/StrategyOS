import type { MaPipelineItem } from "@/lib/types/stratos";

const STAGE_ORDER = ["watch", "screen", "dd", "signed", "integrating"] as const;
const STAGE_LABEL: Record<string, string> = {
  watch: "Watch",
  screen: "Screen",
  dd: "DD",
  signed: "Signed",
  integrating: "Integrating",
};
const DIR_LABEL: Record<string, string> = {
  channel: "渠道",
  tech: "技术",
  jv: "合资",
  brand: "品牌",
};

export function MaPipelinePanel({ items }: { items: MaPipelineItem[] }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-muted)]">
        M&A 四方向管道 · watch → integrating · 100 天整合里程碑
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGE_ORDER.map((stage) => {
          const col = items.filter((i) => i.stage === stage);
          return (
            <div key={stage} className="min-w-[220px] flex-1 rounded-lg bg-black/[0.04] p-3">
              <div className="mb-3 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                {STAGE_LABEL[stage]}
              </div>
              <div className="space-y-2">
                {col.map((item) => (
                  <div
                    key={item.id}
                    className="rounded border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3"
                  >
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-accent)]">
                      {DIR_LABEL[item.direction]} · {item.valuationRange}
                    </div>
                    <p className="mt-2 text-caption">
                      {item.synergyThesis}
                    </p>
                    {item.integrationMilestone100d && (
                      <p className="mt-2 border-t border-[var(--surface-border)] pt-2 text-[11px] text-[var(--signal-green)]">
                        D100: {item.integrationMilestone100d}
                      </p>
                    )}
                    {item.linkedAssumptionCodes.length > 0 && (
                      <div className="mt-1 text-caption">
                        Hx: {item.linkedAssumptionCodes.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
                {col.length === 0 && (
                  <div className="py-6 text-center text-caption">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
