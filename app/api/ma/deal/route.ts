import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { asDbJson, prisma } from "@/lib/db";
import { getMaBundle } from "@/lib/ma/data-access";
import { DEAL_STAGE_ORDER } from "@/lib/ma/views";

export const runtime = "nodejs";

const VALID_DEAL_TYPES = ["acquisition", "merger", "minority_investment", "jv"];
const VALID_METHODS = ["dcf", "comps", "precedent"];
const VALID_SEVERITY = ["low", "medium", "high"];

type ValuationPayload = { method?: string; low?: number; base?: number; high?: number; note?: string | null };
type SynergyPayload = {
  type?: string;
  title?: string;
  runRate?: number;
  ramp?: number[];
  oneTimeCost?: number;
  evidenceLevel?: number;
};
type FindingPayload = {
  workstream?: string;
  finding?: string;
  severity?: string;
  dealBreaker?: boolean;
  status?: string;
};
type ConditionPayload = { item?: string; owner?: string | null; dueDate?: string | null; status?: string };

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  const bundle = await getMaBundle();
  return NextResponse.json(bundle);
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  try {
    const b = await req.json();
    if (!b.name || !b.thesis) {
      return NextResponse.json({ error: "name/thesis 必填——没有论点不立项" }, { status: 400 });
    }
    const data = {
      name: String(b.name),
      dealType: VALID_DEAL_TYPES.includes(b.dealType) ? String(b.dealType) : "acquisition",
      direction: String(b.direction || "tech"),
      stage: DEAL_STAGE_ORDER.includes(b.stage) ? String(b.stage) : "sourcing",
      thesis: String(b.thesis),
      linkedCrux: b.linkedCrux ? String(b.linkedCrux) : null,
      dealLead: b.dealLead ? String(b.dealLead) : null,
      budgetTag: b.budgetTag ? String(b.budgetTag) : null,
      price: numOrNull(b.price),
      walkAwayPrice: numOrNull(b.walkAwayPrice),
      discountRate: numOrNull(b.discountRate) ?? 0.12,
      dealStructure: asDbJson(b.dealStructure ?? {}),
      economics: asDbJson(b.economics ?? {}),
      flags: asDbJson(b.flags ?? {}),
      screening: asDbJson(Array.isArray(b.screening) ? b.screening : []),
    };

    const valuations: ValuationPayload[] = Array.isArray(b.valuations) ? b.valuations : [];
    const synergies: SynergyPayload[] = Array.isArray(b.synergies) ? b.synergies : [];
    const findings: FindingPayload[] = Array.isArray(b.findings) ? b.findings : [];
    const conditions: ConditionPayload[] = Array.isArray(b.conditions) ? b.conditions : [];

    const row = await prisma.$transaction(async (tx) => {
      const deal = b.id
        ? await tx.maDeal.update({ where: { id: b.id }, data })
        : await tx.maDeal.create({ data });

      await tx.maValuation.deleteMany({ where: { dealId: deal.id } });
      for (const v of valuations) {
        if (!VALID_METHODS.includes(String(v.method))) continue;
        await tx.maValuation.create({
          data: {
            dealId: deal.id,
            method: String(v.method),
            low: Number(v.low) || 0,
            base: Number(v.base) || 0,
            high: Number(v.high) || 0,
            note: v.note ? String(v.note) : null,
          },
        });
      }

      await tx.maSynergy.deleteMany({ where: { dealId: deal.id } });
      for (const s of synergies) {
        if (!s.title) continue;
        await tx.maSynergy.create({
          data: {
            dealId: deal.id,
            type: s.type === "revenue" ? "revenue" : "cost",
            title: String(s.title),
            runRate: Number(s.runRate) || 0,
            ramp: asDbJson(Array.isArray(s.ramp) ? s.ramp.map(Number) : []),
            oneTimeCost: Number(s.oneTimeCost) || 0,
            evidenceLevel: Math.min(6, Math.max(1, Number(s.evidenceLevel) || 2)),
          },
        });
      }

      await tx.maDdFinding.deleteMany({ where: { dealId: deal.id } });
      for (const f of findings) {
        if (!f.finding) continue;
        await tx.maDdFinding.create({
          data: {
            dealId: deal.id,
            workstream: String(f.workstream || "other"),
            finding: String(f.finding),
            severity: VALID_SEVERITY.includes(String(f.severity)) ? String(f.severity) : "medium",
            dealBreaker: f.dealBreaker === true,
            status: f.status === "closed" ? "closed" : f.status === "mitigated" ? "mitigated" : "open",
          },
        });
      }

      await tx.maConditionPrecedent.deleteMany({ where: { dealId: deal.id } });
      for (const c of conditions) {
        if (!c.item) continue;
        await tx.maConditionPrecedent.create({
          data: {
            dealId: deal.id,
            item: String(c.item),
            owner: c.owner ? String(c.owner) : null,
            dueDate: c.dueDate ? new Date(c.dueDate) : null,
            status: c.status === "closed" ? "closed" : "open",
          },
        });
      }

      return deal;
    });

    return NextResponse.json({ ok: true, deal: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.maDeal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
