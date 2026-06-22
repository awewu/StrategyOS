/**
 * Compare rules-only vs LLM semantic deduction on Day1 PDF snippet.
 * Usage: npx tsx scripts/llm-deduction-compare.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(join(process.cwd(), ".env"));

import { extractTextFromPdf } from "../lib/compiler/strategic-compiler";
import { sanitizeCompiledPayload } from "../lib/compiler/import-quality";
import { compileStrategicTextSmart, refineWithSemanticDedupe, compilerLlmConfigured } from "../lib/compiler/import-llm";
import { buildImportDeductionReport } from "../lib/compiler/import-deduction";
import { compileStrategicText } from "../lib/compiler/strategic-compiler";
import { prisma } from "../lib/db";

const DAY1 =
  "/Users/tiechuishan/Library/Containers/com.apple.Preview/Data/tmp/com.apple.Preview.PasteboardItems/上午Part1-瑞合瑞德集团2026战略会议-Day1.pdf";

async function main() {
  console.log("=== LLM 推演对比 ===\n");
  console.log("LLM configured:", compilerLlmConfigured());

  const buf = readFileSync(DAY1);
  const rawText = await extractTextFromPdf(buf);
  console.log("Day1 chars:", rawText.length);

  const plan = await prisma.strategicPlan.findFirst({
    where: { orgUnitId: "org-group-rhautt", horizonStart: 2026, horizonEnd: 2028 },
    include: {
      objectives: { include: { keyResults: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const existingRefs = (plan?.objectives ?? []).map((o) => ({
    objective: o.objective,
    keyResults: o.keyResults.map((k) => k.keyResult),
  }));
  const existingTitles = existingRefs.flatMap((o) => [o.objective, ...o.keyResults]);

  // Rules-only path
  const rulesCompiled = compileStrategicText(rawText);
  const rulesSan = sanitizeCompiledPayload(rulesCompiled, existingTitles);
  const rulesDeduction = buildImportDeductionReport({
    mode: "merge",
    fileName: "Day1.pdf",
    charCount: rawText.length,
    compiled: rulesCompiled,
    sanitized: rulesSan,
    existingObjectives: existingRefs,
    planIntent: plan?.intent,
    planNorthStar: plan?.northStar,
    compileEngine: "rules",
  });

  console.log("\n--- 仅规则 ---");
  console.log("原始/接受:", rulesSan.stats.rawObjectives, "→", rulesSan.stats.acceptedObjectives);
  console.log("推演新增:", rulesDeduction.toAdd);
  console.log("规则重复剔除:", rulesDeduction.duplicateExisting);

  // Full smart + semantic path
  const { payload: smartCompiled, engine } = await compileStrategicTextSmart(rawText);
  let smartSan = sanitizeCompiledPayload(smartCompiled, existingTitles);
  const { sanitized: semanticSan, semantic } = await refineWithSemanticDedupe(smartSan, existingTitles);
  smartSan = semanticSan;

  const fullDeduction = buildImportDeductionReport({
    mode: "merge",
    fileName: "Day1.pdf",
    charCount: rawText.length,
    compiled: smartCompiled,
    sanitized: smartSan,
    existingObjectives: existingRefs,
    planIntent: plan?.intent,
    planNorthStar: plan?.northStar,
    semantic,
    compileEngine: engine,
  });

  console.log("\n--- 规则 + LLM ---");
  console.log("编译引擎:", engine);
  console.log("原始/接受:", smartSan.stats.rawObjectives, "→", smartSan.stats.acceptedObjectives);
  console.log("推演新增:", fullDeduction.toAdd);
  console.log("语义:", semantic.engine, semantic.checked, "去重", semantic.removedDuplicate, "去噪", semantic.removedNoise);
  if (semantic.pairs.length) {
    console.log("语义命中样例:");
    semantic.pairs.slice(0, 5).forEach((p) =>
      console.log(`  - ${p.isDuplicate ? "重复" : "噪声"}: ${p.incoming.slice(0, 45)} → ${p.duplicateOf?.slice(0, 40) ?? p.reason ?? ""}`),
    );
  }

  const semanticOnly = smartSan.rejected.filter((r) =>
    String(r.reason).startsWith("semantic"),
  );
  if (semanticOnly.length) {
    console.log("\n语义层额外剔除 (规则未捕获):");
    semanticOnly.slice(0, 8).forEach((r) => console.log(`  [${r.reason}] ${r.text.slice(0, 55)}`));
  }

  const delta = rulesDeduction.toAdd - fullDeduction.toAdd;
  console.log("\n--- 差异 ---");
  console.log("新增目标差 (规则 - LLM):", delta, delta > 0 ? "→ LLM 多剔除重复" : delta < 0 ? "→ LLM 多提取" : "→ 无差");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
