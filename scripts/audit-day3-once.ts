/**
 * One-off Day3 filter audit — comparePlan on/off.
 * Usage: node --import tsx scripts/audit-day3-once.ts
 */
import fs from "node:fs";
import { buildFilterAuditReport } from "../lib/compiler/import-audit";
import { extractTextFromPdf } from "../lib/compiler/strategic-compiler";
import { loadExistingObjectiveTitles } from "../lib/compiler/merge-import";
import { dbAvailable, prisma } from "../lib/db";

const ORG_UNIT_ID = "org-group-rhautt";
const HORIZON_START = 2026;
const HORIZON_END = 2028;

const PDF_PATH =
  "/Users/tiechuishan/Library/Containers/com.apple.Preview/Data/tmp/com.apple.Preview.PasteboardItems/Day3核心岗位OKR汇报资料汇总.pdf";

async function loadExisting(): Promise<string[]> {
  if (!(await dbAvailable())) return [];
  const plan = await prisma.strategicPlan.findFirst({
    where: { orgUnitId: ORG_UNIT_ID, horizonStart: HORIZON_START, horizonEnd: HORIZON_END },
    select: { id: true },
  });
  if (!plan) return [];
  return loadExistingObjectiveTitles(plan.id);
}

async function main() {
  let rawText = "";
  if (fs.existsSync(PDF_PATH)) {
    rawText = await extractTextFromPdf(fs.readFileSync(PDF_PATH));
  } else if (fs.existsSync(".cursor-day3-persist.json")) {
    console.warn("PDF missing — using compile output count only from snippet tests");
    process.exit(0);
  } else {
    console.error("No Day3 source found");
    process.exit(1);
  }

  const existingTitles = await loadExisting();

  const batchOnly = buildFilterAuditReport({
    rawText,
    fileName: "Day3核心岗位OKR汇报资料汇总.pdf",
    existingTitles: [],
  });

  const withPlan = buildFilterAuditReport({
    rawText,
    fileName: "Day3核心岗位OKR汇报资料汇总.pdf",
    existingTitles,
  });

  console.log(
    JSON.stringify(
      {
        comparePlan0: {
          raw: batchOnly.rawObjectives,
          accepted: batchOnly.accepted,
          rejected: batchOnly.rejected,
          reviewCandidates: batchOnly.reviewCandidates.length,
          byReason: batchOnly.byReason,
        },
        comparePlan1: {
          raw: withPlan.rawObjectives,
          accepted: withPlan.accepted,
          rejected: withPlan.rejected,
          reviewCandidates: withPlan.reviewCandidates.length,
          byReason: withPlan.byReason,
          existingTitlesCount: existingTitles.length,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
