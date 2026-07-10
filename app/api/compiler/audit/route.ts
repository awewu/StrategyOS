import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { dbAvailable, prisma } from "@/lib/db";
import { buildFilterAuditReport } from "@/lib/compiler/import-audit";
import { extractTextFromDocument } from "@/lib/compiler/strategic-compiler";
import { loadExistingObjectiveTitles } from "@/lib/compiler/merge-import";

export const runtime = "nodejs";

const ORG_UNIT_ID = "org-group-rhautt";
const HORIZON_START = 2026;
const HORIZON_END = 2028;

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let rawText = "";
    let fileName = "paste.txt";
    let comparePlan = true;

    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { rawText?: string; comparePlan?: boolean; fileName?: string };
      rawText = body.rawText?.trim() ?? "";
      fileName = body.fileName ?? fileName;
      if (body.comparePlan === false) comparePlan = false;
    } else {
      const form = await req.formData();
      fileName = String(form.get("fileName") ?? fileName);
      comparePlan = String(form.get("comparePlan") ?? "1") !== "0";
      const pasted = String(form.get("rawText") ?? "").trim();
      const file = form.get("file");
      if (pasted) rawText = pasted;
      if (file instanceof File && file.size > 0) {
        fileName = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        rawText = rawText || (await extractTextFromDocument(buffer, file.name));
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "无法提取文本" }, { status: 400 });
    }

    let existingTitles: string[] = [];
    if (comparePlan && (await dbAvailable())) {
      const plan = await prisma.strategicPlan.findFirst({
        where: { orgUnitId: ORG_UNIT_ID, horizonStart: HORIZON_START, horizonEnd: HORIZON_END },
        select: { id: true },
      });
      if (plan) existingTitles = await loadExistingObjectiveTitles(plan.id);
    }

    const audit = buildFilterAuditReport({ rawText, fileName, existingTitles });

    return NextResponse.json({ ok: true, audit });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "审计失败" }, { status: 500 });
  }
}
