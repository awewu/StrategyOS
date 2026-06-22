/**
 * E2E smoke: compiler import → strategy plan / decode BSC alignment.
 * Run: npx tsx scripts/e2e-compiler-chain.ts
 * Requires dev server at localhost:3003 and DATABASE_URL.
 */
const BASE = process.env.STRATOS_BASE_URL ?? "http://localhost:3003";
const ORG = "org-group-rhautt";

const SAMPLE_TEXT = `
战略意图：2026-2028 投资驱动增长，聚焦热泵与渠道突破
北极星：2030 营收 25 亿，中国区热泵第一梯队

财务目标 O1：收入 +15% YoY
  KR1：2026 营收 6000 万
  KR2：ROS 11.2%

客户目标 O2：客户增长与 RUUD 渠道突破
  KR1：酒店签约 1200 家
  KR2：NPS ≥ 45

流程目标 O3：V4 平台 Q4 冻结上市
  KR1：Gate 全过

学习成长 O4：单王 5 人到位
  KR1：关键岗位 5/5
`;

type Step = { name: string; ok: boolean; detail: string };

const JSON_HEADERS = { Accept: "application/json", "Content-Type": "application/json" };

async function main() {
  const steps: Step[] = [];

  try {
    const health = await fetch(`${BASE}/api/health?format=json`, { headers: JSON_HEADERS });
    const body = await health.json();
    steps.push({
      name: "health",
      ok: health.ok && body.status === "ok",
      detail: health.ok ? `mode ${body.mode}` : `HTTP ${health.status}`,
    });
  } catch (e) {
    steps.push({ name: "health", ok: false, detail: String(e) });
    report(steps);
    process.exit(1);
  }

  const dryRes = await fetch(`${BASE}/api/compiler/import`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ rawText: SAMPLE_TEXT, dryRun: true }),
  });
  const dry = (await dryRes.json()) as {
    ok?: boolean;
    compiled?: { okrs?: unknown[]; bscRows?: unknown[] };
  };
  const compiledCount = (dry.compiled?.okrs?.length ?? 0) + (dry.compiled?.bscRows?.length ?? 0);
  steps.push({
    name: "compiler dryRun",
    ok: dryRes.ok && compiledCount > 0,
    detail: `okrs ${dry.compiled?.okrs?.length ?? 0} · bsc ${dry.compiled?.bscRows?.length ?? 0}`,
  });

  const persistRes = await fetch(`${BASE}/api/compiler/import`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ rawText: SAMPLE_TEXT, dryRun: false }),
  });
  const persisted = (await persistRes.json()) as { ok?: boolean; summary?: { planId?: string } };
  steps.push({
    name: "compiler persist",
    ok: persistRes.ok && !!persisted.ok,
    detail: persisted.summary?.planId ?? "no planId",
  });

  const planRes = await fetch(
    `${BASE}/api/strategy/plan?orgUnitId=${ORG}&horizonStart=2026&horizonEnd=2028`,
    { headers: JSON_HEADERS },
  );
  const plan = (await planRes.json()) as {
    objectives?: Array<{ objective: string; keyResults?: unknown[] }>;
  };
  const planObjectives = (plan.objectives ?? []).map((o) => o.objective).filter(Boolean);
  steps.push({
    name: "strategy plan API",
    ok: planRes.ok && planObjectives.some((o) => /收入|15%/.test(o)),
    detail: planObjectives.slice(0, 2).join(" | ") || "empty",
  });

  const bscRes = await fetch(`${BASE}/api/decode/bsc`, { headers: JSON_HEADERS });
  const bsc = (await bscRes.json()) as {
    source?: string;
    rows?: Array<{ objective: string; mustNotFail?: string }>;
  };
  const bscObjectives = (bsc.rows ?? []).map((r) => r.objective).filter(Boolean);
  const aligned =
    planObjectives.length > 0 &&
    bscObjectives.some((o) => planObjectives.some((p) => p.includes(o.slice(0, 6)) || o.includes(p.slice(0, 6))));
  steps.push({
    name: "decode BSC API",
    ok: bscRes.ok && bsc.source === "database" && bscObjectives.length >= 1,
    detail: `${bsc.source} · ${bscObjectives.slice(0, 2).join(" | ")} · aligned=${aligned}`,
  });

  const diffRes = await fetch(`${BASE}/api/diffs/compute`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: "{}",
  });
  steps.push({
    name: "versions diff compute",
    ok: diffRes.ok,
    detail: diffRes.ok ? "ok" : `HTTP ${diffRes.status}`,
  });

  const cmdRes = await fetch(`${BASE}/command`);
  steps.push({
    name: "command page",
    ok: cmdRes.ok && (await cmdRes.text()).includes("指挥舱"),
    detail: `HTTP ${cmdRes.status}`,
  });

  report(steps);
  const failed = steps.filter((s) => !s.ok);
  process.exit(failed.length > 0 ? 1 : 0);
}

function report(steps: Step[]) {
  console.log("\n── StratOS compiler chain E2E ──");
  for (const s of steps) {
    console.log(`  ${s.ok ? "✓" : "✗"} ${s.name}: ${s.detail}`);
  }
  console.log("");
}

main();
