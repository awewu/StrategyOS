import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import { join, normalize, sep } from "node:path";
import { ReportApprovalActions } from "@/components/reports/ReportApprovalActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEffectiveRole, getEffectiveSession, requireMinLevel } from "@/lib/auth/guard";
import { getOrgScope, orgScopeWhere } from "@/lib/auth/scope";
import { dbAvailable } from "@/lib/db";
import { getReportDetail, type ReportDetail } from "@/lib/reports/report-queries";

const REPORT_TYPE_LABELS: Record<string, string> = {
  MON_PULSE: "月度脉搏",
  MON_RPT: "月度报告",
  QTR_REV: "季度复盘",
  SHEET_IMPORT: "表格导入",
  ANNUAL_RPT: "年度报告",
  MEETING_MINUTES: "会议纪要",
};

const APPROVAL_LABEL: Record<string, string> = {
  PENDING: "待审批",
  APPROVED: "已存档",
  REJECTED: "已退回",
};

const APPROVAL_STYLE: Record<string, string> = {
  PENDING: "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]",
  APPROVED: "bg-[var(--signal-green)]/10 text-[var(--signal-green)]",
  REJECTED: "bg-[var(--signal-red)]/10 text-[var(--signal-red)]",
};

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

function uploadedReportFileExists(filePath: string | null): boolean {
  if (!filePath || !filePath.startsWith("/uploads/reports/")) return false;
  const normalized = normalize(filePath).replace(/^[/\\]+/, "");
  if (normalized.includes(`..${sep}`) || normalized === "..") return false;
  return existsSync(join(process.cwd(), "public", normalized));
}

function getParsedArray(report: ReportDetail, key: "coverageUpdates" | "assertionTriggers" | "agentTrace" | "patterns") {
  const parsed = report.parsedJson;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  const value = (parsed as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseEngineLabel(engine: ReportDetail["parseEngine"]) {
  if (engine === "llm") return "AI 解析";
  if (engine === "rules") return "规则解析";
  return "已解析";
}

function emptyParsedMessage(report: ReportDetail) {
  if (!report.hasParsed) return "尚未运行解析";
  if (!report.textExtracted) return "未抽取到原始文本，无法产生业务信号";
  if (report.parseEngine === "rules") return "已解析，未识别到该类信号（当前使用规则解析 fallback）";
  return "已解析，未识别到该类信号";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-primary)]">{value || "-"}</p>
    </div>
  );
}

function FileLinkItem({
  fileName,
  filePath,
  fileAvailable,
}: {
  fileName: string | null;
  filePath: string | null;
  fileAvailable: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[var(--color-text-muted)]">文件名</p>
      {fileName && filePath && fileAvailable ? (
        <a
          href={filePath}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          {fileName}
        </a>
      ) : (
        <>
          <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-primary)]">{fileName || "无文件"}</p>
          {fileName && filePath && !fileAvailable && (
            <p className="mt-1 text-[11px] text-[var(--signal-red)]">文件未同步到当前环境</p>
          )}
        </>
      )}
    </div>
  );
}

function PatternItem({ item }: { item: unknown }) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return <>{stringifyValue(item)}</>;
  const pattern = item as { formationType?: unknown; title?: unknown; suggestDeliberate?: unknown };
  const formationType = typeof pattern.formationType === "string" ? pattern.formationType : "pattern";
  const title = typeof pattern.title === "string" ? pattern.title : stringifyValue(item);
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-accent)]">
        {formationType}
        {pattern.suggestDeliberate === true ? " · 建议写入 deliberate" : ""}
      </div>
      <div className="mt-1">{title}</div>
    </div>
  );
}

function ParsedList({ title, items, emptyMessage }: { title: string; items: unknown[]; emptyMessage: string }) {
  const isPatternList = title === "战略模式";
  return (
    <section className="stratos-card stratos-card--padded">
      <h2 className="text-title text-[var(--color-text-primary)]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded-lg border border-[var(--surface-border)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              {isPatternList ? <PatternItem item={item} /> : stringifyValue(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMinLevel(2, { pathname: "/reports" });
  const { id } = await params;

  if (!(await dbAvailable())) {
    return (
      <div className="stratos-page">
        <PageHeader eyebrow="报告详情" title="数据库不可用" subtitle="当前无法读取报告详情，请稍后重试。" />
        <Link href="/reports" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs">
          返回报告档案
        </Link>
      </div>
    );
  }

  const [role, session] = await Promise.all([getEffectiveRole(), getEffectiveSession()]);
  const report = await getReportDetail({
    id,
    scopeWhere: orgScopeWhere(getOrgScope(role, session)),
  });

  if (!report) notFound();

  const coverageUpdates = getParsedArray(report, "coverageUpdates");
  const assertionTriggers = getParsedArray(report, "assertionTriggers");
  const agentTrace = getParsedArray(report, "agentTrace");
  const patterns = getParsedArray(report, "patterns");
  const fileAvailable = uploadedReportFileExists(report.filePath);
  const emptyMessage = emptyParsedMessage(report);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow={`${REPORT_TYPE_LABELS[report.reportType] ?? report.reportType} · ${report.period}`}
        title={report.title}
        subtitle={`${report.orgUnit?.name ?? "未关联组织"} · ${new Date(report.uploadedAt).toLocaleString("zh-CN")}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/reports" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs">
          返回报告档案
        </Link>
        {report.approvalStatus === "PENDING" && <ReportApprovalActions reportId={report.id} />}
      </div>

      <section className="stratos-card stratos-card--padded">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="报告类型" value={REPORT_TYPE_LABELS[report.reportType] ?? report.reportType} />
          <DetailItem label="组织单元" value={report.orgUnit?.name ?? "未关联"} />
          <DetailItem label="报告期" value={report.period} />
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">审批状态</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                APPROVAL_STYLE[report.approvalStatus] ?? ""
              }`}
            >
              {APPROVAL_LABEL[report.approvalStatus] ?? report.approvalStatus}
            </span>
          </div>
        </div>
      </section>

      {report.reportType === "MON_PULSE" && report.monthlyPulse && (
        <section className="stratos-card stratos-card--padded">
          <h2 className="text-title text-[var(--color-text-primary)]">月度脉搏</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <DetailItem label="本月一句话" value={report.monthlyPulse.oneLiner} />
            <DetailItem label="偏离的 KR" value={report.monthlyPulse.offTrackKr ?? ""} />
            <DetailItem label="需协调 / 求助" value={report.monthlyPulse.needHelp ?? ""} />
          </div>
        </section>
      )}

      <section className="stratos-card stratos-card--padded">
        <h2 className="text-title text-[var(--color-text-primary)]">原始报告</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FileLinkItem fileName={report.fileOrigName} filePath={report.filePath} fileAvailable={fileAvailable} />
          <DetailItem label="文件大小" value={report.fileSizeBytes ? fmtBytes(report.fileSizeBytes) : ""} />
          <DetailItem label="MIME" value={report.fileMime ?? ""} />
          <DetailItem label="解析状态" value={report.hasParsed ? parseEngineLabel(report.parseEngine) : "未解析"} />
        </div>
        {report.hasParsed && (
          <div className="mt-4 grid gap-3 rounded-lg border border-[var(--surface-border)] bg-black/[0.02] p-3 text-caption sm:grid-cols-3">
            <div>
              <span className="font-medium text-[var(--color-text-primary)]">{report.signalCount}</span> 条业务信号
            </div>
            <div>{report.textExtracted ? "已抽取原始文本" : "未抽取原始文本"}</div>
            <div>{report.hasSignals ? "可反哺执行审计" : "无命中信号"}</div>
            {report.parseWarning && (
              <div className="sm:col-span-3 text-[var(--signal-yellow)]">{report.parseWarning}</div>
            )}
          </div>
        )}
        <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--surface-border)] bg-black/[0.02] p-4 text-xs leading-6 text-[var(--color-text-primary)]">
          {report.rawContent || "暂无原始文本"}
        </pre>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ParsedList title="覆盖 / KR 信号" items={coverageUpdates} emptyMessage={emptyMessage} />
        <ParsedList title="断言触发" items={assertionTriggers} emptyMessage={emptyMessage} />
        <ParsedList title="战略模式" items={patterns} emptyMessage={emptyMessage} />
        <ParsedList title="Agent Trace" items={agentTrace} emptyMessage={report.hasParsed ? "解析未返回执行轨迹" : emptyMessage} />
      </div>
    </div>
  );
}
