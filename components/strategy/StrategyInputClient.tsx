"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrgUnit } from "@prisma/client";

type OrgUnitWithChildren = OrgUnit & { children: OrgUnit[] };

interface Props {
  orgUnits: OrgUnitWithChildren[];
}

type Step = "intent" | "objectives" | "initiatives" | "resources" | "assumptions";

const STEPS: { id: Step; label: string }[] = [
  { id: "intent", label: "战略意图" },
  { id: "objectives", label: "BSC 目标" },
  { id: "initiatives", label: "关键举措" },
  { id: "resources", label: "资源请求" },
  { id: "assumptions", label: "关键假设" },
];

const DIMENSIONS = [
  { key: "FINANCIAL", label: "财务" },
  { key: "CUSTOMER", label: "客户" },
  { key: "PROCESS", label: "流程" },
  { key: "LEARNING", label: "学习" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

interface KeyResultDraft {
  keyResult: string;
  target: string;
}
interface ObjectiveDraft {
  dimension: DimensionKey;
  objective: string;
  keyResults: KeyResultDraft[];
}
interface InitiativeDraft {
  title: string;
  ownerName: string;
  q1Milestone: string;
  q2Milestone: string;
  q3Milestone: string;
  q4Milestone: string;
}
interface ResourceDraft {
  resourceType: string;
  amount: string;
  justification: string;
}
interface AssumptionDraft {
  assumption: string;
  critical: boolean;
}
interface AttachmentInfo {
  id: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

interface PlanForm {
  intent: string;
  northStar: string;
  objectives: ObjectiveDraft[];
  initiatives: InitiativeDraft[];
  resources: ResourceDraft[];
  assumptions: AssumptionDraft[];
}

function emptyForm(): PlanForm {
  return {
    intent: "",
    northStar: "",
    objectives: DIMENSIONS.map((d) => ({
      dimension: d.key,
      objective: "",
      keyResults: [
        { keyResult: "", target: "" },
        { keyResult: "", target: "" },
      ],
    })),
    initiatives: [1, 2, 3].map(() => ({
      title: "",
      ownerName: "",
      q1Milestone: "",
      q2Milestone: "",
      q3Milestone: "",
      q4Milestone: "",
    })),
    resources: ["Capex", "Opex", "Headcount"].map((t) => ({
      resourceType: t,
      amount: "",
      justification: "",
    })),
    assumptions: [1, 2, 3].map(() => ({ assumption: "", critical: false })),
  };
}

const HORIZON_START = 2026;
const HORIZON_END = 2028;

export function StrategyInputClient({ orgUnits }: Props) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("intent");
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | "LOCKED" | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const groupUnits = orgUnits.filter((u) => u.level === "GROUP");
  const executiveUnits = orgUnits.filter((u) => u.level === "EXECUTIVE");
  const operatingUnits = orgUnits.filter((u) => u.level === "OPERATING_UNIT");
  const selectedOrg = orgUnits.find((u) => u.id === selectedOrgId);

  const flash = useCallback((kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // 选中组织后加载已有草稿
  useEffect(() => {
    if (!selectedOrgId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setStep("intent");
    fetch('/api/strategy/plan?orgUnitId=' + encodeURIComponent(selectedOrgId))
      .then((r) => (r.ok ? r.json() : null))
      .then((plan) => {
        if (cancelled) return;
        if (plan) {
          setForm(hydrate(plan));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAttachments((plan.attachments ?? []).map((a: any) => ({
            id: a.id, filename: a.filename, sizeBytes: a.sizeBytes, mimeType: a.mimeType,
          })));
          setStatus(plan.status ?? "DRAFT");
        } else {
          setForm(emptyForm());
          setAttachments([]);
          setStatus(null);
        }
      })
      .catch(() => flash("err", "草稿加载失败"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedOrgId, flash]);

  const validation = useMemo(() => validate(form), [form]);

  async function persist(submit: boolean) {
    if (!selectedOrgId) return;
    if (submit && !validation.ok) {
      setStep(validation.step);
      flash("err", validation.message);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/strategy/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgUnitId: selectedOrgId,
          horizonStart: HORIZON_START,
          horizonEnd: HORIZON_END,
          intent: form.intent,
          northStar: form.northStar,
          objectives: form.objectives,
          initiatives: form.initiatives,
          resources: form.resources,
          assumptions: form.assumptions,
          submit,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(submit ? "SUBMITTED" : "DRAFT");
      flash("ok", submit ? "已提交审核" : "草稿已保存");
      return data.planId as string;
    } catch {
      flash("err", "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedOrgId) return;
    // 确保已有 plan（先存草稿拿到 planId）
    const planId = await persist(false);
    if (!planId) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("planId", planId);
    try {
      const res = await fetch("/api/strategy/plan/attachment", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const a = await res.json();
      setAttachments((prev) => [...prev, a]);
      flash("ok", "附件已上传：" + file.name);
    } catch {
      flash("err", "附件上传失败");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAttachment(id: string) {
    try {
      const res = await fetch('/api/strategy/plan/attachment?id=' + encodeURIComponent(id), { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      flash("err", "删除失败");
    }
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6">
      {/* 左侧组织树 */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          选择组织单位
        </div>
        <div className="space-y-1">
          {groupUnits.map((g) => (
            <div key={g.id}>
              <button
                onClick={() => setSelectedOrgId(g.id)}
                className={'w-full rounded px-3 py-2 text-left text-sm transition-colors ' + (
                  selectedOrgId === g.id ? "bg-[var(--color-accent)] text-white" : "hover:bg-black/[0.04]"
                )}
              >
                {g.name}
              </button>
              <div className="ml-3 mt-1 space-y-1">
                {executiveUnits.map((ex) => (
                  <div key={ex.id}>
                    <button
                      onClick={() => setSelectedOrgId(ex.id)}
                      className={'w-full rounded px-3 py-1.5 text-left text-sm transition-colors ' + (
                        selectedOrgId === ex.id ? "bg-[var(--color-accent)] text-white" : "hover:bg-black/[0.04]"
                      )}
                    >
                      {ex.name}
                    </button>
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      {operatingUnits
                        .filter((o) => o.parentId === ex.id)
                        .map((o) => (
                          <button
                            key={o.id}
                            onClick={() => setSelectedOrgId(o.id)}
                            className={'w-full rounded px-3 py-1 text-left text-xs transition-colors ' + (
                              selectedOrgId === o.id
                                ? "bg-[var(--color-accent)] text-white"
                                : "text-[var(--color-text-secondary)] hover:bg-black/[0.04]"
                            )}
                          >
                            {o.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="relative rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        {toast && (
          <div
            className={'absolute right-4 top-4 z-10 rounded-md px-3 py-2 text-sm shadow-lg ' + (
              toast.kind === "ok"
                ? "bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
                : "bg-[var(--signal-red)]/10 text-[var(--signal-red)]"
            )}
          >
            {toast.msg}
          </div>
        )}

        {!selectedOrg ? (
          <div className="flex h-96 items-center justify-center text-sm text-[var(--color-text-muted)]">
            ← 请先选择组织单位
          </div>
        ) : loading ? (
          <div className="flex h-96 items-center justify-center text-sm text-[var(--color-text-muted)]">
            加载草稿中…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedOrg.name}</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {selectedOrg.level === "GROUP" && "集团战略报告"}
                  {selectedOrg.level === "EXECUTIVE" && "高管层 · 事业部/体系战略"}
                  {selectedOrg.level === "OPERATING_UNIT" && "执行层 · 二级部门战略"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                {status && (
                  <span
                    className={'rounded-full px-2 py-0.5 ' + (
                      status === "SUBMITTED"
                        ? "bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
                        : status === "LOCKED"
                          ? "bg-black/[0.06]"
                          : "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow)]"
                    )}
                  >
                    {status === "SUBMITTED" ? "已提交" : status === "LOCKED" ? "已锁定" : "草稿"}
                  </span>
                )}
                <span>2026–2028 三年规划</span>
              </div>
            </div>

            {/* 步骤导航 */}
            <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)]">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={'border-b-2 px-4 py-2 text-sm transition-colors ' + (
                    step === s.id
                      ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {step === "intent" && (
                <IntentForm
                  form={form}
                  setForm={setForm}
                  attachments={attachments}
                  fileRef={fileRef}
                  onUpload={handleUpload}
                  onRemove={removeAttachment}
                />
              )}
              {step === "objectives" && <ObjectivesForm form={form} setForm={setForm} />}
              {step === "initiatives" && <InitiativesForm form={form} setForm={setForm} />}
              {step === "resources" && <ResourcesForm form={form} setForm={setForm} />}
              {step === "assumptions" && <AssumptionsForm form={form} setForm={setForm} />}
            </div>

            {/* 校验提示 */}
            {!validation.ok && (
              <div className="rounded-md border border-[var(--signal-yellow)]/40 bg-[var(--signal-yellow)]/[0.05] px-3 py-2 text-xs text-[var(--signal-yellow)]">
                提交前需完善：{validation.message}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-[var(--surface-border)] pt-4">
              <button
                onClick={() => persist(false)}
                disabled={saving}
                className="rounded-lg border border-[var(--surface-border)] px-4 py-2 text-sm hover:bg-black/[0.04] disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存草稿"}
              </button>
              <button
                onClick={() => persist(true)}
                disabled={saving}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
              >
                提交审核
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 校验 / 反序列化 ──────────────────────────────────────────────────────────

function validate(form: PlanForm): { ok: boolean; step: Step; message: string } {
  if (!form.intent.trim()) return { ok: false, step: "intent", message: "战略意图为必填" };
  if (!form.northStar.trim()) return { ok: false, step: "intent", message: "北极星指标为必填" };
  const hasObjective = form.objectives.some((o) => o.objective.trim());
  if (!hasObjective) return { ok: false, step: "objectives", message: "至少填写一个 BSC 目标" };
  const hasInitiative = form.initiatives.some((i) => i.title.trim());
  if (!hasInitiative) return { ok: false, step: "initiatives", message: "至少填写一项关键举措" };
  const hasAssumption = form.assumptions.some((a) => a.assumption.trim());
  if (!hasAssumption) return { ok: false, step: "assumptions", message: "至少填写一条关键假设" };
  return { ok: true, step: "intent", message: "" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hydrate(plan: any): PlanForm {
  const base = emptyForm();
  const objectives: ObjectiveDraft[] = DIMENSIONS.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = (plan.objectives ?? []).find((o: any) => o.dimension === d.key);
    if (!match) return base.objectives.find((b) => b.dimension === d.key)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const krs: KeyResultDraft[] = (match.keyResults ?? []).map((k: any) => ({
      keyResult: k.keyResult ?? "",
      target: k.target ?? "",
    }));
    while (krs.length < 2) krs.push({ keyResult: "", target: "" });
    return { dimension: d.key, objective: match.objective ?? "", keyResults: krs };
  });
  const initiatives: InitiativeDraft[] =
    (plan.initiatives ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.initiatives.map((i: any) => ({
          title: i.title ?? "",
          ownerName: i.ownerName ?? "",
          q1Milestone: i.q1Milestone ?? "",
          q2Milestone: i.q2Milestone ?? "",
          q3Milestone: i.q3Milestone ?? "",
          q4Milestone: i.q4Milestone ?? "",
        }))
      : base.initiatives;
  const resources: ResourceDraft[] = ["Capex", "Opex", "Headcount"].map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = (plan.resourceReqs ?? []).find((r: any) => r.resourceType === t);
    return {
      resourceType: t,
      amount: match?.amount != null ? String(match.amount) : "",
      justification: match?.justification ?? "",
    };
  });
  const assumptions: AssumptionDraft[] =
    (plan.assumptions ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.assumptions.map((a: any) => ({ assumption: a.assumption ?? "", critical: !!a.critical }))
      : base.assumptions;
  return {
    intent: plan.intent ?? "",
    northStar: plan.northStar ?? "",
    objectives,
    initiatives,
    resources,
    assumptions,
  };
}

// ─── 子表单（受控） ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-[var(--surface-border)] bg-black/[0.04] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none";

function IntentForm({
  form,
  setForm,
  attachments,
  fileRef,
  onUpload,
  onRemove,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
  attachments: AttachmentInfo[];
  fileRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">战略意图</label>
        <textarea
          className={inputCls}
          rows={3}
          value={form.intent}
          onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))}
          placeholder="三年愿景一句话 (必填)"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">北极星指标</label>
        <input
          type="text"
          className={inputCls}
          value={form.northStar}
          onChange={(e) => setForm((f) => ({ ...f, northStar: e.target.value }))}
          placeholder="例: 营收 CAGR 25%"
        />
      </div>

      {/* PPT / 附件上传 */}
      <div className="rounded-lg border border-dashed border-[var(--surface-border-strong)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">战略 PPT / 附件</div>
            <div className="text-xs text-[var(--color-text-muted)]">支持上传已有战略报告（PPT/PDF/Word），作为录入参考存档</div>
          </div>
          <label className="cursor-pointer rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-sm hover:bg-black/[0.04]">
            上传文件
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".ppt,.pptx,.pdf,.doc,.docx,.key"
              onChange={onUpload}
            />
          </label>
        </div>
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded border border-[var(--surface-border)] bg-black/[0.02] px-3 py-1.5 text-sm"
              >
                <span className="truncate">
                  {a.filename}
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                    {(a.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </span>
                <button
                  onClick={() => onRemove(a.id)}
                  className="ml-3 text-xs text-[var(--signal-red)] hover:underline"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ObjectivesForm({
  form,
  setForm,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
}) {
  function setObjective(idx: number, value: string) {
    setForm((f) => {
      const objectives = [...f.objectives];
      objectives[idx] = { ...objectives[idx], objective: value };
      return { ...f, objectives };
    });
  }
  function setKr(oIdx: number, kIdx: number, field: keyof KeyResultDraft, value: string) {
    setForm((f) => {
      const objectives = [...f.objectives];
      const keyResults = [...objectives[oIdx].keyResults];
      keyResults[kIdx] = { ...keyResults[kIdx], [field]: value };
      objectives[oIdx] = { ...objectives[oIdx], keyResults };
      return { ...f, objectives };
    });
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-text-muted)]">BSC 四维度，每维 1 个目标 + 关键结果</p>
      {form.objectives.map((obj, oIdx) => (
        <div key={obj.dimension} className="rounded border border-[var(--surface-border)] p-4">
          <div className="mb-2 text-sm font-medium text-[var(--color-accent)]">
            {DIMENSIONS.find((d) => d.key === obj.dimension)?.label}
          </div>
          <textarea
            className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm"
            rows={2}
            value={obj.objective}
            onChange={(e) => setObjective(oIdx, e.target.value)}
            placeholder="目标描述"
          />
          <div className="mt-2 space-y-1">
            {obj.keyResults.map((kr, kIdx) => (
              <div key={kIdx} className="grid grid-cols-[1fr_140px] gap-2">
                <input
                  type="text"
                  className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
                  value={kr.keyResult}
                  onChange={(e) => setKr(oIdx, kIdx, "keyResult", e.target.value)}
                  placeholder={"KR " + (kIdx + 1)}
                />
                <input
                  type="text"
                  className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
                  value={kr.target}
                  onChange={(e) => setKr(oIdx, kIdx, "target", e.target.value)}
                  placeholder="目标值"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InitiativesForm({
  form,
  setForm,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
}) {
  function set(idx: number, field: keyof InitiativeDraft, value: string) {
    setForm((f) => {
      const initiatives = [...f.initiatives];
      initiatives[idx] = { ...initiatives[idx], [field]: value };
      return { ...f, initiatives };
    });
  }
  const quarters: (keyof InitiativeDraft)[] = ["q1Milestone", "q2Milestone", "q3Milestone", "q4Milestone"];
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">年度必赢之战 (WIG) 与关键举措</p>
      {form.initiatives.map((ini, idx) => (
        <div key={idx} className="rounded border border-[var(--surface-border)] p-3">
          <input
            type="text"
            className="mb-2 w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm"
            value={ini.title}
            onChange={(e) => set(idx, "title", e.target.value)}
            placeholder={"举措 " + (idx + 1) + ": 标题"}
          />
          <input
            type="text"
            className="mb-2 w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
            value={ini.ownerName}
            onChange={(e) => set(idx, "ownerName", e.target.value)}
            placeholder="负责人"
          />
          <div className="grid grid-cols-4 gap-2">
            {quarters.map((q, qi) => (
              <input
                key={q}
                type="text"
                className="rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
                value={ini[q]}
                onChange={(e) => set(idx, q, e.target.value)}
                placeholder={"Q" + (qi + 1) + " 里程碑"}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResourcesForm({
  form,
  setForm,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
}) {
  function set(idx: number, field: keyof ResourceDraft, value: string) {
    setForm((f) => {
      const resources = [...f.resources];
      resources[idx] = { ...resources[idx], [field]: value };
      return { ...f, resources };
    });
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">资源请求 (Capex/Opex/Headcount)</p>
      {form.resources.map((r, idx) => (
        <div key={r.resourceType} className="flex items-center gap-3">
          <div className="w-24 text-sm">{r.resourceType}</div>
          <input
            type="text"
            className="flex-1 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm"
            value={r.amount}
            onChange={(e) => set(idx, "amount", e.target.value)}
            placeholder="金额/人数"
          />
          <input
            type="text"
            className="flex-[2] rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm"
            value={r.justification}
            onChange={(e) => set(idx, "justification", e.target.value)}
            placeholder="理由"
          />
        </div>
      ))}
    </div>
  );
}

function AssumptionsForm({
  form,
  setForm,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
}) {
  function set(idx: number, field: keyof AssumptionDraft, value: string | boolean) {
    setForm((f) => {
      const assumptions = [...f.assumptions];
      assumptions[idx] = { ...assumptions[idx], [field]: value };
      return { ...f, assumptions };
    });
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">战略成立的关键前提假设（勾选 = 关键假设）</p>
      {form.assumptions.map((a, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            type="checkbox"
            className="mt-1"
            title="标记为关键假设"
            checked={a.critical}
            onChange={(e) => set(idx, "critical", e.target.checked)}
          />
          <textarea
            className="flex-1 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm"
            rows={2}
            value={a.assumption}
            onChange={(e) => set(idx, "assumption", e.target.value)}
            placeholder={"假设 " + (idx + 1)}
          />
        </div>
      ))}
    </div>
  );
}
