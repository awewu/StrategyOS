import type { Scenario } from "@/lib/types/stratos";

export function ScenarioAdvisor({ scenarios, embedded = false }: { scenarios: Scenario[]; embedded?: boolean }) {
  const risky = scenarios.find((s) => s.fpaImpact.runwayMonths < 3);
  const emergent = scenarios.find((s) => s.name === "乐观");

  const body = (
    <>
      <ul className="space-y-2 text-sm">
        <li>
          · 加权 runway{" "}
          <span className="font-data text-[var(--signal-red)]">
            {(
              scenarios.reduce((a, s) => a + s.fpaImpact.runwayMonths * (s.probability / 100), 0)
            ).toFixed(1)}{" "}
            月
          </span>
          {risky && " — 悲观情景触发一票否决风险"}
        </li>
        {emergent && (
          <li>
            · 乐观情景 {emergent.probability}%：{emergent.drivers[0]} — 建议写入涌现复盘
          </li>
        )}
        <li className="text-[var(--color-text-muted)]">· 下季更新概率 · 驱动变量联动 FPA 输入</li>
      </ul>
      <a href="/finance?tab=scenarios" className="mt-3 inline-block text-sm text-[var(--color-accent)] hover:underline">
        打开情景模型 →
      </a>
    </>
  );

  if (embedded) return body;

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-3 text-sm font-medium text-[var(--color-text-muted)]">战略顾问 · SPBP 情景摘要</h2>
      {body}
    </section>
  );
}
