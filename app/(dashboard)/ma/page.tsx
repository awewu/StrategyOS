import { logUsageEvent } from "@/lib/audit/log-event";
import { requireRouteAccess } from "@/lib/auth/guard";
import { MaClient } from "@/components/ma/MaClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMaBundle } from "@/lib/ma/data-access";

const VALID_DEAL_TYPES = ["acquisition", "merger", "minority_investment", "jv"] as const;

export default async function MaPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; name?: string; thesis?: string; direction?: string; dealType?: string; crux?: string }>;
}) {
  await requireRouteAccess("/ma");
  await logUsageEvent({ action: "ma_view", resource: "/ma" });
  const bundle = await getMaBundle();
  const params = await searchParams;
  const prefill =
    params.new === "1"
      ? {
          name: params.name,
          thesis: params.thesis,
          direction: params.direction,
          dealType: VALID_DEAL_TYPES.includes(params.dealType as (typeof VALID_DEAL_TYPES)[number])
            ? (params.dealType as (typeof VALID_DEAL_TYPES)[number])
            : undefined,
          linkedCrux: params.crux,
        }
      : null;

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="Corp Dev · M&A"
        title="并购 · 资本交易"
        subtitle="收购/并购/投资/合资同一纪律链——论点挂帅,举证过关,红线否决,投后追责。形态画像决定阈值与必备条款。"
      />
      <MaClient bundle={bundle} prefill={prefill} />
    </div>
  );
}
