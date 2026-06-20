import { NextResponse } from "next/server";
import { getCommandDeckBundle } from "@/lib/data/strategy-data";
import { buildPanoramaPdf } from "@/lib/pdf/panorama-pdf";
import { chineseFontAvailable } from "@/lib/pdf/fonts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const langParam = searchParams.get("lang");
  const lang = langParam === "en" ? "en" : "zh";

  const deck = await getCommandDeckBundle();
  const pdf = await buildPanoramaPdf(deck, lang);
  const suffix = lang === "zh" ? "zh" : "en";
  const filename = `stratos-panorama-${deck.diagnosis.period}-${suffix}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-StratOS-Font": chineseFontAvailable() ? "noto" : "helvetica-fallback",
      "X-StratOS-Lang": lang,
    },
  });
}
