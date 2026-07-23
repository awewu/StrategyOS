import Link from "next/link";
import { StrategyInputClient } from "@/components/strategy/StrategyInputClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { requireRouteAccess } from "@/lib/auth/guard";
import { getOrgUnitsWithChildren } from "@/lib/data/org-units-access";
import { getVersionsBundle } from "@/lib/data/versions-data";
import { prisma } from "@/lib/db";
import { topDiffs } from "@/lib/stratos";

const HORIZON_START = 2026;
const HORIZON_END = 2028;

type AttachmentOption = {
  id: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
};

function normalizeAttachment(raw: unknown): AttachmentOption | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Partial<AttachmentOption>;
  if (!item.id || !item.filename) return null;
  return {
    id: String(item.id),
    filename: String(item.filename),
    sizeBytes: Number(item.sizeBytes ?? 0),
    mimeType: String(item.mimeType ?? "application/octet-stream"),
  };
}

function normalizeAttachments(raw: unknown): AttachmentOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeAttachment).filter((item): item is AttachmentOption => item !== null);
}

function snapshotAttachments(snapshotJson: unknown): AttachmentOption[] {
  if (!snapshotJson || typeof snapshotJson !== "object" || Array.isArray(snapshotJson)) return [];
  return normalizeAttachments((snapshotJson as { attachments?: unknown }).attachments);
}

export default async function StrategyInputPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  await requireRouteAccess("/strategy/input");
  const { planId } = await searchParams;
  const [orgUnits, users, { stratDiffs }, historySnapshots, plan] = await Promise.all([
    getOrgUnitsWithChildren(),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orgUnit: { select: { name: true } },
      },
    }),
    getVersionsBundle(),
    prisma.planSubmissionSnapshot.findMany({
      where: { horizonStart: HORIZON_START, horizonEnd: HORIZON_END },
      orderBy: [{ orgUnitId: "asc" }, { version: "desc" }],
      select: {
        id: true,
        orgUnitId: true,
        version: true,
        status: true,
        submittedAt: true,
        snapshotJson: true,
        orgUnit: { select: { name: true } },
        plan: {
          select: {
            attachments: {
              orderBy: { uploadedAt: "asc" },
              select: { id: true, filename: true, sizeBytes: true, mimeType: true },
            },
          },
        },
      },
    }),
    planId
      ? prisma.strategicPlan.findUnique({
          where: { id: planId },
          include: {
            objectives: { include: { keyResults: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
            initiatives: { orderBy: { sortOrder: "asc" } },
            resourceReqs: true,
            assumptions: true,
            attachments: { orderBy: { uploadedAt: "asc" } },
            swotItems: { orderBy: { sortOrder: "asc" } },
            orgChartNodes: { orderBy: { sortOrder: "asc" } },
            channelPlans: { orderBy: { sortOrder: "asc" } },
            customerPlans: { orderBy: { sortOrder: "asc" } },
            productQuarterly: { orderBy: { sortOrder: "asc" } },
            marketInsights: { orderBy: { sortOrder: "asc" } },
            actionItems: { orderBy: { sortOrder: "asc" } },
            budgetItems: { orderBy: { sortOrder: "asc" } },
            roadmapItems: { orderBy: { sortOrder: "asc" } },
          },
        })
      : Promise.resolve(null),
  ]);
  const top3 = topDiffs(stratDiffs, 3);
  const initialPlan = plan ? JSON.parse(JSON.stringify(plan)) : null;
  const ownerOptions = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role),
    orgUnitName: user.orgUnit?.name ?? null,
  }));
  const statusLabel = (status: string) => status === "LOCKED" ? "已锁定" : status === "SUBMITTED" ? "已提交" : status;
  const historyVersions = historySnapshots.map((snapshot) => {
    const attachments = snapshotAttachments(snapshot.snapshotJson);
    return {
      id: snapshot.id,
      orgUnitId: snapshot.orgUnitId,
      version: snapshot.version,
      status: snapshot.status,
      submittedAt: snapshot.submittedAt.toISOString(),
      label: `V${snapshot.version} · ${snapshot.submittedAt.toISOString().slice(0, 10)} · ${statusLabel(snapshot.status)}`,
      orgUnitName: snapshot.orgUnit.name,
      snapshotJson: snapshot.snapshotJson,
      attachments: attachments.length > 0 ? attachments : normalizeAttachments(snapshot.plan.attachments),
    };
  });

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="三级规划 · 提交审核"
        title={initialPlan ? "修改战略" : "战略录入"}
        subtitle={initialPlan ? "加载已保存内容进行修改，保存草稿或重新提交审核" : "集团 · 高管层 · 执行层战略规划录入与提交"}
        actions={
          <>
            <Link href="/strategy/submissions" className="stratos-btn stratos-btn--ghost text-xs">
              已提交战略
            </Link>
            <Link href="/versions" className="stratos-btn stratos-btn--ghost text-xs">
              历史版本
            </Link>
            <Link href="/admin/org" className="stratos-btn stratos-btn--ghost text-xs">
              组织架构
            </Link>
          </>
        }
      />

      <section className="stratos-card stratos-card--padded flex flex-wrap items-start justify-between gap-4 border-l-[3px] border-l-[var(--color-accent)]">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-title text-[var(--color-text-primary)]">编制前 · StratDiff 对照</h2>
          <p className="text-caption">先读版本差异再更新本版战略</p>
          {top3.length > 0 ? (
            <ul className="space-y-1.5">
              {top3.map((d, i) => (
                <li key={`${d.category}-${i}`} className="flex items-start gap-2 text-sm">
                  <TrafficLightDot
                    signal={d.severity === "critical" || d.severity === "high" ? "red" : "yellow"}
                  />
                  <span className="line-clamp-1">{d.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Link href="/versions" className="stratos-btn stratos-btn--primary text-xs">
          打开对照
        </Link>
      </section>

      <StrategyInputClient
        key={initialPlan?.id ?? "new"}
        orgUnits={orgUnits}
        users={ownerOptions}
        historyVersions={historyVersions}
        initialPlan={initialPlan}
      />
    </div>
  );
}
