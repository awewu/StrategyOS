import type { CynefinDomain } from "@/lib/types/stratos";

const HINT: Record<CynefinDomain, string> = {
  clear: "监控主轴：KPI 达成率",
  complicated: "监控主轴：KPI + 里程碑成果",
  complex: "监控主轴：领先指标 + 试点（4DX 优先）",
  chaotic: "监控主轴：48h 行动项 · 暂停年度 KPI",
};

const STYLE: Record<CynefinDomain, string> = {
  clear: "bg-[color-mix(in_srgb,var(--color-text-muted)_18%,white)] text-[var(--color-text-secondary)]",
  complicated: "bg-[var(--accent-sim-dim)] text-[var(--accent-sim)]",
  complex: "bg-[color-mix(in_srgb,var(--bsc-customer)_14%,white)] text-[var(--bsc-customer)]",
  chaotic: "bg-[color-mix(in_srgb,var(--signal-red)_14%,white)] text-[var(--signal-red-text)]",
};

const LABEL: Record<CynefinDomain, string> = {
  clear: "清晰",
  complicated: "繁杂",
  complex: "复杂",
  chaotic: "混沌",
};

export function CynefinBadge({ domain }: { domain: CynefinDomain }) {
  return (
    <span
      title={HINT[domain]}
      className={`cursor-help rounded px-2 py-0.5 text-xs font-medium ${STYLE[domain]}`}
    >
      {LABEL[domain]}
    </span>
  );
}
