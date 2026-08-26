import type { IntelSource } from "@/lib/market-intel/types";
import { SOURCE_LABEL } from "@/lib/market-intel/types";

export function BlindSpotPanel({
  blindSpots,
  sources,
}: {
  blindSpots: string[];
  sources: IntelSource[];
}) {
  if (blindSpots.length === 0) return null;
  return (
    <section className="rounded-lg border border-[var(--signal-yellow)]/40 bg-[var(--signal-yellow)]/[0.04] p-5">
      <h2 className="mb-3 text-sm font-medium text-[var(--signal-yellow-text)]">
        情报盲区 · {blindSpots.length} 处 — 缺失即预警
      </h2>
      <ul className="space-y-1.5">
        {blindSpots.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal-yellow)]" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-[var(--signal-yellow)]/20 pt-3">
        <p className="text-caption">来源清单（{sources.length} 个登记）</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sources.map((s) => (
            <span
              key={s.id}
              className={`rounded-md px-2 py-1 text-xs ${
                s.health === "active"
                  ? "bg-[var(--signal-green)]/10 text-[var(--signal-green-text)]"
                  : s.health === "stale"
                    ? "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow-text)]"
                    : "bg-[var(--signal-red)]/10 text-[var(--signal-red-text)]"
              }`}
            >
              {s.competitor} · {SOURCE_LABEL[s.kind]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
