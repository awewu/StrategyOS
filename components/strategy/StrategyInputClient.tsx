"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { OrgUnit } from "@prisma/client";
import { Pencil, Plus, Upload, X, ZoomIn } from "lucide-react";
import { useRowsEditor, RowTable, AddRowButton, RemoveRowButton } from "@/components/ui/RowsEditor";
import { Modal } from "@/components/ui/Modal";
import { SwotTowsPanel } from "@/components/strategy/SwotTowsPanel";
import { ReadonlyOrgPlanningTable } from "@/components/strategy/ReadonlyOrgPlanningTable";
import { ReadonlyProductQuarterlyTabs } from "@/components/strategy/ReadonlyProductQuarterlyTabs";
import { ReadonlyRoadmapGantt } from "@/components/strategy/ReadonlyRoadmapGantt";
import { SelfScoreEditor } from "@/components/market/SwotPanel";
import type { IntelDimension } from "@/lib/market-intel/types";
import {
  DEFAULT_PRODUCT_QUARTERLY_YEARS,
  isDefaultProductQuarterlyYear,
  normalizeProductQuarterlyYears,
  parseProductQuarterlyYear,
  productQuarterlyYearOrLegacy,
} from "@/lib/strategy/product-quarterly";

type OrgUnitWithChildren = OrgUnit & { children: OrgUnit[] };

interface Props {
  orgUnits: OrgUnitWithChildren[];
  users: OwnerOption[];
  historyVersions: HistoryVersionOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPlan?: any;
}

interface OwnerOption {
  id: string;
  name: string;
  email: string;
  role: string;
  orgUnitName: string | null;
}

interface HistoryVersionOption {
  id: string;
  orgUnitId: string;
  version: number;
  status: string;
  submittedAt: string;
  label: string;
  orgUnitName: string;
  snapshotJson: unknown;
  attachments: AttachmentInfo[];
}

type Step = "intent" | "objectives" | "initiatives" | "swot" | "product" | "channel" | "customer" | "org" | "resources" | "assumptions" | "market" | "action" | "budget" | "roadmap" | "onepager";

const ALL_STEPS: { id: Step; label: string; buHint?: boolean }[] = [
  { id: "intent",    label: "战略意图" },
  { id: "market",    label: "市场洞察" },
  { id: "swot",      label: "SWOT分析" },
  { id: "objectives",label: "BSC目标/KPI" },
  { id: "initiatives",label:"OKR/关键举措" },
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

// 时间分层：每个板块属于哪一规划视野（愿景→3年路径→年度落地 + 研判/汇总）。
type PlanLayer = "vision" | "insight" | "path" | "annual" | "summary";
const STEP_LAYER: Record<Step, PlanLayer> = {
  intent: "vision",
  market: "insight",
  swot: "insight",
  assumptions: "insight",
  objectives: "annual",
  initiatives: "annual",
  action: "annual",
  product: "annual",
  channel: "annual",
  customer: "annual",
  org: "annual",
  resources: "annual",
  budget: "path",
  roadmap: "path",
  onepager: "summary",
};
const LAYER_META: Record<PlanLayer, { label: string; full: string; hint: string; color: string }> = {
  vision:  { label: "愿景", full: "愿景 · 3–5年终局", hint: "北极星、目标年、收入/利润终局（如 2030）——回答“我们要去哪”。", color: "#7c3aed" },
  insight: { label: "研判", full: "研判 · 事实基线", hint: "市场洞察 / SWOT / 关键假设——外部事实与内部能力判断，不设时间轴。", color: "#0891b2" },
  path:    { label: "3年路径", full: "中期路径 · 2026–2028", hint: "路线图、里程碑、跨年预算——3 年战略路径。", color: "#2563eb" },
  annual:  { label: "年度", full: "年度落地 · 季度", hint: "目标/KR、举措、作战计划、产品/渠道/客户——按季度落地的本期执行。", color: "#16a34a" },
  summary: { label: "汇总", full: "汇总输出", hint: "一页纸摘要，汇总以上各层。", color: "#6b7280" },
};
const LAYER_LEGEND: PlanLayer[] = ["vision", "insight", "path", "annual"];

function stepDone(form: PlanForm, id: Step): boolean {
  switch (id) {
    case "intent": return form.intent.trim().length > 0 || form.northStar.trim().length > 0;
    case "market": return form.marketInsights.some((m) => m.title.trim() || m.content.trim());
    case "swot": return form.swotItems.some((s) => s.content.trim());
    case "objectives": return form.objectives.some((o) => o.objective.trim());
    case "initiatives": return form.initiatives.some((i) => i.title.trim());
    case "action": return form.actionItems.some((a) => a.action.trim());
    case "product": return form.productQuarterly.some((p) => p.productName.trim());
    case "channel": return form.channelPlans.some((c) => c.channelType.trim());
    case "customer": return form.customerPlans.some((c) => c.customerSegment.trim());
    case "org": return form.orgChartNodes.some((n) => n.name.trim());
    case "budget": return form.budgetItems.some((b) => b.description.trim() || b.totalAmount.trim());
    case "resources": return form.resources.some((r) => r.justification.trim() || r.amount.trim());
    case "assumptions": return form.assumptions.some((a) => a.assumption.trim());
    case "roadmap": return form.roadmapItems.some((r) => r.title.trim());
    case "onepager": return false;
  }
}

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
  kpiCode: string;
}
interface ObjectiveDraft {
  dimension: DimensionKey;
  objective: string;
  keyResults: KeyResultDraft[];
}
interface InitiativeKeyResultDraft {
  okrKeyResult: string;
  okrTarget: string;
  okrBaseline: string;
  q1Milestone: string;
  q2Milestone: string;
  q3Milestone: string;
  q4Milestone: string;
}
interface InitiativeDraft {
  title: string;
  ownerName: string;
  keyResults: InitiativeKeyResultDraft[];
}
interface SwotItemDraft {
  quadrant: "strength" | "weakness" | "opportunity" | "threat";
  content: string;
  weight?: number | null;
  intensity?: number | null;
  dimension?: string | null;
}
interface OrgChartNodeDraft {
  name: string;
  role: string;
  headcount: string;
  headcount2026: string;
  headcount2027: string;
  headcount2028: string;
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
  year: number;
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
interface RoadmapTabDraft {
  id: string;
  name: string;
}
interface RoadmapItemDraft {
  roadmapTabId: string;
  roadmapTabName: string;
  track: string;
  title: string;
  startYear: string;
  startQ: string;
  endYear: string;
  endQ: string;
  milestone: string;
  color: string;
  imageAttachmentId: string;
  imageFilename: string;
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
  storagePath?: string;
}

function normalizeAttachmentInfo(raw: unknown): AttachmentInfo | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Partial<AttachmentInfo>;
  if (!item.id || !item.filename) return null;
  const sizeBytes = Number(item.sizeBytes ?? 0);
  return {
    id: String(item.id),
    filename: String(item.filename),
    sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
    mimeType: String(item.mimeType ?? "application/octet-stream"),
    storagePath: item.storagePath ? String(item.storagePath) : undefined,
  };
}

function normalizeAttachmentInfos(raw: unknown): AttachmentInfo[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeAttachmentInfo).filter((item): item is AttachmentInfo => item !== null);
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
  productQuarterlyYears: number[];
  productQuarterly: ProductQuarterlyDraft[];
  marketInsights: MarketInsightDraft[];
  actionItems: ActionItemDraft[];
  budgetItems: BudgetItemDraft[];
  roadmapTabs: RoadmapTabDraft[];
  roadmapItems: RoadmapItemDraft[];
}

function emptyInitiativeKeyResult(): InitiativeKeyResultDraft {
  return { okrKeyResult: "", okrTarget: "", okrBaseline: "", q1Milestone: "", q2Milestone: "", q3Milestone: "", q4Milestone: "" };
}
function emptyInitiative(): InitiativeDraft {
  return { title: "", ownerName: "", keyResults: [emptyInitiativeKeyResult()] };
}
function emptyChannel(): ChannelPlanDraft {
  return { channelType: "", currentState: "", targetState: "", q1Action: "", q2Action: "", q3Action: "", q4Action: "", revenueTarget: "", partnerCount: "", note: "" };
}
function emptyCustomer(isNew: boolean): CustomerPlanDraft {
  return { customerSegment: "", isNew, currentCount: "", targetCount: "", q1Count: "", q2Count: "", q3Count: "", q4Count: "", revenuePerCustomer: "", acquisitionStrategy: "", retentionStrategy: "", note: "" };
}
function emptyProduct(year = 2027): ProductQuarterlyDraft {
  return { year, productName: "", unit: "", q1Qty: "", q1Revenue: "", q2Qty: "", q2Revenue: "", q3Qty: "", q3Revenue: "", q4Qty: "", q4Revenue: "", annualQty: "", annualRevenue: "", note: "" };
}
function emptyOrg(): OrgChartNodeDraft {
  return { name: "", role: "", headcount: "", headcount2026: "", headcount2027: "", headcount2028: "", note: "" };
}
function emptyActionItem(): ActionItemDraft {
  return { initiativeTitle: "", year: "2026", quarter: "1", action: "", ownerName: "", acceptanceCriteria: "", checkDate: "", status: "PLAN" };
}
function emptyBudgetItem(category = "OPEX"): BudgetItemDraft {
  return { category, initiativeTitle: "", department: "", description: "", year1Amount: "", year2Amount: "", year3Amount: "", totalAmount: "", roiEstimate: "", justification: "" };
}
const DEFAULT_ROADMAP_TAB_ID = "roadmap-default";
const DEFAULT_ROADMAP_TAB_NAME = "路线图 1";

function emptyRoadmapTab(index = 0): RoadmapTabDraft {
  return { id: index === 0 ? DEFAULT_ROADMAP_TAB_ID : createRoadmapTabId(), name: `路线图 ${index + 1}` };
}

function createRoadmapTabId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `roadmap-tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyRoadmapItem(tab: RoadmapTabDraft = emptyRoadmapTab()): RoadmapItemDraft {
  return {
    roadmapTabId: tab.id,
    roadmapTabName: tab.name,
    track: "举措",
    title: "",
    startYear: "2026",
    startQ: "1",
    endYear: "2026",
    endQ: "4",
    milestone: "",
    color: "",
    imageAttachmentId: "",
    imageFilename: "",
  };
}
function emptyKeyResult(): KeyResultDraft {
  return { keyResult: "", target: "", kpiCode: "" };
}

function emptyForm(): PlanForm {
  return {
    intent: "",
    northStar: "",
    objectives: DIMENSIONS.map((d) => ({
      dimension: d.key,
      objective: "",
      keyResults: [
        emptyKeyResult(),
        emptyKeyResult(),
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
    productQuarterlyYears: [...DEFAULT_PRODUCT_QUARTERLY_YEARS],
    productQuarterly: [emptyProduct(), emptyProduct()],
    marketInsights: [
      { category: "TAM", title: "", content: "", dataPoint: "", source: "" },
      { category: "TREND", title: "", content: "", dataPoint: "", source: "" },
      { category: "CUSTOMER", title: "", content: "", dataPoint: "", source: "" },
      { category: "TECH", title: "", content: "", dataPoint: "", source: "" },
    ],
    actionItems: [emptyActionItem(), emptyActionItem(), emptyActionItem()],
    budgetItems: [emptyBudgetItem("CAPEX"), emptyBudgetItem("OPEX"), emptyBudgetItem("HC")],
    roadmapTabs: [emptyRoadmapTab()],
    roadmapItems: [emptyRoadmapItem(), emptyRoadmapItem()],
  };
}

function initiativeKrHasText(kr: InitiativeKeyResultDraft): boolean {
  return Boolean(
    kr.okrKeyResult.trim() ||
      kr.okrTarget.trim() ||
      kr.okrBaseline.trim() ||
      kr.q1Milestone.trim() ||
      kr.q2Milestone.trim() ||
      kr.q3Milestone.trim() ||
      kr.q4Milestone.trim(),
  );
}

function flattenInitiativesForSave(initiatives: InitiativeDraft[]) {
  return initiatives.flatMap((initiative) => {
    const title = initiative.title.trim();
    const ownerName = initiative.ownerName.trim();
    const meaningfulKrs = initiative.keyResults.filter(initiativeKrHasText);
    const keyResults = meaningfulKrs.length > 0 ? meaningfulKrs : [emptyInitiativeKeyResult()];

    return keyResults
      .filter((kr) => title || ownerName || initiativeKrHasText(kr))
      .map((kr) => ({
        title,
        ownerName,
        okrKeyResult: kr.okrKeyResult,
        okrTarget: kr.okrTarget,
        okrBaseline: kr.okrBaseline,
        q1Milestone: kr.q1Milestone,
        q2Milestone: kr.q2Milestone,
        q3Milestone: kr.q3Milestone,
        q4Milestone: kr.q4Milestone,
      }));
  });
}

function initiativeGroupKey(row: {
  title?: string | null;
  ownerName?: string | null;
}): string {
  return `${row.title ?? ""}\u001f${row.ownerName ?? ""}`;
}

function hydrateInitiatives(rows: unknown[], fallback: InitiativeDraft[]): InitiativeDraft[] {
  if (rows.length === 0) return fallback;

  const groups: InitiativeDraft[] = [];
  const indexByKey = new Map<string, number>();

  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Partial<InitiativeDraft & InitiativeKeyResultDraft>;
    const key = initiativeGroupKey(row);
    let idx = indexByKey.get(key);
    if (idx == null) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({
        title: row.title ?? "",
        ownerName: row.ownerName ?? "",
        keyResults: [],
      });
    }
    groups[idx].keyResults.push({
      okrKeyResult: row.okrKeyResult ?? "",
      okrTarget: row.okrTarget ?? "",
      okrBaseline: row.okrBaseline ?? "",
      q1Milestone: row.q1Milestone ?? "",
      q2Milestone: row.q2Milestone ?? "",
      q3Milestone: row.q3Milestone ?? "",
      q4Milestone: row.q4Milestone ?? "",
    });
  }

  if (groups.length === 0) return fallback;
  return groups.map((group) => ({
    ...group,
    keyResults: group.keyResults.length > 0 ? group.keyResults : [emptyInitiativeKeyResult()],
  }));
}

const HORIZON_START = 2026;
const HORIZON_END = 2028;

function isLockedHistoryVersion(version: HistoryVersionOption): boolean {
  return version.status.toUpperCase() === "LOCKED";
}

export function StrategyInputClient({ orgUnits, users, historyVersions, initialPlan }: Props) {
  const editingExistingPlan = Boolean(initialPlan?.id);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(initialPlan?.orgUnitId ?? null);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  // 客户端挂载后恢复上次选中的组织单位（避免SSR hydration mismatch）
  useEffect(() => {
    if (initialPlan) return;
    const saved = sessionStorage.getItem("strategy_input_orgId");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR 安全：仅在客户端挂载后恢复 sessionStorage，避免 hydration mismatch
    if (saved) setSelectedOrgId(saved);
  }, [initialPlan]);
  const [step, setStep] = useState<Step>("intent");
  const [form, setForm] = useState<PlanForm>(() => initialPlan ? hydrate(initialPlan) : emptyForm());
  const [attachments, setAttachments] = useState<AttachmentInfo[]>(() => normalizeAttachmentInfos(initialPlan?.attachments));
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | "LOCKED" | null>(() => {
    const value = initialPlan?.status;
    return value === "DRAFT" || value === "SUBMITTED" || value === "LOCKED" ? value : null;
  });
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
  const orgHistoryVersions = useMemo(
    () => historyVersions.filter((version) => version.orgUnitId === selectedOrgId),
    [historyVersions, selectedOrgId],
  );

  const flash = useCallback((kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  }, []);

  function selectOrg(orgUnitId: string | null) {
    if (orgUnitId) sessionStorage.setItem("strategy_input_orgId", orgUnitId);
    else sessionStorage.removeItem("strategy_input_orgId");
    setSelectedOrgId(orgUnitId);
    setStep("intent");
    setForm(emptyForm());
    setAttachments([]);
    setStatus(null);
    setLoading(false);
    setSelectedHistoryId("");
    setHistoryOpen(false);
  }

  function selectHistoryVersion(snapshotId: string) {
    setSelectedHistoryId(snapshotId);
    if (!snapshotId) return;
    const version = historyVersions.find((item) => item.id === snapshotId);
    if (!version) return;
    if (isLockedHistoryVersion(version)) {
      flash("err", "已锁定版本不可修改");
      return;
    }
    setSelectedOrgId(version.orgUnitId);
    if (version.orgUnitId) sessionStorage.setItem("strategy_input_orgId", version.orgUnitId);
    setForm(hydrate(version.snapshotJson));
    setAttachments([...version.attachments]);
    setStatus("DRAFT");
    setStep("intent");
    setHistoryOpen(false);
    flash("ok", `已载入 ${version.orgUnitName} ${version.label}，可继续修改`);
  }

  const validation = useMemo(() => validate(form), [form]);

  async function persist(submit: boolean, formOverride?: PlanForm) {
    if (!selectedOrgId) return;
    const currentForm = formOverride ?? form;
    const currentValidation = formOverride ? validate(formOverride) : validation;
    if (submit && !currentValidation.ok) {
      setStep(currentValidation.step);
      flash("err", currentValidation.message);
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
          intent: currentForm.intent,
          northStar: currentForm.northStar,
          objectives: currentForm.objectives,
          initiatives: flattenInitiativesForSave(currentForm.initiatives),
          resources: currentForm.resources,
          assumptions: currentForm.assumptions,
          swotItems: currentForm.swotItems,
          orgChartNodes: currentForm.orgChartNodes,
          channelPlans: currentForm.channelPlans,
          customerPlans: currentForm.customerPlans,
          productQuarterlyYears: currentForm.productQuarterlyYears,
          productQuarterly: currentForm.productQuarterly,
          marketInsights: currentForm.marketInsights,
          actionItems: currentForm.actionItems.map((a) => ({ ...a, year: Number(a.year) || 2026, quarter: Number(a.quarter) || 1 })),
          budgetItems: currentForm.budgetItems,
          roadmapTabs: currentForm.roadmapTabs.map((tab) => ({ id: tab.id, name: tab.name })),
          roadmapItems: currentForm.roadmapItems.map((r) => ({ ...r, startYear: Number(r.startYear) || 2026, startQ: Number(r.startQ) || 1, endYear: Number(r.endYear) || 2026, endQ: Number(r.endQ) || 4 })),
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
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !selectedOrgId) return;
    // 确保已有 plan（先存草稿拿到 planId）
    const planId = await persist(false);
    if (!planId) return;
    const uploaded: AttachmentInfo[] = [];
    const failed: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("planId", planId);
        const res = await fetch("/api/strategy/plan/attachment", { method: "POST", body: fd });
        if (!res.ok) {
          failed.push(file.name);
          continue;
        }
        uploaded.push(await res.json());
      }
      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
      if (failed.length > 0) {
        flash("err", `已上传 ${uploaded.length} 个，失败 ${failed.length} 个：${failed.slice(0, 2).join("、")}`);
      } else {
        flash("ok", `已上传 ${uploaded.length} 个附件`);
      }
    } catch {
      flash("err", "附件上传失败，已填内容未被修改");
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
      <div className="grid gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap">编制单位</label>
          <select
            value={selectedOrgId ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              selectOrg(v);
            }}
            disabled={editingExistingPlan}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-[var(--surface-border)] bg-black/[0.03] px-3 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
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
            <span className="text-caption whitespace-nowrap">
              {selectedOrg.level === "GROUP" && "集团"}
              {selectedOrg.level === "EXECUTIVE" && "事业部/体系"}
              {selectedOrg.level === "OPERATING_UNIT" && "二级部门"}
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap">历史版本</label>
          <HistoryVersionPicker
            open={historyOpen}
            selectedId={selectedHistoryId}
            selectedOrgId={selectedOrgId}
            versions={orgHistoryVersions}
            onOpenChange={setHistoryOpen}
            onSelect={selectHistoryVersion}
          />
        </div>
      </div>

      {/* 表单主体 */}
      <div className="relative rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
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
                <p className="text-caption">
                  {selectedOrg.level === "GROUP" && "集团战略报告"}
                  {selectedOrg.level === "EXECUTIVE" && "高管层 · 事业部/体系战略"}
                  {selectedOrg.level === "OPERATING_UNIT" && "执行层 · 二级部门战略"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-caption">
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

            {toast && (
              <div className="flex justify-end">
                <div
                  className={'max-w-full break-words rounded-md px-3 py-2 text-sm shadow-sm ' + (
                    toast.kind === "ok"
                      ? "bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
                      : "bg-[var(--signal-red)]/10 text-[var(--signal-red)]"
                  )}
                >
                  {toast.msg}
                </div>
              </div>
            )}

            {/* AI 一键提取 */}
            <AiExtractBar
              setForm={setForm}
              flash={flash}
              persistDraft={() => persist(false)}
              onAttachmentSaved={(attachment) => setAttachments((prev) => [...prev, attachment])}
            />

            {/* 步骤导航 · 带完成度 */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--surface-border)]">
              {ALL_STEPS.map((s) => {
                const done = stepDone(form, s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id)}
                    className={'relative flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ' + (
                      step === s.id
                        ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                        : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    {s.id !== "onepager" && (
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: done ? "var(--signal-green)" : "var(--surface-border-strong)" }}
                      />
                    )}
                    {s.label}
                    {s.buHint && !isBuUnit && (
                      <span className="ml-1 text-[11px] text-[var(--signal-yellow)] opacity-70">BU</span>
                    )}
                  </button>
                );
              })}
              <span className="ml-auto pb-1 pr-1 font-data text-caption">
                已填 {ALL_STEPS.filter((s) => s.id !== "onepager" && stepDone(form, s.id)).length}/{ALL_STEPS.length - 1}
              </span>
            </div>

            {/* 时间分层图例：板块顶部色条对应规划视野 */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
              <span>时间层：</span>
              {LAYER_LEGEND.map((k) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: LAYER_META[k].color }} />
                  {LAYER_META[k].full}
                </span>
              ))}
            </div>

            {/* 当前板块所属时间层 */}
            {(() => {
              const meta = LAYER_META[STEP_LAYER[step]];
              return (
                <div
                  className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5 text-xs"
                  style={{ borderColor: meta.color, color: meta.color, backgroundColor: meta.color + "12" }}
                >
                  <span className="font-semibold">{meta.full}</span>
                  <span className="text-[var(--color-text-muted)]">{meta.hint}</span>
                </div>
              );
            })()}

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
              {step === "initiatives" && <InitiativesForm form={form} setForm={setForm} users={users} />}
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
              {step === "roadmap" && (
                <RoadmapForm
                  form={form}
                  setForm={setForm}
                  persistDraft={(formOverride) => persist(false, formOverride)}
                  flash={flash}
                  onAttachmentSaved={(attachment) => setAttachments((prev) => [...prev, attachment])}
                />
              )}
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
                {status === "SUBMITTED" ? "更新并重新提交" : "提交审核"}
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
function unwrapExtractedPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  let current = value as Record<string, unknown>;
  for (const key of ["extracted", "data", "result", "plan", "structured", "output"]) {
    const nested = current[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      current = nested as Record<string, unknown>;
    }
  }
  return current;
}

function hasExtractedContent(e: Record<string, unknown>): boolean {
  if (typeof e.intent === "string" && e.intent.trim()) return true;
  if (typeof e.northStar === "string" && e.northStar.trim()) return true;
  const hasMeaningfulValue = (value: unknown): boolean => {
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(hasMeaningfulValue);
    return Object.values(value as Record<string, unknown>).some(hasMeaningfulValue);
  };
  return [
    "objectives",
    "initiatives",
    "swotItems",
    "assumptions",
    "productQuarterly",
    "channelPlans",
    "customerPlans",
    "orgChartNodes",
    "marketInsights",
    "actionItems",
    "budgetItems",
    "roadmapItems",
  ].some((key) => Array.isArray(e[key]) && (e[key] as unknown[]).some(hasMeaningfulValue));
}

function isReadableFormText(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  if (isDocumentObjectNoise(text)) return false;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f�]/.test(text)) return false;
  const readable = (text.match(/[\u4e00-\u9fffA-Za-z0-9%.,，。；;：:、（）()【】\s\-_/]/g) ?? []).length;
  return readable / Math.max(text.length, 1) >= 0.65;
}

function isDocumentObjectNoise(value: string): boolean {
  const text = value.trim();
  return /\/Type\s*\/XObject|\/Subtype\s*\/Image|\/ColorSp(?:ace)?|\/BitsPerComponent|\/Filter\s*\/|\/Length\s+\d+|\/Width\s+\d+\s*\/Height\s+\d+/i.test(text) ||
    /^<</.test(text) ||
    /(?:\/[A-Za-z][A-Za-z0-9]*){4,}/.test(text) ||
    /^(?:obj|endobj|stream|endstream|xref|trailer)\b/i.test(text);
}

function cleanFormString(value: unknown): string {
  const text = String(value ?? "");
  return isReadableFormText(text) ? text : "";
}

function applyExtracted(f: PlanForm, e: Record<string, unknown>): PlanForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ea = unwrapExtractedPayload(e) as any;
  return {
    ...f,
    intent: cleanFormString(ea.intent) || f.intent,
    northStar: cleanFormString(ea.northStar) || f.northStar,
    objectives: Array.isArray(ea.objectives) && ea.objectives.length > 0
      ? DIMENSIONS.map((d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = ea.objectives.find((o: any) => o.dimension === d.key);
          const base = f.objectives.find((b) => b.dimension === d.key)!;
          if (!m) return base;
          const krs = (m.keyResults ?? []).map((k: { keyResult?: string; target?: string; kpiCode?: string }) => ({ keyResult: k.keyResult ?? "", target: k.target ?? "", kpiCode: k.kpiCode ?? "" }));
          while (krs.length < 2) krs.push({ keyResult: "", target: "", kpiCode: "" });
          return { dimension: d.key, objective: m.objective ?? "", keyResults: krs };
        })
      : f.objectives,
    initiatives: Array.isArray(ea.initiatives) && ea.initiatives.length > 0
      ? hydrateInitiatives(ea.initiatives, f.initiatives)
      : f.initiatives,
    swotItems: Array.isArray(ea.swotItems) && ea.swotItems.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.swotItems.map((s: any) => ({ quadrant: s.quadrant ?? "strength", content: s.content ?? "", weight: s.weight ?? 3, intensity: s.intensity ?? 3, dimension: s.dimension ?? null }))
      : f.swotItems,
    assumptions: Array.isArray(ea.assumptions) && ea.assumptions.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.assumptions.map((a: any) => ({ assumption: a.assumption ?? "", critical: !!a.critical }))
      : f.assumptions,
    productQuarterlyYears: normalizeProductQuarterlyYears(f.productQuarterlyYears, ea.productQuarterly),
    productQuarterly: Array.isArray(ea.productQuarterly) && ea.productQuarterly.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.productQuarterly.map((p: any) => ({ year: productQuarterlyYearOrLegacy(p.year), productName: p.productName ?? "", unit: p.unit ?? "", q1Qty: p.q1Qty ?? "", q1Revenue: p.q1Revenue ?? "", q2Qty: p.q2Qty ?? "", q2Revenue: p.q2Revenue ?? "", q3Qty: p.q3Qty ?? "", q3Revenue: p.q3Revenue ?? "", q4Qty: p.q4Qty ?? "", q4Revenue: p.q4Revenue ?? "", annualQty: p.annualQty ?? "", annualRevenue: p.annualRevenue ?? "", note: p.note ?? "" }))
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
      ? ea.orgChartNodes.map((n: any) => ({ name: n.name ?? "", role: n.role ?? "", headcount: String(n.headcount ?? ""), headcount2026: String(n.headcount2026 ?? ""), headcount2027: String(n.headcount2027 ?? n.headcountNew ?? ""), headcount2028: String(n.headcount2028 ?? ""), note: n.note ?? "" }))
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
    roadmapTabs: f.roadmapTabs.length > 0 ? f.roadmapTabs : [emptyRoadmapTab()],
    roadmapItems: Array.isArray(ea.roadmapItems) && ea.roadmapItems.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ea.roadmapItems.map((r: any) => {
        const tab = f.roadmapTabs[0] ?? emptyRoadmapTab();
        return { roadmapTabId: tab.id, roadmapTabName: tab.name, track: cleanFormString(r.track) || "举措", title: cleanFormString(r.title), startYear: String(r.startYear ?? 2026), startQ: String(r.startQ ?? 1), endYear: String(r.endYear ?? 2026), endQ: String(r.endQ ?? 4), milestone: cleanFormString(r.milestone), color: cleanFormString(r.color), imageAttachmentId: "", imageFilename: "" };
      })
      : f.roadmapItems.map((r) => ({ ...r, track: cleanFormString(r.track) || "举措", title: cleanFormString(r.title), milestone: cleanFormString(r.milestone), color: cleanFormString(r.color) })),
  };
}

function AiExtractBar({
  setForm, flash, persistDraft, onAttachmentSaved,
}: {
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
  flash: (kind: "ok" | "err", msg: string) => void;
  persistDraft: () => Promise<string | undefined>;
  onAttachmentSaved: (attachment: AttachmentInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<1 | 2 | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAttachment(file: File): Promise<AttachmentInfo> {
    const planId = await persistDraft();
    if (!planId) throw new Error("保存草稿失败，无法上传并解析文件。请确认已选择编制单位。");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("planId", planId);
    const res = await fetch("/api/strategy/plan/attachment", { method: "POST", body: fd });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "附件上传失败");
    return data as AttachmentInfo;
  }

  async function runExtract(body: FormData | string) {
    setLoading(true);
    setLoadingStage(1);
    try {
      const isFormData = body instanceof FormData;
      const res = await fetch("/api/strategy/plan/ai-extract", {
        method: "POST",
        ...(isFormData ? { body } : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: body }),
        }),
      });
      // 请求返回时两阶段已完成，stage2标记
      setLoadingStage(2);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "提取失败");
      const extracted = unwrapExtractedPayload(data.extracted);
      if (!hasExtractedContent(extracted)) {
        const debugSuffix = data.debugId ? `（debugId: ${data.debugId}）` : "";
        throw new Error(`AI 已完成解析，但没有识别到可写入页签的字段。请确认文件内容包含战略意图、市场洞察、SWOT、目标或举措等信息。${debugSuffix}`);
      }
      setForm((f) => applyExtracted(f, extracted));
      flash("ok", "AI 提取完成，请逐页检查并修订内容");
      setOpen(false);
      setText("");
      setFileName("");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "提取失败");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    void (async () => {
      try {
        const attachment = await uploadAttachment(file);
        onAttachmentSaved(attachment);
        await runExtract(fd);
      } catch (err) {
        flash("err", err instanceof Error ? err.message : "附件上传或解析失败");
      }
    })();
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
          {loading ? (
            <span className="text-xs text-[var(--color-accent)] animate-pulse">
              {loadingStage === 1 ? "⏳ 阶段 1/2 · 降噪摘要中…" : "⚙️ 阶段 2/2 · 结构化提取中…"}
            </span>
          ) : (
            <span className="text-caption">上传文件或粘贴文档内容，AI 两阶段智能提取</span>
          )}
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
              <p className="text-caption">支持 PPTX · DOCX · XLSX · PDF，最大 20 MB</p>
              <div className="flex items-center gap-3">
                <label className={
                  "cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors " +
                  (loading
                    ? "border-[var(--surface-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                    : "border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white")
                }>
                  {loading
                    ? (loadingStage === 1 ? "阶段 1/2 降噪中…" : "阶段 2/2 提取中…")
                    : "选择文件并提取"}
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
                  <span className="text-caption truncate max-w-[200px]">{fileName}</span>
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
                placeholder="粘贴战略报告/PPT 文字内容（支持中英文），AI 将自动识别战略意图、BSC/KPI、OKR/关键举措、SWOT、产品计划、渠道、客户规划等字段…"
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

function HistoryVersionPicker({
  open,
  selectedId,
  selectedOrgId,
  versions,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  selectedId: string;
  selectedOrgId: string | null;
  versions: HistoryVersionOption[];
  onOpenChange: (open: boolean) => void;
  onSelect: (snapshotId: string) => void;
}) {
  const selected = versions.find((version) => version.id === selectedId);
  const placeholder = !selectedOrgId
    ? "请先选择编制单位"
    : versions.length === 0
      ? "暂无历史提交版本"
      : "选择历史版本并填充";
  const disabled = !selectedOrgId || versions.length === 0;

  return (
    <div
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--surface-border)] bg-black/[0.03] px-3 py-1.5 text-left text-sm focus:border-[var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">▼</span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-40 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-1 shadow-lg">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onSelect("");
              onOpenChange(false);
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-[var(--color-text-muted)] hover:bg-black/[0.04]"
          >
            选择历史版本并填充
          </button>
          {versions.map((version) => {
            const locked = isLockedHistoryVersion(version);
            return (
              <div key={version.id} className="group/history-option relative" title={locked ? "已锁定不可修改" : undefined}>
                <button
                  type="button"
                  aria-disabled={locked}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (!locked) onSelect(version.id);
                  }}
                  className={'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ' + (
                    locked
                      ? "cursor-not-allowed text-[var(--color-text-muted)] opacity-65"
                      : "hover:bg-black/[0.04]"
                  )}
                >
                  <span className="min-w-0 truncate">{version.label}</span>
                  {locked ? (
                    <span className="shrink-0 rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                      已锁定
                    </span>
                  ) : null}
                </button>
                {locked ? (
                  <div className="pointer-events-none absolute right-3 top-1/2 z-50 hidden -translate-y-1/2 rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-lg group-hover/history-option:block">
                    已锁定不可修改
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function normalizeRoadmapTabs(rawTabs: unknown, rawItems: Array<Record<string, unknown>>): RoadmapTabDraft[] {
  const tabs = Array.isArray(rawTabs)
    ? rawTabs
        .map((rawTab, index) => {
          const tab = rawTab && typeof rawTab === "object" && !Array.isArray(rawTab) ? rawTab as Record<string, unknown> : {};
          return {
            id: cleanFormString(tab.id) || (index === 0 ? DEFAULT_ROADMAP_TAB_ID : `roadmap-tab-${index + 1}`),
            name: cleanFormString(tab.name) || `路线图 ${index + 1}`,
          };
        })
        .filter((tab, index, list) => tab.id && list.findIndex((item) => item.id === tab.id) === index)
    : [];
  if (tabs.length === 0) tabs.push(emptyRoadmapTab());
  for (const item of rawItems) {
    const tabId = cleanFormString(item.roadmapTabId);
    if (tabId && !tabs.some((tab) => tab.id === tabId)) {
      tabs.push({ id: tabId, name: cleanFormString(item.roadmapTabName) || `路线图 ${tabs.length + 1}` });
    }
  }
  return tabs;
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
      kpiCode: k.kpiCode ?? "",
    }));
    while (krs.length < 2) krs.push({ keyResult: "", target: "", kpiCode: "" });
    return { dimension: d.key, objective: match.objective ?? "", keyResults: krs };
  });
  const initiatives: InitiativeDraft[] =
    (plan.initiatives ?? []).length > 0
      ? hydrateInitiatives(plan.initiatives, base.initiatives)
      : base.initiatives;
  const planResources = plan.resourceReqs ?? plan.resources ?? [];
  const resources: ResourceDraft[] = ["Capex", "Opex", "Headcount"].map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = planResources.find((r: any) => r.resourceType === t);
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
      ? plan.swotItems.map((s: any) => ({ quadrant: s.quadrant ?? "strength", content: s.content ?? "", weight: s.weight ?? 3, intensity: s.intensity ?? 3, dimension: s.dimension ?? null }))
      : base.swotItems;
  const orgChartNodes: OrgChartNodeDraft[] =
    (plan.orgChartNodes ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.orgChartNodes.map((n: any) => ({ name: n.name ?? "", role: n.role ?? "", headcount: n.headcount?.toString() ?? "", headcount2026: n.headcount2026?.toString() ?? "", headcount2027: n.headcount2027?.toString() ?? n.headcountNew?.toString() ?? "", headcount2028: n.headcount2028?.toString() ?? "", note: n.note ?? "" }))
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
  const productQuarterlyYears = normalizeProductQuarterlyYears(plan.productQuarterlyYears, plan.productQuarterly);
  const productQuarterly: ProductQuarterlyDraft[] =
    (plan.productQuarterly ?? []).length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? plan.productQuarterly.map((p: any) => ({ year: productQuarterlyYearOrLegacy(p.year), productName: p.productName ?? "", unit: p.unit ?? "", q1Qty: p.q1Qty?.toString() ?? "", q1Revenue: p.q1Revenue?.toString() ?? "", q2Qty: p.q2Qty?.toString() ?? "", q2Revenue: p.q2Revenue?.toString() ?? "", q3Qty: p.q3Qty?.toString() ?? "", q3Revenue: p.q3Revenue?.toString() ?? "", q4Qty: p.q4Qty?.toString() ?? "", q4Revenue: p.q4Revenue?.toString() ?? "", annualQty: p.annualQty?.toString() ?? "", annualRevenue: p.annualRevenue?.toString() ?? "", note: p.note ?? "" }))
      : base.productQuarterly;
  const marketInsights: MarketInsightDraft[] = (plan.marketInsights ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.marketInsights.map((m: any) => ({ category: m.category ?? "TREND", title: m.title ?? "", content: m.content ?? "", dataPoint: m.dataPoint ?? "", source: m.source ?? "" }))
    : base.marketInsights;
  const actionItems: ActionItemDraft[] = (plan.actionItems ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.actionItems.map((a: any) => ({ initiativeTitle: a.initiativeTitle ?? "", year: String(a.year ?? 2026), quarter: String(a.quarter ?? 1), action: a.action ?? "", ownerName: a.ownerName ?? "", acceptanceCriteria: a.acceptanceCriteria ?? "", checkDate: a.checkDate ?? "", status: a.status ?? "PLAN" }))
    : base.actionItems;
  const budgetItems: BudgetItemDraft[] = (plan.budgetItems ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.budgetItems.map((b: any) => ({ category: b.category ?? "OPEX", initiativeTitle: b.initiativeTitle ?? "", department: b.department ?? "", description: b.description ?? "", year1Amount: b.year1Amount ?? "", year2Amount: b.year2Amount ?? "", year3Amount: b.year3Amount ?? "", totalAmount: b.totalAmount ?? "", roiEstimate: b.roiEstimate ?? "", justification: b.justification ?? "" }))
    : base.budgetItems;
  const roadmapTabs = normalizeRoadmapTabs(plan.roadmapTabs, plan.roadmapItems ?? []);
  const roadmapItems: RoadmapItemDraft[] = (plan.roadmapItems ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? plan.roadmapItems.map((r: any) => {
      const tabId = cleanFormString(r.roadmapTabId) || roadmapTabs[0].id;
      const tabName = roadmapTabs.find((tab) => tab.id === tabId)?.name || cleanFormString(r.roadmapTabName) || DEFAULT_ROADMAP_TAB_NAME;
      return { roadmapTabId: tabId, roadmapTabName: tabName, track: r.track ?? "举措", title: r.title ?? "", startYear: String(r.startYear ?? 2026), startQ: String(r.startQ ?? 1), endYear: String(r.endYear ?? 2026), endQ: String(r.endQ ?? 4), milestone: r.milestone ?? "", color: r.color ?? "", imageAttachmentId: r.imageAttachmentId ?? "", imageFilename: r.imageFilename ?? "" };
    })
    : base.roadmapItems.map((item) => ({ ...item, roadmapTabId: roadmapTabs[0].id, roadmapTabName: roadmapTabs[0].name }));
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
    productQuarterlyYears,
    productQuarterly,
    marketInsights,
    actionItems,
    budgetItems,
    roadmapTabs,
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
            <div className="text-caption">支持多选上传 PPT / PDF / Word / 图片，仅作为附件存档，不覆盖已填写内容</div>
          </div>
          <label className="cursor-pointer rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-sm hover:bg-black/[0.04]">
            上传文件
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept=".ppt,.pptx,.pdf,.doc,.docx,.key,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff"
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
                  <span className="ml-2 text-caption">
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
  function addKr(oIdx: number) {
    setForm((f) => {
      const objectives = [...f.objectives];
      objectives[oIdx] = {
        ...objectives[oIdx],
        keyResults: [...objectives[oIdx].keyResults, emptyKeyResult()],
      };
      return { ...f, objectives };
    });
  }
  function removeKr(oIdx: number, kIdx: number) {
    setForm((f) => {
      const objectives = [...f.objectives];
      const keyResults = objectives[oIdx].keyResults.filter((_, idx) => idx !== kIdx);
      objectives[oIdx] = {
        ...objectives[oIdx],
        keyResults: keyResults.length > 0 ? keyResults : [emptyKeyResult()],
      };
      return { ...f, objectives };
    });
  }
  return (
    <div className="space-y-4">
      <p className="text-caption">BSC 四维度 KPI 管理：每个维度填写管理目标、KPI 指标与目标值</p>
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
            placeholder="BSC 管理目标"
          />
          <div className="mt-2 space-y-1">
            {obj.keyResults.map((kr, kIdx) => (
              <div key={kIdx} className="grid grid-cols-[1fr_120px_110px_auto] items-center gap-2">
                <input
                  type="text"
                  className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
                  value={kr.keyResult}
                  onChange={(e) => setKr(oIdx, kIdx, "keyResult", e.target.value)}
                  placeholder={"KPI 指标 " + (kIdx + 1)}
                />
                <input
                  type="text"
                  className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
                  value={kr.target}
                  onChange={(e) => setKr(oIdx, kIdx, "target", e.target.value)}
                  placeholder="KPI 目标值"
                />
                <input
                  type="text"
                  className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs"
                  value={kr.kpiCode}
                  onChange={(e) => setKr(oIdx, kIdx, "kpiCode", e.target.value)}
                  placeholder="编码(选填)"
                  title="与集团健康 KPI 编码一致时，指挥舱可精确关联实际值"
                />
                <div className="flex w-10 justify-end">
                  {obj.keyResults.length > 1 && (
                    <RemoveRowButton onClick={() => removeKr(oIdx, kIdx)} label="删除" />
                  )}
                </div>
              </div>
            ))}
            <AddRowButton label="新增 KPI" onClick={() => addKr(oIdx)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerPicker({
  users,
  value,
  onChange,
}: {
  users: OwnerOption[];
  value: string;
  onChange: (ownerName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOwner = users.find((user) => user.name === value);
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = users
    .filter((user) => {
      if (!normalizedQuery) return true;
      return `${user.name} ${user.email} ${user.role} ${user.orgUnitName ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((a, b) =>
      Number(b.name === value) - Number(a.name === value) ||
      a.name.localeCompare(b.name, "zh-CN"));

  return (
    <div className="relative">
      <input
        type="search"
        className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none"
        value={open ? query : selectedOwner?.name ?? value}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        placeholder="搜索负责人"
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 min-w-72 overflow-y-auto rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-1 shadow-lg">
          <div className="px-3 py-1.5 text-[11px] text-[var(--color-text-muted)]">
            共 {candidates.length} 人
          </div>
          {value && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange("");
                setQuery("");
                setOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-left text-caption hover:bg-black/[0.04]"
            >
              清除负责人
            </button>
          )}
          {candidates.length === 0 ? (
            <div className="px-3 py-2 text-caption">没有匹配人员</div>
          ) : (
            candidates.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(user.name);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-xs hover:bg-black/[0.04]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--color-text-primary)]">{user.name}</span>
                  <span className="block truncate text-[var(--color-text-muted)]">{user.orgUnitName ?? user.email}</span>
                </span>
                <span className="shrink-0 rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-text-muted)]">
                  {user.role}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InitiativesForm({
  form,
  setForm,
  users,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
  users: OwnerOption[];
}) {
  function patchInitiative(idx: number, patch: Partial<Omit<InitiativeDraft, "keyResults">>) {
    setForm((f) => {
      const initiatives = [...f.initiatives];
      initiatives[idx] = { ...initiatives[idx], ...patch };
      return { ...f, initiatives };
    });
  }

  function patchKr(idx: number, krIdx: number, patch: Partial<InitiativeKeyResultDraft>) {
    setForm((f) => {
      const initiatives = [...f.initiatives];
      const keyResults = [...initiatives[idx].keyResults];
      keyResults[krIdx] = { ...keyResults[krIdx], ...patch };
      initiatives[idx] = { ...initiatives[idx], keyResults };
      return { ...f, initiatives };
    });
  }

  function addKr(idx: number) {
    setForm((f) => {
      const initiatives = [...f.initiatives];
      initiatives[idx] = {
        ...initiatives[idx],
        keyResults: [...initiatives[idx].keyResults, emptyInitiativeKeyResult()],
      };
      return { ...f, initiatives };
    });
  }

  function removeKr(idx: number, krIdx: number) {
    setForm((f) => {
      const initiatives = [...f.initiatives];
      const keyResults = initiatives[idx].keyResults.filter((_, i) => i !== krIdx);
      initiatives[idx] = {
        ...initiatives[idx],
        keyResults: keyResults.length > 0 ? keyResults : [emptyInitiativeKeyResult()],
      };
      return { ...f, initiatives };
    });
  }

  function addInitiative() {
    setForm((f) => ({ ...f, initiatives: [...f.initiatives, emptyInitiative()] }));
  }

  function removeInitiative(idx: number) {
    setForm((f) => {
      const initiatives = f.initiatives.filter((_, i) => i !== idx);
      return { ...f, initiatives: initiatives.length > 0 ? initiatives : [emptyInitiative()] };
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-caption">OKR 管理：每项关键举措作为一个 Objective，填写负责人、关键结果、基线、目标值与季度里程碑</p>
      {form.initiatives.map((ini, idx) => (
        <div key={idx} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                className="w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm font-medium"
                value={ini.title}
                onChange={(e) => patchInitiative(idx, { title: e.target.value })}
                placeholder={"Objective / 关键举措 " + (idx + 1)}
              />
              <div className="grid grid-cols-2 gap-2">
                <OwnerPicker
                  users={users}
                  value={ini.ownerName}
                  onChange={(ownerName) => patchInitiative(idx, { ownerName })}
                />
                <div />
              </div>
              <div className="space-y-2">
                {ini.keyResults.map((kr, krIdx) => (
                  <div key={krIdx} className="rounded bg-[var(--color-accent)]/[0.04] p-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-[var(--color-accent)]">OKR · Key Result {krIdx + 1}</div>
                      {ini.keyResults.length > 1 && (
                        <RemoveRowButton onClick={() => removeKr(idx, krIdx)} label="删除 KR" />
                      )}
                    </div>
                    <input type="text" className="w-full rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={kr.okrKeyResult} onChange={(e) => patchKr(idx, krIdx, { okrKeyResult: e.target.value })} placeholder="关键成果描述（可衡量）" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" className="rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={kr.okrBaseline} onChange={(e) => patchKr(idx, krIdx, { okrBaseline: e.target.value })} placeholder="基线值（现状）" />
                      <input type="text" className="rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={kr.okrTarget} onChange={(e) => patchKr(idx, krIdx, { okrTarget: e.target.value })} placeholder="目标值" />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["q1Milestone", "q2Milestone", "q3Milestone", "q4Milestone"] as const).map((q, qi) => (
                        <input key={q} type="text" className="rounded border border-[var(--surface-border)] bg-white/50 px-2 py-1 text-xs" value={kr[q]} onChange={(e) => patchKr(idx, krIdx, { [q]: e.target.value })} placeholder={"Q" + (qi + 1) + " 里程碑"} />
                      ))}
                    </div>
                  </div>
                ))}
                <AddRowButton label="新增 KR" onClick={() => addKr(idx)} />
              </div>
            </div>
            {form.initiatives.length > 1 && (
              <RemoveRowButton onClick={() => removeInitiative(idx)} label="删除" />
            )}
          </div>
        </div>
      ))}
      <AddRowButton label="新增举措" onClick={addInitiative} />
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
  const set = useRowsEditor<PlanForm, ResourceDraft>(setForm, "resources", () => ({ resourceType: "", amount: "", justification: "" })).update;
  return (
    <div className="space-y-3">
      <p className="text-caption">资源请求 (Capex/Opex/Headcount)</p>
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
  const rows = useRowsEditor<PlanForm, AssumptionDraft>(setForm, "assumptions", () => ({ assumption: "", critical: false }));
  const set = rows.update;
  return (
    <div className="space-y-3">
      <p className="text-caption">战略成立的关键前提假设（勾选 = 关键假设）</p>
      {form.assumptions.map((a, idx) => (
        <div key={idx} className="flex gap-2">
          <input type="checkbox" className="mt-1" title="标记为关键假设" checked={a.critical} onChange={(e) => set(idx, "critical", e.target.checked)} />
          <textarea className="flex-1 rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-sm" rows={2} value={a.assumption} onChange={(e) => set(idx, "assumption", e.target.value)} placeholder={"假设 " + (idx + 1)} />
        </div>
      ))}
      <AddRowButton label="新增假设" onClick={() => rows.add()} />
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

const SWOT_DIMENSIONS = [
  { key: "", label: "维度" },
  { key: "product", label: "产品" },
  { key: "gtm", label: "渠道" },
  { key: "brand", label: "品牌" },
  { key: "strategy", label: "战略" },
];
const SWOT_SCALE = [1, 2, 3, 4, 5];

function SwotForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  const rows = useRowsEditor<PlanForm, SwotItemDraft>(setForm, "swotItems", () => ({ quadrant: "strength", content: "", weight: 3, intensity: 3, dimension: null }));
  const miniSel = "rounded border border-[var(--surface-border)] bg-black/[0.04] px-1 py-0.5 text-[11px]";
  return (
    <div className="space-y-4">
      <StrategySwotSelfScoreEditor />
      <div className="grid grid-cols-2 gap-4">
        {SWOT_META.map((m) => {
          const items = form.swotItems.map((s, i) => ({ ...s, _idx: i })).filter((s) => s.quadrant === m.key);
          return (
            <div key={m.key} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
              <div className={"text-sm font-semibold " + m.color}>{m.label}</div>
              {items.map((s) => (
                <div key={s._idx} className="space-y-1 rounded border border-[var(--surface-border)]/60 p-1.5">
                  <div className="flex gap-1">
                    <textarea className="min-h-28 flex-1 resize-y rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs leading-relaxed" rows={5} value={s.content} onChange={(e) => rows.update(s._idx, "content", e.target.value)} placeholder="输入条目" />
                    <RemoveRowButton onClick={() => rows.remove(s._idx)} />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <span>重要</span>
                    <select className={miniSel} value={s.weight ?? 3} onChange={(e) => rows.update(s._idx, "weight", Number(e.target.value))}>
                      {SWOT_SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>强度</span>
                    <select className={miniSel} value={s.intensity ?? 3} onChange={(e) => rows.update(s._idx, "intensity", Number(e.target.value))}>
                      {SWOT_SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select className={miniSel} value={s.dimension ?? ""} onChange={(e) => rows.update(s._idx, "dimension", e.target.value || null)}>
                      {SWOT_DIMENSIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={() => rows.add({ quadrant: m.key, weight: 3, intensity: 3, dimension: null })} className="w-full rounded border border-dashed border-[var(--surface-border)] py-1 text-caption hover:border-[var(--color-accent)] transition-colors">+ 新增</button>
            </div>
          );
        })}
      </div>
      <SwotTowsPanel items={form.swotItems} />
    </div>
  );
}

function StrategySwotSelfScoreEditor() {
  const [scores, setScores] = useState<Partial<Record<IntelDimension, number>>>({});
  const [source, setSource] = useState<"database" | "demo" | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadScores() {
      setLoading(true);
      setSaveNote("");
      try {
        const res = await fetch("/api/market/self-scores");
        const data = (await res.json()) as {
          scores?: Partial<Record<IntelDimension, number>>;
          source?: "database" | "demo";
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setSaveNote(data.error ?? "自评分加载失败");
          return;
        }
        setScores(data.scores ?? {});
        setSource(data.source);
      } catch {
        if (!cancelled) setSaveNote("自评分加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadScores();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveScores() {
    setSaving(true);
    setSaveNote("");
    try {
      const res = await fetch("/api/market/self-scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        scores?: Partial<Record<IntelDimension, number>>;
        source?: "database" | "demo";
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setSaveNote(data.error ?? "保存失败");
        return;
      }
      setScores(data.scores ?? scores);
      setSource(data.source);
      setSaveNote("已保存");
    } catch {
      setSaveNote("保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SelfScoreEditor
      scores={scores}
      onChange={setScores}
      onSave={saveScores}
      saving={saving || loading}
      saveNote={loading ? "正在加载自评分…" : saveNote}
      source={source}
    />
  );
}

// ─── 产品季度推进表 ────────────────────────────────────────────────────────────
function ProductQuarterlyForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  const [activeYear, setActiveYear] = useState(2027);
  const [addingYear, setAddingYear] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [yearError, setYearError] = useState("");
  const years = useMemo(
    () => normalizeProductQuarterlyYears(form.productQuarterlyYears, form.productQuarterly),
    [form.productQuarterly, form.productQuarterlyYears],
  );
  const resolvedActiveYear = years.includes(activeYear) ? activeYear : 2027;
  const activeRows = form.productQuarterly
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => productQuarterlyYearOrLegacy(item.year) === resolvedActiveYear);
  const cellCls = "rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs text-right";

  function setRow<K extends keyof ProductQuarterlyDraft>(idx: number, field: K, value: ProductQuarterlyDraft[K]) {
    setForm((current) => {
      const productQuarterly = [...current.productQuarterly];
      productQuarterly[idx] = { ...productQuarterly[idx], [field]: value };
      return { ...current, productQuarterly };
    });
  }

  function addRow() {
    setForm((current) => ({
      ...current,
      productQuarterly: [...current.productQuarterly, emptyProduct(resolvedActiveYear)],
    }));
  }

  function removeRow(idx: number) {
    setForm((current) => ({
      ...current,
      productQuarterly: current.productQuarterly.filter((_, index) => index !== idx),
    }));
  }

  function beginAddYear() {
    setNewYear(String(Math.max(...years) + 1));
    setYearError("");
    setAddingYear(true);
  }

  function addYear() {
    const year = parseProductQuarterlyYear(newYear);
    if (year === null || year <= 2028) {
      setYearError("请输入 2029 及以后的年份");
      return;
    }
    if (years.includes(year)) {
      setYearError("该年份已存在");
      return;
    }
    setForm((current) => ({
      ...current,
      productQuarterlyYears: [...current.productQuarterlyYears, year].sort((a, b) => a - b),
    }));
    setActiveYear(year);
    setAddingYear(false);
    setYearError("");
  }

  function removeYear(year: number) {
    if (isDefaultProductQuarterlyYear(year)) return;
    const hasRows = form.productQuarterly.some((item) => productQuarterlyYearOrLegacy(item.year) === year);
    if (hasRows && !window.confirm(`删除 ${year} 年选项卡将同时删除该年度的产品数据，是否继续？`)) return;
    setForm((current) => ({
      ...current,
      productQuarterlyYears: current.productQuarterlyYears.filter((item) => item !== year),
      productQuarterly: current.productQuarterly.filter((item) => productQuarterlyYearOrLegacy(item.year) !== year),
    }));
    if (resolvedActiveYear === year) setActiveYear(2027);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end border-b border-[var(--surface-border)]">
        <div className="flex min-w-0 flex-1 overflow-x-auto">
          {years.map((year) => {
            const active = year === resolvedActiveYear;
            return (
              <div
                key={year}
                className={'flex min-w-[112px] items-center border border-b-0 ' + (
                  active
                    ? "border-[var(--surface-border)] bg-[var(--color-bg-surface)]"
                    : "border-transparent bg-black/[0.02] text-[var(--color-text-muted)] hover:bg-black/[0.04]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveYear(year)}
                  className="min-w-0 flex-1 px-4 py-2 text-center text-sm font-medium"
                >
                  {year}
                </button>
                {!isDefaultProductQuarterlyYear(year) && (
                  <button
                    type="button"
                    onClick={() => removeYear(year)}
                    className="mr-1 grid h-7 w-7 shrink-0 place-items-center text-[var(--color-text-muted)] hover:text-[var(--signal-red)]"
                    title={`删除 ${year} 年`}
                    aria-label={`删除 ${year} 年`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={beginAddYear}
          className="mb-1 ml-2 grid h-8 w-8 shrink-0 place-items-center rounded border border-dashed border-[var(--surface-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          title="新增年度"
          aria-label="新增年度"
        >
          <Plus size={16} />
        </button>
      </div>

      {addingYear && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={2029}
            max={2100}
            value={newYear}
            onChange={(event) => {
              setNewYear(event.target.value);
              setYearError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") addYear();
              if (event.key === "Escape") setAddingYear(false);
            }}
            className="h-9 w-28 rounded border border-[var(--surface-border)] bg-black/[0.04] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
            aria-label="新增产品季度年份"
            autoFocus
          />
          <button type="button" onClick={addYear} className="h-9 rounded bg-[var(--color-accent)] px-3 text-sm text-white hover:opacity-90">
            添加
          </button>
          <button type="button" onClick={() => setAddingYear(false)} className="h-9 px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            取消
          </button>
          {yearError && <span className="text-xs text-[var(--signal-red)]">{yearError}</span>}
        </div>
      )}

      <p className="text-caption">{resolvedActiveYear} 年产品数量与金额季度推进计划（收入单位：万元）</p>
      <RowTable
        columns={[
          { label: "产品" },
          { label: "单位", align: "center" },
          ...["Q1", "Q2", "Q3", "Q4"].map((q) => ({ label: q, align: "center" as const, colSpan: 2, className: "border-l border-[var(--surface-border)]" })),
          { label: "全年", align: "center", colSpan: 2, className: "border-l border-[var(--surface-border)]" },
          { label: "" },
        ]}
        extraHeadRow={
          <tr className="text-[var(--color-text-muted)] bg-black/[0.02]">
            <th /><th />
            {["Q1","Q2","Q3","Q4"].map(q => (
              <React.Fragment key={q}>
                <th className="px-2 py-1 text-center border-l border-[var(--surface-border)]">数量</th>
                <th className="px-2 py-1 text-center">收入</th>
              </React.Fragment>
            ))}
            <th className="border-l border-[var(--surface-border)] px-2 py-1 text-center">数量</th>
            <th className="px-2 py-1 text-center">收入</th>
            <th />
          </tr>
        }
      >
        {activeRows.length === 0 && (
          <tr>
            <td colSpan={13} className="px-3 py-8 text-center text-xs text-[var(--color-text-muted)]">
              当前年度暂无产品数据
            </td>
          </tr>
        )}
        {activeRows.map(({ item: p, index: idx }) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1"><input type="text" className={cellCls + " text-left w-24"} value={p.productName} onChange={(e) => setRow(idx, "productName", e.target.value)} placeholder="产品名" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-12"} value={p.unit} onChange={(e) => setRow(idx, "unit", e.target.value)} placeholder="台/套" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q1Qty} onChange={(e) => setRow(idx, "q1Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q1Revenue} onChange={(e) => setRow(idx, "q1Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q2Qty} onChange={(e) => setRow(idx, "q2Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q2Revenue} onChange={(e) => setRow(idx, "q2Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q3Qty} onChange={(e) => setRow(idx, "q3Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q3Revenue} onChange={(e) => setRow(idx, "q3Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.q4Qty} onChange={(e) => setRow(idx, "q4Qty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.q4Revenue} onChange={(e) => setRow(idx, "q4Revenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1 border-l border-[var(--surface-border)]"><input type="text" className={cellCls + " w-16"} value={p.annualQty} onChange={(e) => setRow(idx, "annualQty", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={cellCls + " w-16"} value={p.annualRevenue} onChange={(e) => setRow(idx, "annualRevenue", e.target.value)} placeholder="0" /></td>
                <td className="px-1"><RemoveRowButton onClick={() => removeRow(idx)} /></td>
              </tr>
            ))}
      </RowTable>
      <AddRowButton label={`新增 ${resolvedActiveYear} 年产品行`} onClick={addRow} />
    </div>
  );
}

// ─── 渠道发展专题（业务BU必填）────────────────────────────────────────────────
const CHANNEL_TYPES = ["直销", "经销/代理", "电商", "OEM/ODM", "政府/项目", "海外出口"];

function ChannelForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  const rows = useRowsEditor<PlanForm, ChannelPlanDraft>(setForm, "channelPlans", emptyChannel);
  const set = rows.update;
  const ta = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-caption">业务BU必填 · 渠道发展专题分析</p>
        {CHANNEL_TYPES.map((t) => (
          <button key={t} onClick={() => rows.add({ channelType: t })} className="rounded border border-[var(--surface-border)] px-2 py-0.5 text-xs hover:bg-black/[0.04] transition-colors">{t}</button>
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
              <RemoveRowButton onClick={() => rows.remove(idx)} label="删除" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-caption mb-1">现状</div><textarea className={ta} rows={2} value={ch.currentState} onChange={(e) => set(idx, "currentState", e.target.value)} placeholder="当前渠道状况" /></div>
            <div><div className="text-caption mb-1">三年目标</div><textarea className={ta} rows={2} value={ch.targetState} onChange={(e) => set(idx, "targetState", e.target.value)} placeholder="期望达到的渠道状态" /></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["q1Action","q2Action","q3Action","q4Action"] as const).map((f, qi) => (
              <div key={f}><div className="text-caption mb-1">Q{qi+1}行动</div><textarea className={ta} rows={2} value={ch[f]} onChange={(e) => set(idx, f, e.target.value)} placeholder={"Q"+(qi+1)+"关键行动"} /></div>
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
  const rows = useRowsEditor<PlanForm, CustomerPlanDraft>(setForm, "customerPlans", () => emptyCustomer(false));
  const set = rows.update;
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
          <button onClick={() => rows.add({ isNew })} className="text-xs text-[var(--color-accent)] hover:underline">+ 新增{isNew ? "新增" : "现有"}客户</button>
        </div>
        {group.length === 0 && <div className="text-center py-4 text-caption">暂无数据，点击上方新增</div>}
        {group.map((cu, gi) => {
          const idx = indices[gi];
          return (
            <div key={idx} className="rounded border border-[var(--surface-border)] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" className={inp + " flex-1"} value={cu.customerSegment} onChange={(e) => set(idx, "customerSegment", e.target.value)} placeholder="客户类型/名称" />
                <span className="text-caption">现有</span>
                <input type="text" className={inp + " w-16"} value={cu.currentCount} onChange={(e) => set(idx, "currentCount", e.target.value)} placeholder="家数" />
                <span className="text-caption">年度目标</span>
                <input type="text" className={inp + " w-16"} value={cu.targetCount} onChange={(e) => set(idx, "targetCount", e.target.value)} placeholder="家数" />
                <span className="text-caption">客单值(万)</span>
                <input type="text" className={inp + " w-20"} value={cu.revenuePerCustomer} onChange={(e) => set(idx, "revenuePerCustomer", e.target.value)} placeholder="0" />
                <RemoveRowButton onClick={() => rows.remove(idx)} label="删除" />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["q1Count","q2Count","q3Count","q4Count"] as const).map((f, qi) => (
                  <div key={f}><div className="text-caption mb-0.5">Q{qi+1}家数</div><input type="text" className={inp + " w-full"} value={cu[f]} onChange={(e) => set(idx, f, e.target.value)} placeholder="0" /></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-caption mb-1">{isNew ? "获客策略" : "留存策略"}</div><textarea className={ta} rows={2} value={isNew ? cu.acquisitionStrategy : cu.retentionStrategy} onChange={(e) => set(idx, isNew ? "acquisitionStrategy" : "retentionStrategy", e.target.value)} placeholder={isNew ? "如何获取新客户" : "如何维系老客户"} /></div>
                <div><div className="text-caption mb-1">备注</div><textarea className={ta} rows={2} value={cu.note} onChange={(e) => set(idx, "note", e.target.value)} placeholder="" /></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <p className="text-caption">业务BU必填 · 客户发展年度规划</p>
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
      <p className="text-caption">市场洞察 — 战略意图的依据，填写真实数据与趋势判断</p>
      {MARKET_CATS.map((cat) => {
        const item = getOrCreate(cat.key);
        return (
          <div key={cat.key} className="rounded-lg border border-[var(--surface-border)] p-4 space-y-2">
            <div className="text-sm font-medium">{cat.label}</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-caption mb-1">标题 / 结论</div>
                <input type="text" className={inp} value={item.title} onChange={(e) => update(cat.key, "title", e.target.value)} placeholder="一句话结论" />
              </div>
              <div>
                <div className="text-caption mb-1">关键数据点</div>
                <input type="text" className={inp} value={item.dataPoint} onChange={(e) => update(cat.key, "dataPoint", e.target.value)} placeholder="如：市场规模 500 亿，增速 12%" />
              </div>
            </div>
            <div>
              <div className="text-caption mb-1">详细描述</div>
              <textarea className={inp} rows={3} value={item.content} onChange={(e) => update(cat.key, "content", e.target.value)} placeholder={cat.placeholder} />
            </div>
            <div>
              <div className="text-caption mb-1">数据来源</div>
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
  const rows = useRowsEditor<PlanForm, ActionItemDraft>(setForm, "actionItems", emptyActionItem);
  const set = rows.update;
  const cell = "px-1.5 py-1.5 align-middle";
  const inp = "h-8 w-full rounded-md border border-[var(--surface-border)] bg-black/[0.04] px-2.5 text-xs leading-8 focus:border-[var(--color-accent)] focus:outline-none";
  const selectBase = "h-8 appearance-none rounded-md border border-[var(--surface-border)] bg-black/[0.04] pl-2.5 pr-5 text-left text-xs focus:border-[var(--color-accent)] focus:outline-none";
  const yearSel = selectBase + " w-[5.25rem]";
  const quarterSel = selectBase + " w-[4.25rem]";
  const statusSel = "h-8 w-24 appearance-none rounded-full border border-[var(--surface-border)] bg-[var(--color-bg-surface)] pl-3 pr-5 text-left text-xs font-medium text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none";
  const STATUS_OPTS = [
    { value: "PLAN", label: "计划中" },
    { value: "ON_TRACK", label: "进行中" },
    { value: "AT_RISK", label: "有风险" },
    { value: "DONE", label: "完成" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-caption">年度作战计划 — 关键举措拆解到年度 / 季度具体行动，填写验收标准</p>
      <RowTable
        columns={[
          { label: "关联举措", className: "min-w-[9rem] w-36" },
          { label: "年份", align: "center", className: "min-w-[6rem] w-24" },
          { label: "季度", align: "center", className: "min-w-[5rem] w-20" },
          { label: "具体行动", className: "min-w-[28rem]" },
          { label: "负责人", className: "min-w-[7rem] w-28" },
          { label: "验收标准", className: "min-w-[30rem]" },
          { label: "检查日期", align: "center", className: "min-w-[6.25rem] w-[6.25rem]" },
          { label: "状态", align: "center", className: "min-w-[7rem] w-28" },
          { label: "", className: "min-w-[2rem] w-8" },
        ]}
      >
        {form.actionItems.map((ai, idx) => (
          <tr key={idx} className="border-b border-[var(--surface-border)]/50 hover:bg-black/[0.015]">
            <td className={cell}><input type="text" className={inp} value={ai.initiativeTitle} onChange={(e) => set(idx, "initiativeTitle", e.target.value)} placeholder="举措标题" /></td>
            <td className={cell + " text-center"}>
              <div className="relative inline-block">
                <select className={yearSel} value={ai.year} onChange={(e) => set(idx, "year", e.target.value)}>
                  {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-muted)]">▼</span>
              </div>
            </td>
            <td className={cell + " text-center"}>
              <div className="relative inline-block">
                <select className={quarterSel} value={ai.quarter} onChange={(e) => set(idx, "quarter", e.target.value)}>
                  {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-muted)]">▼</span>
              </div>
            </td>
            <td className={cell}><input type="text" className={inp} value={ai.action} onChange={(e) => set(idx, "action", e.target.value)} placeholder="具体行动描述" /></td>
            <td className={cell}><input type="text" className={inp} value={ai.ownerName} onChange={(e) => set(idx, "ownerName", e.target.value)} placeholder="姓名" /></td>
            <td className={cell}><input type="text" className={inp} value={ai.acceptanceCriteria} onChange={(e) => set(idx, "acceptanceCriteria", e.target.value)} placeholder="完成标准/交付物" /></td>
            <td className={cell}><input type="text" className={inp + " text-center"} value={ai.checkDate} onChange={(e) => set(idx, "checkDate", e.target.value)} placeholder="MM-DD" /></td>
            <td className={cell + " text-center"}>
              <div className="relative inline-block">
                <select className={statusSel} value={ai.status} onChange={(e) => set(idx, "status", e.target.value)}>
                  {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-muted)]">▼</span>
              </div>
            </td>
            <td className="px-1 text-center"><RemoveRowButton onClick={() => rows.remove(idx)} /></td>
          </tr>
        ))}
      </RowTable>
      <AddRowButton label="新增行动项" onClick={() => rows.add()} />
    </div>
  );
}

// ─── 资源预算 ─────────────────────────────────────────────────────────────────
function BudgetForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  const rowsEditor = useRowsEditor<PlanForm, BudgetItemDraft>(setForm, "budgetItems", emptyBudgetItem);
  const set = rowsEditor.update;
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none";
  const CATS = ["CAPEX", "OPEX", "HC"] as const;
  const catLabel: Record<string, string> = { CAPEX: "资本性支出（Capex）", OPEX: "运营费用（Opex）", HC: "人员编制（HC）" };
  return (
    <div className="space-y-5">
      <p className="text-caption">资源预算 — 按 Capex / Opex / HC 三类，关联举措，填写三年投入与产出估算</p>
      {CATS.map((cat) => {
        const rows = form.budgetItems.map((b, i) => ({ b, i })).filter(({ b }) => b.category === cat);
        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{catLabel[cat]}</span>
              <button onClick={() => rowsEditor.add({ category: cat })} className="text-xs text-[var(--color-accent)] hover:underline">+ 新增</button>
            </div>
            <RowTable
              columns={[
                { label: "描述" },
                { label: "关联举措" },
                { label: "部门" },
                { label: "2026", align: "center" },
                { label: "2027", align: "center" },
                { label: "2028", align: "center" },
                { label: "合计", align: "center" },
                { label: "ROI估算" },
                { label: "", className: "w-6" },
              ]}
            >
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
                      <td className="px-1"><RemoveRowButton onClick={() => rowsEditor.remove(i)} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="px-2 py-3 text-center text-[var(--color-text-muted)]">暂无条目，点击「+ 新增」添加</td></tr>
                  )}
            </RowTable>
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

function OverflowTooltipText({ text }: { text: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);

  const measureOverflow = useCallback(() => {
    const element = textRef.current;
    const overflow = Boolean(element && element.scrollWidth > element.clientWidth + 1);
    setIsOverflowing(overflow);
    return overflow;
  }, []);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measureOverflow, text]);

  function showTooltip() {
    const element = textRef.current;
    if (!element || !measureOverflow()) return;

    const rect = element.getBoundingClientRect();
    const tooltipWidth = Math.min(360, window.innerWidth - 24);
    setTooltipPosition({
      left: Math.min(Math.max(12, rect.left), window.innerWidth - tooltipWidth - 12),
      top: rect.bottom + 6,
    });
  }

  return (
    <>
      <span
        ref={textRef}
        className="block truncate"
        tabIndex={isOverflowing ? 0 : -1}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTooltipPosition(null)}
        onFocus={showTooltip}
        onBlur={() => setTooltipPosition(null)}
      >
        {text}
      </span>
      {tooltipPosition && isOverflowing
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[100] w-[min(360px,calc(100vw-24px))] rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-xs leading-relaxed text-[var(--color-text-primary)] shadow-xl whitespace-normal break-words"
              style={tooltipPosition}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function roadmapImageSrc(attachmentId: string) {
  return `/api/strategy/plan/attachment?id=${encodeURIComponent(attachmentId)}`;
}

function RoadmapForm({
  form,
  setForm,
  persistDraft,
  flash,
  onAttachmentSaved,
}: {
  form: PlanForm;
  setForm: React.Dispatch<React.SetStateAction<PlanForm>>;
  persistDraft: (formOverride?: PlanForm) => Promise<string | undefined>;
  flash: (kind: "ok" | "err", msg: string) => void;
  onAttachmentSaved: (attachment: AttachmentInfo) => void;
}) {
  const [activeTabId, setActiveTabId] = useState(form.roadmapTabs[0]?.id ?? DEFAULT_ROADMAP_TAB_ID);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  const imageInputRefs = useRef(new Map<number, HTMLInputElement>());
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none";
  const YEARS = [2026, 2027, 2028];
  const QS = [1, 2, 3, 4];
  const roadmapTabs = useMemo(() => (form.roadmapTabs.length > 0 ? form.roadmapTabs : [emptyRoadmapTab()]), [form.roadmapTabs]);
  const resolvedActiveTabId = roadmapTabs.some((tab) => tab.id === activeTabId) ? activeTabId : roadmapTabs[0].id;
  const activeTab = roadmapTabs.find((tab) => tab.id === resolvedActiveTabId) ?? roadmapTabs[0];
  const activeRows = form.roadmapItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (item.roadmapTabId || DEFAULT_ROADMAP_TAB_ID) === activeTab.id);

  // 可视化甘特区域
  const quarters = YEARS.flatMap((y) => QS.map((q) => ({ y, q, label: `${y} Q${q}` })));
  const ganttGridColumns = `190px repeat(${quarters.length}, 1fr)`;

  function qIndex(year: number, q: number) { return (year - 2026) * 4 + (q - 1); }
  function setRow<K extends keyof RoadmapItemDraft>(idx: number, field: K, value: RoadmapItemDraft[K]) {
    setForm((f) => {
      const roadmapItems = [...f.roadmapItems];
      roadmapItems[idx] = { ...roadmapItems[idx], [field]: value };
      return { ...f, roadmapItems };
    });
  }
  function addTab() {
    const tab: RoadmapTabDraft = { id: createRoadmapTabId(), name: `路线图 ${roadmapTabs.length + 1}` };
    setForm((f) => ({ ...f, roadmapTabs: [...f.roadmapTabs, tab] }));
    setActiveTabId(tab.id);
  }
  function renameTab(tabId: string, name: string) {
    setForm((f) => {
      const roadmapTabs = f.roadmapTabs.map((tab) => (tab.id === tabId ? { ...tab, name } : tab));
      const roadmapItems = f.roadmapItems.map((item) => (item.roadmapTabId === tabId ? { ...item, roadmapTabName: name } : item));
      return { ...f, roadmapTabs, roadmapItems };
    });
  }
  function removeTab(tabId: string, index: number) {
    if (index === 0) return;
    setForm((f) => ({
      ...f,
      roadmapTabs: f.roadmapTabs.filter((tab) => tab.id !== tabId),
      roadmapItems: f.roadmapItems.filter((item) => item.roadmapTabId !== tabId),
    }));
    if (activeTabId === tabId) setActiveTabId(roadmapTabs[0]?.id ?? DEFAULT_ROADMAP_TAB_ID);
  }
  function addNode() {
    setForm((f) => ({ ...f, roadmapItems: [...f.roadmapItems, emptyRoadmapItem(activeTab)] }));
  }
  function removeNode(idx: number) {
    setForm((f) => ({ ...f, roadmapItems: f.roadmapItems.filter((_, index) => index !== idx) }));
  }
  async function uploadNodeImage(idx: number, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("err", "节点图片仅支持图片文件");
      return;
    }
    const planId = await persistDraft();
    if (!planId) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("planId", planId);
      const res = await fetch("/api/strategy/plan/attachment", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error ?? "图片上传失败");
      const attachment = data as AttachmentInfo;
      onAttachmentSaved(attachment);
      const nextForm: PlanForm = {
        ...form,
        roadmapItems: form.roadmapItems.map((item, index) => (
          index === idx
            ? { ...item, imageAttachmentId: attachment.id, imageFilename: attachment.filename }
            : item
        )),
      };
      setForm(nextForm);
      await persistDraft(nextForm);
      flash("ok", "节点图片已上传");
    } catch {
      flash("err", "节点图片上传失败");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-caption">战略路线图 — 三年时间轴，按轨道展示关键节点</p>

      <div className="flex items-center border-b border-[var(--surface-border)]">
        <div className="flex min-w-0 flex-1 overflow-x-auto">
          {roadmapTabs.map((tab, index) => {
            const active = tab.id === activeTab.id;
            return (
              <div
                key={tab.id}
                className={'flex min-w-[132px] max-w-[220px] items-center gap-1 border border-b-0 px-2 py-1.5 ' + (
                  active
                    ? "border-[var(--surface-border)] bg-[var(--color-bg-surface)]"
                    : "border-transparent bg-black/[0.02] text-[var(--color-text-muted)] hover:bg-black/[0.04]"
                )}
              >
                <div className="min-w-0 flex-1 text-left" onClick={() => setActiveTabId(tab.id)}>
                  <input
                    value={tab.name}
                    onChange={(event) => renameTab(tab.id, event.target.value)}
                    onFocus={() => setActiveTabId(tab.id)}
                    className="w-full truncate bg-transparent text-sm outline-none"
                    placeholder={`路线图 ${index + 1}`}
                  />
                </div>
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => removeTab(tab.id, index)}
                    className="shrink-0 rounded px-1 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.05] hover:text-[var(--signal-red)]"
                    title="删除该路线图"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addTab}
          className="ml-2 h-7 w-7 rounded border border-[var(--surface-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          title="新增路线图"
        >
          +
        </button>
      </div>

      {/* 甘特可视化 */}
      <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)] p-3">
        <div className="text-xs font-medium mb-2">预览 · {activeTab.name || DEFAULT_ROADMAP_TAB_NAME}</div>
        <div className="relative min-h-[72px]" style={{ minWidth: 770 }}>
            <div className="grid text-caption mb-1" style={{ gridTemplateColumns: ganttGridColumns }}>
              <div />
              {quarters.map((q) => (
                <div key={q.label} className={"text-center border-l border-[var(--surface-border)] " + (q.q === 1 ? "font-semibold" : "")}>{q.label}</div>
              ))}
            </div>
            {activeRows.filter(({ item }) => item.title.trim()).map(({ item: r, index }) => {
              const si = qIndex(Number(r.startYear) || 2026, Number(r.startQ) || 1);
              const ei = qIndex(Number(r.endYear) || 2026, Number(r.endQ) || 4);
              const span = Math.max(1, ei - si + 1);
              const colorCls = COLORS.find((c) => c.value === r.color)?.cls ?? COLORS[0].cls;
              return (
                <div key={index} className="grid items-center mb-1" style={{ gridTemplateColumns: ganttGridColumns }}>
                  <div className="min-w-0 pr-3 text-[11px] text-[var(--color-text-secondary)]">
                    <OverflowTooltipText text={`${r.track} · ${r.title}`} />
                  </div>
                  {Array.from({ length: quarters.length }).map((_, ci) => (
                    ci === si
                      ? (
                        <div key={ci} className={"flex min-h-8 items-center gap-1 rounded px-1 py-0.5 text-[11px] " + colorCls} style={{ gridColumn: `span ${span}` }}>
                          <span className="min-w-0 flex-1 truncate">{r.milestone || r.title}</span>
                          {r.imageAttachmentId ? (
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white/80">
                              <Image
                                src={roadmapImageSrc(r.imageAttachmentId)}
                                alt={r.imageFilename || r.title}
                                fill
                                sizes="32px"
                                unoptimized
                                className="object-contain p-0.5"
                              />
                            </div>
                          ) : null}
                        </div>
                      )
                      : ci > si && ci <= ei ? null
                      : <div key={ci} />
                  ))}
                </div>
              );
            })}
        </div>
      </div>

      {/* 输入表格 */}
      <RowTable
        columns={[
          { label: "轨道" },
          { label: "标题" },
          { label: "开始年", align: "center" },
          { label: "Q", align: "center" },
          { label: "结束年", align: "center" },
          { label: "Q", align: "center" },
          { label: "关键里程碑" },
          { label: "颜色", align: "center" },
          { label: "图片", align: "center", className: "w-20" },
          { label: "", className: "w-6" },
        ]}
      >
        {activeRows.map(({ item: r, index: idx }) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1">
                  <select className={inp} value={r.track} onChange={(e) => setRow(idx, "track", e.target.value)}>
                    {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><input type="text" className={inp} value={r.title} onChange={(e) => setRow(idx, "title", e.target.value)} placeholder="举措/产品/项目名称" /></td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.startYear} onChange={(e) => setRow(idx, "startYear", e.target.value)}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.startQ} onChange={(e) => setRow(idx, "startQ", e.target.value)}>
                    {QS.map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.endYear} onChange={(e) => setRow(idx, "endYear", e.target.value)}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select className={inp + " text-center"} value={r.endQ} onChange={(e) => setRow(idx, "endQ", e.target.value)}>
                    {QS.map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><input type="text" className={inp} value={r.milestone} onChange={(e) => setRow(idx, "milestone", e.target.value)} placeholder="里程碑描述" /></td>
                <td className="px-1 py-1">
                  <select className={inp} value={r.color} onChange={(e) => setRow(idx, "color", e.target.value)}>
                    {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <div className="flex items-center justify-center">
                    <input
                      ref={(input) => {
                        if (input) imageInputRefs.current.set(idx, input);
                        else imageInputRefs.current.delete(idx);
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void uploadNodeImage(idx, file);
                      }}
                    />
                    {r.imageAttachmentId ? (
                      <div className="group relative h-14 w-14 overflow-hidden rounded border border-[var(--surface-border)] bg-white">
                        <Image
                          src={roadmapImageSrc(r.imageAttachmentId)}
                          alt={r.imageFilename || "节点图片"}
                          fill
                          sizes="56px"
                          unoptimized
                          className="object-contain p-1"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({
                              src: roadmapImageSrc(r.imageAttachmentId),
                              name: r.imageFilename || "节点图片",
                            })}
                            className="flex h-7 w-7 items-center justify-center rounded bg-white/90 text-[var(--color-text-primary)] hover:bg-white"
                            aria-label="查看大图"
                            title="查看大图"
                          >
                            <ZoomIn size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => imageInputRefs.current.get(idx)?.click()}
                            className="flex h-7 w-7 items-center justify-center rounded bg-white/90 text-[var(--color-text-primary)] hover:bg-white"
                            aria-label="修改图片"
                            title="修改图片"
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRefs.current.get(idx)?.click()}
                        className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-[var(--surface-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        aria-label="上传图片"
                        title="上传图片"
                      >
                        <Upload size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-1"><RemoveRowButton onClick={() => removeNode(idx)} /></td>
              </tr>
            ))}
      </RowTable>
      <AddRowButton label="新增节点" onClick={addNode} />

      {previewImage ? (
        <Modal onClose={() => setPreviewImage(null)} size="2xl">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="min-w-0 truncate text-sm font-medium text-[var(--color-text-primary)]">{previewImage.name}</p>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-black/[0.05] hover:text-[var(--color-text-primary)]"
              aria-label="关闭大图"
              title="关闭"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="relative h-[65vh] min-h-64 w-full overflow-hidden rounded border border-[var(--surface-border)] bg-black/[0.03]">
            <Image
              src={previewImage.src}
              alt={previewImage.name}
              fill
              sizes="(max-width: 768px) 90vw, 720px"
              unoptimized
              className="object-contain p-2"
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

// ─── 一页纸摘要 ───────────────────────────────────────────────────────────────
function PreviewTooltipText({ text }: { text: string }) {
  return (
    <div className="group relative focus:outline-none" tabIndex={0} title={text}>
      <div className="line-clamp-2 whitespace-pre-line break-words leading-relaxed">{text}</div>
      <div className="absolute bottom-full left-0 z-50 hidden w-72 max-w-[min(22rem,70vw)] pb-1 group-hover:block group-focus:block">
        <div className="max-h-44 overflow-auto rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-2.5 text-xs leading-relaxed text-[var(--color-text-primary)] shadow-xl whitespace-pre-line break-words">
          {text}
        </div>
      </div>
    </div>
  );
}

function OnePagerView({ form, selectedOrg }: { form: PlanForm; selectedOrg: OrgUnit | undefined }) {
  const topObjectives = form.objectives.filter((o) => o.objective.trim()).slice(0, 4);
  const topInitiatives = form.initiatives.filter((i) => i.title.trim()).slice(0, 5);
  const swotByQ = (q: string) => form.swotItems.filter((s) => s.quadrant === q && s.content.trim()).map((s) => s.content);
  const criticalAssumptions = form.assumptions.filter((a) => a.critical && a.assumption.trim());
  const topMarket = form.marketInsights.find((m) => m.title.trim() || m.content.trim());
  const displayMetric = (raw: string) => {
    const value = raw.trim();
    if (!value) return "0";
    const number = Number(value.replaceAll(",", ""));
    return Number.isFinite(number) ? number.toLocaleString("zh-CN") : value;
  };
  const productRows = form.productQuarterly
    .filter((product) => product.productName.trim())
    .map((product) => ({
      year: productQuarterlyYearOrLegacy(product.year),
      productName: product.productName,
      unit: product.unit.trim() || "台/套",
      q1Qty: displayMetric(product.q1Qty),
      q1Revenue: displayMetric(product.q1Revenue),
      q2Qty: displayMetric(product.q2Qty),
      q2Revenue: displayMetric(product.q2Revenue),
      q3Qty: displayMetric(product.q3Qty),
      q3Revenue: displayMetric(product.q3Revenue),
      q4Qty: displayMetric(product.q4Qty),
      q4Revenue: displayMetric(product.q4Revenue),
      annualQty: displayMetric(product.annualQty),
      annualRevenue: displayMetric(product.annualRevenue),
      note: product.note.trim() || "-",
    }));
  const orgPlanningRows = form.orgChartNodes
    .filter((node) => node.name.trim())
    .map((node) => ({
      name: node.name,
      role: node.role.trim() || "-",
      headcount: displayMetric(node.headcount),
      headcount2026: displayMetric(node.headcount2026),
      headcount2027: displayMetric(node.headcount2027),
      headcount2028: displayMetric(node.headcount2028),
      note: node.note.trim() || "-",
    }));
  const roadmapItems = form.roadmapItems
    .filter((item) => item.title.trim())
    .map((item, index) => ({
      id: `onepager-roadmap-${index}`,
      roadmapTabId: item.roadmapTabId || null,
      roadmapTabName: item.roadmapTabName || null,
      track: item.track,
      title: item.title,
      startYear: Number(item.startYear) || 2026,
      startQ: Number(item.startQ) || 1,
      endYear: Number(item.endYear) || 2026,
      endQ: Number(item.endQ) || 4,
      milestone: item.milestone || null,
      color: item.color || null,
      imageAttachmentId: item.imageAttachmentId || null,
      imageFilename: item.imageFilename || null,
    }));

  return (
    <div className="space-y-4 print:text-xs">
      <div className="flex items-start justify-between border-b border-[var(--surface-border)] pb-3">
        <div>
          <div className="text-caption tracking-wide">战略规划摘要 · 董事会版</div>
          <h2 className="text-lg font-bold mt-0.5">{selectedOrg?.name ?? "—"} · 2026–2028 三年战略</h2>
        </div>
        <div className="text-caption text-right">
          <div>StratOS · 战略编制系统</div>
          <div>保密 · 仅供内部</div>
        </div>
      </div>

      {/* 战略意图 */}
      <div className="rounded-lg bg-[var(--color-accent)]/[0.06] border border-[var(--color-accent)]/20 px-4 py-3">
        <div className="text-xs font-semibold text-[var(--color-accent)] mb-1">战略意图</div>
        <p className="text-sm font-medium">{form.intent || "—"}</p>
        {form.northStar && <p className="text-caption mt-1">北极星指标：{form.northStar}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 市场背景 */}
        {topMarket && (
          <div className="rounded-lg border border-[var(--surface-border)] p-3">
            <div className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">市场背景</div>
            <p className="text-xs">{topMarket.title}</p>
            {topMarket.dataPoint && <p className="text-caption mt-1">{topMarket.dataPoint}</p>}
          </div>
        )}

        {/* 战略目标 */}
        <div className="rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">战略目标</div>
          <ul className="space-y-1">
            {topObjectives.length > 0 ? topObjectives.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                <span>{o.objective}</span>
              </li>
            )) : <li className="text-caption">尚未填写目标</li>}
          </ul>
        </div>
      </div>

      {/* 关键举措 */}
      <div className="rounded-lg border border-[var(--surface-border)] p-3">
        <div className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">关键举措（Top {topInitiatives.length}）</div>
        <div className="grid grid-cols-1 gap-1.5">
          {topInitiatives.length > 0 ? topInitiatives.map((ini, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[var(--color-accent)] font-medium flex-shrink-0">I{i + 1}</span>
              <div>
                <span className="font-medium">{ini.title}</span>
                {ini.ownerName && <span className="text-[var(--color-text-muted)] ml-1">· {ini.ownerName}</span>}
                {ini.keyResults.filter(initiativeKrHasText).slice(0, 2).map((kr, krIdx) => (
                  <p key={krIdx} className="text-[var(--color-text-muted)] mt-0.5">
                    KR{krIdx + 1}：{kr.okrKeyResult || "—"} {kr.okrTarget && `→ ${kr.okrTarget}`}
                  </p>
                ))}
              </div>
            </div>
          )) : <p className="text-caption">尚未填写举措</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* SWOT 简版 */}
        <div className="rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">SWOT</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[["strength", "优势"], ["weakness", "劣势"], ["opportunity", "机会"], ["threat", "威胁"]].map(([q, label]) => (
              <div key={q} className="space-y-0.5">
                <div className="font-medium text-caption">{label}</div>
                {swotByQ(q).slice(0, 2).map((c, i) => <PreviewTooltipText key={i} text={c} />)}
                {swotByQ(q).length === 0 && <div className="text-[var(--color-text-muted)]">—</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 关键假设 */}
        <div className="rounded-lg border border-[var(--surface-border)] p-3">
          <div className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">关键假设</div>
          <ul className="space-y-1">
            {criticalAssumptions.length > 0 ? criticalAssumptions.slice(0, 4).map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span className="mt-0.5 text-[var(--signal-yellow)]">⚠</span>
                <span>{a.assumption}</span>
              </li>
            )) : form.assumptions.filter((a) => a.assumption.trim()).slice(0, 4).map((a, i) => (
              <li key={i} className="text-xs">{a.assumption}</li>
            ))}
            {form.assumptions.filter((a) => a.assumption.trim()).length === 0 && <li className="text-caption">—</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--surface-border)] p-3">
        <div className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">产品季度</div>
        <ReadonlyProductQuarterlyTabs years={form.productQuarterlyYears} rows={productRows} />
      </div>

      <div className="rounded-lg border border-[var(--surface-border)] p-3">
        <div className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">组织规划</div>
        <ReadonlyOrgPlanningTable rows={orgPlanningRows} />
      </div>

      <div className="rounded-lg border border-[var(--surface-border)] p-3">
        <div className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">战略路线图</div>
        <ReadonlyRoadmapGantt
          roadmapTabs={form.roadmapTabs}
          items={roadmapItems}
          horizonStart={2026}
          horizonEnd={2028}
        />
      </div>

      <div className="text-center text-caption border-t border-[var(--surface-border)] pt-2">
        本文件由 StratOS 战略编制系统生成 · 草稿版本 · 内部保密
      </div>
    </div>
  );
}

// ─── 组织规划 ─────────────────────────────────────────────────────────────────
function OrgChartForm({ form, setForm }: { form: PlanForm; setForm: React.Dispatch<React.SetStateAction<PlanForm>> }) {
  const rows = useRowsEditor<PlanForm, OrgChartNodeDraft>(setForm, "orgChartNodes", emptyOrg);
  const set = rows.update;
  const inp = "w-full rounded border border-[var(--surface-border)] bg-black/[0.04] px-2 py-1 text-xs";
  return (
    <div className="space-y-3">
      <p className="text-caption">组织架构规划 — 填写规划期末的目标组织设计</p>
      <RowTable
        columns={[
          { label: "部门/岗位", className: "w-[15%] min-w-36" },
          { label: "职能描述", className: "w-[25%] min-w-48" },
          { label: "现有编制", align: "center", className: "w-[9%] min-w-24" },
          { label: "2026", align: "center", className: "w-[9%] min-w-24" },
          { label: "2027", align: "center", className: "w-[9%] min-w-24" },
          { label: "2028", align: "center", className: "w-[9%] min-w-24" },
          { label: "备注", className: "w-[20%] min-w-48" },
          { label: "", className: "w-[4%] min-w-8" },
        ]}
      >
        {form.orgChartNodes.map((node, idx) => (
              <tr key={idx} className="border-b border-[var(--surface-border)]/50">
                <td className="px-1 py-1"><input type="text" className={inp} value={node.name} onChange={(e) => set(idx, "name", e.target.value)} placeholder="部门/岗位名称" /></td>
                <td className="px-1 py-1"><input type="text" className={inp} value={node.role} onChange={(e) => set(idx, "role", e.target.value)} placeholder="主要职能" /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={node.headcount} onChange={(e) => set(idx, "headcount", e.target.value)} placeholder="0" /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={node.headcount2026} onChange={(e) => set(idx, "headcount2026", e.target.value)} placeholder="0" aria-label={`${node.name || `第 ${idx + 1} 行`} 2026 编制`} /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={node.headcount2027} onChange={(e) => set(idx, "headcount2027", e.target.value)} placeholder="0" aria-label={`${node.name || `第 ${idx + 1} 行`} 2027 编制`} /></td>
                <td className="px-1 py-1"><input type="text" className={inp + " text-center"} value={node.headcount2028} onChange={(e) => set(idx, "headcount2028", e.target.value)} placeholder="0" aria-label={`${node.name || `第 ${idx + 1} 行`} 2028 编制`} /></td>
                <td className="px-1 py-1"><input type="text" className={inp} value={node.note} onChange={(e) => set(idx, "note", e.target.value)} placeholder="" /></td>
                <td className="px-1"><RemoveRowButton onClick={() => rows.remove(idx)} /></td>
              </tr>
            ))}
      </RowTable>
      <AddRowButton label="新增行" onClick={() => rows.add()} />
    </div>
  );
}
