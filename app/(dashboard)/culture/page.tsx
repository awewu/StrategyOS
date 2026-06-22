import { CultureTabs } from "@/components/culture/CultureTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCompassBundle } from "@/lib/compass/data";
import { getCultureAwards, getCultureUnderstanding } from "@/lib/culture/data-access";
import { getCultureHandbook } from "@/lib/culture/handbook-access";
import { getWushiAssessment } from "@/lib/culture/wushi-access";

export default async function CulturePage() {
  const [{ northStar }, awards, understanding, handbook, wushi] = await Promise.all([
    getCompassBundle(),
    getCultureAwards(),
    getCultureUnderstanding(),
    getCultureHandbook(),
    getWushiAssessment(),
  ]);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="Normative · 精神与文化"
        title="企业文化"
        subtitle="企业文化 · 价值观评选 · 组织评估（五事七计）"
      />
      <CultureTabs
        northStar={northStar}
        initialHandbook={handbook.handbook}
        handbookSource={handbook.source}
        initialWinners={awards.winners}
        initialRecords={understanding.records}
        source={awards.source === "database" ? "database" : understanding.source}
        wushi={wushi}
      />
    </div>
  );
}
