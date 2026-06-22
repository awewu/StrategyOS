import { colors } from "@/lib/brand/tokens";

export function GtmStackPanel({
  segments,
}: {
  segments: Array<{
    code: string;
    name: string;
    priority: string;
    coverage: string;
    ltvCac: string;
  }>;
}) {
  return (
    <section className="rounded-lg border border-[var(--stack-gtm)]/30 bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium" style={{ color: colors.stackGtm }}>
        GtmStack · Deliver on Commitment
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">段</th>
              <th className="pb-2">优先级</th>
              <th className="pb-2">覆盖</th>
              <th className="pb-2">LTV:CAC</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.code} className="border-t border-[var(--surface-border)]">
                <td className="py-2">
                  <span className="font-data text-xs text-[var(--color-accent)]">{s.code}</span>
                  <div>{s.name}</div>
                </td>
                <td className="py-2">{s.priority}</td>
                <td className="py-2 font-data">{s.coverage}</td>
                <td className="py-2">{s.ltvCac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
