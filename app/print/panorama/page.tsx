import Link from "next/link";
import { PrintButton } from "@/components/brand/PrintButton";
import { DownloadPdfButton } from "@/components/brand/DownloadPdfButton";
import { PanoramaPrintLayout } from "@/components/print/PanoramaPrintLayout";
import { getCommandDeckBundle } from "@/lib/data/strategy-data";

export default async function PanoramaPrintPage() {
  const deck = await getCommandDeckBundle();

  return (
    <div
      data-theme="print"
      className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-primary)] print:bg-white"
    >
      <div className="mx-auto max-w-5xl px-8 py-10 print:px-0 print:py-0">
        <div className="mb-6 flex justify-end gap-2 print:hidden">
          <Link
            href="/command"
            className="rounded border border-[var(--color-text-primary)]/20 px-4 py-2 text-sm"
          >
            返回指挥舱
          </Link>
          <DownloadPdfButton />
          <PrintButton />
        </div>
        <PanoramaPrintLayout deck={deck} />
      </div>
    </div>
  );
}
