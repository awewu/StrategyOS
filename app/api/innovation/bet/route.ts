import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { asDbJson, prisma } from "@/lib/db";
import { STAGE_ORDER } from "@/lib/innovation/data-access";

export const runtime = "nodejs";

const VALID_AXIS = ["d", "f", "v"];
const VALID_ASSUMPTION_STATUS = ["pending", "validated", "failed"];

type ClaimPayload = {
  axis?: string;
  claim?: string;
  warrant?: string | null;
  rebuttal?: string | null;
  evidence?: { level?: number; source?: string; artifactRef?: string | null; note?: string | null; stale?: boolean }[];
};

type AssumptionPayload = {
  code?: string;
  statement?: string;
  status?: string;
  testPlan?: string | null;
};

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = await req.json();
    if (!b.title || !b.lineId) {
      return NextResponse.json({ error: "title/lineId 必填" }, { status: 400 });
    }
    const stageGate = STAGE_ORDER.includes(b.stageGate) ? b.stageGate : "discovery";
    const data = {
      lineId: String(b.lineId),
      title: String(b.title),
      horizon: String(b.horizon || "H2"),
      stageGate,
      nextCommitAmount:
        b.nextCommitAmount === null || b.nextCommitAmount === undefined || b.nextCommitAmount === ""
          ? null
          : Number(b.nextCommitAmount),
      abandonRight: b.abandonRight !== false,
      odi: asDbJson(Array.isArray(b.odi) ? b.odi : []),
      wtpFactor: Number.isFinite(Number(b.wtpFactor)) ? Number(b.wtpFactor) : 1,
      feasibilityDims: asDbJson(Array.isArray(b.feasibilityDims) ? b.feasibilityDims : []),
      economics: asDbJson(b.economics ?? {}),
      capabilityGaps: asDbJson(Array.isArray(b.capabilityGaps) ? b.capabilityGaps : []),
    };

    const claims: ClaimPayload[] = Array.isArray(b.claims) ? b.claims : [];
    const assumptions: AssumptionPayload[] = Array.isArray(b.assumptions) ? b.assumptions : [];

    const row = await prisma.$transaction(async (tx) => {
      const bet = b.id
        ? await tx.innovationBet.update({ where: { id: b.id }, data })
        : await tx.innovationBet.create({ data });

      await tx.innovationClaim.deleteMany({ where: { betId: bet.id } });
      for (const c of claims) {
        if (!c.claim) continue;
        const created = await tx.innovationClaim.create({
          data: {
            betId: bet.id,
            axis: VALID_AXIS.includes(String(c.axis)) ? String(c.axis) : "f",
            claim: String(c.claim),
            warrant: c.warrant ? String(c.warrant) : null,
            rebuttal: c.rebuttal ? String(c.rebuttal) : null,
          },
        });
        const evidence = Array.isArray(c.evidence) ? c.evidence : [];
        for (const e of evidence) {
          if (!e.source) continue;
          await tx.innovationEvidence.create({
            data: {
              claimId: created.id,
              level: Math.min(6, Math.max(1, Number(e.level) || 1)),
              source: String(e.source),
              artifactRef: e.artifactRef && String(e.artifactRef).trim() ? String(e.artifactRef).trim() : null,
              note: e.note ? String(e.note) : null,
              stale: e.stale === true,
            },
          });
        }
      }

      await tx.innovationAssumption.deleteMany({ where: { betId: bet.id } });
      for (const a of assumptions) {
        if (!a.code || !a.statement) continue;
        await tx.innovationAssumption.create({
          data: {
            betId: bet.id,
            code: String(a.code),
            statement: String(a.statement),
            status: VALID_ASSUMPTION_STATUS.includes(String(a.status)) ? String(a.status) : "pending",
            testPlan: a.testPlan ? String(a.testPlan) : null,
          },
        });
      }

      return bet;
    });

    return NextResponse.json({ ok: true, bet: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.innovationBet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
