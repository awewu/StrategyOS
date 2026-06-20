import { NextResponse, type NextRequest } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { getSession } from "@/lib/auth/session";
import { DEMO_USERS } from "@/lib/auth/config";
import { dbAvailable, prisma } from "@/lib/db";
import { pushMemorySnapshot } from "@/lib/data/versions-data";
import { autoPersistDiffsForSnapshot } from "@/lib/stratos/persist-diff";
import { getCommandDeckBundle } from "@/lib/data/strategy-data";
import { freezeSnapshot } from "@/lib/stratos/freeze-snapshot";
import {
  healthAssertion,
  snapshotFY26,
  brandCards,
  productBets,
  gtmBets,
  projects,
  assumptions,
  leadingKrs,
  capacity,
  bscLights,
} from "@/lib/stratos-demo-data";

async function resolveFrozenById(session: Awaited<ReturnType<typeof getSession>>) {
  if (await dbAvailable()) {
    if (session?.userId && !session.userId.startsWith("demo-")) {
      return session.userId;
    }
    const ceo = await prisma.user.findFirst({ where: { role: "ceo" } });
    if (!ceo) throw new Error("No CEO user in database — run db:seed");
    return ceo.id;
  }
  return session?.userId ?? DEMO_USERS[0].userId;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    code?: string;
    period?: string;
    snapshotType?: "H1" | "FY" | "EVENT";
    meetingNotes?: string;
    bypassAssertion?: boolean;
  };

  const code = body.code ?? "2026-FY-STRATEGIC";
  const period = body.period ?? "2026-FY";
  const snapshotType = body.snapshotType ?? "FY";

  const deck = await getCommandDeckBundle();
  const session = await getSession();

  const state = {
    ...snapshotFY26,
    diagnosis: deck.diagnosis,
    fpa: deck.fpa,
    capStack: deck.capStack,
    investmentCases: deck.investmentCases,
    brandCards,
    productBets,
    gtmBets,
    projects,
    assumptions,
    keyResults: leadingKrs,
    capacity,
    healthAssertions: body.bypassAssertion
      ? [{ ...healthAssertion, active: false, ceoExceptionNote: "remedial Vx 已录" }]
      : [healthAssertion],
  };

  try {
    const frozen = freezeSnapshot({
      period,
      snapshotType,
      code,
      state,
      assertionCtx: {
        trigger: "PRE_SNAPSHOT",
        cashRunwayMonths: deck.fpa.cashRunwayMonths,
      },
      meetingNotes: body.meetingNotes,
    });

    const frozenById = await resolveFrozenById(session);

    if (await dbAvailable()) {
      const row = await prisma.strategicSnapshot.upsert({
        where: { code: frozen.code },
        create: {
          code: frozen.code,
          period: frozen.period,
          snapshotType,
          status: "FROZEN",
          frozenAt: new Date(frozen.frozenAt),
          frozenById,
          meetingNotes: body.meetingNotes,
          bscLightsAtFreeze: bscLights,
          stateJson: frozen.stateJson as object,
          strategyPattern: {
            create: {
              deliberateRealizationRate:
                frozen.stateJson.strategyPattern?.deliberateRealizationRate ?? 0,
              emergentPatterns: frozen.stateJson.strategyPattern?.emergentPatterns ?? [],
              unrealizedItems: frozen.stateJson.strategyPattern?.unrealizedItems ?? [],
              serendipitousItems: frozen.stateJson.strategyPattern?.serendipitousItems ?? [],
              learningPrompts: frozen.stateJson.strategyPattern?.learningPrompts ?? [],
              computedAt: new Date(frozen.frozenAt),
            },
          },
        },
        update: {
          frozenAt: new Date(frozen.frozenAt),
          stateJson: frozen.stateJson as object,
          meetingNotes: body.meetingNotes,
        },
      });
      const diffResult = await autoPersistDiffsForSnapshot(row.id, frozen.code);
      await logUsageEvent({
        action: "diff_persist",
        resource: frozen.code,
        metadata: diffResult,
        request,
      });
    } else {
      pushMemorySnapshot({
        code: frozen.code,
        period: frozen.period,
        frozenAt: frozen.frozenAt,
        stateJson: frozen.stateJson,
      });
    }

    await logUsageEvent({
      action: "snapshot_freeze",
      resource: frozen.code,
      metadata: { ok: true, source: (await dbAvailable()) ? "database" : "memory" },
      request,
    });

    return NextResponse.json({
      ok: true,
      code: frozen.code,
      frozenAt: frozen.frozenAt,
      deliberateRate: frozen.stateJson.strategyPattern?.deliberateRealizationRate,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Snapshot blocked";
    await logUsageEvent({
      action: "snapshot_freeze",
      resource: code,
      metadata: { ok: false, error: message },
      request,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}
