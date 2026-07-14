import type {
  BalanceSheet,
  CashFlowStatement,
  IncomeStatement,
  StatementLine,
} from "@/lib/fpa/management-types";

type LinePatch = (key: string, field: keyof StatementLine, value: string | number) => void;

function StatementTable({
  title,
  lines,
  sections,
  editing,
  onLinePatch,
}: {
  title: string;
  lines?: StatementLine[];
  sections?: { heading: string; lines: StatementLine[] }[];
  editing?: boolean;
  onLinePatch?: LinePatch;
}) {
  return (
    <section className="stratos-card overflow-hidden">
      <div className="border-b border-[var(--surface-border)] px-6 py-3">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-caption">
              <th className="px-6 py-2 font-normal">科目</th>
              <th className="px-4 py-2 text-right font-normal">Budget</th>
              <th className="px-4 py-2 text-right font-normal">Actual</th>
              <th className="px-4 py-2 text-right font-normal">Forecast</th>
            </tr>
          </thead>
          <tbody>
            {sections
              ? sections.flatMap((s) => [
                  <tr key={`h-${s.heading}`}>
                    <td colSpan={4} className="bg-black/[0.03] px-6 py-2 text-xs font-medium text-[var(--color-accent)]">
                      {s.heading}
                    </td>
                  </tr>,
                  ...s.lines.map((row) => (
                    <Row key={row.key} row={row} editing={editing} onLinePatch={onLinePatch} />
                  )),
                ])
              : lines?.map((row) => (
                  <Row key={row.key} row={row} editing={editing} onLinePatch={onLinePatch} />
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({
  row,
  editing,
  onLinePatch,
}: {
  row: StatementLine;
  editing?: boolean;
  onLinePatch?: LinePatch;
}) {
  const pad = row.level ? "pl-10" : "pl-6";

  if (editing && onLinePatch) {
    return (
      <tr className={`border-t border-[var(--surface-border)] ${row.emphasis ? "bg-black/[0.02]" : ""}`}>
        <td className={`${pad} py-2`}>
          <input
            className="w-full min-w-[8rem] rounded border border-[var(--surface-border)] px-2 py-1 text-xs"
            value={row.label}
            onChange={(e) => onLinePatch(row.key, "label", e.target.value)}
          />
        </td>
        {(["budget", "actual", "forecast"] as const).map((field) => (
          <td key={field} className="px-2 py-2">
            <input
              type="number"
              className="w-full min-w-[4.5rem] rounded border border-[var(--surface-border)] px-2 py-1 text-right font-data text-xs"
              value={row[field]}
              onChange={(e) => onLinePatch(row.key, field, Number(e.target.value))}
            />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <tr className={`border-t border-[var(--surface-border)] ${row.emphasis ? "bg-black/[0.02]" : ""}`}>
      <td className={`${pad} py-2.5 ${row.emphasis ? "font-medium" : "text-[var(--color-text-muted)]"}`}>
        {row.label}
      </td>
      <td className="px-4 py-2.5 text-right font-data text-[var(--color-text-muted)]">{row.budget.toLocaleString()}</td>
      <td className="px-4 py-2.5 text-right font-data">{row.actual.toLocaleString()}</td>
      <td className="px-4 py-2.5 text-right font-data text-[var(--color-text-muted)]">{row.forecast.toLocaleString()}</td>
    </tr>
  );
}

export function IncomeStatementPanel({
  statement,
  editing,
  onLinePatch,
}: {
  statement: IncomeStatement;
  editing?: boolean;
  onLinePatch?: LinePatch;
}) {
  return (
    <StatementTable
      title={`利润表 · ${statement.period}（${statement.unit}）`}
      lines={statement.lines}
      editing={editing}
      onLinePatch={onLinePatch}
    />
  );
}

export function BalanceSheetPanel({
  sheet,
  editing,
  onLinePatch,
}: {
  sheet: BalanceSheet;
  editing?: boolean;
  onLinePatch?: LinePatch;
}) {
  return (
    <StatementTable
      title={`资产负债表 · ${sheet.period}（${sheet.unit}）`}
      sections={[
        { heading: "资产", lines: sheet.assets },
        { heading: "负债", lines: sheet.liabilities },
        { heading: "所有者权益", lines: sheet.equity },
      ]}
      editing={editing}
      onLinePatch={onLinePatch}
    />
  );
}

export function CashFlowStatementPanel({
  statement,
  editing,
  onLinePatch,
}: {
  statement: CashFlowStatement;
  editing?: boolean;
  onLinePatch?: LinePatch;
}) {
  return (
    <StatementTable
      title={`现金流量表 · ${statement.period}（${statement.unit}）`}
      lines={statement.lines}
      editing={editing}
      onLinePatch={onLinePatch}
    />
  );
}

export type { LinePatch };
