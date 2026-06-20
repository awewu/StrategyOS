import type { HealthAssertion } from "@/lib/types/stratos";

export function HardBlockBar({ assertions }: { assertions: HealthAssertion[] }) {
  const active = assertions.filter((a) => a.active && !a.ceoExceptionNote);
  if (active.length === 0) return null;

  return (
    <div className="w-full bg-[#8b0e04] px-6 py-3 text-center text-sm font-medium text-white">
      {active.map((a) => (
        <span key={a.id}>
          {a.message}
          {a.sourceReportId && (
            <span className="ml-2 opacity-80">· 来源 {a.sourceReportId}</span>
          )}
          {" · 须 CEO 确认例外或 remedial Vx"}
        </span>
      ))}
    </div>
  );
}
