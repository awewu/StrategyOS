import type { CynefinDomain } from "@/lib/types/stratos";

const HINT: Record<CynefinDomain, string> = {
  clear: "监控主轴：KPI 达成率",
  complicated: "监控主轴：KPI + 里程碑成果",
  complex: "监控主轴：领先指标 + 试点（4DX 优先）",
  chaotic: "监控主轴：48h 行动项 · 暂停年度 KPI",
};

const STYLE: Record<CynefinDomain, string> = {
  clear: "bg-slate-600/40 text-slate-200",
  complicated: "bg-violet-500/20 text-violet-200",
  complex: "bg-sky-500/20 text-sky-200",
  chaotic: "bg-[#8b0e04]/30 text-orange-200",
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
