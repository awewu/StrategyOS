import {
  BehaviorGuidelinesPanel,
  CoreValuesPanel,
  CultureLinksBar,
  DoctrinesPanel,
  MissionVisionPanel,
  ValuesAwardPanel,
  ValuesUnderstandingPanel,
} from "@/components/culture/CulturePanels";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCompassBundle } from "@/lib/compass/data";

export default async function CulturePage() {
  const { northStar } = await getCompassBundle();

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="Normative · 精神与文化"
        title="企业文化"
        subtitle="使命愿景 · 三大信条 · 四个满意 · 六项基本原则 · 七大奖项 · 公示与 CI"
      />

      <MissionVisionPanel northStar={northStar} />
      <DoctrinesPanel />
      <CoreValuesPanel />
      <BehaviorGuidelinesPanel />
      <ValuesAwardPanel />
      <ValuesUnderstandingPanel />
      <CultureLinksBar />
    </div>
  );
}
