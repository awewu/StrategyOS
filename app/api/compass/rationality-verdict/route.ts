/**
 * 季度战略"合理性审视"裁决 API
 * ─────────────────────────────────
 * GET   ?period=  列出某期次(默认当前期)已留痕的裁决 (AI 建议 + 人工决策)
 * POST  { persist? } 组装本地战略摘要 → 调 Tandem 中央 AI 求裁决建议 → (可选)落库留痕 → 返回裁决
 *        Hermes 未配置/失败时优雅降级为本地规则引擎, 保证 UI 始终有可展示的研判。
 * PATCH { id, humanDecision, humanRationale } 记录人工最终裁决 (坚守/pivot/kill) 留痕
 *
 * 纪律: AI 裁决是"建议", 人工决策才是最终留痕。kill/pivot 的最终裁决由人在此确认。
 */
import { NextResponse } from "next/server";
import { prisma, dbAvailable } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getActivePeriod } from "@/lib/data/active-period";
import { buildStrategyDigest, type StrategyDigest } from "@/lib/stratos/strategy-digest";

export const runtime = "nodejs";

type Recommendation = "persevere" | "pivot" | "kill" | "mixed";

interface VerdictItem {
  code: string;
  recommendation: Recommendation;
  severity?: string;
  rationale: string;
}
interface StrategyVerdict {
  overallStance: Recommendation;
  crux: string;
  summary: string;
  premises: VerdictItem[];
  bets: VerdictItem[];
  source: "central-ai" | "local-fallback";
  model?: string;
}

/** 调 Tandem 中央 AI 裁决端点 (反向桥)。未配置/失败 → null, 交给本地降级。 */
async function requestCentralAiVerdict(
  digest: StrategyDigest,
): Promise<{ verdict: unknown; model?: string } | null> {
  const url = process.env.HERMES_VERDICT_URL?.trim();
  const token = process.env.HERMES_VERDICT_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(digest),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; verdict?: unknown; model?: string };
    if (!data.ok || !data.verdict) return null;
    return { verdict: data.verdict, model: data.model };
  } catch {
    return null;
  }
}

/** 本地规则引擎降级: Hermes 不可用时, 从摘要给出保守研判 (克制, 不轻言 kill)。 */
function localFallbackVerdict(digest: StrategyDigest): StrategyVerdict {
  const premises: VerdictItem[] = digest.fragilePremises.map((p) => {
    let recommendation: Recommendation = "persevere";
    let rationale = `脆弱性 ${p.fragility}% · 置信度 ${p.confidence}%`;
    if (p.failSignal) {
      recommendation = p.confidence <= 30 && p.fragility >= 90 ? "kill" : "pivot";
      rationale = `已出现失效信号: ${p.failSignal}${p.signalSource ? ` (${p.signalSource})` : ""}`;
    } else if (p.fragility >= 85 && p.confidence < 50) {
      recommendation = "pivot";
      rationale = `高脆弱性(${p.fragility}%)且置信度不足(${p.confidence}%), 建议重新检验打法`;
    }
    return { code: p.code, recommendation, severity: p.fragility >= 85 ? "high" : "medium", rationale };
  });

  const bets: VerdictItem[] = digest.bets
    .filter((b) => b.gateStatus === "review" || b.gateStatus === "rejected" || b.fpaToggle === "off")
    .map((b) => ({
      code: b.code,
      recommendation: b.gateStatus === "rejected" ? "kill" : "pivot",
      rationale: `门禁=${b.gateStatus} · FPA=${b.fpaToggle} · CapEx=${b.capexTotal}`,
    }));

  const runwayRed = digest.fpa.cashRunwayMonths > 0 && digest.fpa.cashRunwayMonths < 3;
  const hasKill = premises.some((p) => p.recommendation === "kill") || bets.some((b) => b.recommendation === "kill");
  const hasPivot = premises.some((p) => p.recommendation === "pivot") || bets.some((b) => b.recommendation === "pivot");
  const overallStance: Recommendation = hasKill ? "mixed" : hasPivot ? "pivot" : "persevere";

  return {
    overallStance,
    crux: digest.diagnosis.crux || digest.diagnosis.challengeStatement || "战略合理性待审视",
    summary:
      `本地规则研判(中央 AI 未接入): ${digest.counts.fragilePremises} 条脆弱前提、` +
      `${digest.hardBlocks.length} 条硬阻断${runwayRed ? `、现金 runway 仅 ${digest.fpa.cashRunwayMonths} 月(低于安全线)` : ""}。` +
      `建议对上述条目逐条人工复核。`,
    premises,
    bets,
    source: "local-fallback",
  };
}

/** 把中央 AI 返回的 verdict (unknown) 归一成 StrategyVerdict; 解析不出则回退本地。 */
function normalizeVerdict(raw: unknown, model: string | undefined, digest: StrategyDigest): StrategyVerdict {
  const v = raw as Partial<StrategyVerdict> | null;
  if (!v || typeof v !== "object") return localFallbackVerdict(digest);
  const okRec = (r: unknown): Recommendation =>
    r === "pivot" || r === "kill" || r === "mixed" || r === "persevere" ? r : "persevere";
  const items = (arr: unknown): VerdictItem[] =>
    Array.isArray(arr)
      ? arr
          .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
          .map((x) => ({
            code: String(x.code ?? ""),
            recommendation: okRec(x.recommendation),
            severity: typeof x.severity === "string" ? x.severity : undefined,
            rationale: String(x.rationale ?? ""),
          }))
      : [];
  return {
    overallStance: okRec(v.overallStance),
    crux: typeof v.crux === "string" ? v.crux : digest.diagnosis.crux,
    summary: typeof v.summary === "string" ? v.summary : "",
    premises: items(v.premises),
    bets: items(v.bets),
    source: "central-ai",
    model,
  };
}

/** 把 AI 建议落库留痕 (保留已有人工决策)。 */
async function persistAiVerdict(period: string, verdict: StrategyVerdict, digest: StrategyDigest): Promise<void> {
  const now = new Date();
  const premiseLabel = new Map(digest.fragilePremises.map((p) => [p.code, p.premise]));
  const betLabel = new Map(digest.bets.map((b) => [b.code, b.title]));

  const rows: Array<{ targetKind: string; targetCode: string | null; targetLabel: string | null; rec: string; rationale: string }> = [
    { targetKind: "overall", targetCode: null, targetLabel: verdict.crux, rec: verdict.overallStance, rationale: verdict.summary },
    ...verdict.premises.map((p) => ({
      targetKind: "premise",
      targetCode: p.code,
      targetLabel: premiseLabel.get(p.code) ?? null,
      rec: p.recommendation,
      rationale: p.rationale,
    })),
    ...verdict.bets.map((b) => ({
      targetKind: "bet",
      targetCode: b.code,
      targetLabel: betLabel.get(b.code) ?? null,
      rec: b.recommendation,
      rationale: b.rationale,
    })),
  ];

  for (const r of rows) {
    const existing = await prisma.rationalityVerdict.findFirst({
      where: { period, targetKind: r.targetKind, targetCode: r.targetCode },
    });
    const aiData = {
      targetLabel: r.targetLabel,
      aiRecommendation: r.rec,
      aiRationale: r.rationale,
      aiModel: verdict.model ?? verdict.source,
      aiGeneratedAt: now,
    };
    if (existing) {
      await prisma.rationalityVerdict.update({ where: { id: existing.id }, data: aiData });
    } else {
      await prisma.rationalityVerdict.create({
        data: { period, targetKind: r.targetKind, targetCode: r.targetCode, ...aiData },
      });
    }
  }
}

export async function GET(req: Request) {
  if (!(await dbAvailable())) return NextResponse.json({ ok: true, period: null, verdicts: [] });
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? (await getActivePeriod());
  const verdicts = await prisma.rationalityVerdict.findMany({
    where: { period },
    orderBy: [{ targetKind: "asc" }, { targetCode: "asc" }],
  });
  return NextResponse.json({ ok: true, period, verdicts });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { persist?: boolean; period?: string };
  const period = body.period ?? (await getActivePeriod());

  const digest = await buildStrategyDigest();
  const ai = await requestCentralAiVerdict(digest);
  const verdict = ai ? normalizeVerdict(ai.verdict, ai.model, digest) : localFallbackVerdict(digest);

  let persisted = false;
  if (body.persist !== false && (await dbAvailable())) {
    try {
      await persistAiVerdict(period, verdict, digest);
      persisted = true;
    } catch {
      persisted = false;
    }
  }

  return NextResponse.json({ ok: true, period, digest, verdict, persisted });
}

export async function PATCH(req: Request) {
  if (!(await dbAvailable())) return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    humanDecision?: string;
    humanRationale?: string;
    governanceRef?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const decision = body.humanDecision;
  if (decision && !["persevere", "pivot", "kill"].includes(decision)) {
    return NextResponse.json({ error: "invalid humanDecision" }, { status: 400 });
  }

  const session = await getSession();
  const row = await prisma.rationalityVerdict.update({
    where: { id: body.id },
    data: {
      humanDecision: decision ?? null,
      humanRationale: body.humanRationale ?? null,
      decidedBy: session ? `${session.name} <${session.email}>` : "unknown",
      decidedAt: new Date(),
      governanceRef: body.governanceRef ?? undefined,
    },
  });
  return NextResponse.json({ ok: true, verdict: row });
}
