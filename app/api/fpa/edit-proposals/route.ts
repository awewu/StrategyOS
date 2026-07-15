import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getSession } from "@/lib/auth/session";
import { logUsageEvent } from "@/lib/audit/log-event";
import {
  TARGET_FIELDS,
  computeChangeSet,
  createProposal,
  listProposals,
  readEditableRows,
  transitionProposal,
  type EditAction,
  type EditTarget,
  type EditableRow,
} from "@/lib/finance/edit-proposals";

function isTarget(v: string): v is EditTarget {
  return v === "ops_metric" || v === "pvi_sales";
}

export async function GET(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const url = new URL(req.url);
  const targetRaw = url.searchParams.get("target") ?? "";
  const period = url.searchParams.get("period");
  const wantRows = url.searchParams.get("rows") === "1";
  const target = isTarget(targetRaw) ? targetRaw : undefined;

  const proposals = await listProposals(target);
  if (wantRows && target) {
    const rows = await readEditableRows(target, period);
    return NextResponse.json({ proposals, target, fields: TARGET_FIELDS[target].fields, rows });
  }
  return NextResponse.json({ proposals });
}

/** 新建草稿：服务端以最新生效数据为基线，重算变更集（不信任前端 before）。 */
export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      target?: string;
      period?: string | null;
      title?: string;
      edited?: EditableRow[];
    };
    if (!body.target || !isTarget(body.target)) {
      return NextResponse.json({ error: "缺少或非法 target" }, { status: 400 });
    }
    if (!Array.isArray(body.edited)) {
      return NextResponse.json({ error: "缺少编辑数据" }, { status: 400 });
    }
    const baseline = await readEditableRows(body.target, body.period ?? undefined);
    const { ops, errors } = computeChangeSet(body.target, baseline, body.edited);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("；"), errors }, { status: 400 });
    }
    if (ops.length === 0) {
      return NextResponse.json({ error: "没有检测到任何改动" }, { status: 400 });
    }
    const session = await getSession().catch(() => null);
    const proposal = await createProposal({
      target: body.target,
      period: body.period ?? null,
      title: body.title ?? "手工调整",
      ops,
      createdBy: session?.email ?? null,
    });
    await logUsageEvent({
      action: "manual_edit_review",
      resource: "/api/fpa/edit-proposals",
      metadata: { op: "create", id: proposal.id, target: proposal.target, ...proposal.summary },
      request: req,
    });
    return NextResponse.json({ proposal });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "创建失败" }, { status: 400 });
  }
}

/** 流转：submit 需 L2；approve/reject/revise 需 L3（生效前双人复核）。 */
export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; action?: EditAction; note?: string };
    if (!body.id || !body.action) {
      return NextResponse.json({ error: "缺少 id / action" }, { status: 400 });
    }
    const minLevel = body.action === "submit" ? 2 : 3;
    const denied = await requireApiMinLevel(minLevel);
    if (denied) return denied;

    const session = await getSession().catch(() => null);
    const proposal = await transitionProposal({
      id: body.id,
      action: body.action,
      actor: session?.email ?? null,
      note: body.note,
    });
    await logUsageEvent({
      action: "manual_edit_review",
      resource: "/api/fpa/edit-proposals",
      metadata: { op: body.action, id: proposal.id, status: proposal.status },
      request: req,
    });
    return NextResponse.json({ proposal });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "操作失败" }, { status: 400 });
  }
}
