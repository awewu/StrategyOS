import { CulturePageClient } from "@/components/culture/CulturePageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCompassBundle } from "@/lib/compass/data";
import { getCultureAwards, getCultureUnderstanding } from "@/lib/culture/data-access";

export default async function CulturePage() {
  const [{ northStar }, awards, understanding] = await Promise.all([
    getCompassBundle(),
    getCultureAwards(),
    getCultureUnderstanding(),
  ]);

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="Normative · 精神与文化"
        title="企业文化"
        subtitle="使命愿景 · 三大信条 · 四个满意 · 六项基本原则 · 七大奖项 · 公示与 CI"
      />
      <CulturePageClient
        northStar={northStar}
        initialWinners={awards.winners}
        initialRecords={understanding.records}
        source={awards.source === "database" ? "database" : understanding.source}
      />
    </div>
  );
}
