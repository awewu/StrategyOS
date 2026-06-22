import { resolveDataTrust } from "@/lib/data/data-trust";

export async function DataSourceBanner() {
  const trust = await resolveDataTrust();
  return (
    <div className="mb-5 flex items-center gap-2" role="status">
      <span
        className={`stratos-chip ${trust.isDemo ? "stratos-chip--warn" : "stratos-chip--ok"}`}
      >
        {trust.label}
      </span>
    </div>
  );
}
