"use client";

import { useEffect, useState, useRef } from "react";

type OrgUnit = { id: string; name: string; level: string };
type ReportRow = {
  id: string;
  title: string;
  reportType: string;
  period: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt: string;
  orgUnit: OrgUnit | null;
  fileOrigName: string | null;
  fileSizeBytes: number | null;
  hasParsed: boolean;
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  MON_PULSE: "月度脉搏",
  MON_RPT: "月度报告",
  QTR_REV: "季度复盘",
  SHEET_IMPORT: "表格导入",
  ANNUAL_RPT: "年度报告",
  MEETING_MINUTES: "会议纪要",
};

const APPROVAL_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700",
  APPROVED: "bg-green-600/10 text-green-700",
  REJECTED: "bg-red-600/10 text-red-700",
};
const APPROVAL_LABEL: Record<string, string> = {
  PENDING: "待审批",
  APPROVED: "已存档",
  REJECTED: "已退回",
};

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

export function ReportsArchive({ orgUnits }: { orgUnits: OrgUnit[] }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ orgUnitId: "", reportType: "", period: "", approval: "" });

  // Upload form state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [form, setForm] = useState({
    orgUnitId: "",
    reportType: "MON_RPT",
    period: new Date().toISOString().slice(0, 7),
    title: "",
    rawContent: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchRows() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.orgUnitId) p.set("orgUnitId", filters.orgUnitId);
      if (filters.reportType) p.set("reportType", filters.reportType);
      if (filters.period) p.set("period", filters.period);
      if (filters.approval) p.set("approval", filters.approval);
      const res = await fetch("/api/reports/list?" + p.toString());
      const data = (await res.json()) as { rows: ReportRow[]; db: boolean };
      setRows(data.rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const p = new URLSearchParams();
    if (filters.orgUnitId) p.set("orgUnitId", filters.orgUnitId);
    if (filters.reportType) p.set("reportType", filters.reportType);
    if (filters.period) p.set("period", filters.period);
    if (filters.approval) p.set("approval", filters.approval);
    fetch("/api/reports/list?" + p.toString())
      .then((r) => r.json())
      .then((data: { rows: ReportRow[]; db: boolean }) => {
        if (active) setRows(data.rows);
      })
      .catch(() => { /* ignore */ });
    return () => { active = false; };
  }, [filters]);

  async function submitReport() {
    if (!form.title.trim()) { setUploadMsg("标题必填"); return; }
    if (["MON_RPT", "QTR_REV", "ANNUAL_RPT"].includes(form.reportType) && !form.orgUnitId) {
      setUploadMsg("月报/复盘必须选择组织单元");
      return;
    }
    setUploading(true);
    setUploadMsg("");
    try {
      const fd = new FormData();
      fd.append("orgUnitId", form.orgUnitId);
      fd.append("reportType", form.reportType);
      fd.append("period", form.period);
      fd.append("title", form.title.trim());
      fd.append("rawContent", form.rawContent);
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("file", file);

      const res = await fetch("/api/reports/submit", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string; reportId?: string };
      if (!res.ok || !data.ok) { setUploadMsg(data.error ?? "上传失败"); return; }
      setUploadMsg(`已提交 · ${data.reportId}${data.reportId && " · 待上级审批"}`);
      setForm((f) => ({ ...f, title: "", rawContent: "" }));
      if (fileRef.current) fileRef.current.value = "";
      await fetchRows();
    } finally {
      setUploading(false);
    }
  }

  async function doApproval(id: string, action: "APPROVED" | "REJECTED") {
    await fetch("/api/reports/submit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    await fetchRows();
  }

  const f = (key: keyof typeof filters, v: string) =>
    setFilters((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">报告档案库</h2>
      </div>

      <details className="surface-elevated rounded-xl border border-black/[0.06] p-5">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          高级 / 完整月报上传（Word · Excel · PDF · 七章节）
        </summary>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label-xs">报告类型</label>
              <select
                className="stratos-input mt-1"
                value={form.reportType}
                onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}
              >
                {Object.entries(REPORT_TYPE_LABELS).filter(([k]) => k !== "MON_PULSE").map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-xs">所属部门/事业部</label>
              <select
                className="stratos-input mt-1"
                required={["MON_RPT", "QTR_REV", "ANNUAL_RPT"].includes(form.reportType)}
                value={form.orgUnitId}
                onChange={(e) => setForm((f) => ({ ...f, orgUnitId: e.target.value }))}
              >
                <option value="">请选择组织单元</option>
                {orgUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-xs">报告期</label>
              <input
                type="month"
                className="stratos-input mt-1"
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label-xs">报告标题 *</label>
            <input
              className="stratos-input mt-1 w-full"
              placeholder="如：空调事业部 2026-06 月度经营报告"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-xs">上传文件（Word / Excel / PDF / PPT）</label>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.xlsx,.pdf,.pptx,.doc,.xls,.ppt"
              className="mt-1 block text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-accent-dim)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--color-accent)] hover:file:opacity-80"
            />
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              系统将自动提取文本内容用于 AI 分析；原文件存档留存
            </p>
          </div>
          <div>
            <label className="label-xs">或直接粘贴文字内容</label>
            <textarea
              className="stratos-input mt-1 w-full min-h-[80px] resize-y"
              placeholder="可粘贴报告正文，补充说明文件中无法提取的内容"
              value={form.rawContent}
              onChange={(e) => setForm((f) => ({ ...f, rawContent: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={uploading}
              onClick={submitReport}
              className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "提交中…" : "提交待审批"}
            </button>
            {uploadMsg && (
              <span className={`text-sm ${uploadMsg.includes("失败") || uploadMsg.includes("必填") ? "text-[var(--signal-red)]" : "text-[var(--signal-green)]"}`}>
                {uploadMsg}
              </span>
            )}
          </div>
        </div>
      </details>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="stratos-input text-sm"
          value={filters.orgUnitId}
          onChange={(e) => f("orgUnitId", e.target.value)}
        >
          <option value="">全部部门</option>
          {orgUnits.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          className="stratos-input text-sm"
          value={filters.reportType}
          onChange={(e) => f("reportType", e.target.value)}
        >
          <option value="">全部类型</option>
          {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="month"
          className="stratos-input text-sm"
          value={filters.period}
          onChange={(e) => f("period", e.target.value)}
        />
        <select
          className="stratos-input text-sm"
          value={filters.approval}
          onChange={(e) => f("approval", e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="PENDING">待审批</option>
          <option value="APPROVED">已存档</option>
          <option value="REJECTED">已退回</option>
        </select>
        <button
          type="button"
          onClick={() => setFilters({ orgUnitId: "", reportType: "", period: "", approval: "" })}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          清除筛选
        </button>
      </div>

      {/* Archive list */}
      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">加载中…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.08] py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">暂无报告 · 点击「上传报告」提交第一份</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <article
              key={r.id}
              className="surface-glass flex flex-wrap items-start gap-3 rounded-xl border border-black/[0.06] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-accent)]">
                    {REPORT_TYPE_LABELS[r.reportType] ?? r.reportType}
                  </span>
                  {r.orgUnit && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {r.orgUnit.name}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--color-text-muted)]">{r.period}</span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {r.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                  <span>{new Date(r.uploadedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  {r.fileOrigName && (
                    <span>· {r.fileOrigName} {r.fileSizeBytes ? `(${fmtBytes(r.fileSizeBytes)})` : ""}</span>
                  )}
                  {r.hasParsed && <span>· AI 已解析</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${APPROVAL_STYLE[r.approvalStatus]}`}>
                  {APPROVAL_LABEL[r.approvalStatus]}
                </span>
                {r.approvalStatus === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => doApproval(r.id, "APPROVED")}
                      className="rounded border border-green-600/30 px-2.5 py-0.5 text-[11px] text-green-700 hover:bg-green-600/10"
                    >
                      存档
                    </button>
                    <button
                      type="button"
                      onClick={() => doApproval(r.id, "REJECTED")}
                      className="rounded border border-red-600/20 px-2.5 py-0.5 text-[11px] text-[var(--signal-red)] hover:bg-red-600/5"
                    >
                      退回
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[var(--color-text-muted)]">
        已存档报告由 AI 解析后数据自动反哺至执行审计和指挥舱
      </p>
    </div>
  );
}
