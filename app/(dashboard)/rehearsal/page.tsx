import { RehearsalWalkthrough } from "@/components/rehearsal/RehearsalWalkthrough";
import { getRehearsalBundle } from "@/lib/data/strategy-data";

export default async function RehearsalPage() {
  const live = await getRehearsalBundle();
  return <RehearsalWalkthrough live={live} />;
}
