import type {
  BalanceSheet,
  CashFlowStatement,
  IncomeStatement,
  StatementLine,
} from "@/lib/fpa/management-types";

function StatementTable({
  title,
  lines,
  sections,
}: {
  title: string;
  lines?: StatementLine[];
  sections?: { heading: string; lines: StatementLine[] }[];
}) {
  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] overflow-hidden">
      <div className="border-b border-[var(--surface-border)] px-6 py-3">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs text-[#828c8d]">
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
                  ...s.lines.map((row) => <Row key={row.key} row={row} />),
                ])
              : lines?.map((row) => <Row key={row.key} row={row} />)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ row }: { row: StatementLine }) {
  const pad = row.level ? "pl-10" : "pl-6";
  return (
    <tr className={`border-t border-[var(--surface-border)] ${row.emphasis ? "bg-black/[0.02]" : ""}`}>
      <td className={`${pad} py-2.5 ${row.emphasis ? "font-medium" : "text-[#828c8d]"}`}>
        {row.label}
      </td>
      <td className="px-4 py-2.5 text-right font-data text-[#828c8d]">{row.budget.toLocaleString()}</td>
      <td className="px-4 py-2.5 text-right font-data">{row.actual.toLocaleString()}</td>
      <td className="px-4 py-2.5 text-right font-data text-[#828c8d]">{row.forecast.toLocaleString()}</td>
    </tr>
  );
}

export function IncomeStatementPanel({ statement }: { statement: IncomeStatement }) {
  return (
    <StatementTable
      title={`利润表 · ${statement.period}（${statement.unit}）`}
      lines={statement.lines}
    />
  );
}

export function BalanceSheetPanel({ sheet }: { sheet: BalanceSheet }) {
  return (
    <StatementTable
      title={`资产负债表 · ${sheet.period}（${sheet.unit}）`}
      sections={[
        { heading: "资产", lines: sheet.assets },
        { heading: "负债", lines: sheet.liabilities },
        { heading: "所有者权益", lines: sheet.equity },
      ]}
    />
  );
}

export function CashFlowStatementPanel({ statement }: { statement: CashFlowStatement }) {
  return (
    <StatementTable
      title={`现金流量表 · ${statement.period}（${statement.unit}）`}
      lines={statement.lines}
    />
  );
}
