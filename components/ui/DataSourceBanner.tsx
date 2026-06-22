import { resolveDataTrust } from "@/lib/data/data-trust";

export async function DataSourceBanner() {
  const trust = await resolveDataTrust();
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-2 text-xs font-medium ${
        trust.isDemo
          ? "border-amber-500/30 bg-amber-500/10 text-amber-800"
          : "border-green-600/20 bg-green-600/5 text-green-800"
      }`}
      role="status"
    >
      {trust.label}
    </div>
  );
}
