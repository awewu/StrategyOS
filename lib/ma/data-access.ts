import { prisma, safeDbQuery } from "@/lib/db";
import { dealEconomics, evaluateDealGate, footballField, synergyNpv } from "./engine";
import type { DealStage, DealType, DealTypeThresholds, RequiredFlag, SynergyItem, ValuationRange } from "./types";
import { DEAL_STAGE_ORDER, DEFAULT_DEAL_THRESHOLDS } from "./views";
import type {
  ConditionView,
  DdFindingView,
  DealEconomicsFields,
  DealStructure,
  DealTypeProfileView,
  DealView,
  MaBundle,
  ScreeningRow,
  SynergyView,
  ValuationView,
} from "./views";

const STRICT_STAGES: DealStage[] = ["approval", "integration", "postclose"];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function num(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseThresholds(value: unknown): DealTypeThresholds {
  const rec = asRecord(value);
  return {
    maxPaybackYears: num(rec.maxPaybackYears) ?? DEFAULT_DEAL_THRESHOLDS.maxPaybackYears,
    minRoicOverWacc: num(rec.minRoicOverWacc) ?? DEFAULT_DEAL_THRESHOLDS.minRoicOverWacc,
    maxSynergyPctOfPrice: num(rec.maxSynergyPctOfPrice) ?? DEFAULT_DEAL_THRESHOLDS.maxSynergyPctOfPrice,
    minEvidenceLevel: (num(rec.minEvidenceLevel) ?? DEFAULT_DEAL_THRESHOLDS.minEvidenceLevel) as DealTypeThresholds["minEvidenceLevel"],
  };
}

function parseRequiredFlags(value: unknown): RequiredFlag[] {
  return asArray<Record<string, unknown>>(value)
    .filter((f) => typeof f.key === "string" && typeof f.label === "string")
    .map((f) => ({ key: String(f.key), label: String(f.label) }));
}

function clampLevel(value: unknown): number {
  return Math.min(6, Math.max(1, Number(value) || 1));
}

export async function getMaBundle(): Promise<MaBundle> {
  const [profileRows, dealRows] = await safeDbQuery(
    async () =>
      Promise.all([
        prisma.maDealTypeProfile.findMany({ orderBy: { dealType: "asc" } }),
        prisma.maDeal.findMany({
          orderBy: { updatedAt: "desc" },
          include: {
            valuations: { orderBy: { method: "asc" } },
            synergies: { orderBy: { updatedAt: "asc" } },
            findings: { orderBy: { updatedAt: "asc" } },
            conditions: { orderBy: { updatedAt: "asc" } },
          },
        }),
      ]),
    [[], []],
  );

  const profiles: DealTypeProfileView[] = profileRows.map((p) => ({
    id: p.id,
    dealType: p.dealType as DealType,
    name: p.name,
    thresholds: parseThresholds(p.thresholds),
    requiredFlags: parseRequiredFlags(p.requiredFlags),
  }));

  const profileByType = new Map(profiles.map((p) => [p.dealType, p]));

  const deals: DealView[] = dealRows.map((d) => {
    const profile = profileByType.get(d.dealType as DealType);
    const thresholds = profile?.thresholds ?? DEFAULT_DEAL_THRESHOLDS;
    const requiredFlags = profile?.requiredFlags ?? [];

    const valuations: ValuationView[] = d.valuations.map((v) => ({
      id: v.id,
      method: v.method as ValuationView["method"],
      low: Number(v.low),
      base: Number(v.base),
      high: Number(v.high),
      note: v.note,
    }));

    const synergies: SynergyView[] = d.synergies.map((s) => ({
      id: s.id,
      type: s.type === "revenue" ? "revenue" : "cost",
      title: s.title,
      runRate: Number(s.runRate),
      ramp: asArray<number>(s.ramp).map((r) => Number(r)),
      oneTimeCost: Number(s.oneTimeCost),
      evidenceLevel: clampLevel(s.evidenceLevel),
    }));

    const findings: DdFindingView[] = d.findings.map((f) => ({
      id: f.id,
      workstream: f.workstream,
      finding: f.finding,
      severity: f.severity,
      dealBreaker: f.dealBreaker,
      status: f.status,
    }));

    const conditions: ConditionView[] = d.conditions.map((c) => ({
      id: c.id,
      item: c.item,
      owner: c.owner,
      dueDate: c.dueDate ? c.dueDate.toISOString().slice(0, 10) : null,
      status: c.status,
    }));

    const screening: ScreeningRow[] = asArray<Record<string, unknown>>(d.screening)
      .filter((r) => typeof r.dimension === "string")
      .map((r) => ({
        dimension: String(r.dimension),
        judgment: String(r.judgment ?? ""),
        evidenceLevel: clampLevel(r.evidenceLevel),
      }));

    const econRec = asRecord(d.economics);
    const economicsInput: DealEconomicsFields = {
      roic: num(econRec.roic),
      wacc: num(econRec.wacc),
      paybackYears: num(econRec.paybackYears),
    };

    const structRec = asRecord(d.dealStructure);
    const dealStructure: DealStructure = {
      cashPct: num(structRec.cashPct),
      stockPct: num(structRec.stockPct),
      earnoutPct: num(structRec.earnoutPct),
      earnoutTerms: typeof structRec.earnoutTerms === "string" ? structRec.earnoutTerms : undefined,
    };

    const flagsRec = asRecord(d.flags);
    const flags: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(flagsRec)) flags[k] = v === true;

    const discountRate = Number(d.discountRate);
    const synergyItems: SynergyItem[] = synergies.map((s) => ({
      type: s.type,
      runRate: s.runRate,
      ramp: s.ramp,
      oneTimeCost: s.oneTimeCost,
      evidenceLevel: s.evidenceLevel as SynergyItem["evidenceLevel"],
    }));
    const synergyNpvValue = synergyNpv(synergyItems, discountRate);

    const ff = footballField(
      valuations.map((v): ValuationRange => ({ method: v.method, low: v.low, base: v.base, high: v.high })),
    );

    const price = d.price === null ? null : Number(d.price);
    const economics = dealEconomics({
      price: price ?? 0,
      synergyNpvValue,
      roic: economicsInput.roic,
      wacc: economicsInput.wacc,
    });

    const evidenceCarriers = [
      ...synergies.map((s) => s.evidenceLevel),
      ...screening.map((s) => s.evidenceLevel),
    ];
    const minEvidence = evidenceCarriers.length > 0 ? Math.min(...evidenceCarriers) : 1;

    const stage = (DEAL_STAGE_ORDER.includes(d.stage as DealStage) ? d.stage : "sourcing") as DealStage;

    const gate = evaluateDealGate({
      economics: { ...economics, paybackYears: economicsInput.paybackYears },
      minEvidence: minEvidence as 1 | 2 | 3 | 4 | 5 | 6,
      thresholds,
      requiredFlags,
      flags,
      openDealBreakers: findings.filter((f) => f.dealBreaker && f.status !== "closed").map((f) => f.finding),
      openConditions: conditions.filter((c) => c.status !== "closed").map((c) => c.item),
      strict: STRICT_STAGES.includes(stage),
    });

    return {
      id: d.id,
      name: d.name,
      dealType: d.dealType as DealType,
      direction: d.direction,
      stage,
      thesis: d.thesis,
      linkedCrux: d.linkedCrux,
      dealLead: d.dealLead,
      budgetTag: d.budgetTag,
      price,
      walkAwayPrice: d.walkAwayPrice === null ? null : Number(d.walkAwayPrice),
      discountRate,
      dealStructure,
      economicsInput,
      flags,
      screening,
      valuations,
      synergies,
      findings,
      conditions,
      footballField: ff,
      synergyNpvValue,
      economics,
      minEvidence,
      gate,
    };
  });

  return { profiles, deals };
}
