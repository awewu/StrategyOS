import { CulturePageClient } from "@/components/culture/CulturePageClient";
import { WushiPanel } from "@/components/culture/WushiPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCompassBundle } from "@/lib/compass/data";
import { getCultureAwards, getCultureUnderstanding } from "@/lib/culture/data-access";
import { getCultureHandbook } from "@/lib/culture/handbook-access";
import { defaultWushiAssessment } from "@/lib/culture/wushi";

export default async function CulturePage() {
  const [{ northStar }, awards, understanding, handbook] = await Promise.all([
    getCompassBundle(),
    getCultureAwards(),
    getCultureUnderstanding(),
    getCultureHandbook(),
  ]);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="Normative · 精神与文化"
        title="企业文化"
        subtitle="使命愿景 · 三大信条 · 四个满意 · 六项基本原则 · 七大奖项 · 公示与 CI"
      />
      <CulturePageClient
        northStar={northStar}
        initialHandbook={handbook.handbook}
        handbookSource={handbook.source}
        initialWinners={awards.winners}
        initialRecords={understanding.records}
        source={awards.source === "database" ? "database" : understanding.source}
      />

      <div className="mt-10 border-t border-[var(--surface-border)] pt-8">
        <WushiPanel assessment={defaultWushiAssessment("史密斯")} />
      </div>
    </div>
  );
}
