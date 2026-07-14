"use client";

import { useCallback, useState } from "react";

type OrgUnit = { id: string; name: string; level: string };

type PulseCheck = {
  isDuplicate: boolean;
  level: string;
  message: string;
  matchedReportId?: string;
};

export function MonthlyPulseForm({ orgUnits }: { orgUnits: OrgUnit[] }) {
  const [form, setForm] = useState({
    orgUnitId: orgUnits[0]?.id ?? "",
    period: new Date().toISOString().slice(0, 7),
    title: "",
    oneLiner: "",
    offTrackKr: "",
    needHelp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");
  const [dup, setDup] = useState<PulseCheck | null>(null);

  const checkDuplicate = useCallback(async () => {
    if (!form.orgUnitId || !form.oneLiner.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/reports/pulse-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgUnitId: form.orgUnitId,
          period: form.period,
          oneLiner: form.oneLiner.trim(),
          offTrackKr: form.offTrackKr.trim(),
          needHelp: form.needHelp.trim(),
        }),
      });
      const data = (await res.json()) as PulseCheck & { ok?: boolean };
      if (data.ok !== false) setDup(data);
    } finally {
      setChecking(false);
    }
  }, [form]);

  async function submit(force = false) {
    if (!form.orgUnitId) {
      setMsg("请选择组织单元");
      return;
    }
    if (!form.oneLiner.trim()) {
      setMsg("本月一句话必填");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      const title =
        form.title.trim() ||
        `${orgUnits.find((u) => u.id === form.orgUnitId)?.name ?? "部门"} ${form.period} 月度脉搏`;
      const fd = new FormData();
      fd.append("orgUnitId", form.orgUnitId);
      fd.append("reportType", "MON_PULSE");
      fd.append("period", form.period);
      fd.append("title", title);
      fd.append("oneLiner", form.oneLiner.trim());
      fd.append("offTrackKr", form.offTrackKr.trim());
      fd.append("needHelp", form.needHelp.trim());
      if (force) fd.append("forceSubmit", "1");

      const res = await fetch("/api/reports/submit", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        duplicate?: PulseCheck;
        reportId?: string;
      };
      if (res.status === 409 && data.error === "duplicate_pulse") {
        setDup(data.duplicate ?? { isDuplicate: true, level: "exact", message: data.message ?? "重复" });
        setMsg(data.message ?? "与已有脉搏重复");
        return;
      }
      if (!res.ok || !data.ok) {
        setMsg(data.error ?? data.message ?? "提交失败");
        return;
      }
      setDup(null);
      setMsg(`已提交 · ${data.reportId} · 待审批`);
      setForm((f) => ({ ...f, oneLiner: "", offTrackKr: "", needHelp: "", title: "" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stratos-card stratos-card--padded space-y-4">
      <div>
        <h3 className="text-title text-[var(--color-text-primary)]">月度脉搏</h3>
        <p className="text-caption mt-1">3 字段快速提交 · 同组织同月自动查重</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label-xs">组织单元</label>
          <select
            className="stratos-input mt-1"
            value={form.orgUnitId}
            onChange={(e) => setForm((f) => ({ ...f, orgUnitId: e.target.value }))}
          >
            <option value="">请选择</option>
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
        <div>
          <label className="label-xs">标题（可选）</label>
          <input
            className="stratos-input mt-1 w-full"
            placeholder="留空自动生成"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="label-xs">本月一句话 *</label>
        <input
          className="stratos-input mt-1 w-full"
          placeholder="如：Q2 营收按 B 轨，热泵 Crux 进入验证期"
          value={form.oneLiner}
          onChange={(e) => {
            setForm((f) => ({ ...f, oneLiner: e.target.value }));
            setDup(null);
          }}
          onBlur={() => void checkDuplicate()}
        />
      </div>
      <div>
        <label className="label-xs">偏离的 KR</label>
        <input
          className="stratos-input mt-1 w-full"
          placeholder="如：酒店签约 820/1200，华东覆盖低于目标"
          value={form.offTrackKr}
          onChange={(e) => setForm((f) => ({ ...f, offTrackKr: e.target.value }))}
        />
      </div>
      <div>
        <label className="label-xs">需协调 / 求助</label>
        <input
          className="stratos-input mt-1 w-full"
          placeholder="如：需 CFO 确认 H2 CAPEX 分期"
          value={form.needHelp}
          onChange={(e) => setForm((f) => ({ ...f, needHelp: e.target.value }))}
        />
      </div>
      {dup?.isDuplicate && (
        <div className="rounded-lg border border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/10 px-3 py-2 text-xs text-[var(--signal-yellow)]">
          [{dup.level}] {dup.message}
          {dup.matchedReportId && ` · ${dup.matchedReportId}`}
        </div>
      )}
      {!dup?.isDuplicate && dup?.message && (
        <p className="text-xs text-[var(--color-text-muted)]">{dup.message}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={checking}
          onClick={() => void checkDuplicate()}
          className="rounded-lg border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50"
        >
          {checking ? "查重中…" : "查重"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit(false)}
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "提交中…" : "提交月度脉搏"}
        </button>
        {dup?.isDuplicate && (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit(true)}
            className="rounded-lg border border-[var(--signal-yellow)] px-4 py-2 text-xs text-[var(--signal-yellow)] hover:bg-[var(--signal-yellow)]/10 disabled:opacity-50"
          >
            仍要提交
          </button>
        )}
        {msg && (
          <span
            className={`text-sm ${
              msg.includes("失败") || msg.includes("必填") || msg.includes("选择") || msg.includes("重复")
                ? "text-[var(--signal-red)]"
                : "text-[var(--signal-green)]"
            }`}
          >
            {msg}
          </span>
        )}
      </div>
    </section>
  );
}
