/**
 * One-off: test PDF extraction + compiler import for a meeting PDF.
 * Usage: npx tsx scripts/test-pdf-import.ts "/path/to/file.pdf"
 */
import { readFileSync } from "node:fs";
import { compileStrategicText, extractTextFromPdf } from "../lib/compiler/strategic-compiler";

const pdfPath = process.argv[2];
const BASE = process.env.STRATOS_BASE_URL ?? "http://localhost:3003";

if (!pdfPath) {
  console.error("Usage: npx tsx scripts/test-pdf-import.ts <pdf-path>");
  process.exit(1);
}

async function main() {
  const buf = readFileSync(pdfPath);
  console.log(`\n── PDF: ${pdfPath} (${(buf.length / 1024 / 1024).toFixed(1)} MB) ──\n`);

  const text = await extractTextFromPdf(buf);
  console.log(`Extracted chars: ${text.length}`);
  if (text.length > 0) {
    console.log("Excerpt:\n", text.slice(0, 800).replace(/\n/g, "\n "));
  } else {
    console.log("⚠ No text extracted — PDF may be image-only or extractors unavailable");
    process.exit(1);
  }

  const compiled = compileStrategicText(text);
  console.log("\n── Compiled locally ──");
  console.log("intent:", compiled.intent?.slice(0, 80));
  console.log("northStar:", compiled.northStar?.slice(0, 80));
  console.log("objectives:", compiled.objectives.map((o) => `${o.dimension}: ${o.objective?.slice(0, 40)}`).join(" | "));
  console.log("bsc rows:", compiled.bscRows.length);

  try {
    const dryRes = await fetch(`${BASE}/api/compiler/import`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: text.slice(0, 50000), dryRun: true }),
    });
    const dry = await dryRes.json();
    console.log("\n── API dryRun ──", dryRes.status, dry.ok ? "ok" : dry.error);

    const form = new FormData();
    form.append("file", new Blob([buf], { type: "application/pdf" }), "day2.pdf");
    form.append("dryRun", "false");
    const persistRes = await fetch(`${BASE}/api/compiler/import`, { method: "POST", body: form });
    const persisted = await persistRes.json();
    console.log("── API persist ──", persistRes.status, persisted.ok ? persisted.summary : persisted.error);

    const planRes = await fetch(
      `${BASE}/api/strategy/plan?orgUnitId=org-group-rhautt&horizonStart=2026&horizonEnd=2028`,
      { headers: { Accept: "application/json" } },
    );
    const plan = await planRes.json();
    const objs = (plan.objectives ?? []).map((o: { objective: string }) => o.objective).filter(Boolean);
    console.log("── Plan objectives ──", objs.slice(0, 4).join(" | ") || "(empty)");
  } catch (e) {
    console.log("\nAPI skipped (dev server down?):", e instanceof Error ? e.message : e);
  }
}

main();
