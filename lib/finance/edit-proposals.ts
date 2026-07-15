/**
 * 手工调整 · 变更集审批（改动待审批·生效前）
 *
 * 编辑单元格 → computeChangeSet 生成变更集(草稿) → 提交 → 审批人看 diff →
 * 通过则 applyProposal 写入生效表(运营指标 / PVI)，拒绝则丢弃。
 *
 * 纯函数(canTransition / computeChangeSet / normalizeRow) 可独立测试；
 * DB 读写(readEditableRows / applyProposal / CRUD) 走 prisma。
 */
import { dbAvailable, prisma } from "@/lib/db";
import type { FinEditStatus, FinEditTarget, OpsMetricType } from "@prisma/client";

export type EditTarget = FinEditTarget; // "ops_metric" | "pvi_sales"
export type EditStatus = FinEditStatus; // draft | submitted | approved | rejected
export type EditAction = "submit" | "approve" | "reject" | "revise";

export type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: readonly string[];
  required?: boolean;
};

export type EditableRow = Record<string, unknown> & { id: string; isNew?: boolean };

export type EditOp =
  | { op: "update"; factId: string; before: Record<string, unknown>; after: Record<string, unknown> }
  | { op: "create"; after: Record<string, unknown> }
  | { op: "delete"; factId: string; before: Record<string, unknown> };

export const OPS_METRIC_TYPES = ["headcount", "units_shipped", "capex"] as const;

const OPS_METRIC_LABEL: Record<string, string> = {
  headcount: "人头",
  units_shipped: "发货台数",
  capex: "CapEx",
};

/** 每个目标表的可编辑列定义（供网格渲染 + 校验），numericKey 为主数值列。 */
export const TARGET_FIELDS: Record<
  EditTarget,
  { label: string; numericKey: string; batchSource: "manual_ops" | "manual_pvi"; fields: FieldSpec[] }
> = {
  ops_metric: {
    label: "运营指标",
    numericKey: "value",
    batchSource: "manual_ops",
    fields: [
      { key: "metricType", label: "指标", type: "select", options: OPS_METRIC_TYPES, required: true },
      { key: "period", label: "期间", type: "text", required: true },
      { key: "dim1", label: "维度1", type: "text" },
      { key: "dim2", label: "维度2", type: "text" },
      { key: "value", label: "数值", type: "number", required: true },
      { key: "unit", label: "单位", type: "text" },
    ],
  },
  pvi_sales: {
    label: "PVI 新品销售",
    numericKey: "amount",
    batchSource: "manual_pvi",
    fields: [
      { key: "businessUnit", label: "业务单元", type: "text", required: true },
      { key: "reportingUnit", label: "报告单元", type: "text", required: true },
      { key: "productName", label: "新品", type: "text", required: true },
      { key: "channel", label: "渠道", type: "text" },
      { key: "category", label: "品类", type: "text" },
      { key: "launchPeriod", label: "上市期", type: "text" },
      { key: "period", label: "期间", type: "text", required: true },
      { key: "amount", label: "金额($000)", type: "number", required: true },
    ],
  },
};

export function metricTypeLabel(v: string): string {
  return OPS_METRIC_LABEL[v] ?? v;
}

// ---------- 纯函数 ----------

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** 按目标列定义把一行归一化为可比较的值对象（数值列转 number，文本 trim，空串→null）。 */
export function normalizeRow(target: EditTarget, row: Record<string, unknown>): Record<string, unknown> {
  const spec = TARGET_FIELDS[target];
  const out: Record<string, unknown> = {};
  for (const f of spec.fields) {
    const raw = row[f.key];
    if (f.type === "number") {
      out[f.key] = parseNumber(raw);
    } else {
      const s = raw === null || raw === undefined ? "" : String(raw).trim();
      out[f.key] = s === "" ? null : s;
    }
  }
  return out;
}

function rowIsEmpty(target: EditTarget, normalized: Record<string, unknown>): boolean {
  return TARGET_FIELDS[target].fields.every((f) => normalized[f.key] === null);
}

/** 校验单行：必填列齐全、数值列有值、metricType 合法。返回错误信息（null=通过）。 */
export function validateRow(target: EditTarget, normalized: Record<string, unknown>): string | null {
  const spec = TARGET_FIELDS[target];
  for (const f of spec.fields) {
    if (f.required && normalized[f.key] === null) return `缺少必填列「${f.label}」`;
  }
  if (target === "ops_metric") {
    const mt = normalized.metricType;
    if (mt !== null && !OPS_METRIC_TYPES.includes(mt as OpsMetricType)) return `非法指标类型「${String(mt)}」`;
  }
  return null;
}

/**
 * 纯 diff：对比基线(现有事实) 与编辑后行，产出变更集。
 * - 新行(isNew 或 id 以 "new:" 开头)且非空 → create
 * - 现有行字段有变化 → update（仅记录变化列 + 完整 before/after 供审阅）
 * - 基线中存在但编辑后缺失 → delete
 */
export function computeChangeSet(
  target: EditTarget,
  baseline: EditableRow[],
  edited: EditableRow[],
): { ops: EditOp[]; errors: string[] } {
  const ops: EditOp[] = [];
  const errors: string[] = [];
  const baseById = new Map(baseline.map((r) => [r.id, normalizeRow(target, r)]));
  const seen = new Set<string>();

  edited.forEach((row, idx) => {
    const isNew = row.isNew === true || String(row.id).startsWith("new:");
    const norm = normalizeRow(target, row);
    if (isNew) {
      if (rowIsEmpty(target, norm)) return;
      const err = validateRow(target, norm);
      if (err) {
        errors.push(`新增第 ${idx + 1} 行：${err}`);
        return;
      }
      ops.push({ op: "create", after: norm });
      return;
    }
    seen.add(row.id);
    const before = baseById.get(row.id);
    if (!before) return; // 未知 id，忽略
    const changed = TARGET_FIELDS[target].fields.some((f) => before[f.key] !== norm[f.key]);
    if (!changed) return;
    const err = validateRow(target, norm);
    if (err) {
      errors.push(`第 ${idx + 1} 行：${err}`);
      return;
    }
    ops.push({ op: "update", factId: row.id, before, after: norm });
  });

  for (const b of baseline) {
    if (!seen.has(b.id)) ops.push({ op: "delete", factId: b.id, before: normalizeRow(target, b) });
  }
  return { ops, errors };
}

/** 状态机：草稿→提交→批准/退回；退回可修订回草稿；批准为终态。 */
const TRANSITIONS: Record<EditAction, { from: EditStatus[]; to: EditStatus }> = {
  submit: { from: ["draft"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted"], to: "rejected" },
  revise: { from: ["rejected"], to: "draft" },
};

export function canTransition(status: EditStatus, action: EditAction): EditStatus | null {
  const rule = TRANSITIONS[action];
  if (!rule || !rule.from.includes(status)) return null;
  return rule.to;
}

export function summarizeOps(ops: EditOp[]): { creates: number; updates: number; deletes: number } {
  return {
    creates: ops.filter((o) => o.op === "create").length,
    updates: ops.filter((o) => o.op === "update").length,
    deletes: ops.filter((o) => o.op === "delete").length,
  };
}

// ---------- DB 读写 ----------

export interface ProposalView {
  id: string;
  target: EditTarget;
  period: string | null;
  title: string;
  status: EditStatus;
  ops: EditOp[];
  summary: { creates: number; updates: number; deletes: number };
  note: string | null;
  createdBy: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: string;
}

type ProposalRow = {
  id: string;
  target: EditTarget;
  period: string | null;
  title: string;
  status: EditStatus;
  changesJson: unknown;
  note: string | null;
  createdBy: string | null;
  submittedAt: Date | null;
  submittedBy: string | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: Date;
};

function toView(r: ProposalRow): ProposalView {
  const ops = Array.isArray(r.changesJson) ? (r.changesJson as EditOp[]) : [];
  return {
    id: r.id,
    target: r.target,
    period: r.period,
    title: r.title,
    status: r.status,
    ops,
    summary: summarizeOps(ops),
    note: r.note,
    createdBy: r.createdBy,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    submittedBy: r.submittedBy,
    decidedAt: r.decidedAt?.toISOString() ?? null,
    decidedBy: r.decidedBy,
    decisionNote: r.decisionNote,
    createdAt: r.createdAt.toISOString(),
  };
}

/** 读取目标表当前事实为可编辑行（作为编辑基线）。 */
export async function readEditableRows(target: EditTarget, period?: string | null): Promise<EditableRow[]> {
  if (!(await dbAvailable())) return [];
  if (target === "ops_metric") {
    const rows = await prisma.opsMetricFact.findMany({
      where: period ? { period } : undefined,
      orderBy: [{ metricType: "asc" }, { period: "asc" }, { dim1: "asc" }],
      take: 5000,
    });
    return rows.map((r) => ({
      id: r.id,
      metricType: r.metricType,
      period: r.period,
      dim1: r.dim1,
      dim2: r.dim2,
      value: Number(r.value),
      unit: r.unit,
    }));
  }
  const rows = await prisma.pviSalesFact.findMany({
    where: period ? { period } : undefined,
    orderBy: [{ businessUnit: "asc" }, { period: "asc" }, { productName: "asc" }],
    take: 5000,
  });
  return rows.map((r) => ({
    id: r.id,
    businessUnit: r.businessUnit,
    reportingUnit: r.reportingUnit,
    productName: r.productName,
    channel: r.channel,
    category: r.category,
    launchPeriod: r.launchPeriod,
    period: r.period,
    amount: Number(r.amount),
  }));
}

export async function listProposals(target?: EditTarget): Promise<ProposalView[]> {
  if (!(await dbAvailable())) return [];
  const rows = await prisma.finEditProposal.findMany({
    where: target ? { target } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((r) => toView(r as ProposalRow));
}

export async function createProposal(input: {
  target: EditTarget;
  period?: string | null;
  title: string;
  ops: EditOp[];
  createdBy?: string | null;
}): Promise<ProposalView> {
  if (!input.title.trim()) throw new Error("请填写变更标题");
  if (input.ops.length === 0) throw new Error("没有检测到任何改动");
  const row = await prisma.finEditProposal.create({
    data: {
      target: input.target,
      period: input.period?.trim() || null,
      title: input.title.trim(),
      status: "draft",
      changesJson: input.ops as never,
      createdBy: input.createdBy ?? null,
    },
  });
  return toView(row as ProposalRow);
}

const UNIT_DEFAULT: Record<string, string> = { headcount: "人", units_shipped: "台", capex: "USD" };

/** 审批通过：把变更集写入生效表；create 归入一个手工调整批次。 */
async function applyProposal(proposal: ProposalRow, actor: string | null): Promise<string | null> {
  const ops = Array.isArray(proposal.changesJson) ? (proposal.changesJson as EditOp[]) : [];
  const target = proposal.target;
  const creates = ops.filter((o): o is Extract<EditOp, { op: "create" }> => o.op === "create");

  let batchId: string | null = null;
  if (creates.length > 0) {
    const batch = await prisma.finImportBatch.create({
      data: {
        sourceType: TARGET_FIELDS[target].batchSource,
        fileName: `手工调整 · ${proposal.title}`,
        sheetName: "(manual)",
        period: proposal.period,
        status: "imported",
        rowCount: creates.length,
        importedBy: actor ?? "manual-edit",
      },
    });
    batchId = batch.id;
  }

  await prisma.$transaction(async (tx) => {
    for (const op of ops) {
      if (target === "ops_metric") {
        if (op.op === "delete") {
          await tx.opsMetricFact.delete({ where: { id: op.factId } });
        } else if (op.op === "update") {
          const a = op.after;
          await tx.opsMetricFact.update({
            where: { id: op.factId },
            data: {
              metricType: a.metricType as OpsMetricType,
              period: String(a.period),
              dim1: (a.dim1 as string) ?? null,
              dim2: (a.dim2 as string) ?? null,
              value: Number(a.value),
              unit: (a.unit as string) ?? null,
            },
          });
        } else {
          const a = op.after;
          const mt = a.metricType as OpsMetricType;
          await tx.opsMetricFact.create({
            data: {
              batchId: batchId as string,
              metricType: mt,
              period: String(a.period),
              dim1: (a.dim1 as string) ?? null,
              dim2: (a.dim2 as string) ?? null,
              value: Number(a.value),
              unit: (a.unit as string) ?? UNIT_DEFAULT[mt] ?? null,
            },
          });
        }
      } else {
        if (op.op === "delete") {
          await tx.pviSalesFact.delete({ where: { id: op.factId } });
        } else if (op.op === "update") {
          const a = op.after;
          await tx.pviSalesFact.update({
            where: { id: op.factId },
            data: {
              businessUnit: String(a.businessUnit),
              reportingUnit: String(a.reportingUnit),
              productName: String(a.productName),
              channel: (a.channel as string) ?? null,
              category: (a.category as string) ?? null,
              launchPeriod: (a.launchPeriod as string) ?? null,
              period: String(a.period),
              amount: Number(a.amount),
            },
          });
        } else {
          const a = op.after;
          await tx.pviSalesFact.create({
            data: {
              batchId: batchId as string,
              businessUnit: String(a.businessUnit),
              reportingUnit: String(a.reportingUnit),
              productName: String(a.productName),
              channel: (a.channel as string) ?? null,
              category: (a.category as string) ?? null,
              launchPeriod: (a.launchPeriod as string) ?? null,
              period: String(a.period),
              amount: Number(a.amount),
            },
          });
        }
      }
    }
  });
  return batchId;
}

export async function transitionProposal(input: {
  id: string;
  action: EditAction;
  actor?: string | null;
  note?: string | null;
  ops?: EditOp[];
}): Promise<ProposalView> {
  const current = (await prisma.finEditProposal.findUnique({ where: { id: input.id } })) as ProposalRow | null;
  if (!current) throw new Error("变更集不存在");
  const to = canTransition(current.status, input.action);
  if (!to) throw new Error(`当前状态 ${current.status} 不允许 ${input.action}`);

  const now = new Date();
  if (input.action === "submit") {
    const row = await prisma.finEditProposal.update({
      where: { id: input.id },
      data: {
        status: to,
        submittedAt: now,
        submittedBy: input.actor ?? null,
        ...(input.ops ? { changesJson: input.ops as never } : {}),
      },
    });
    return toView(row as ProposalRow);
  }
  if (input.action === "revise") {
    const row = await prisma.finEditProposal.update({
      where: { id: input.id },
      data: { status: to, decidedAt: null, decidedBy: null, decisionNote: null },
    });
    return toView(row as ProposalRow);
  }

  let appliedBatchId: string | null = null;
  if (input.action === "approve") {
    appliedBatchId = await applyProposal(current, input.actor ?? null);
  }
  const row = await prisma.finEditProposal.update({
    where: { id: input.id },
    data: {
      status: to,
      decidedAt: now,
      decidedBy: input.actor ?? null,
      decisionNote: input.note?.trim() || null,
      appliedBatchId,
    },
  });
  return toView(row as ProposalRow);
}
