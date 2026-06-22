import { DecodeWorkspace } from "@/components/decode/DecodeWorkspace";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDecodeBundle, getFpaSummary } from "@/lib/data/strategy-data";
import { deriveDynamicsInitial, deriveSimSeed } from "@/lib/stratos/calibrate";
import { DEFAULT_DYNAMICS_INITIAL } from "@/lib/stratos/strat-sim-dynamics";

export default async function DecodePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [{ loops, source, bsc, hoshinFlat }, fpa] = await Promise.all([
    getDecodeBundle(),
    getFpaSummary(),
  ]);
  const simSeed = deriveSimSeed(fpa);
  const simInitial = deriveDynamicsInitial(fpa, DEFAULT_DYNAMICS_INITIAL);
  const initialTab =
    tab === "stratsim" ? ("stratsim" as const) : tab === "hoshin" ? ("hoshin" as const) : undefined;

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="BSC · X-Matrix · 反馈环"
        title="战略解码"
        subtitle={`战略地图与执行对齐 · 在线录入 / Excel 导入 · 数据源 ${source === "database" ? "战略计划 DB" : "Demo"}`}
      />
      <DecodeWorkspace
        initial={{ bsc, hoshinFlat, loops, source, simSeed, simInitial }}
        initialTab={initialTab}
      />
      <ConceptGuide ids={["bsc", "okr", "hoshin", "systemDynamics"]} />
    </div>
  );
}
