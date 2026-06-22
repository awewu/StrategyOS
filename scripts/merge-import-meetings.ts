/**
 * Batch merge-import Day2 → Day1 → Day3 strategy PDFs.
 */
const BASE = process.env.STRATOS_BASE_URL ?? "http://localhost:3003";

const FILES = [
  {
    label: "Day2",
    path: "/Users/tiechuishan/Library/Containers/com.apple.Preview/Data/tmp/com.apple.Preview.PasteboardItems/瑞合瑞德集团2026战略会议-Day2.pdf",
  },
  {
    label: "Day1",
    path: "/Users/tiechuishan/Library/Containers/com.apple.Preview/Data/tmp/com.apple.Preview.PasteboardItems/上午Part1-瑞合瑞德集团2026战略会议-Day1.pdf",
  },
  {
    label: "Day3",
    path: "/Users/tiechuishan/Library/Containers/com.apple.Preview/Data/tmp/com.apple.Preview.PasteboardItems/Day3核心岗位OKR汇报资料汇总.pdf",
  },
];

async function importFile(
  label: string,
  filePath: string,
  mode: "merge" | "replace",
) {
  const { readFileSync } = await import("node:fs");
  const buf = readFileSync(filePath);
  const name = filePath.split("/").pop() ?? `${label}.pdf`;

  const persistFd = new FormData();
  persistFd.append("file", new Blob([buf], { type: "application/pdf" }), name);
  persistFd.append("preview", "0");
  persistFd.append("mode", mode);

  const persistRes = await fetch(`${BASE}/api/compiler/import`, { method: "POST", body: persistFd });
  const persisted = await persistRes.json();

  return {
    label,
    mode,
    file: name,
    sizeMb: (buf.length / 1024 / 1024).toFixed(1),
    persistStatus: persistRes.status,
    ok: persisted.ok,
    error: persisted.error,
    charCount: persisted.charCount,
    quality: persisted.quality,
    imported: persisted.imported,
    intent: persisted.compiled?.intent?.slice(0, 60),
    northStar: persisted.compiled?.northStar?.slice(0, 60),
  };
}

async function main() {
  console.log("Step 0: restore Day3 base (replace — plan was corrupted)");
  console.log(JSON.stringify(await importFile("Day3-restore", FILES[2]!.path, "replace"), null, 2));

  for (const f of FILES) {
    console.log(`\n── ${f.label} merge import ──`);
    console.log(JSON.stringify(await importFile(f.label, f.path, "merge"), null, 2));
  }

  const { prisma } = await import("../lib/db");
  const plan = await prisma.strategicPlan.findFirst({
    where: { orgUnitId: "org-group-rhautt", horizonStart: 2026, horizonEnd: 2028 },
    include: {
      objectives: { take: 5, orderBy: { sortOrder: "asc" } },
      _count: { select: { objectives: true } },
    },
  });
  const krCount = await prisma.planKeyResult.count({
    where: { objective: { planId: plan!.id } },
  });

  console.log("\n── FINAL PLAN ──");
  console.log(
    JSON.stringify(
      {
        objectives: plan?._count.objectives,
        keyResults: krCount,
        intent: plan?.intent?.slice(0, 80),
        northStar: plan?.northStar?.slice(0, 80),
        firstFive: plan?.objectives.map((o) => o.objective.slice(0, 50)),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
