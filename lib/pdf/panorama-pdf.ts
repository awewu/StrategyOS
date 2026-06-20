import PDFDocument from "pdfkit";
import type { getCommandDeckBundle } from "@/lib/data/strategy-data";
import {
  buildPanoramaViewModel,
  kpiValue,
  PANORAMA_KPI_CARDS,
} from "@/lib/panorama/view-model";
import { resolvePdfFonts } from "@/lib/pdf/fonts";

type Deck = Awaited<ReturnType<typeof getCommandDeckBundle>>;

export function buildPanoramaPdf(
  deck: Deck,
  lang: "zh" | "en" = "zh"
): Promise<Buffer> {
  const wantZh = lang === "zh";
  const vm = buildPanoramaViewModel(deck);
  const { regular, useChinese } = resolvePdfFonts(wantZh);
  const zh = useChinese && wantZh;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (useChinese) doc.registerFont("Main", regular);
    const font = useChinese ? "Main" : "Helvetica";
    const gold = "#b8860b";
    const navy = "#0a1628";
    const muted = "#64748b";
    const pageW = doc.page.width - 72;

    // Header — mirrors /print/panorama
    doc.font(font).fillColor(gold).fontSize(20);
    doc.text(zh ? `${vm.brandName} · 战略推演全景` : `${vm.brandName} · Panorama`);
    doc.fillColor(muted).fontSize(10);
    doc.text(
      zh
        ? `周期 ${vm.period} · 数据源 ${vm.sourceLabel}`
        : `Period ${vm.period} · Source ${deck.source}`
    );
    doc.moveDown(0.6);

    // Core challenge card
    drawCard(doc, 36, doc.y, pageW, 52, font, gold, navy);
    const cardY = doc.y;
    doc.font(font).fillColor(gold).fontSize(12).text(zh ? "核心挑战" : "Challenge", 44, cardY + 8);
    doc.fillColor(navy).fontSize(10);
    doc.text(vm.challenge, 44, cardY + 24, { width: pageW - 16 });
    doc.text(zh ? `Crux: ${vm.crux}` : `Crux: ${vm.crux}`, 44, cardY + 38, { width: pageW - 16 });
    doc.y = cardY + 58;

    // KPI grid 4 columns
    const kpiW = (pageW - 12) / 4;
    const kpiY = doc.y;
    PANORAMA_KPI_CARDS.forEach((k, i) => {
      const x = 36 + i * (kpiW + 4);
      drawCard(doc, x, kpiY, kpiW, 44, font, gold, navy);
      doc.font(font).fillColor(muted).fontSize(8).text(k.label, x + 8, kpiY + 8, { width: kpiW - 16 });
      doc.fillColor(gold).fontSize(14).text(kpiValue(vm, k.key), x + 8, kpiY + 22, { width: kpiW - 16 });
    });
    doc.y = kpiY + 52;

    // One-minute diagram
    drawCard(doc, 36, doc.y, pageW, 118, font, gold, navy);
    const diagY = doc.y;
    doc.font(font).fillColor(gold).fontSize(12).text(zh ? "一分钟看懂 StratOS" : "StratOS at a glance", 44, diagY + 8);
    doc.fillColor("#334155").fontSize(7.5);
    doc.text(vm.oneMinuteDiagram, 44, diagY + 24, { width: pageW - 16, lineGap: 1 });
    doc.y = diagY + 124;

    // BSC + Top diff row
    const halfW = (pageW - 8) / 2;
    const rowY = doc.y;
    drawCard(doc, 36, rowY, halfW, 56, font, gold, navy);
    doc.font(font).fillColor(gold).fontSize(10).text(zh ? "BSC 四灯" : "BSC", 44, rowY + 8);
    doc.fillColor(navy).fontSize(9).text(vm.bscLightsLine, 44, rowY + 22, { width: halfW - 16 });

    drawCard(doc, 36 + halfW + 8, rowY, halfW, 56, font, gold, navy);
    doc.font(font).fillColor(gold).fontSize(10).text("Top StratDiff", 44 + halfW + 8, rowY + 8);
    let dy = rowY + 22;
    vm.topDiffs.slice(0, 3).forEach((d) => {
      doc.fillColor(navy).fontSize(8).text(`· [${d.severity}] ${d.title}`, 44 + halfW + 8, dy, {
        width: halfW - 16,
      });
      dy += 12;
    });
    doc.y = rowY + 64;

    // FPA + CapStack appendix (same data as browser extended section)
    doc.font(font).fillColor(gold).fontSize(10).text(zh ? "FPA B-A-F" : "FPA", 36, doc.y);
    doc.fillColor(navy).fontSize(8);
    vm.fpaLines.forEach((l) => {
      doc.text(l, 36, doc.y + 2);
      doc.moveDown(0.3);
    });
    doc.moveDown(0.2);
    doc.fillColor(gold).fontSize(10).text("CapStack", 36, doc.y);
    doc.fillColor(navy).fontSize(8);
    vm.capStackLines.forEach((l) => {
      doc.text(l, 36, doc.y + 2);
      doc.moveDown(0.3);
    });

    if (vm.activeAssertion) {
      doc.moveDown(0.3);
      doc.fillColor("#e65100").fontSize(9).text(`⚠ ${vm.activeAssertion}`, 36, doc.y);
    }

    doc.font(font).fontSize(7).fillColor(muted);
    const footerY = doc.page.height - 36;
    doc.text(
      `${vm.taglineZh} · ${vm.taglineEn} · ${vm.period} · ${vm.statusLabel}`,
      36,
      footerY,
      { align: "center", width: pageW }
    );
    if (wantZh && !useChinese) {
      doc.text("Chinese font unavailable — npm run fonts:fetch", 36, footerY + 10, {
        align: "center",
        width: pageW,
      });
    }

    doc.end();
  });
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function drawCard(
  doc: PdfDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  _font: string,
  gold: string,
  _navy: string
) {
  doc.save();
  doc.roundedRect(x, y, w, h, 4).lineWidth(0.5).strokeColor(`${gold}66`).stroke();
  doc.restore();
}
