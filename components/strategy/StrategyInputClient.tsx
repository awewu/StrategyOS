"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrgUnit } from "@prisma/client";

type OrgUnitWithChildren = OrgUnit & { children: OrgUnit[] };

interface Props {
  orgUnits: OrgUnitWithChildren[];
}

type Step = "intent" | "objectives" | "initiatives" | "swot" | "product" | "channel" | "customer" | "org" | "resources" | "assumptions" | "market" | "action" | "budget" | "roadmap" | "onepager";

const ALL_STEPS: { id: Step; label: string; buHint?: boolean }[] = [
  { id: "intent",    label: "战略意图" },
  { id: "market",    label: "市场洞察" },
  { id: "swot",      label: "SWOT分析" },
  { id: "objectives",label: "BSC目标/OKR" },
  { id: "initiatives",label:"关键举措" },
  { id: "action",    label: "作战计划" },
  { id: "product",   label: "产品季度", buHint: true },
  { id: "channel",   label: "渠道发展", buHint: true },
  { id: "customer",  label: "客户发展", buHint: true },
  { id: "org",       label: "组织规划" },
  { id: "budget",    label: "资源预算" },
  { id: "assumptions",label:"关键假设" },
  { id: "roadmap",   label: "路线图" },
  { id: "onepager",  label: "一页纸摘要" },
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
  okrKeyResult: string;
  okrTarget: string;
  okrBaseline: string;
  q1Milestone: string;
  q2Milestone: string;
  q3Milestone: string;
  q4Milestone: string;
}
interface SwotItemDraft {
  quadrant: "strength" | "weakness" | "opportunity" | "threat";
  content: string;
}
interface OrgChartNodeDraft {
  name: string;
  role: string;
  headcount: string;
  headcountNew: string;
  note: string;
}
interface ChannelPlanDraft {
  channelType: string;
  currentState: string;
  targetState: string;
  q1Action: string;
  q2Action: string;
  q3Action: string;
  q4Action: string;
  revenueTarget: string;
  partnerCount: string;
  note: string;
}
interface CustomerPlanDraft {
  customerSegment: string;
  isNew: boolean;
  currentCount: string;
  targetCount: string;
  q1Count: string;
  q2Count: string;
  q3Count: string;
  q4Count: string;
  revenuePerCustomer: string;
  acquisitionStrategy: string;
  retentionStrategy: string;
  note: string;
}
interface ProductQuarterlyDraft {
  productName: string;
  unit: string;
  q1Qty: string;
  q1Revenue: string;
  q2Qty: string;
  q2Revenue: string;
  q3Qty: string;
  q3Revenue: string;
  q4Qty: string;
  q4Revenue: string;
  annualQty: string;
  annualRevenue: string;
  note: string;
}
interface MarketInsightDraft {
  category: string;
  title: string;
  content: string;
  dataPoint: string;
  source: string;
}
interface ActionItemDraft {
  initiativeTitle: string;
  year: string;
  quarter: string;
  action: string;
  ownerName: string;
  acceptanceCriteria: string;
  checkDate: string;
  status: string;
}
interface BudgetItemDraft {
  category: string;
  initiativeTitle: string;
  department: string;
  description: string;
  year1Amount: string;
  year2Amount: string;
  year3Amount: string;
  totalAmount: string;
  roiEstimate: string;
  justification: string;
}
interface RoadmapItemDraft {
  track: string;
  title: string;
  startYear: string;
  startQ: string;
  endYear: string;
  endQ: string;
  milestone: string;
  color: string;
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
  swotItems: SwotItemDraft[];
  orgChartNodes: OrgChartNodeDraft[];
  channelPlans: ChannelPlanDraft[];
  customerPlans: CustomerPlanDraft[];
  productQuarterly: ProductQuarterlyDraft[];
  marketInsights: MarketInsightDraft[];
  actionItems: ActionItemDraft[];
  budgetItems: BudgetItemDraft[];
  roadmapItems: RoadmapItemDraft[];
}

function emptyInitiative(): InitiativeDraft {
  return { title: "", ownerName: "", okrKeyResult: "", okrTarget: "", okrBaseline: "", q1Milestone: "", q2Milestone: "", q3Milestone: "", q4Milestone: "" };
}
function emptyChannel(): ChannelPlanDraft {
  return { channelType: "", currentState: "", targetState: "", q1Action: "", q2Action: "", q3Action: "", q4Action: "", revenueTarget: "", partnerCount: "", note: "" };
}
function emptyCustomer(isNew: boolean): CustomerPlanDraft {
  return { customerSegment: "", isNew, currentCount: "", targetCount: "", q1Count: "", q2Count: "", q3Count: "", q4Count: "", revenuePerCustomer: "", acquisitionStrategy: "", retentionStrategy: "", note: "" };
}
function emptyProduct(): ProductQuarterlyDraft {
  return { productName: "", unit: "", q1Qty: "", q1Revenue: "", q2Qty: "", q2Revenue: "", q3Qty: "", q3Revenue: "", q4Qty: "", q4Revenue: "", annualQty: "", annualRevenue: "", note: "" };
}
function emptyOrg(): OrgChartNodeDraft {
  return { name: "", role: "", headcount: "", headcountNew: "", note: "" };
}
function emptyMarketInsight(): MarketInsightDraft {
  return { category: "TREND", title: "", content: "", dataPoint: "", source: "" };
}
function emptyActionItem(): ActionItemDraft {
  return { initiativeTitle: "", year: "2026", quarter: "1", action: "", ownerName: "", acceptanceCriteria: "", checkDate: "", status: "PLAN" };
}
function emptyBudgetItem(category = "OPEX"): BudgetItemDraft {
  return { category, initiativeTitle: "", department: "", description: "", year1Amount: "", year2Amount: "", year3Amount: "", totalAmount: "", roiEstimate: "", justification: "" };
}
function emptyRoadmapItem(): RoadmapItemDraft {
  return { track: "举措", title: "", startYear: "2026", startQ: "1", endYear: "2026", endQ: "4", milestone: "", color: "" };
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
    initiatives: [1, 2, 3].map(() => emptyInitiative()),
    resources: ["Capex", "Opex", "Headcount"].map((t) => ({
      resourceType: t,
      amount: "",
      justification: "",
    })),
    assumptions: [1, 2, 3].map(() => ({ assumption: "", critical: false })),
    swotItems: [
      { quadrant: "strength", content: "" },
      { quadrant: "weakness", content: "" },
      { quadrant: "opportunity", content: "" },
      { quadrant: "threat", content: "" },
    ],
    orgChartNodes: [emptyOrg()],
    channelPlans: [emptyChannel(), emptyChannel()],
    customerPlans: [emptyCustomer(false), emptyCustomer(false), emptyCustomer(true), emptyCustomer(true)],
    productQuarterly: [emptyProduct(), emptyProduct()],
    marketInsights: [
      { category: "TAM", title: "", content: "", dataPoint: "", source: "" },
      { category: "TREND", title: "", content: "", dataPoint: "", source: "" },
      { category: "CUSTOMER", title: "", content: "", dataPoint: "", source: "" },
      { category: "TECH", title: "", content: "", dataPoint: "", source: "" },
    ],
    actionItems: [emptyActionItem(), emptyActionItem(), emptyActionItem()],
    budgetItems: [emptyBudgetItem("CAPEX"), emptyBudgetItem("OPEX"), emptyBudgetItem("HC")],
    roadmapItems: [emptyRoadmapItem(), emptyRoadmapItem()],
  };
}

const HORIZON_START = 2026;
const HORIZON_END = 2028;

export function StrategyInputClient({ orgUnits }: Props) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // 客户端挂载后恢复上次选中的组织单位（避免SSR hydration mismatch）
  useEffect(() => {
    const saved = sessionStorage.getItem("strategy_input_orgId");
    if (saved) setSelectedOrgId(saved);
  }, []);
  const [step, setStep] = useState<Step>("intent");
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | "LOCKED" | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // flat list including any children nested in the tree (DB may return nested structure)
  const allUnitsFlat = useMemo(() => {
    const seen = new Set<string>();
    const result: OrgUnit[] = [];
    for (const u of orgUnits) {
      if (!seen.has(u.id)) { seen.add(u.id); result.push(u); }
      for (const c of u.children ?? []) {
        if (!seen.has(c.id)) { seen.add(c.id); result.push(c); }
      }
    }
    return result;
  }, [orgUnits]);
  const groupUnits = allUnitsFlat.filter((u) => u.level === "GROUP");
  const executiveUnits = allUnitsFlat.filter((u) => u.level === "EXECUTIVE");
  const operatingUnits = allUnitsFlat.filter((u) => u.level === "OPERATING_UNIT");
  const selectedOrg = allUnitsFlat.find((u) => u.id === selectedOrgId);
  const isBuUnit = selectedOrg ? selectedOrg.level === "OPERATING_UNIT" || selectedOrg.level === "EXECUTIVE" : false;

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
          swotItems: form.swotItems,
          orgChartNodes: form.orgChartNodes,
          channelPlans: form.channelPlans,
          customerPlans: form.customerPlans,
          productQuarterly: form.productQuarterly,
          marketInsights: form.marketInsights,
          actionItems: form.actionItems.map((a) => ({ ...a, year: Number(a.year) || 2026, quarter: Number(a.quarter) || 1 })),
          budgetItems: form.budgetItems,
          roadmapItems: form.roadmapItems.map((r) => ({ ...r, startYear: Number(r.startYear) || 2026, startQ: Number(r.startQ) || 1, endYear: Number(r.endYear) || 2026, endQ: Number(r.endQ) || 4 })),
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
    <div className="space-y-4">
      {/* 顶部：下拉选择组织单位 */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-4 py-3">
        <label className="text-sm font-medium whitespace-nowrap">编制单位</label>
        <select
          value={selectedOrgId ?? ""}
          onChange={(e) => {
            const v = e.target.value || null;
            if (v) sessionStorage.setItem("strategy_input_orgId", v);
            else sessionStorage.removeItem("strategy_input_orgId");
            setSelectedOrgId(v);
          }}
          autoComplete="off"
          className="flex-1 rounded-lg border border-[var(--surface-border)] bg-black/[0.03] px-3 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
        >
          <option value="">— 请选择组织单位 —</option>
          {groupUnits.length > 0 && (
            <optgroup label="集团">
              {groupUnits.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </optgroup>
          )}
          {executiveUnits.length > 0 && (
            <optgroup label="事业部 / 职能">
              {executiveUnits.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </optgroup>
          )}
          {operatingUnits.length > 0 && (
            <optgroup label="二级部门">
              {operatingUnits.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </optgroup>
          )}
          {groupUnits.length === 0 && executiveUnits.length === 0 && operatingUnits.length === 0 &&
            orgUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)
          }
        </select>
        {selectedOrg && (
          <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            {selectedOrg.level === "GROUP" && "集团"}
            {selectedOrg.level === "EXECUTIVE" && "事业部/体系"}
            {selectedOrg.level === "OPERATING_UNIT" && "二级部门"}
          </span>
        )}
      </div>

      {/* 表单主体 */}
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

        {/* DEBUG: remove after fix confirmed */}
        {process.env.NODE_ENV === "development" && typeof window !== "undefined" && (() => {
          // eslint-disable-next-line no-console
          console.log("[StrategyInput] selectedOrgId=", selectedOrgId, "selectedOrg=", selectedOrg, "allUnitsFlat.length=", allUnitsFlat.length, "ids=", allUnitsFlat.map(u => u.id));
          return null;
        })()}
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

            {/* AI 一键提取 */}
            <AiExtractBar form={form} setForm={setForm} flash={flash} />

            {/* 步骤导航 */}
            <div className="flex flex-wrap gap-2 border-b border-[var(--surface-border)]">
              {ALL_STEPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={'relative border-b-2 px-4 py-2 text-sm transition-colors ' + (
                    step === s.id
                      ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  {s.label}
                  {s.buHint && !isBuUnit && (
                    <span className="ml-1 text-[10px] text-[var(--signal-yellow)] opacity-70">BU</span>
                  )}
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
              {step === "swot" && <SwotForm form={form} setForm={setForm} />}
              {step === "product" && <ProductQuarterlyForm form={form} setForm={setForm} />}
              {step === "channel" && <ChannelForm form={form} setForm={setForm} />}
              {step === "customer" && <CustomerForm form={form} setForm={setForm} />}
              {step === "org" && <OrgChartForm form={form} setForm={setForm} />}
              {step === "resources" && <ResourcesForm form={form} setForm={setForm} />}
              {step === "assumptions" && <AssumptionsForm form={form} setForm={setForm} />}
              {step === "market" && <MarketInsightForm form={form} setForm={setForm} />}
              {step === "action" && <ActionPlanForm form={form} setForm={setForm} />}
              {step === "budget" && <BudgetForm form={form} setForm={setForm} />}
              {step === "roadmap" && <RoadmapForm form={form} setForm={setForm} />}
              {step === "onepager" && <OnePagerView form={form} selectedOrg={selectedOrg} />}
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

// ─── AI 一键提取栏 ────────────────────────────────────────────────────────────
function applyExtracted(f: PlanForm, e: Record<string, unknown>): PlanForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ea = e as any;
  return {
    ...f,
    intent: ea.intent?.trim() || f.intent,
    northStar: ea.northStar?.trim() || f.northStar,
    objectives: Array.isArray(ea.objectives) && ea.objectives.length > 0
      ? DIMENSIONS.map((d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = ea.objectives.find((o: any) => o.dimension === d.key);
          const base = f.objectives.find((b) => b.dimension === d.key)!;
          if (!m) return base;
          const krs = (m.keyResults ?? []).map((k: { keyResult?: string; target?: string }) => ({ keyResult: k.keyResult ?? "", target: k.target ?? "" }));
          while (krs.length < 2) krs.push({ keyResult: "", target: "" });
          return { dimension: d.key, objective: m.objective ?? "", keyResults: krs };
        })
      : f.objectives,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initiatives: Array.isArray(ea.initiatives) && ea.initiatives.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.initiatives.map((i: any) => ({ title: i.title ?? "", ownerName: i.ownerName ?? "", okrKeyResult: i.okrKeyResult ?? "", okrTarget: i.okrTarget ?? "", okrBaseline: i.okrBaseline ?? "", q1Milestone: i.q1Milestone ?? "", q2Milestone: i.q2Milestone ?? "", q3Milestone: i.q3Milestone ?? "", q4Milestone: i.q4Milestone ?? "" }))
      : f.initiatives,
    swotItems: Array.isArray(ea.swotItems) && ea.swotItems.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.swotItems.map((s: any) => ({ quadrant: s.quadrant ?? "strength", content: s.content ?? "" }))
      : f.swotItems,
    assumptions: Array.isArray(ea.assumptions) && ea.assumptions.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.assumptions.map((a: any) => ({ assumption: a.assumption ?? "", critical: !!a.critical }))
      : f.assumptions,
    productQuarterly: Array.isArray(ea.productQuarterly) && ea.productQuarterly.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.productQuarterly.map((p: any) => ({ productName: p.productName ?? "", unit: p.unit ?? "", q1Qty: p.q1Qty ?? "", q1Revenue: p.q1Revenue ?? "", q2Qty: p.q2Qty ?? "", q2Revenue: p.q2Revenue ?? "", q3Qty: p.q3Qty ?? "", q3Revenue: p.q3Revenue ?? "", q4Qty: p.q4Qty ?? "", q4Revenue: p.q4Revenue ?? "", annualQty: p.annualQty ?? "", annualRevenue: p.annualRevenue ?? "", note: p.note ?? "" }))
      : f.productQuarterly,
    channelPlans: Array.isArray(ea.channelPlans) && ea.channelPlans.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.channelPlans.map((c: any) => ({ channelType: c.channelType ?? "", currentState: c.currentState ?? "", targetState: c.targetState ?? "", q1Action: c.q1Action ?? "", q2Action: c.q2Action ?? "", q3Action: c.q3Action ?? "", q4Action: c.q4Action ?? "", revenueTarget: c.revenueTarget ?? "", partnerCount: c.partnerCount ?? "", note: c.note ?? "" }))
      : f.channelPlans,
    customerPlans: Array.isArray(ea.customerPlans) && ea.customerPlans.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.customerPlans.map((c: any) => ({ customerSegment: c.customerSegment ?? "", isNew: !!c.isNew, currentCount: String(c.currentCount ?? ""), targetCount: String(c.targetCount ?? ""), q1Count: String(c.q1Count ?? ""), q2Count: String(c.q2Count ?? ""), q3Count: String(c.q3Count ?? ""), q4Count: String(c.q4Count ?? ""), revenuePerCustomer: c.revenuePerCustomer ?? "", acquisitionStrategy: c.acquisitionStrategy ?? "", retentionStrategy: c.retentionStrategy ?? "", note: c.note ?? "" }))
      : f.customerPlans,
    orgChartNodes: Array.isArray(ea.orgChartNodes) && ea.orgChartNodes.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.orgChartNodes.map((n: any) => ({ name: n.name ?? "", role: n.role ?? "", headcount: String(n.headcount ?? ""), headcountNew: String(n.headcountNew ?? ""), note: n.note ?? "" }))
      : f.orgChartNodes,
    marketInsights: Array.isArray(ea.marketInsights) && ea.marketInsights.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.marketInsights.map((m: any) => ({ category: m.category ?? "TREND", title: m.title ?? "", content: m.content ?? "", dataPoint: m.dataPoint ?? "", source: m.source ?? "" }))
      : f.marketInsights,
    actionItems: Array.isArray(ea.actionItems) && ea.actionItems.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.actionItems.map((a: any) => ({ initiativeTitle: a.initiativeTitle ?? "", year: String(a.year ?? 2026), quarter: String(a.quarter ?? 1), action: a.action ?? "", ownerName: a.ownerName ?? "", acceptanceCriteria: a.acceptanceCriteria ?? "", checkDate: a.checkDate ?? "", status: a.status ?? "PLAN" }))
      : f.actionItems,
    budgetItems: Array.isArray(ea.budgetItems) && ea.budgetItems.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.budgetItems.map((b: any) => ({ category: b.category ?? "OPEX", initiativeTitle: b.initiativeTitle ?? "", department: b.department ?? "", description: b.description ?? "", year1Amount: b.year1Amount ?? "", year2Amount: b.year2Amount ?? "", year3Amount: b.year3Amount ?? "", totalAmount: b.totalAmount ?? "", roiEstimate: b.roiEstimate ?? "", justification: b.justification ?? "" }))
      : f.budgetItems,
    roadmapItems: Array.isArray(ea.roadmapItems) && ea.roadmapItems.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.roadmapItems.map((r: any) => ({ track: r.track ?? "举措", title: r.title ?? "", startYear: String(r.startYear ?? 2026), startQ: String(r.startQ ?? 1), endYear: String(r.endYear ?? 2026), endQ: String(r.endQ ?? 4), milestone: r.milestone ?? "", color: r.color ?? "" }))
      : f.roadmapItems,
  };
}

function AiExtractBar({
  form, setForm, flash,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
  flash: (kind: "ok" | "err", msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runExtract(body: FormData | string) {
    setLoading(true);
    try {
      const isFormData = body instanceof FormData;
      const res = await fetch("/api/strategy/plan/ai-extract", {
        method: "POST",
        ...(isFormData ? { body } : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: body }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "提取失败");
      setForm((f) => applyExtracted(f, data.extracted));
      flash("ok", "AI 提取完成，请逐页检查并修订内容");
      setOpen(false);
      setText("");
      setFileName("");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "提取失败");
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    void runExtract(fd);
    e.target.value = "";
  }

  function onTextExtract() {
    if (!text.trim() || text.trim().length < 50) {
      flash("err", "请粘贴至少 50 字的内容");
      return;
    }
    void runExtract(text.trim());
  }

  return (
    <div className="rounded-lg border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.03] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-accent)]">✨ AI 自动填充</span>
          <span className="text-xs text-[var(--color-text-muted)]">上传文件或粘贴文档内容，AI 一键提取所有字段</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-[var(--color-accent)] hover:underline">
          {open ? "收起" : "展开"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {/* 模式切换 */}
          <div className="flex gap-1 rounded-lg border border-[var(--surface-border)] p-0.5 w-fit">
            {(["file", "text"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={"rounded-md px-3 py-1 text-xs transition-colors " + (
                  mode === m
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                )}
              >
                {m === "file" ? "📎 上传文件" : "📋 粘贴文本"}
              </button>
            ))}
          </div>

          {mode === "file" ? (
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-text-muted)]">支持 PPTX · DOCX · XLSX · PDF，最大 20 MB</p>
              <div className="flex items-center gap-3">
                <label className={
                  "cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors " +
                  (loading
                    ? "border-[var(--surface-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                    : "border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white")
                }>
                  {loading ? "AI 提取中…" : "选择文件并提取"}
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pptx,.ppt,.docx,.doc,.xlsx,.xls,.pdf"
                    disabled={loading}
                    onChange={onFileChange}
                  />
                </label>
                {fileName && !loading && (
                  <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">{fileName}</span>
                )}
                {loading && (
                  <span className="text-xs text-[var(--color-accent)] animate-pulse">正在提取内容并分析，请稍候…</span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg border border-[var(--surface-border)] bg-black/[0.04] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="粘贴战略报告/PPT 文字内容（支持中英文），AI 将自动识别战略意图、OKR、SWOT、产品计划、渠道、客户规划等所有字段…"
              />
              <div className="flex justify-end">
                <button
                  onClick={onTextExtract}
                  disabled={loading}
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "AI 提取中…" : "开始提取"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
          okrKeyResult: i.okrKeyResult ?? "",
          okrTarget: i.okrTarget ?? "",
          okrBaseline: i.okrBaseline ?? "",
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
  const swotItems: SwotItemDraft[] =
    (plan.swotItems ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.swotItems.map((s: any) => ({ quadrant: s.quadrant ?? "strength", content: s.content ?? "" }))
      : base.swotItems;
  const orgChartNodes: OrgChartNodeDraft[] =
    (plan.orgChartNodes ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.orgChartNodes.map((n: any) => ({ name: n.name ?? "", role: n.role ?? "", headcount: n.headcount?.toString() ?? "", headcountNew: n.headcountNew?.toString() ?? "", note: n.note ?? "" }))
      : base.orgChartNodes;
  const channelPlans: ChannelPlanDraft[] =
    (plan.channelPlans ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.channelPlans.map((c: any) => ({ channelType: c.channelType ?? "", currentState: c.currentState ?? "", targetState: c.targetState ?? "", q1Action: c.q1Action ?? "", q2Action: c.q2Action ?? "", q3Action: c.q3Action ?? "", q4Action: c.q4Action ?? "", revenueTarget: c.revenueTarget?.toString() ?? "", partnerCount: c.partnerCount?.toString() ?? "", note: c.note ?? "" }))
      : base.channelPlans;
  const customerPlans: CustomerPlanDraft[] =
    (plan.customerPlans ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.customerPlans.map((c: any) => ({ customerSegment: c.customerSegment ?? "", isNew: !!c.isNew, currentCount: c.currentCount?.toString() ?? "", targetCount: c.targetCount?.toString() ?? "", q1Count: c.q1Count?.toString() ?? "", q2Count: c.q2Count?.toString() ?? "", q3Count: c.q3Count?.toString() ?? "", q4Count: c.q4Count?.toString() ?? "", revenuePerCustomer: c.revenuePerCustomer?.toString() ?? "", acquisitionStrategy: c.acquisitionStrategy ?? "", retentionStrategy: c.retentionStrategy ?? "", note: c.note ?? "" }))
      : base.customerPlans;
  const productQuarterly: ProductQuarterlyDraft[] =
    (plan.productQuarterly ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.productQuarterly.map((p: any) => ({ productName: p.productName ?? "", unit: p.unit ?? "", q1Qty: p.q1Qty?.toString() ?? "", q1Revenue: p.q1Revenue?.toString() ?? "", q2Qty: p.q2Qty?.toString() ?? "", q2Revenue: p.q2Revenue?.toString() ?? "", q3Qty: p.q3Qty?.toString() ?? "", q3Revenue: p.q3Revenue?.toString() ?? "", q4Qty: p.q4Qty?.toString() ?? "", q4Revenue: p.q4Revenue?.toString() ?? "", annualQty: p.annualQty?.toString() ?? "", annualRevenue: p.annualRevenue?.toString() ?? "", note: p.note ?? "" }))
      : base.productQuarterly;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marketInsights: MarketInsightDraft[] = (plan.marketInsights ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.marketInsights.map((m: any) => ({ category: m.category ?? "TREND", title: m.title ?? "", content: m.content ?? "", dataPoint: m.dataPoint ?? "", source: m.source ?? "" }))
    : base.marketInsights;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actionItems: ActionItemDraft[] = (plan.actionItems ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.actionItems.map((a: any) => ({ initiativeTitle: a.initiativeTitle ?? "", year: String(a.year ?? 2026), quarter: String(a.quarter ?? 1), action: a.action ?? "", ownerName: a.ownerName ?? "", acceptanceCriteria: a.acceptanceCriteria ?? "", checkDate: a.checkDate ?? "", status: a.status ?? "PLAN" }))
    : base.actionItems;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const budgetItems: BudgetItemDraft[] = (plan.budgetItems ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.budgetItems.map((b: any) => ({ category: b.category ?? "OPEX", initiativeTitle: b.initiativeTitle ?? "", department: b.department ?? "", description: b.description ?? "", year1Amount: b.year1Amount ?? "", year2Amount: b.year2Amount ?? "", year3Amount: b.year3Amount ?? "", totalAmount: b.totalAmount ?? "", roiEstimate: b.roiEstimate ?? "", justification: b.justification ?? "" }))
    : base.budgetItems;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roadmapItems: RoadmapItemDraft[] = (plan.roadmapItems ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.roadmapItems.map((r: any) => ({ track: r.track ?? "举措", title: r.title ?? "", startYear: String(r.startYear ?? 2026), startQ: String(r.startQ ?? 1), endYear: String(r.endYear ?? 2026), endQ: String(r.endQ ?? 4), milestone: r.milestone ?? "", color: r.color ?? "" }))
    : base.roadmapItems;
  return {
    intent: plan.intent ?? "",
    northStar: plan.northStar ?? "",
    objectives,
    initiatives,
    resources,
    assumptions,
    swotItems,
    orgChartNodes,
    channelPlans,
    customerPlans,
    productQuarterly,
    marketInsights,
    actionItems,
    budgetItems,
    roadmapItems,
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
  function addRow() {
    setForm((f) => ({ ...f, initiatives: [...f.initiatives, emptyInitiative()] }));
  }
  function removeRow(idx: number) {
    setForm((f) => ({ ...f, initiatives: f.initiatives.filter((_, i) => i !== idx) }));
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">OKR 关键举措级成果 — 每项举措对应一个可衡量关键结果</p>
      {form.initiatives.map((ini, idx) => (
        <div key={idx} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm font-medium"
                value={ini.title}
                onChange={(e) => set(idx, "title", e.target.value)}
                placeholder={"举措 " + (idx + 1) + " 标题（必赢之战）"}
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" className="rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs" value={ini.ownerName} onChange={(e) => set(idx, "ownerName", e.target.value)} placeholder="负责人" />
                <div />
              </div>
              <div className="rounded bg-[var(--color-accent)]/[0.04] p-2 space-y-1">
                <div className="text-xs font-medium text-[var(--color-accent)]">KR · 关键成果</div>
                <input type="text" className="w-full rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={ini.okrKeyResult} onChange={(e) => set(idx, "okrKeyResult", e.target.value)} placeholder="关键成果描述（可衡量）" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" className="rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={ini.okrBaseline} onChange={(e) => set(idx, "okrBaseline", e.target.value)} placeholder="基线值（现状）" />
                  <input type="text" className="rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={ini.okrTarget} onChange={(e) => set(idx, "okrTarget", e.target.value)} placeholder="目标值" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["q1Milestone", "q2Milestone", "q3Milestone", "q4Milestone"] as const).map((q, qi) => (
                  <input key={q} type="text" className="rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs" value={ini[q]} onChange={(e) => set(idx, q, e.target.value)} placeholder={"Q" + (qi + 1) + " 里程碑"} />
                ))}
              </div>
            </div>
            {form.initiatives.length > 1 && (
              <button onClick={() => removeRow(idx)} className="mt-0.5 text-xs text-[var(--signal-red)] hover:underline">删除</button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addRow} className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
        + 新增举措
      </button>
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
  function addRow() { setForm((f) => ({ ...f, assumptions: [...f.assumptions, { assumption: "", critical: false }] })); }
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">战略成立的关键前提假设（勾选 = 关键假设）</p>
      {form.assumptions.map((a, idx) => (
        <div key={idx} className="flex gap-2">
          <input type="checkbox" className="mt-1" title="标记为关键假设" checked={a.critical} onChange={(e) => set(idx, "critical", e.target.checked)} />
          <textarea className="flex-1 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm" rows={2} value={a.assumption} onChange={(e) => set(idx, "assumption", e.target.value)} placeholder={"假设 " + (idx + 1)} />
        </div>
      ))}
      <button onClick={addRow} className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">+ 新增假设</button>
    </div>
  );
}

// ─── SWOT 分析 ────────────────────────────────────────────────────────────────
const SWOT_META = [
  { key: "strength" as const, label: "S · 优势", color: "text-[var(--signal-green)]" },
  { key: "weakness" as const, label: "W · 劣势", color: "text-[var(--signal-red)]" },
  { key: "opportunity" as const, label: "O · 机会", color: "text-[var(--color-accent)]" },
  { key: "threat" as const, label: "T · 威胁", color: "text-[var(--signal-yellow)]" },
];

function SwotForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, content: string) {
    setForm((f) => { const swotItems = [...f.swotItems]; swotItems[idx] = { ...swotItems[idx], content }; return { ...f, swotItems }; });
  }
  function addItem(quadrant: SwotItemDraft["quadrant"]) {
    setForm((f) => ({ ...f, swotItems: [...f.swotItems, { quadrant, content: "" }] }));
  }
  function removeItem(idx: number) {
    setForm((f) => ({ ...f, swotItems: f.swotItems.filter((_, i) => i !== idx) }));
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      {SWOT_META.map((m) => {
        const items = form.swotItems.map((s, i) => ({ ...s, _idx: i })).filter((s) => s.quadrant === m.key);
        return (
          <div key={m.key} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
            <div className={"text-sm font-semibold " + m.color}>{m.label}</div>
            {items.map((s) => (
              <div key={s._idx} className="flex gap-1">
                <textarea className="flex-1 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs" rows={2} value={s.content} onChange={(e) => set(s._idx, e.target.value)} placeholder="输入条目" />
                <button onClick={() => removeItem(s._idx)} className="text-xs text-[var(--signal-red)] hover:underline">×</button>
              </div>
            ))}
            <button onClick={() => addItem(m.key)} className="w-full rounded border border-dashed border-[var(--surface-border)] py-1 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] transition-colors">+ 新增</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── 产品季度推进表 ────────────────────────────────────────────────────────────
function ProductQuarterlyForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof ProductQuarterlyDraft, value: string) {
    setForm((f) => { const productQuarterly = [...f.productQuarterly]; productQuarterly[idx] = { ...productQuarterly[idx], [field]: value }; return { ...f, productQuarterly }; });
  }
  function addRow() { setForm((f) => ({ ...f, productQuarterly: [...f.productQuarterly, emptyProduct()] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, productQuarterly: f.productQuarterly.filter((_, i) => i !== idx) })); }
  const cellCls = "rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs text-right";
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">产品数量与金额季度推进计划（万元）</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
              <th className="px-2 py-1.5 text-left font-medium">产品</th>
              <th className="px-2 py-1.5 text-center font-medium">单位</th>
              {["Q1","Q2","Q3","Q4"].map(q => (
                <th key={q} colSpan={2} className="px-2 py-1.5 text-center font-medium border-l border-[var(--surface-border)]">{q}</th>
              ))}
              <th className="px-2 py-1.5 text-center font-medium border-l border-[var(--surface-border)]">全年收入</th>
              <th className="px-1" />
            </tr>
            <tr className="text-[var(--color-text-muted)] bg-black/[0.02]">
              <th /><th />
              {["Q1","Q2","Q3","Q4"].map(q => (
                <React.Fragment key={q}>
                  <th className="px-2 py-1 text-center border-l border-[var(--surface-border)]">数量</th>
                  <th className="px-2 py-1 text-center">收入</th>
                </React.Fragment>
              ))}
              <th className="border-l border-[var(--surface-border)] px-2">万元</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {form.productQuarterly.map((p, idx) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1"><input type="text" className={cellCls + " text-left w-24"} value={p.productName} onChange={(e) => set(idx, "productName", e.target.value)} placeholder="产品名" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-12"} value={p.unit} onChange={(e) => set(idx, "unit", e.target.value)} placeholder="台/套" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q1Qty} onChange={(e) => set(idx, "q1Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q1Revenue} onChange={(e) => set(idx, "q1Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q2Qty} onChange={(e) => set(idx, "q2Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q2Revenue} onChange={(e) => set(idx, "q2Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q3Qty} onChange={(e) => set(idx, "q3Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q3Revenue} onChange={(e) => set(idx, "q3Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q4Qty} onChange={(e) => set(idx, "q4Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q4Revenue} onChange={(e) => set(idx, "q4Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-20"} value={p.annualRevenue} onChange={(e) => set(idx, "annualRevenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1"><button onClick={() => removeRow(idx)} className="text-xs text-[var(--signal-red)] hover:underline">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">+ 新增产品行</button>
    </div>
  );
}

// ─── 渠道发展专题（业务BU必填）────────────────────────────────────────────────
const CHANNEL_TYPES = ["直销", "经销/代理", "电商", "OEM/ODM", "政府/项目", "海外出口"];

function ChannelForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof ChannelPlanDraft, value: string) {
    setForm((f) => { const channelPlans = [...f.channelPlans]; channelPlans[idx] = { ...channelPlans[idx], [field]: value }; return { ...f, channelPlans }; });
  }
  function addRow(type: string) { setForm((f) => ({ ...f, channelPlans: [...f.channelPlans, { ...emptyChannel(), channelType: type }] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, channelPlans: f.channelPlans.filter((_, i) => i !== idx) })); }
  const ta = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-[var(--color-text-muted)]">业务BU必填 · 渠道发展专题分析</p>
        {CHANNEL_TYPES.map((t) => (
          <button key={t} onClick={() => addRow(t)} className="rounded border border-[var(--surface-border)] px-2 py-0.5 text-xs hover:bg-black/[0.04] transition-colors">{t}</button>
        ))}
      </div>
      {form.channelPlans.map((ch, idx) => (
        <div key={idx} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input type="text" className="rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm font-medium" value={ch.channelType} onChange={(e) => set(idx, "channelType", e.target.value)} placeholder="渠道类型" />
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--color-text-muted)]">年度目标收入(万)</span>
              <input type="text" className="w-24 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1" value={ch.revenueTarget} onChange={(e) => set(idx, "revenueTarget", e.target.value)} placeholder="0" />
              <span className="text-[var(--color-text-muted)]">伙伴数量</span>
              <input type="text" className="w-16 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1" value={ch.partnerCount} onChange={(e) => set(idx, "partnerCount", e.target.value)} placeholder="0" />
              <button onClick={() => removeRow(idx)} className="text-[var(--signal-red)] hover:underline">删除</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-xs text-[var(--color-text-muted)] mb-1">现状</div><textarea className={ta} rows={2} value={ch.currentState} onChange={(e) => set(idx, "currentState", e.target.value)} placeholder="当前渠道状况" /></div>
            <div><div className="text-xs text-[var(--color-text-muted)] mb-1">三年目标</div><textarea className={ta} rows={2} value={ch.targetState} onChange={(e) => set(idx, "targetState", e.target.value)} placeholder="期望达到的渠道状态" /></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["q1Action","q2Action","q3Action","q4Action"] as const).map((f, qi) => (
              <div key={f}><div className="text-xs text-[var(--color-text-muted)] mb-1">Q{qi+1}行动</div><textarea className={ta} rows={2} value={ch[f]} onChange={(e) => set(idx, f, e.target.value)} placeholder={"Q"+(qi+1)+"关键行动"} /></div>
            ))}
          </div>
          <input type="text" className={ta} value={ch.note} onChange={(e) => set(idx, "note", e.target.value)} placeholder="备注" />
        </div>
      ))}
      {form.channelPlans.length === 0 && <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">点击上方按钮添加渠道类型</div>}
    </div>
  );
}

// ─── 客户发展专题（业务BU必填）────────────────────────────────────────────────
function CustomerForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof CustomerPlanDraft, value: string | boolean) {
    setForm((f) => { const customerPlans = [...f.customerPlans]; customerPlans[idx] = { ...customerPlans[idx], [field]: value as string }; return { ...f, customerPlans }; });
  }
  function addRow(isNew: boolean) { setForm((f) => ({ ...f, customerPlans: [...f.customerPlans, emptyCustomer(isNew)] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, customerPlans: f.customerPlans.filter((_, i) => i !== idx) })); }
  const inp = "rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs";
  const ta = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs";
  const existing = form.customerPlans.filter((c) => !c.isNew);
  const newCustomers = form.customerPlans.filter((c) => c.isNew);
  function renderGroup(group: typeof existing, label: string, isNew: boolean) {
    const indices = form.customerPlans.map((c, i) => ({ c, i })).filter(({ c }) => c.isNew === isNew).map(({ i }) => i);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{label}</div>
          <button onClick={() => addRow(isNew)} className="text-xs text-[var(--color-accent)] hover:underline">+ 新增{isNew ? "新增" : "现有"}客户</button>
        </div>
        {group.length === 0 && <div className="text-center py-4 text-xs text-[var(--color-text-muted)]">暂无数据，点击上方新增</div>}
        {group.map((cu, gi) => {
          const idx = indices[gi];
          return (
            <div key={idx} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" className={inp + " flex-1"} value={cu.customerSegment} onChange={(e) => set(idx, "customerSegment", e.target.value)} placeholder="客户类型/名称" />
                <span className="text-xs text-[var(--color-text-muted)]">现有</span>
                <input type="text" className={inp + " w-16"} value={cu.currentCount} onChange={(e) => set(idx, "currentCount", e.target.value)} placeholder="家数" />
                <span className="text-xs text-[var(--color-text-muted)]">年度目标</span>
                <input type="text" className={inp + " w-16"} value={cu.targetCount} onChange={(e) => set(idx, "targetCount", e.target.value)} placeholder="家数" />
                <span className="text-xs text-[var(--color-text-muted)]">客单值(万)</span>
                <input type="text" className={inp + " w-20"} value={cu.revenuePerCustomer} onChange={(e) => set(idx, "revenuePerCustomer", e.target.value)} placeholder="0" />
                <button onClick={() => removeRow(idx)} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["q1Count","q2Count","q3Count","q4Count"] as const).map((f, qi) => (
                  <div key={f}><div className="text-xs text-[var(--color-text-muted)] mb-0.5">Q{qi+1}家数</div><input type="text" className={inp + " w-full"} value={cu[f]} onChange={(e) => set(idx, f, e.target.value)} placeholder="0" /></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-xs text-[var(--color-text-muted)] mb-1">{isNew ? "获客策略" : "留存策略"}</div><textarea className={ta} rows={2} value={isNew ? cu.acquisitionStrategy : cu.retentionStrategy} onChange={(e) => set(idx, isNew ? "acquisitionStrategy" : "retentionStrategy", e.target.value)} placeholder={isNew ? "如何获取新客户" : "如何维系老客户"} /></div>
                <div><div className="text-xs text-[var(--color-text-muted)] mb-1">备注</div><textarea className={ta} rows={2} value={cu.note} onChange={(e) => set(idx, "note", e.target.value)} placeholder="" /></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--color-text-muted)]">业务BU必填 · 客户发展年度规划</p>
      {renderGroup(existing, "现有客户", false)}
      <hr className="border-[var(--surface-border)]" />
      {renderGroup(newCustomers, "新增客户", true)}
    </div>
  );
}

// ─── 市场洞察 ─────────────────────────────────────────────────────────────────
const MARKET_CATS: { key: string; label: string; placeholder: string }[] = [
  { key: "TAM", label: "市场规模（TAM/SAM/SOM）", placeholder: "描述目标市场总量、可服务市场、可获得市场规模及增长率…" },
  { key: "TREND", label: "行业趋势", placeholder: "描述技术变革、政策变化、行业整合等重大趋势…" },
  { key: "CUSTOMER", label: "客户需求变化", placeholder: "描述客户痛点变化、购买行为、决策链变化…" },
  { key: "TECH", label: "技术洞察", placeholder: "描述关键技术趋势对业务的影响与机会…" },
  { key: "COMPETE", label: "竞争态势", placeholder: "主要竞争对手现状、差异化定位、市场份额变化…" },
];

function MarketInsightForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none";

  function getOrCreate(cat: string): MarketInsightDraft {
    return form.marketInsights.find((m) => m.category === cat) ?? { category: cat, title: "", content: "", dataPoint: "", source: "" };
  }

  function update(cat: string, field: keyof MarketInsightDraft, value: string) {
    setForm((f) => {
      const exists = f.marketInsights.findIndex((m) => m.category === cat);
      const item = { ...getOrCreate(cat), [field]: value };
      if (exists >= 0) {
        const arr = [...f.marketInsights];
        arr[exists] = item;
        return { ...f, marketInsights: arr };
      }
      return { ...f, marketInsights: [...f.marketInsights, item] };
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--color-text-muted)]">市场洞察 — 战略意图的依据，填写真实数据与趋势判断</p>
      {MARKET_CATS.map((cat) => {
        const item = getOrCreate(cat.key);
        return (
          <div key={cat.key} className="rounded-lg border border-[var(--surface-border)] p-4 space-y-2">
            <div className="text-sm font-medium">{cat.label}</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-1">标题 / 结论</div>
                <input type="text" className={inp} value={item.title} onChange={(e) => update(cat.key, "title", e.target.value)} placeholder="一句话结论" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-1">关键数据点</div>
                <input type="text" className={inp} value={item.dataPoint} onChange={(e) => update(cat.key, "dataPoint", e.target.value)} placeholder="如：市场规模 500 亿，增速 12%" />
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">详细描述</div>
              <textarea className={inp} rows={3} value={item.content} onChange={(e) => update(cat.key, "content", e.target.value)} placeholder={cat.placeholder} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">数据来源</div>
              <input type="text" className={inp} value={item.source} onChange={(e) => update(cat.key, "source", e.target.value)} placeholder="如：IDC 2025 报告、内部调研" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 作战计划 ─────────────────────────────────────────────────────────────────
function ActionPlanForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof ActionItemDraft, value: string) {
    setForm((f) => { const arr = [...f.actionItems]; arr[idx] = { ...arr[idx], [field]: value }; return { ...f, actionItems: arr }; });
  }
  function addRow() { setForm((f) => ({ ...f, actionItems: [...f.actionItems, emptyActionItem()] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, actionItems: f.actionItems.filter((_, i) => i !== idx) })); }
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none";
  const sel = inp;
  const STATUS_OPTS = [
    { value: "PLAN", label: "计划中" },
    { value: "ON_TRACK", label: "进行中" },
    { value: "AT_RISK", label: "有风险" },
    { value: "DONE", label: "完成" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">年度作战计划 — 关键举措拆解到年度 / 季度具体行动，填写验收标准</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
              <th className="px-2 py-1.5 text-left font-medium w-28">关联举措</th>
              <th className="px-2 py-1.5 text-center font-medium w-14">年份</th>
              <th className="px-2 py-1.5 text-center font-medium w-10">季度</th>
              <th className="px-2 py-1.5 text-left font-medium">具体行动</th>
              <th className="px-2 py-1.5 text-left font-medium w-20">负责人</th>
              <th className="px-2 py-1.5 text-left font-medium">验收标准</th>
              <th className="px-2 py-1.5 text-center font-medium w-20">检查日期</th>
              <th className="px-2 py-1.5 text-center font-medium w-16">状态</th>
              <th className="px-1 w-6" />
            </tr>
          </thead>
          <tbody>
            {form.actionItems.map((ai, idx) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1"><input type="text" className={inp} value={ai.initiativeTitle} onChange={(e) => set(idx, "initiativeTitle", e.target.value)} placeholder="举措标题" /></td>
                <td className="px-1 py-1">
                  <select className={sel} value={ai.year} onChange={(e) => set(idx, "year", e.target.value)}>
                    {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={sel} value={ai.quarter} onChange={(e) => set(idx, "quarter", e.target.value)}>
                    {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><input type="text" className={inp} value={ai.action} onChange={(e) => set(idx, "action", e.target.value)} placeholder="具体行动描述" /></td>
                <td className="px-1 py-1"><input type="text" className={inp} value={ai.ownerName} onChange={(e) => set(idx, "ownerName", e.target.value)} placeholder="姓名" /></td>
                <td className="px-1 py-1"><input type="text" className={inp} value={ai.acceptanceCriteria} onChange={(e) => set(idx, "acceptanceCriteria", e.target.value)} placeholder="完成标准/交付物" /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={ai.checkDate} onChange={(e) => set(idx, "checkDate", e.target.value)} placeholder="MM-DD" /></td>
                <td className="px-1 py-1">
                  <select className={sel} value={ai.status} onChange={(e) => set(idx, "status", e.target.value)}>
                    {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td className="px-1"><button onClick={() => removeRow(idx)} className="text-[var(--signal-red)] hover:underline">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">+ 新增行动项</button>
    </div>
  );
}

// ─── 资源预算 ─────────────────────────────────────────────────────────────────
function BudgetForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof BudgetItemDraft, value: string) {
    setForm((f) => { const arr = [...f.budgetItems]; arr[idx] = { ...arr[idx], [field]: value }; return { ...f, budgetItems: arr }; });
  }
  function addRow(cat: string) { setForm((f) => ({ ...f, budgetItems: [...f.budgetItems, emptyBudgetItem(cat)] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, budgetItems: f.budgetItems.filter((_, i) => i !== idx) })); }
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none";
  const CATS = ["CAPEX", "OPEX", "HC"] as const;
  const catLabel: Record<string, string> = { CAPEX: "资本性支出（Capex）", OPEX: "运营费用（Opex）", HC: "人员编制（HC）" };
  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--color-text-muted)]">资源预算 — 按 Capex / Opex / HC 三类，关联举措，填写三年投入与产出估算</p>
      {CATS.map((cat) => {
        const rows = form.budgetItems.map((b, i) => ({ b, i })).filter(({ b }) => b.category === cat);
        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{catLabel[cat]}</span>
              <button onClick={() => addRow(cat)} className="text-xs text-[var(--color-accent)] hover:underline">+ 新增</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
                    <th className="px-2 py-1 text-left font-medium">描述</th>
                    <th className="px-2 py-1 text-left font-medium">关联举措</th>
                    <th className="px-2 py-1 text-left font-medium">部门</th>
                    <th className="px-2 py-1 text-center font-medium">2026</th>
                    <th className="px-2 py-1 text-center font-medium">2027</th>
                    <th className="px-2 py-1 text-center font-medium">2028</th>
                    <th className="px-2 py-1 text-center font-medium">合计</th>
                    <th className="px-2 py-1 text-left font-medium">ROI估算</th>
                    <th className="px-1 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ b, i }) => (
                    <tr key={i} className="border-b border-[var(--surface-border)]/50">
                      <td className="px-1 py-1"><input type="text" className={inp} value={b.description} onChange={(e) => set(i, "description", e.target.value)} placeholder="项目描述" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp} value={b.initiativeTitle} onChange={(e) => set(i, "initiativeTitle", e.target.value)} placeholder="举措名" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp} value={b.department} onChange={(e) => set(i, "department", e.target.value)} placeholder="部门" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp + " text-right"} value={b.year1Amount} onChange={(e) => set(i, "year1Amount", e.target.value)} placeholder="万元" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp + " text-right"} value={b.year2Amount} onChange={(e) => set(i, "year2Amount", e.target.value)} placeholder="万元" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp + " text-right"} value={b.year3Amount} onChange={(e) => set(i, "year3Amount", e.target.value)} placeholder="万元" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp + " text-right"} value={b.totalAmount} onChange={(e) => set(i, "totalAmount", e.target.value)} placeholder="万元" /></td>
                      <td className="px-1 py-1"><input type="text" className={inp} value={b.roiEstimate} onChange={(e) => set(i, "roiEstimate", e.target.value)} placeholder="如：18个月回本" /></td>
                      <td className="px-1"><button onClick={() => removeRow(i)} className="text-[var(--signal-red)] hover:underline">×</button></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="px-2 py-3 text-center text-[var(--color-text-muted)]">暂无条目，点击「+ 新增」添加</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 路线图 ───────────────────────────────────────────────────────────────────
const TRACKS = ["举措", "产品", "组织", "技术", "渠道"] as const;
const COLORS: { value: string; label: string; cls: string }[] = [
  { value: "", label: "默认", cls: "bg-[var(--color-accent)]/20" },
  { value: "green", label: "绿", cls: "bg-[var(--signal-green)]/20" },
  { value: "yellow", label: "黄", cls: "bg-[var(--signal-yellow)]/20" },
  { value: "red", label: "红", cls: "bg-[var(--signal-red)]/20" },
];

function RoadmapForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof RoadmapItemDraft, value: string) {
    setForm((f) => { const arr = [...f.roadmapItems]; arr[idx] = { ...arr[idx], [field]: value }; return { ...f, roadmapItems: arr }; });
  }
  function addRow() { setForm((f) => ({ ...f, roadmapItems: [...f.roadmapItems, emptyRoadmapItem()] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, roadmapItems: f.roadmapItems.filter((_, i) => i !== idx) })); }
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none";
  const YEARS = [2026, 2027, 2028];
  const QS = [1, 2, 3, 4];

  // 可视化甘特区域
  const quarters = YEARS.flatMap((y) => QS.map((q) => ({ y, q, label: `${y} Q${q}` })));

  function qIndex(year: number, q: number) { return (year - 2026) * 4 + (q - 1); }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-text-muted)]">战略路线图 — 三年时间轴，按轨道展示关键节点</p>

      {/* 甘特可视化 */}
      {form.roadmapItems.some((r) => r.title.trim()) && (
        <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-medium mb-2">预览</div>
          <div className="relative" style={{ minWidth: 700 }}>
            <div className="grid text-[10px] text-[var(--color-text-muted)] mb-1" style={{ gridTemplateColumns: `120px repeat(${quarters.length}, 1fr)` }}>
              <div />
              {quarters.map((q) => (
                <div key={q.label} className={"text-center border-l border-[var(--surface-border)] " + (q.q === 1 ? "font-semibold" : "")}>{q.label}</div>
              ))}
            </div>
            {form.roadmapItems.filter((r) => r.title.trim()).map((r, idx) => {
              const si = qIndex(Number(r.startYear) || 2026, Number(r.startQ) || 1);
              const ei = qIndex(Number(r.endYear) || 2026, Number(r.endQ) || 4);
              const span = Math.max(1, ei - si + 1);
              const colorCls = COLORS.find((c) => c.value === r.color)?.cls ?? COLORS[0].cls;
              return (
                <div key={idx} className="grid items-center mb-1" style={{ gridTemplateColumns: `120px repeat(${quarters.length}, 1fr)` }}>
                  <div className="text-[10px] truncate pr-2 text-[var(--color-text-secondary)]">{r.track} · {r.title}</div>
                  {Array.from({ length: quarters.length }).map((_, ci) => (
                    ci === si
                      ? <div key={ci} className={"rounded text-[10px] px-1 py-0.5 truncate " + colorCls} style={{ gridColumn: `span ${span}` }}>{r.milestone || r.title}</div>
                      : ci > si && ci <= ei ? null
                      : <div key={ci} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 输入表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
              <th className="px-2 py-1.5 text-left font-medium">轨道</th>
              <th className="px-2 py-1.5 text-left font-medium">标题</th>
              <th className="px-2 py-1.5 text-center font-medium">开始年</th>
              <th className="px-2 py-1.5 text-center font-medium">Q</th>
              <th className="px-2 py-1.5 text-center font-medium">结束年</th>
              <th className="px-2 py-1.5 text-center font-medium">Q</th>
              <th className="px-2 py-1.5 text-left font-medium">关键里程碑</th>
              <th className="px-2 py-1.5 text-center font-medium">颜色</th>
              <th className="px-1 w-6" />
            </tr>
          </thead>
          <tbody>
            {form.roadmapItems.map((r, idx) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1">
                  <select className={inp} value={r.track} onChange={(e) => set(idx, "track", e.target.value)}>
                    {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><input type="text" className={inp} value={r.title} onChange={(e) => set(idx, "title", e.target.value)} placeholder="举措/产品/项目名称" /></td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.startYear} onChange={(e) => set(idx, "startYear", e.target.value)}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.startQ} onChange={(e) => set(idx, "startQ", e.target.value)}>
                    {QS.map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.endYear} onChange={(e) => set(idx, "endYear", e.target.value)}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.endQ} onChange={(e) => set(idx, "endQ", e.target.value)}>
                    {QS.map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><input type="text" className={inp} value={r.milestone} onChange={(e) => set(idx, "milestone", e.target.value)} placeholder="里程碑描述" /></td>
                <td className="px-1 py-1">
                  <select className={inp} value={r.color} onChange={(e) => set(idx, "color", e.target.value)}>
                    {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </td>
                <td className="px-1"><button onClick={() => removeRow(idx)} className="text-[var(--signal-red)] hover:underline">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">+ 新增节点</button>
    </div>
  );
}

// ─── 一页纸摘要 ───────────────────────────────────────────────────────────────
function OnePagerView({ form, selectedOrg }: { form: PlanForm; selectedOrg: OrgUnit | undefined }) {
  const topObjectives = form.objectives.filter((o) => o.objective.trim()).slice(0, 4);
  const topInitiatives = form.initiatives.filter((i) => i.title.trim()).slice(0, 5);
  const swotByQ = (q: string) => form.swotItems.filter((s) => s.quadrant === q && s.content.trim()).map((s) => s.content);
  const criticalAssumptions = form.assumptions.filter((a) => a.critical && a.assumption.trim());
  const topMarket = form.marketInsights.find((m) => m.title.trim() || m.content.trim());

  return (
    <div className="space-y-4 print:text-xs">
      <div className="flex items-start justify-between border-b border-[var(--surface-border)] pb-3">
        <div>
          <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest">战略规划摘要 · 董事会版</div>
          <h2 className="text-lg font-bold mt-0.5">{selectedOrg?.name ?? "—"} · 2026–2028 三年战略</h2>
        </div>
        <div className="text-xs text-[var(--color-text-muted)] text-right">
          <div>StratOS · 战略编制系统</div>
          <div>保密 · 仅供内部</div>
        </div>
      </div>

      {/* 战略意图 */}
      <div className="rounded-lg bg-[var(--color-accent)]/[0.06] border border-[var(--color-accent)]/20 px-4 py-3">
        <div className="text-xs font-semibold text-[var(--color-accent)] uppercase mb-1">战略意图</div>
        <p className="text-sm font-medium">{form.intent || "—"}</p>
        {form.northStar && <p className="text-xs text-[var(--color-text-muted)] mt-1">北极星指标：{form.northStar}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 市场背景 */}
        {topMarket && (
          <div className="rounded-lg border border-[var(--surface-border)] p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">市场背景</div>
            <p className="text-xs">{topMarket.title}</p>
            {topMarket.dataPoint && <p className="text-xs text-[var(--color-text-muted)] mt-1">{topMarket.dataPoint}</p>}
          </div>
        )}

        {/* 战略目标 */}
        <div className="rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">战略目标</div>
          <ul className="space-y-1">
            {topObjectives.length > 0 ? topObjectives.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                <span>{o.objective}</span>
              </li>
            )) : <li className="text-xs text-[var(--color-text-muted)]">尚未填写目标</li>}
          </ul>
        </div>
      </div>

      {/* 关键举措 */}
      <div className="rounded-lg border border-[var(--surface-border)] p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">关键举措（Top {topInitiatives.length}）</div>
        <div className="grid grid-cols-1 gap-1.5">
          {topInitiatives.length > 0 ? topInitiatives.map((ini, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[var(--color-accent)] font-medium flex-shrink-0">I{i + 1}</span>
              <div>
                <span className="font-medium">{ini.title}</span>
                {ini.ownerName && <span className="text-[var(--color-text-muted)] ml-1">· {ini.ownerName}</span>}
                {ini.okrKeyResult && <p className="text-[var(--color-text-muted)] mt-0.5">KR：{ini.okrKeyResult} {ini.okrTarget && `→ ${ini.okrTarget}`}</p>}
              </div>
            </div>
          )) : <p className="text-xs text-[var(--color-text-muted)]">尚未填写举措</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* SWOT 简版 */}
        <div className="rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">SWOT</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[["strength", "优势"], ["weakness", "劣势"], ["opportunity", "机会"], ["threat", "威胁"]].map(([q, label]) => (
              <div key={q} className="space-y-0.5">
                <div className="font-medium text-[10px] text-[var(--color-text-muted)]">{label}</div>
                {swotByQ(q).slice(0, 2).map((c, i) => <div key={i} className="line-clamp-1">{c}</div>)}
                {swotByQ(q).length === 0 && <div className="text-[var(--color-text-muted)]">—</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 关键假设 */}
        <div className="rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">关键假设</div>
          <ul className="space-y-1">
            {criticalAssumptions.length > 0 ? criticalAssumptions.slice(0, 4).map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span className="mt-0.5 text-[var(--signal-yellow)]">⚠</span>
                <span>{a.assumption}</span>
              </li>
            )) : form.assumptions.filter((a) => a.assumption.trim()).slice(0, 4).map((a, i) => (
              <li key={i} className="text-xs">{a.assumption}</li>
            ))}
            {form.assumptions.filter((a) => a.assumption.trim()).length === 0 && <li className="text-xs text-[var(--color-text-muted)]">—</li>}
          </ul>
        </div>
      </div>

      <div className="text-center text-[10px] text-[var(--color-text-muted)] border-t border-[var(--surface-border)] pt-2">
        本文件由 StratOS 战略编制系统生成 · 草稿版本 · 内部保密
      </div>
    </div>
  );
}

// ─── 组织规划 ─────────────────────────────────────────────────────────────────
function OrgChartForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  function set(idx: number, field: keyof OrgChartNodeDraft, value: string) {
    setForm((f) => { const orgChartNodes = [...f.orgChartNodes]; orgChartNodes[idx] = { ...orgChartNodes[idx], [field]: value }; return { ...f, orgChartNodes }; });
  }
  function addRow() { setForm((f) => ({ ...f, orgChartNodes: [...f.orgChartNodes, emptyOrg()] })); }
  function removeRow(idx: number) { setForm((f) => ({ ...f, orgChartNodes: f.orgChartNodes.filter((_, i) => i !== idx) })); }
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs";
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">组织架构规划 — 填写规划期末的目标组织设计</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
              <th className="px-2 py-1.5 text-left font-medium">部门/岗位</th>
              <th className="px-2 py-1.5 text-left font-medium">职能描述</th>
              <th className="px-2 py-1.5 text-center font-medium">现有编制</th>
              <th className="px-2 py-1.5 text-center font-medium">新增编制</th>
              <th className="px-2 py-1.5 text-left font-medium">备注</th>
              <th className="px-1" />
            </tr>
          </thead>
          <tbody>
            {form.orgChartNodes.map((node, idx) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1"><input type="text" className={inp} value={node.name} onChange={(e) => set(idx, "name", e.target.value)} placeholder="部门/岗位名称" /></td>
                <td className="px-1 py-1"><input type="text" className={inp} value={node.role} onChange={(e) => set(idx, "role", e.target.value)} placeholder="主要职能" /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={node.headcount} onChange={(e) => set(idx, "headcount", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={node.headcountNew} onChange={(e) => set(idx, "headcountNew", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={inp} value={node.note} onChange={(e) => set(idx, "note", e.target.value)} placeholder="" /></td>
                <td className="px-1"><button onClick={() => removeRow(idx)} className="text-[var(--signal-red)] hover:underline">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">+ 新增行</button>
    </div>
  );
}
