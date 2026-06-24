import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRouteAccess } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

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

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "SUBMITTED"
      ? "bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
      : status === "LOCKED"
        ? "bg-black/[0.06] text-[var(--color-text-secondary)]"
        : "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
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
    <section id={id} className="stratos-card stratos-card--padded space-y-4">
      <h2 className="text-subsection text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-[var(--color-text-muted)]">暂无内容</p>;
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="stratos-table-wrap">
      <table className="stratos-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

  const plans = await prisma.strategicPlan.findMany({
    where: { horizonStart: HORIZON_START, horizonEnd: HORIZON_END },
    include: { orgUnit: true, submittedBy: true },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
  });
  const selectedPlanId = planId ?? plans[0]?.id;
  const plan = selectedPlanId
    ? await prisma.strategicPlan.findUnique({
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
          productQuarterly: { orderBy: { sortOrder: "asc" } },
          marketInsights: { orderBy: { sortOrder: "asc" } },
          actionItems: { orderBy: { sortOrder: "asc" } },
          budgetItems: { orderBy: { sortOrder: "asc" } },
          roadmapItems: { orderBy: { sortOrder: "asc" } },
        },
      })
    : null;

  return (
    <div className="stratos-page">
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

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="stratos-card stratos-card--padded h-fit space-y-3">
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
                  <span className="font-medium text-[var(--color-text-primary)]">{p.orgUnit.name}</span>
                  <StatusPill status={p.status} />
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
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
          <main className="space-y-4">
            <section className="stratos-card stratos-card--padded space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-title text-[var(--color-text-primary)]">{plan.orgUnit.name}</h2>
                  <p className="text-caption">
                    {plan.horizonStart}-{plan.horizonEnd} · 提交人 {plan.submittedBy?.name ?? "-"} · 提交时间{" "}
                    {value(plan.submittedAt)}
                  </p>
                </div>
                <StatusPill status={plan.status} />
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
                  <p className="mt-1 text-sm">{value(plan.intent)}</p>
                </div>
                <div>
                  <p className="text-label text-[var(--color-text-muted)]">北极星指标</p>
                  <p className="mt-1 text-sm">{value(plan.northStar)}</p>
                </div>
              </div>
            </Section>

            <Section id="market" title="市场洞察">
              <SimpleTable
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
              <SimpleTable
                columns={["象限", "内容"]}
                rows={plan.swotItems.map((s) => [s.quadrant, s.content])}
              />
            </Section>

            <Section id="objectives" title="BSC 目标 / KPI">
              <SimpleTable
                columns={["维度", "BSC 管理目标", "KPI 指标 / 目标值"]}
                rows={plan.objectives.map((o) => [
                  o.dimension,
                  o.objective,
                  o.keyResults.length > 0
                    ? o.keyResults.map((k) => `${k.keyResult}${k.target ? ` (${k.target})` : ""}`).join("；")
                    : "-",
                ])}
              />
            </Section>

            <Section id="initiatives" title="OKR / 关键举措">
              <SimpleTable
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
                columns={["年份", "季度", "行动", "关联举措", "负责人", "验收标准", "状态"]}
                rows={plan.actionItems.map((a) => [
                  a.year,
                  `Q${a.quarter}`,
                  a.action,
                  value(a.initiativeTitle),
                  value(a.ownerName),
                  value(a.acceptanceCriteria),
                  value(a.status),
                ])}
              />
            </Section>

            <Section id="product" title="产品季度">
              <SimpleTable
                columns={["产品", "单位", "Q1量", "Q1收入", "Q2量", "Q2收入", "Q3量", "Q3收入", "Q4量", "Q4收入", "年度收入", "备注"]}
                rows={plan.productQuarterly.map((p) => [
                  p.productName,
                  value(p.unit),
                  money(p.q1Qty),
                  money(p.q1Revenue),
                  money(p.q2Qty),
                  money(p.q2Revenue),
                  money(p.q3Qty),
                  money(p.q3Revenue),
                  money(p.q4Qty),
                  money(p.q4Revenue),
                  money(p.annualRevenue),
                  value(p.note),
                ])}
              />
            </Section>

            <Section id="channel" title="渠道发展">
              <SimpleTable
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
              <SimpleTable
                columns={["部门/岗位", "职能", "现有编制", "新增编制", "备注"]}
                rows={plan.orgChartNodes.map((n) => [
                  n.name,
                  value(n.role),
                  value(n.headcount),
                  value(n.headcountNew),
                  value(n.note),
                ])}
              />
            </Section>

            <Section id="budget" title="资源预算">
              <SimpleTable
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
              <SimpleTable
                columns={["轨道", "标题", "开始", "结束", "里程碑"]}
                rows={plan.roadmapItems.map((r) => [
                  r.track,
                  r.title,
                  `${r.startYear} Q${r.startQ}`,
                  `${r.endYear} Q${r.endQ}`,
                  value(r.milestone),
                ])}
              />
            </Section>

            <Section id="attachments" title="附件">
              <SimpleTable
                columns={["文件名", "类型", "大小", "上传时间", "操作"]}
                rows={plan.attachments.map((a) => [
                  <a
                    key={a.id}
                    href={a.storagePath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {a.filename}
                  </a>,
                  a.mimeType,
                  `${Math.round(a.sizeBytes / 1024)} KB`,
                  value(a.uploadedAt),
                  <a
                    key={`${a.id}-open`}
                    href={`/api/strategy/plan/attachment/preview?id=${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="stratos-btn stratos-btn--ghost px-2 py-1 text-xs"
                  >
                    预览
                  </a>,
                ])}
              />
            </Section>
          </main>
        )}
      </div>
    </div>
  );
}
