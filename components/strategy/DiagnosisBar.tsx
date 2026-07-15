import type { StrategicDiagnosis } from "@/lib/types/stratos";

export function DiagnosisBar({ diagnosis }: { diagnosis: StrategicDiagnosis }) {
  const bottleneck: Record<string, string> = {
    capability: "能力",
    market: "市场",
    organization: "组织",
    capital: "资本",
  };

  return (
    <section className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--surface-panel)] p-6">
      <div className="mb-2 text-xs tracking-wide text-[var(--color-accent)]">
        Rumelt 诊断 · Diagnosis
      </div>
      <p className="text-xl font-medium leading-snug">{diagnosis.challengeStatement}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
        <span>瓶颈：{bottleneck[diagnosis.bottleneckType]}</span>
        <span>枢纽：{diagnosis.crux}</span>
        <span className="rounded bg-[color-mix(in_srgb,var(--signal-green)_20%,transparent)] px-2 py-0.5 text-[var(--signal-green)]">{diagnosis.status}</span>
      </div>
    </section>
  );
}
