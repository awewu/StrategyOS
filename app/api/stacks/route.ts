import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  getStacksBundle,
  saveCapStack,
  saveGtmBets,
  saveInvestmentCases,
  saveProductBets,
  saveProjects,
} from "@/lib/stacks/data-access";
import { getActivePeriod } from "@/lib/data/active-period";
import type {
  CapStackPeriod,
  GtmBet,
  InvestmentCase,
  ProductBet,
  Project,
} from "@/lib/types/stratos";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const bundle = await getStacksBundle(await getActivePeriod());
  return NextResponse.json({ period: await getActivePeriod(), ...bundle });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      capStack?: CapStackPeriod;
      investmentCases?: InvestmentCase[];
      productBets?: ProductBet[];
      gtmBets?: GtmBet[];
      projects?: Project[];
      period?: string;
    };
    const period = body.period ?? await getActivePeriod();
    if (body.capStack) await saveCapStack(body.capStack, period);
    if (body.investmentCases) await saveInvestmentCases(body.investmentCases, period);
    if (body.productBets) await saveProductBets(body.productBets, period);
    if (body.gtmBets) await saveGtmBets(body.gtmBets, period);
    if (body.projects) await saveProjects(body.projects, period);
    const bundle = await getStacksBundle(period);
    return NextResponse.json({ ok: true, period, ...bundle });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
