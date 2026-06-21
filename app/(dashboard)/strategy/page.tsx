import { ChinaStrategyOnePager } from "@/components/strategy/ChinaStrategyOnePager";
import { getEffectiveRole } from "@/lib/auth/guard";
import { getStrategyOnePagerForViewer } from "@/lib/strategy/one-pager-store";

export default async function StrategyPage() {
  const role = await getEffectiveRole();
  const record = await getStrategyOnePagerForViewer(role);
  return <ChinaStrategyOnePager initial={record} />;
}
