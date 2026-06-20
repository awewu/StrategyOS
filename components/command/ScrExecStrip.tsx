import { ExecutiveSummary } from "@/components/ui/ExecutiveSummary";
import type { ScrSummary } from "@/lib/panorama/scr";

/** @deprecated Use ExecutiveSummary — kept for backward compatibility */
export function ScrExecStrip({ scr }: { scr: ScrSummary }) {
  return <ExecutiveSummary scr={scr} />;
}
