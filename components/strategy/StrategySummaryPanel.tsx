import type { StrategicDiagnosis, InvestmentCase, ProductBet, GtmBet } from "@/lib/types/stratos";
import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

const BSC_COLOR: Record<string, string> = {
  financial: "var(--bsc-financial)", customer: "var(--bsc-customer)",
  process: "var(--bsc-process)", learning: "var(--bsc-learning)",
};

const TIER_CONFIG = [
  { key: "invest",   label: "Invest to Grow",         color: "var(--color-accent)", dot: "bg-[var(--color-accent)]" },
  { key: "innovate", label: "Innovate to Lead",        color: "#60a5fa",             dot: "bg-[#60a5fa]" },
  { key: "deliver",  label: "Deliver on Commitments",  color: "var(--signal-green)", dot: "bg-[var(--signal-green)]" },
];

function LeftPanel({ diagnosis, brandCards }: {
  diagnosis: StrategicDiagnosis;
  brandCards: { brandCode: string; whereToPlay: string; howToWin: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">市场驱动力</div>
        <p className="text-sm font-medium leading-snug text-[var(--color-text-primary)]">{diagnosis.challengeStatement}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)]">
          <span className="rounded bg-black/[0.04] px-2 py-0.5">瓶颈·{diagnosis.bottleneckType}</span>
          <span className="rounded bg-black/[0.04] px-2 py-0.5">枢纽·{diagnosis.crux}</span>
        </div>
      </div>
      <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">品牌优势</div>
        <div className="space-y-2">
          {brandCards.map((b) => (
            <div key={b.brandCode} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 flex-shrink-0 rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                {b.brandCode}
              </span>
              <div className="min-w-0">
                <div className="text-[var(--color-text-secondary)]">{b.whereToPlay}</div>
                <div className="text-[var(--color-text-muted)]">{b.howToWin}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiddlePanel({ ics, productBets, gtmBets }: {
  ics: InvestmentCase[]; productBets: ProductBet[]; gtmBets: GtmBet[];
}) {
  const tiers = [
    { ...TIER_CONFIG[0], items: ics.map((i) => i.title) },
    { ...TIER_CONFIG[1], items: productBets.map((p) => p.title) },
    { ...TIER_CONFIG[2], items: gtmBets.map((g) => g.title) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">战略重点</div>
      {tiers.map((tier) => (
        <div key={tier.key} className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${tier.dot}`} />
            <span className="text-sm font-semibold" style={{ color: tier.color }}>{tier.label}</span>
          </div>
          <ul className="space-y-1">
            {tier.items.length > 0 ? tier.items.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <span className="mt-1 flex-shrink-0 text-[var(--color-text-muted)]">·</span>{item}
              </li>
            )) : <li className="text-xs italic text-[var(--color-text-muted)]">—</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RightPanel({ bscCards, period }: {
  bscCards: { key: string; label: string; satisfaction: string; target: string; light: TrafficLight }[];
  period: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        关键目标 · {period}
      </div>
      {bscCards.map((c) => (
        <div key={c.key}
          className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4"
          style={{ borderLeftColor: BSC_COLOR[c.key], borderLeftWidth: 3 }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: BSC_COLOR[c.key] + "b0" }}>{c.satisfaction}</div>
              <div className="mt-0.5 text-sm font-semibold" style={{ color: BSC_COLOR[c.key] }}>{c.label}</div>
            </div>
            <TrafficLightDot signal={c.light} />
          </div>
          <div className="mt-2 font-data text-xs tabular-nums text-[var(--color-text-secondary)]">{c.target}</div>
        </div>
      ))}
    </div>
  );
}

export function StrategySummaryPanel({ diagnosis, brandCards, ics, productBets, gtmBets, bscCards, period }: {
  diagnosis: StrategicDiagnosis;
  brandCards: { brandCode: string; whereToPlay: string; howToWin: string }[];
  ics: InvestmentCase[]; productBets: ProductBet[]; gtmBets: GtmBet[];
  bscCards: { key: string; label: string; satisfaction: string; target: string; light: TrafficLight }[];
  period: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">战略总览</h2>
        <span className="text-xs text-[var(--color-text-muted)]">{period}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <LeftPanel diagnosis={diagnosis} brandCards={brandCards} />
        <MiddlePanel ics={ics} productBets={productBets} gtmBets={gtmBets} />
        <RightPanel bscCards={bscCards} period={period} />
      </div>
    </section>
  );
}
