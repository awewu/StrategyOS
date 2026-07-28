export interface ReadonlyOrgPlanningRow {
  name: string;
  role: string;
  headcount: string;
  headcount2026: string;
  headcount2027: string;
  headcount2028: string;
  note: string;
}

export function ReadonlyOrgPlanningTable({ rows }: { rows: ReadonlyOrgPlanningRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">暂无内容</p>;
  }

  return (
    <div className="stratos-table-wrap max-w-full min-w-0">
      <table className="stratos-table table-fixed text-xs" style={{ minWidth: 920 }}>
        <thead>
          <tr>
            <th className="w-32">部门/岗位</th>
            <th>职能</th>
            <th className="w-24 text-center">现有编制</th>
            <th className="w-24 text-center">2026</th>
            <th className="w-24 text-center">2027</th>
            <th className="w-24 text-center">2028</th>
            <th className="w-52">备注</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.name}-${index}`}>
              <td><span className="block whitespace-pre-line break-words leading-relaxed">{row.name}</span></td>
              <td><span className="block whitespace-pre-line break-words leading-relaxed">{row.role}</span></td>
              <td className="text-center">{row.headcount}</td>
              <td className="text-center">{row.headcount2026}</td>
              <td className="text-center">{row.headcount2027}</td>
              <td className="text-center">{row.headcount2028}</td>
              <td><span className="block whitespace-pre-line break-words leading-relaxed">{row.note}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
