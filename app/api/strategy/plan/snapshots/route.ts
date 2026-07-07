import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { dbAvailable, prisma } from "@/lib/db";

type PlanSnapshotPayload = {
  intent?: string;
  northStar?: string;
  objectives?: Array<{ dimension?: string; objective?: string; keyResults?: Array<{ keyResult?: string; target?: string }> }>;
  initiatives?: Array<{ title?: string; okrKeyResult?: string; q1Milestone?: string; q2Milestone?: string; q3Milestone?: string; q4Milestone?: string }>;
  resources?: Array<{ resourceType?: string; amount?: string; justification?: string }>;
  assumptions?: Array<{ assumption?: string; critical?: boolean }>;
  swotItems?: Array<{ quadrant?: string; content?: string }>;
  orgChartNodes?: Array<{ name?: string; role?: string; headcount?: string | number; headcountNew?: string | number; note?: string }>;
  channelPlans?: Array<Record<string, unknown>>;
  customerPlans?: Array<Record<string, unknown>>;
  productQuarterly?: Array<Record<string, unknown>>;
  marketInsights?: Array<{ category?: string; title?: string; content?: string; dataPoint?: string; source?: string }>;
  actionItems?: Array<{ initiativeTitle?: string; action?: string; ownerName?: string; acceptanceCriteria?: string }>;
  budgetItems?: Array<{ category?: string; initiativeTitle?: string; department?: string; description?: string; totalAmount?: string; justification?: string }>;
  roadmapItems?: Array<{ track?: string; title?: string; milestone?: string; startYear?: string | number; startQ?: string | number; endYear?: string | number; endQ?: string | number }>;
};

type PlanDiff = {
  category: string;
  severity: "info" | "warning" | "high";
  title: string;
  detail?: string;
  before?: string;
  after?: string;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function normalizeList(items: unknown[] | undefined, picker: (item: any) => string): string[] {
  return (items ?? []).map((item) => picker(item)).map((item) => item.trim()).filter(Boolean);
}

function joined(items: string[]): string {
  return items.join("；");
}

function addTextDiff(diffs: PlanDiff[], category: string, label: string, before: unknown, after: unknown, severity: PlanDiff["severity"] = "warning") {
  const b = text(before);
  const a = text(after);
  if (b === a) return;
  diffs.push({
    category,
    severity,
    title: `${label}发生变化`,
    before: b || "-",
    after: a || "-",
  });
}

function addListDiff(diffs: PlanDiff[], category: string, label: string, before: string[], after: string[], severity: PlanDiff["severity"] = "warning") {
  const b = joined(before);
  const a = joined(after);
  if (b === a) return;
  diffs.push({
    category,
    severity,
    title: `${label}发生变化`,
    detail: `旧 ${before.length} 条，新 ${after.length} 条`,
    before: b || "-",
    after: a || "-",
  });
}

function comparePlanSnapshots(from: PlanSnapshotPayload, to: PlanSnapshotPayload): PlanDiff[] {
  const diffs: PlanDiff[] = [];
  addTextDiff(diffs, "STRATEGIC_INTENT", "战略意图", from.intent, to.intent, "high");
  addTextDiff(diffs, "NORTH_STAR", "北极星指标", from.northStar, to.northStar, "high");

  addListDiff(
    diffs,
    "MARKET_INSIGHT",
    "市场洞察",
    normalizeList(from.marketInsights, (m) => `${text(m.category)} ${text(m.title)} ${text(m.content)} ${text(m.dataPoint)}`),
    normalizeList(to.marketInsights, (m) => `${text(m.category)} ${text(m.title)} ${text(m.content)} ${text(m.dataPoint)}`),
  );
  addListDiff(
    diffs,
    "SWOT",
    "SWOT",
    normalizeList(from.swotItems, (s) => `${text(s.quadrant)} ${text(s.content)}`),
    normalizeList(to.swotItems, (s) => `${text(s.quadrant)} ${text(s.content)}`),
  );
  addListDiff(
    diffs,
    "BSC_OBJECTIVE",
    "BSC 目标/KPI",
    normalizeList(from.objectives, (o) => `${text(o.dimension)} ${text(o.objective)} ${(o.keyResults ?? []).map((k: any) => `${text(k.keyResult)} ${text(k.target)}`).join(" ")}`),
    normalizeList(to.objectives, (o) => `${text(o.dimension)} ${text(o.objective)} ${(o.keyResults ?? []).map((k: any) => `${text(k.keyResult)} ${text(k.target)}`).join(" ")}`),
    "high",
  );
  addListDiff(
    diffs,
    "INITIATIVE",
    "OKR/关键举措",
    normalizeList(from.initiatives, (i) => `${text(i.title)} ${text(i.okrKeyResult)} ${text(i.q1Milestone)} ${text(i.q2Milestone)} ${text(i.q3Milestone)} ${text(i.q4Milestone)}`),
    normalizeList(to.initiatives, (i) => `${text(i.title)} ${text(i.okrKeyResult)} ${text(i.q1Milestone)} ${text(i.q2Milestone)} ${text(i.q3Milestone)} ${text(i.q4Milestone)}`),
    "high",
  );
  addListDiff(
    diffs,
    "ACTION_PLAN",
    "作战计划",
    normalizeList(from.actionItems, (a) => `${text(a.initiativeTitle)} ${text(a.action)} ${text(a.ownerName)} ${text(a.acceptanceCriteria)}`),
    normalizeList(to.actionItems, (a) => `${text(a.initiativeTitle)} ${text(a.action)} ${text(a.ownerName)} ${text(a.acceptanceCriteria)}`),
  );
  addListDiff(
    diffs,
    "ORGANIZATION",
    "组织规划",
    normalizeList(from.orgChartNodes, (n) => `${text(n.name)} ${text(n.role)} ${text(n.headcount)} ${text(n.headcountNew)} ${text(n.note)}`),
    normalizeList(to.orgChartNodes, (n) => `${text(n.name)} ${text(n.role)} ${text(n.headcount)} ${text(n.headcountNew)} ${text(n.note)}`),
  );
  addListDiff(
    diffs,
    "RESOURCE_BUDGET",
    "资源预算",
    [
      ...normalizeList(from.resources, (r) => `${text(r.resourceType)} ${text(r.amount)} ${text(r.justification)}`),
      ...normalizeList(from.budgetItems, (b) => `${text(b.category)} ${text(b.initiativeTitle)} ${text(b.department)} ${text(b.description)} ${text(b.totalAmount)} ${text(b.justification)}`),
    ],
    [
      ...normalizeList(to.resources, (r) => `${text(r.resourceType)} ${text(r.amount)} ${text(r.justification)}`),
      ...normalizeList(to.budgetItems, (b) => `${text(b.category)} ${text(b.initiativeTitle)} ${text(b.department)} ${text(b.description)} ${text(b.totalAmount)} ${text(b.justification)}`),
    ],
  );
  addListDiff(
    diffs,
    "ASSUMPTION",
    "关键假设",
    normalizeList(from.assumptions, (a) => `${text(a.assumption)} ${a.critical ? "critical" : ""}`),
    normalizeList(to.assumptions, (a) => `${text(a.assumption)} ${a.critical ? "critical" : ""}`),
  );
  addListDiff(
    diffs,
    "ROADMAP",
    "路线图",
    normalizeList(from.roadmapItems, (r) => `${text(r.track)} ${text(r.title)} ${text(r.milestone)} ${text(r.startYear)}Q${text(r.startQ)}-${text(r.endYear)}Q${text(r.endQ)}`),
    normalizeList(to.roadmapItems, (r) => `${text(r.track)} ${text(r.title)} ${text(r.milestone)} ${text(r.startYear)}Q${text(r.startQ)}-${text(r.endYear)}Q${text(r.endQ)}`),
    "high",
  );
  return diffs;
}

export async function GET(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  if (!(await dbAvailable())) return NextResponse.json({ orgUnits: [], snapshots: [], source: "unavailable" });

  const { searchParams } = new URL(req.url);
  const orgUnitId = searchParams.get("orgUnitId");

  const orgUnits = await prisma.$queryRaw<Array<{ id: string; name: string; level: string; snapshotCount: bigint }>>`
    SELECT
      ou."id",
      ou."name",
      ou."level"::text AS "level",
      COUNT(ps."id") AS "snapshotCount"
    FROM "org_units" ou
    LEFT JOIN "plan_submission_snapshots" ps ON ps."org_unit_id" = ou."id"
    GROUP BY ou."id", ou."name", ou."level", ou."sort_order"
    ORDER BY ou."sort_order" ASC, ou."name" ASC
  `;

  const selectedOrgId = orgUnitId || orgUnits.find((org) => Number(org.snapshotCount) > 0)?.id || orgUnits[0]?.id || null;
  const snapshots = selectedOrgId
    ? await prisma.$queryRaw<
        Array<{
          id: string;
          orgUnitId: string;
          version: number;
          status: string;
          submittedAt: Date;
          horizonStart: number;
          horizonEnd: number;
        }>
      >`
        SELECT
          "id",
          "org_unit_id" AS "orgUnitId",
          "version",
          "status",
          "submitted_at" AS "submittedAt",
          "horizon_start" AS "horizonStart",
          "horizon_end" AS "horizonEnd"
        FROM "plan_submission_snapshots"
        WHERE "org_unit_id" = ${selectedOrgId}
        ORDER BY "version" ASC
      `
    : [];

  return NextResponse.json({
    source: "database",
    selectedOrgId,
    orgUnits: orgUnits.map((org) => ({
      id: org.id,
      name: org.name,
      level: org.level,
      snapshotCount: Number(org.snapshotCount),
    })),
    snapshots: snapshots.map((snapshot) => ({
      ...snapshot,
      submittedAt: snapshot.submittedAt.toISOString(),
      label: `V${snapshot.version} · ${snapshot.horizonStart}-${snapshot.horizonEnd} · ${snapshot.submittedAt.toISOString().slice(0, 10)}`,
    })),
  });
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  if (!(await dbAvailable())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const body = (await req.json()) as { fromId?: string; toId?: string };
  if (!body.fromId || !body.toId) {
    return NextResponse.json({ error: "fromId 与 toId 必填" }, { status: 400 });
  }
  if (body.fromId === body.toId) {
    return NextResponse.json({ error: "请选择两个不同版本" }, { status: 400 });
  }

  const rows = await prisma.$queryRaw<
    Array<{ id: string; orgUnitId: string; version: number; snapshotJson: unknown }>
  >`
    SELECT
      "id",
      "org_unit_id" AS "orgUnitId",
      "version",
      "snapshot_json" AS "snapshotJson"
    FROM "plan_submission_snapshots"
    WHERE "id" IN (${body.fromId}, ${body.toId})
  `;
  const from = rows.find((row) => row.id === body.fromId);
  const to = rows.find((row) => row.id === body.toId);
  if (!from || !to) {
    return NextResponse.json({ error: "版本不存在" }, { status: 404 });
  }
  if (from.orgUnitId !== to.orgUnitId) {
    return NextResponse.json({ error: "只能对比同一组织的战略版本" }, { status: 400 });
  }

  const diffs = comparePlanSnapshots(from.snapshotJson as PlanSnapshotPayload, to.snapshotJson as PlanSnapshotPayload);
  return NextResponse.json({
    ok: true,
    source: "plan_submission_snapshots",
    fromVersion: from.version,
    toVersion: to.version,
    count: diffs.length,
    diffs,
  });
}
