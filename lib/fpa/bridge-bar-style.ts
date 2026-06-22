/** Margin-bridge bar fill from item value semantics (shared with ManagementReportPanel). */
export function bridgeBarStyle(item: { label: string; value: number }): string {
  if (item.label.startsWith("=")) return "var(--chart-bridge-total)";
  if (item.value < 0) return "var(--chart-bridge-negative)";
  if (item.value > 0) return "var(--chart-bridge-positive)";
  return "var(--chart-bridge-track)";
}
