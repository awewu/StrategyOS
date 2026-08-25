import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PlanReviewActions } from "@/components/strategy/PlanReviewActions";
import { ReadonlyOrgPlanningTable } from "@/components/strategy/ReadonlyOrgPlanningTable";
import { ReadonlyProductQuarterlyTabs } from "@/components/strategy/ReadonlyProductQuarterlyTabs";
import { ReadonlyRoadmapGantt } from "@/components/strategy/ReadonlyRoadmapGantt";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { prisma, safeDbQuery } from "@/lib/db";

const HORIZON_START = 2026;
const HORIZON_END = 2028;

type SearchParams = {
  planId?: string;
};

function value(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function money(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("zh-CN") : String(v);
}

function productMetric(v: unknown): string {
  return v === null || v === undefined || v === "" ? "0" : money(v);
}

function productQuarterlyDisplay(p: {
  unit: string | null;
  q1Qty: unknown;
  q2Qty: unknown;
  q3Qty: unknown;
  q4Qty: unknown;
  annualQty: unknown;
}): { unit: string; annualQty: string } {
  const rawUnit = p.unit?.trim() ?? "";
  const misplacedAnnualQty = Number(rawUnit.replaceAll(",", ""));
  const quarterlyQty = [p.q1Qty, p.q2Qty, p.q3Qty, p.q4Qty].map(Number);
  const quarterlyTotal = quarterlyQty.reduce((sum, qty) => sum + qty, 0);
  const hasQuarterlyQty = [p.q1Qty, p.q2Qty, p.q3Qty, p.q4Qty].some(
    (qty) => qty !== null && qty !== undefined && qty !== "",
  );
  const hasLegacyMisplacement =
    p.annualQty === null &&
    rawUnit !== "" &&
    Number.isFinite(misplacedAnnualQty) &&
    quarterlyQty.every(Number.isFinite) &&
    Math.abs(misplacedAnnualQty - quarterlyTotal) < 0.001;

  const annualQty = hasLegacyMisplacement
    ? money(misplacedAnnualQty)
    : p.annualQty !== null && p.annualQty !== undefined && p.annualQty !== ""
      ? money(p.annualQty)
      : hasQuarterlyQty
        ? money(quarterlyTotal)
        : "0";

  return { unit: rawUnit && !hasLegacyMisplacement ? rawUnit : "台/套", annualQty };
}

function safeAttachmentPath(storagePath: string): string | null {
  if (!storagePath.startsWith("/uploads/plans/")) return null;
  if (storagePath.includes("..")) return null;
  return join(process.cwd(), "public", storagePath);
}

function attachmentFileExists(storagePath: string): boolean {
  const physPath = safeAttachmentPath(storagePath);
  return Boolean(physPath && existsSync(physPath));
}

function canPreviewAttachment(filename: string, mimeType: string): boolean {
  const lower = filename.toLowerCase();
  return mimeType === "application/pdf" || lower.endsWith(".pdf") || lower.endsWith(".ppt") || lower.endsWith(".pptx");
}

const SWOT_META = {
  strength: { label: "优势 Strength", shortLabel: "S", tint: "bg-[var(--signal-green)]/10 text-[var(--signal-green)]" },
  weakness: { label: "劣势 Weakness", shortLabel: "W", tint: "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]" },
  opportunity: { label: "机会 Opportunity", shortLabel: "O", tint: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" },
  threat: { label: "威胁 Threat", shortLabel: "T", tint: "bg-[var(--signal-red)]/10 text-[var(--signal-red)]" },
} as const;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  LOCKED: "已锁定",
};

const BSC_DIMENSION_LABELS: Record<string, string> = {
  FINANCIAL: "财务",
  CUSTOMER: "客户",
  PROCESS: "流程",
  LEARNING: "学习",
};

const ACTION_STATUS_LABELS: Record<string, string> = {
  PLAN: "计划中",
  IN_PROGRESS: "推进中",
  DONE: "已完成",
  RISK: "有风险",
};

type SwotQuadrant = keyof typeof SWOT_META;

function swotQuadrant(raw: string): SwotQuadrant {
  return raw === "weakness" || raw === "opportunity" || raw === "threat" ? raw : "strength";
}

function actionStatusLabel(status: string | null): string {
  if (!status) return "-";
  return ACTION_STATUS_LABELS[status] ?? status;
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "SUBMITTED"
      ? "bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
      : status === "LOCKED"
        ? "bg-black/[0.06] text-[var(--color-text-secondary)]"
        : "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{STATUS_LABELS[status] ?? status}</span>;
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="stratos-card stratos-card--padded min-w-0 space-y-4">
      <h2 className="text-subsection text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-[var(--color-text-muted)]">暂无内容</p>;
}

function TableCellContent({ cell }: { cell: React.ReactNode }) {
  if (typeof cell === "string") {
    if (!cell.includes("\n") && cell.length <= 12) {
      return <span className="block whitespace-nowrap">{cell}</span>;
    }
    return <span className="block whitespace-pre-line break-words leading-relaxed">{cell}</span>;
  }
  return cell;
}

function SimpleTable({
  columns,
  rows,
  minWidth,
  compact = false,
  stickyColumns = 0,
  stickyColumnWidths,
  nowrapHeaderColumns = [],
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  minWidth?: number;
  compact?: boolean;
  stickyColumns?: 0 | 1 | 2;
  stickyColumnWidths?: readonly number[];
  nowrapHeaderColumns?: number[];
}) {
  if (rows.length === 0) return <Empty />;
  const tableMinWidth = minWidth ?? Math.max(640, columns.length * 150);
  const resolvedStickyColumnWidths = stickyColumns === 2
    ? stickyColumnWidths ?? [112, 256]
    : stickyColumnWidths;

  function stickyColumnClass(index: number, header: boolean): string | undefined {
    if (index >= stickyColumns) return undefined;
    const layer = header ? "z-20" : "z-10";
    const hover = header ? "" : "group-hover:bg-[var(--surface-raised)]";
    return `sticky ${layer} bg-[var(--color-bg-surface)] shadow-[1px_0_0_var(--surface-border)] ${hover}`;
  }

  function stickyColumnStyle(index: number): React.CSSProperties | undefined {
    if (index >= stickyColumns) return undefined;
    const width = resolvedStickyColumnWidths?.[index];
    const left = resolvedStickyColumnWidths
      ?.slice(0, index)
      .reduce((sum, columnWidth) => sum + columnWidth, 0) ?? 0;
    return width ? { left, width, minWidth: width, maxWidth: width } : { left };
  }

  return (
    <div className="stratos-table-wrap max-w-full min-w-0">
      <table
        className={`stratos-table ${compact ? "table-fixed text-[11px] [&_th]:whitespace-normal [&_th]:px-1 [&_td]:px-1 [&_td_span]:whitespace-normal [&_th:first-child]:w-24" : ""}`}
        style={{ minWidth: tableMinWidth }}
      >
        <thead>
          <tr>
            {columns.map((c, index) => (
              <th
                key={c}
                className={[
                  stickyColumnClass(index, true),
                  nowrapHeaderColumns.includes(index) ? "whitespace-nowrap" : undefined,
                ].filter(Boolean).join(" ") || undefined}
                style={stickyColumnStyle(index)}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={stickyColumns > 0 ? "group" : undefined}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={stickyColumnClass(j, false)}
                  style={stickyColumnStyle(j)}
                >
                  <TableCellContent cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SwotQuadrantView({
  items,
}: {
  items: Array<{ quadrant: string; content: string }>;
}) {
  const grouped: Record<SwotQuadrant, string[]> = {
    strength: [],
    weakness: [],
    opportunity: [],
    threat: [],
  };
  for (const item of items) {
    grouped[swotQuadrant(item.quadrant)].push(item.content);
  }

  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      {(Object.keys(SWOT_META) as SwotQuadrant[]).map((key) => {
        const meta = SWOT_META[key];
        return (
          <div key={key} className="min-w-0 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-raised)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${meta.tint}`}>
                {meta.shortLabel}
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{meta.label}</h3>
            </div>
            {grouped[key].length === 0 ? (
              <p className="text-caption">暂无内容</p>
            ) : (
              <ul className="space-y-2">
                {grouped[key].map((content, index) => (
                  <li key={`${key}-${index}`} className="whitespace-pre-line break-words rounded-md bg-white px-3 py-2 text-sm leading-relaxed">
                    {content}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function StrategySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRouteAccess("/strategy/submissions");
  const { planId } = await searchParams;

  const plans = await safeDbQuery(
    () =>
      prisma.strategicPlan.findMany({
        where: { horizonStart: HORIZON_START, horizonEnd: HORIZON_END },
        include: { orgUnit: true, submittedBy: true },
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
      }),
    [],
  );
  const selectedPlanId = planId ?? plans[0]?.id;
  const plan = selectedPlanId
    ? await safeDbQuery(
        () =>
          prisma.strategicPlan.findUnique({
            where: { id: selectedPlanId },
            include: {
              orgUnit: true,
              submittedBy: true,
              objectives: {
                include: { keyResults: { orderBy: { sortOrder: "asc" } } },
                orderBy: { sortOrder: "asc" },
              },
              initiatives: { orderBy: { sortOrder: "asc" } },
              resourceReqs: true,
              assumptions: true,
              attachments: { orderBy: { uploadedAt: "asc" } },
              swotItems: { orderBy: { sortOrder: "asc" } },
              orgChartNodes: { orderBy: { sortOrder: "asc" } },
              channelPlans: { orderBy: { sortOrder: "asc" } },
              customerPlans: { orderBy: { sortOrder: "asc" } },
              productQuarterly: { orderBy: [{ year: "asc" }, { sortOrder: "asc" }] },
              marketInsights: { orderBy: { sortOrder: "asc" } },
              actionItems: { orderBy: { sortOrder: "asc" } },
              budgetItems: { orderBy: { sortOrder: "asc" } },
              roadmapItems: { orderBy: { sortOrder: "asc" } },
            },
          }),
        null,
      )
    : null;

  return (
    <div className="stratos-page lg:relative lg:left-1/2 lg:w-[min(calc(100vw_-_var(--sidebar-w)_-_var(--page-gutter)_-_var(--page-gutter)),100rem)] lg:-translate-x-1/2">
      <PageHeader
        eyebrow="战略制定 · 提交回看"
        title="已提交战略"
        subtitle="按编制单位查看 2026-2028 战略录入完整页签"
        actions={
          <>
            <Link href="/strategy/input" className="stratos-btn stratos-btn--ghost text-xs">
              继续编制
            </Link>
            <Link href="/strategy" className="stratos-btn stratos-btn--primary text-xs">
              战略总览
            </Link>
          </>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="stratos-card stratos-card--padded h-fit min-w-0 space-y-3">
          <div>
            <h2 className="text-subsection">提交记录</h2>
            <p className="text-caption">共 {plans.length} 份</p>
          </div>
          <div className="space-y-2">
            {plans.length === 0 ? <Empty /> : null}
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/strategy/submissions?planId=${p.id}`}
                className={`block rounded-lg border px-3 py-2 text-sm transition-colors ${
                  p.id === selectedPlanId
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-[var(--surface-border)] hover:border-[var(--color-accent)]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-2 min-w-0 flex-1 font-medium text-[var(--color-text-primary)]" title={p.orgUnit.name}>
                    {p.orgUnit.name}
                  </span>
                  <StatusPill status={p.status} />
                </div>
                <div className="mt-1 text-caption">
                  {p.horizonStart}-{p.horizonEnd} · 更新 {value(p.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {!plan ? (
          <section className="stratos-card stratos-card--padded">
            <Empty />
          </section>
        ) : (
          <main className="min-w-0 space-y-4">
            <section className="stratos-card stratos-card--padded min-w-0 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-title text-[var(--color-text-primary)]">{plan.orgUnit.name}</h2>
                  <p className="text-caption">
                    {plan.horizonStart}-{plan.horizonEnd} · 提交人 {plan.submittedBy?.name ?? "-"} · 提交时间{" "}
                    {value(plan.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={plan.status} />
                  {plan.status === "SUBMITTED" ? (
                    <PlanReviewActions
                      orgUnitId={plan.orgUnitId}
                      horizonStart={plan.horizonStart}
                      horizonEnd={plan.horizonEnd}
                    />
                  ) : null}
                  {plan.status !== "LOCKED" ? (
                    <Link
                      href={`/strategy/input?planId=${plan.id}`}
                      className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
                    >
                      修改此战略
                    </Link>
                  ) : null}
                </div>
              </div>
              <nav className="flex flex-wrap gap-2 text-xs">
                {[
                  ["intent", "战略意图"],
                  ["market", "市场洞察"],
                  ["swot", "SWOT"],
                  ["objectives", "BSC/KPI"],
                  ["initiatives", "OKR/关键举措"],
                  ["action", "作战计划"],
                  ["product", "产品"],
                  ["channel", "渠道"],
                  ["customer", "客户"],
                  ["org", "组织"],
                  ["budget", "预算"],
                  ["assumptions", "假设"],
                  ["roadmap", "路线图"],
                  ["attachments", "附件"],
                ].map(([id, label]) => (
                  <a key={id} href={`#${id}`} className="stratos-btn stratos-btn--ghost px-2 py-1">
                    {label}
                  </a>
                ))}
              </nav>
            </section>

            <Section id="intent" title="战略意图">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-label text-[var(--color-text-muted)]">战略意图</p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">{value(plan.intent)}</p>
                </div>
                <div>
                  <p className="text-label text-[var(--color-text-muted)]">北极星指标</p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">
                    {value(plan.northStar)}
                  </p>
                </div>
              </div>
            </Section>

            <Section id="market" title="市场洞察">
              <SimpleTable
                stickyColumns={2}
                nowrapHeaderColumns={[4]}
                columns={["类别", "标题", "内容", "数据点", "来源"]}
                rows={plan.marketInsights.map((m) => [
                  m.category,
                  m.title,
                  m.content,
                  value(m.dataPoint),
                  value(m.source),
                ])}
              />
            </Section>

            <Section id="swot" title="SWOT 分析">
              <SwotQuadrantView items={plan.swotItems} />
            </Section>

            <Section id="objectives" title="BSC 目标 / KPI">
              <SimpleTable
                columns={["维度", "BSC 管理目标", "KPI 指标 / 目标值"]}
                rows={plan.objectives.map((o) => [
                  BSC_DIMENSION_LABELS[o.dimension] ?? o.dimension,
                  o.objective,
                  o.keyResults.length > 0
                    ? o.keyResults.map((k) => `${k.keyResult}${k.target ? ` (${k.target})` : ""}`).join("；")
                    : "-",
                ])}
              />
            </Section>

            <Section id="initiatives" title="OKR / 关键举措">
              <SimpleTable
                stickyColumns={2}
                stickyColumnWidths={[360, 96]}
                nowrapHeaderColumns={[0, 1]}
                columns={["Objective / 关键举措", "负责人", "Key Result", "目标值", "Q1", "Q2", "Q3", "Q4"]}
                rows={plan.initiatives.map((i) => [
                  i.title,
                  value(i.ownerName),
                  value(i.okrKeyResult),
                  value(i.okrTarget),
                  value(i.q1Milestone),
                  value(i.q2Milestone),
                  value(i.q3Milestone),
                  value(i.q4Milestone),
                ])}
              />
            </Section>

            <Section id="action" title="作战计划">
              <SimpleTable
                stickyColumns={2}
                stickyColumnWidths={[80, 72]}
                nowrapHeaderColumns={[0, 1]}
                columns={["年份", "季度", "行动", "关联举措", "负责人", "验收标准", "状态"]}
                rows={plan.actionItems.map((a) => [
                  a.year,
                  `Q${a.quarter}`,
                  a.action,
                  value(a.initiativeTitle),
                  value(a.ownerName),
                  value(a.acceptanceCriteria),
                  actionStatusLabel(a.status),
                ])}
              />
            </Section>

            <Section id="product" title="产品季度">
              <ReadonlyProductQuarterlyTabs
                years={plan.productQuarterlyYears}
                rows={plan.productQuarterly.map((p) => {
                  const display = productQuarterlyDisplay(p);
                  return {
                    year: p.year,
                    productName: p.productName,
                    unit: display.unit,
                    q1Qty: productMetric(p.q1Qty),
                    q1Revenue: productMetric(p.q1Revenue),
                    q2Qty: productMetric(p.q2Qty),
                    q2Revenue: productMetric(p.q2Revenue),
                    q3Qty: productMetric(p.q3Qty),
                    q3Revenue: productMetric(p.q3Revenue),
                    q4Qty: productMetric(p.q4Qty),
                    q4Revenue: productMetric(p.q4Revenue),
                    annualQty: display.annualQty,
                    annualRevenue: productMetric(p.annualRevenue),
                    note: value(p.note),
                  };
                })}
              />
            </Section>

            <Section id="channel" title="渠道发展">
              <SimpleTable
                stickyColumns={2}
                columns={["渠道", "现状", "目标", "Q1", "Q2", "Q3", "Q4", "收入目标", "伙伴数", "备注"]}
                rows={plan.channelPlans.map((c) => [
                  c.channelType,
                  value(c.currentState),
                  value(c.targetState),
                  value(c.q1Action),
                  value(c.q2Action),
                  value(c.q3Action),
                  value(c.q4Action),
                  money(c.revenueTarget),
                  value(c.partnerCount),
                  value(c.note),
                ])}
              />
            </Section>

            <Section id="customer" title="客户发展">
              <SimpleTable
                stickyColumns={1}
                stickyColumnWidths={[220]}
                columns={["客户类型", "新客户", "现有数", "目标数", "Q1", "Q2", "Q3", "Q4", "客均收入", "获客策略", "留存策略"]}
                rows={plan.customerPlans.map((c) => [
                  c.customerSegment,
                  c.isNew ? "是" : "否",
                  value(c.currentCount),
                  value(c.targetCount),
                  value(c.q1Count),
                  value(c.q2Count),
                  value(c.q3Count),
                  value(c.q4Count),
                  money(c.revenuePerCustomer),
                  value(c.acquisitionStrategy),
                  value(c.retentionStrategy),
                ])}
              />
            </Section>

            <Section id="org" title="组织规划">
              <ReadonlyOrgPlanningTable
                rows={plan.orgChartNodes.map((n) => ({
                  name: n.name,
                  role: value(n.role),
                  headcount: value(n.headcount),
                  headcount2026: value(n.headcount2026),
                  headcount2027: value(n.headcount2027),
                  headcount2028: value(n.headcount2028),
                  note: value(n.note),
                }))}
              />
            </Section>

            <Section id="budget" title="资源预算">
              <SimpleTable
                stickyColumns={2}
                columns={["类别", "关联举措", "部门", "说明", "Year1", "Year2", "Year3", "合计", "ROI", "理由"]}
                rows={plan.budgetItems.map((b) => [
                  b.category,
                  value(b.initiativeTitle),
                  value(b.department),
                  b.description,
                  value(b.year1Amount),
                  value(b.year2Amount),
                  value(b.year3Amount),
                  value(b.totalAmount),
                  value(b.roiEstimate),
                  value(b.justification),
                ])}
              />
            </Section>

            <Section id="assumptions" title="关键假设">
              <SimpleTable
                columns={["假设", "关键"]}
                rows={plan.assumptions.map((a) => [a.assumption, a.critical ? "是" : "否"])}
              />
            </Section>

            <Section id="roadmap" title="路线图">
              <ReadonlyRoadmapGantt
                roadmapTabs={plan.roadmapTabs}
                items={plan.roadmapItems}
                horizonStart={plan.horizonStart}
                horizonEnd={plan.horizonEnd}
              />
            </Section>

            <Section id="attachments" title="附件">
              <SimpleTable
                columns={["文件名", "类型", "大小", "上传时间", "操作"]}
                rows={plan.attachments.map((a) => {
                  const fileExists = attachmentFileExists(a.storagePath);
                  const href = canPreviewAttachment(a.filename, a.mimeType)
                    ? `/api/strategy/plan/attachment/preview?id=${a.id}`
                    : `/api/strategy/plan/attachment?id=${a.id}`;
                  return [
                    fileExists ? (
                      <a
                        key={a.id}
                        href={`/api/strategy/plan/attachment?id=${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {a.filename}
                      </a>
                    ) : (
                      <span key={a.id} title="本地附件文件不存在，请同步 uploads/plans 目录或重新上传附件" className="text-[var(--color-text-muted)]">
                        {a.filename}
                      </span>
                    ),
                    a.mimeType,
                    `${Math.round(a.sizeBytes / 1024)} KB`,
                    value(a.uploadedAt),
                    fileExists ? (
                      <a
                        key={`${a.id}-open`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="stratos-btn stratos-btn--ghost px-2 py-1 text-xs"
                      >
                        查看
                      </a>
                    ) : (
                      <span
                        key={`${a.id}-missing`}
                        title="本地附件文件不存在，请同步 uploads/plans 目录或重新上传附件"
                        className="inline-flex rounded-lg border border-[var(--surface-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]"
                      >
                        文件缺失
                      </span>
                    ),
                  ];
                })}
              />
            </Section>
          </main>
        )}
      </div>
    </div>
  );
}
