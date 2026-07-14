import type { DecisionLedger, GateReversal } from "@/lib/review/decision-ledger";

const OBJECT_LABEL: Record<GateReversal["objectType"], string> = {
  investment_case: "投资",
  product_bet: "产品",
  gtm_bet: "GTM",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "approved",
  post_invest: "post_invest",
  killed: "killed",
  rejected: "rejected",
  deferred: "deferred",
  draft: "draft",
  review: "review",
  missing: "本版失踪",
};

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--surface-border)] p-3">
      <div className="text-caption">{label}</div>
      <div className="font-data mt-1 text-xl text-[var(--color-text-primary)]">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{sub}</div>}
    </div>
  );
}

export function DecisionLedgerPanel({
  ledger,
  fromCode,
  toCode,
  isDemoBaseline,
}: {
  ledger: DecisionLedger;
  fromCode: string;
  toCode: string;
  isDemoBaseline: boolean;
}) {
  const { gate, revivals, assumptions, forecast } = ledger;

  return (
    <section className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-bg-surface)] p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium text-[var(--color-accent)]">
          决策记分卡 · 我们上一版的判断对了几成
        </h2>
        <span className="font-data text-caption">
          {fromCode} → {toCode}
        </span>
        {isDemoBaseline && (
          <span className="stratos-chip stratos-chip--warn text-[11px]">演示基线</span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          label="go 判断命中率"
          value={gate.hitRatePct === null ? "—" : `${gate.hitRatePct}%`}
          sub={`${gate.held}/${gate.total} 项 go 后仍存活`}
        />
        <Metric
          label="kill 后复活"
          value={String(revivals.length)}
          sub={revivals.length > 0 ? "当初否决可能过严" : "无错杀信号"}
        />
        <Metric
          label="假设结案率"
          value={assumptions.resolutionRatePct === null ? "—" : `${assumptions.resolutionRatePct}%`}
          sub={`${assumptions.resolved}/${assumptions.pendingAtFrom} 结案 · ${assumptions.failed} 证伪`}
        />
        <Metric
          label="营收预测偏差"
          value={
            forecast.revenueBiasPct === null
              ? "—"
              : `${forecast.revenueBiasPct > 0 ? "+" : ""}${forecast.revenueBiasPct}%`
          }
          sub={
            forecast.revenueBiasPct === null
              ? "缺 forecast/actual"
              : forecast.revenueBiasPct > 0
                ? "预测偏乐观"
                : "预测偏保守"
          }
        />
      </div>

      {gate.reversals.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-caption">go 后翻车清单</div>
          <ul className="space-y-1">
            {gate.reversals.map((r, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)]">
                <span className="text-[var(--signal-red)]">▾</span>{" "}
                [{OBJECT_LABEL[r.objectType]}] {r.title}
                <span className="font-data ml-2 text-[11px] text-[var(--color-text-muted)]">
                  {STATUS_LABEL[r.fromStatus] ?? r.fromStatus} → {STATUS_LABEL[r.toStatus] ?? r.toStatus}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {revivals.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-caption">kill 后复活清单</div>
          <ul className="space-y-1">
            {revivals.map((r, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)]">
                <span className="text-[var(--signal-yellow)]">▴</span>{" "}
                [{OBJECT_LABEL[r.objectType]}] {r.title}
                <span className="font-data ml-2 text-[11px] text-[var(--color-text-muted)]">
                  {STATUS_LABEL[r.fromStatus] ?? r.fromStatus} → {STATUS_LABEL[r.toStatus] ?? r.toStatus}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {assumptions.newlyFailed.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-caption">本版被证伪的假设</div>
          <ul className="space-y-1">
            {assumptions.newlyFailed.map((a, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)]">✗ {a}</li>
            ))}
          </ul>
        </div>
      )}

      {ledger.prompts.length > 0 && (
        <div className="mt-4 rounded-md border border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/5 p-3">
          <div className="mb-1 text-xs font-medium text-[var(--signal-yellow)]">复盘提示 · 建议进战略会议程</div>
          <ul className="space-y-1">
            {ledger.prompts.map((p, i) => (
              <li key={i} className="text-xs text-[var(--color-text-primary)]">· {p}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
