import Link from "next/link";
import { PrintButton } from "@/components/brand/PrintButton";
import { DownloadPdfButton } from "@/components/brand/DownloadPdfButton";
import { PanoramaPrintLayout } from "@/components/print/PanoramaPrintLayout";
import { RehearsalSignInPrintLayout } from "@/components/print/RehearsalSignInPrintLayout";
import { getCommandDeckBundle, getRehearsalStrategyDeck } from "@/lib/data/strategy-data";

export const dynamic = "force-dynamic";

export default async function PanoramaPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; orgUnitId?: string; snapshotId?: string }>;
}) {
  const params = await searchParams;
  const rehearsalPrint = params.source === "rehearsal";
  const strategyDeck = rehearsalPrint
    ? await getRehearsalStrategyDeck({ orgUnitId: params.orgUnitId, snapshotId: params.snapshotId })
    : null;
  const deck = rehearsalPrint ? null : await getCommandDeckBundle();

  return (
    <div
      data-theme="print"
      className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-primary)] print:bg-white"
    >
      <div className="mx-auto max-w-5xl px-8 py-10 print:px-0 print:py-0">
        <div className="mb-6 flex justify-end gap-2 print:hidden">
          <Link
            href={rehearsalPrint ? `/rehearsal?orgUnitId=${encodeURIComponent(params.orgUnitId ?? "")}${params.snapshotId ? `&snapshotId=${encodeURIComponent(params.snapshotId)}` : ""}` : "/command"}
            className="rounded border border-[var(--color-text-primary)]/20 px-4 py-2 text-sm"
          >
            {rehearsalPrint ? "返回彩排" : "返回指挥舱"}
          </Link>
          {!rehearsalPrint ? <DownloadPdfButton /> : null}
          <PrintButton />
        </div>
        {strategyDeck?.meta ? (
          <RehearsalSignInPrintLayout meta={strategyDeck.meta} slides={strategyDeck.slides} />
        ) : deck ? (
          <PanoramaPrintLayout deck={deck} />
        ) : (
          <div className="bg-white p-8 text-sm text-[var(--signal-red)]">未找到所选战略版本</div>
        )}
      </div>
    </div>
  );
}
