import type { AlertItem } from "@/lib/panorama/scr";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

export function TopAlertsPanel({ alerts, embedded = false }: { alerts: AlertItem[]; embedded?: boolean }) {
  const list =
    alerts.length === 0 ? (
      <p className="text-sm text-[var(--color-text-muted)]">当前无硬阻断预警</p>
    ) : (
      <ul className="space-y-3">
        {alerts.map((a) => (
          <li key={a.id} className="flex gap-3 text-sm">
            <TrafficLightDot signal={a.severity === "critical" ? "red" : "yellow"} />
            <span>{a.message}</span>
          </li>
        ))}
      </ul>
    );

  if (embedded) return list;

  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">Top 预警 · ≤3</h2>
      {list}
    </div>
  );
}
