/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic JSON round-trips */
/**
 * Persistence + data-flow closed-loop verifier.
 *
 * Logs in as the demo CEO, then for each editable slot performs a full-stack
 * round-trip: GET baseline → write a sentinel → GET again and assert the
 * sentinel persisted → restore the original value. Also exercises the
 * forward/return data-flow loop (FPA → runway sync → CashPosition →
 * HealthAssertion → Compass audit).
 *
 * Usage: BASE=http://localhost:3003 npx tsx scripts/verify-persistence.ts
 */

const BASE = process.env.BASE ?? "http://localhost:3003";
const CEO_EMAIL = process.env.CEO_EMAIL ?? "ceo@rheem.cn";
const TAG = `__verify_${Date.now()}`;
// Short code for VarChar(10) code/projectCode columns (<=10 chars).
const SHORT = `V${Date.now().toString().slice(-7)}`;

let cookie = "";

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

function record(name: string, ok: boolean, detail = "") {
  results.push({ name, ok, detail });
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${name}${detail ? ` · ${detail}` : ""}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiOnce(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json: json as any, text };
}

/** Retries transient dev-server (Turbopack) first-hit compile 500s. */
async function api(method: string, path: string, body?: unknown) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await apiOnce(method, path, body);
    const transient = r.status === 500 && /TURBOPACK|Invalid `/.test(r.text ?? "");
    if (!transient) return r;
    await sleep(900);
  }
  return apiOnce(method, path, body);
}

async function login() {
  const r = await api("POST", "/api/auth/login", { email: CEO_EMAIL });
  if (r.status !== 200) throw new Error(`login failed: ${r.status} ${JSON.stringify(r.json)}`);
  console.log(`logged in as ${CEO_EMAIL}\n`);
}

/** Config-style round-trip: GET → mutate(copy) → write → GET → check → restore. */
async function roundTripConfig(opts: {
  name: string;
  getPath: string;
  writePath?: string;
  method?: "PUT" | "POST";
  pick: (g: any) => any; // the original payload to send back on restore
  mutate: (g: any) => any; // body to write (with sentinel)
  check: (g2: any) => boolean; // verify sentinel present after re-GET
  restore: (original: any) => any; // body to restore
}) {
  const { name } = opts;
  try {
    const writePath = opts.writePath ?? opts.getPath;
    const method = opts.method ?? "PUT";
    const before = await api("GET", opts.getPath);
    if (before.status !== 200) return record(name, false, `GET ${before.status}`);
    const original = opts.pick(before.json);
    const writeBody = opts.mutate(structuredClone(before.json));
    const w = await api(method, writePath, writeBody);
    if (w.status !== 200) return record(name, false, `write ${w.status} ${JSON.stringify(w.json).slice(0, 120)}`);
    const after = await api("GET", opts.getPath);
    const ok = after.status === 200 && opts.check(after.json);
    // restore
    await api(method, writePath, opts.restore(original));
    record(name, ok, ok ? "save→read-back ✓ · restored" : `sentinel not persisted`);
  } catch (e) {
    record(name, false, e instanceof Error ? e.message : String(e));
  }
}

async function run() {
  await login();

  console.log("── 配置型可编辑槽位（GET→写入→读回→还原）──");

  await roundTripConfig({
    name: "fpa/period (财务期间)",
    getPath: "/api/fpa/period",
    pick: (g) => g.fpa,
    mutate: (g) => ({ fpa: { ...g.fpa, revenueForecast: 4242 } }),
    check: (g) => g?.fpa?.revenueForecast === 4242,
    restore: (orig) => ({ fpa: orig }),
  });

  await roundTripConfig({
    name: "fpa/outlook (五年展望)",
    getPath: "/api/fpa/outlook",
    pick: (g) => ({ fiveYearForecast: g.fiveYearForecast, sensitivityDrivers: g.sensitivityDrivers }),
    mutate: (g) => {
      const f = structuredClone(g.fiveYearForecast);
      f[0].revenueForecast = 4242;
      return { fiveYearForecast: f, sensitivityDrivers: g.sensitivityDrivers };
    },
    check: (g) => g?.fiveYearForecast?.[0]?.revenueForecast === 4242,
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "fpa/capital-config (资本配置)",
    getPath: "/api/fpa/capital-config",
    pick: (g) => ({ realOptions: g.realOptions, postInvestDeviations: g.postInvestDeviations }),
    mutate: (g) => {
      const ro = structuredClone(g.realOptions);
      ro[0].nextCommitAmount = 4242;
      return { realOptions: ro, postInvestDeviations: g.postInvestDeviations };
    },
    check: (g) => g?.realOptions?.[0]?.nextCommitAmount === 4242,
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "decode/bsc (BSC 解码)",
    getPath: "/api/decode/bsc",
    pick: (g) => ({ rows: g.rows }),
    mutate: (g) => {
      const rows = structuredClone(g.rows);
      rows[0].mustWin = `${rows[0].mustWin} ${TAG}`;
      return { rows };
    },
    check: (g) => typeof g?.rows?.[0]?.mustWin === "string" && g.rows[0].mustWin.includes(TAG),
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "spbp/scenarios (情景)",
    getPath: "/api/spbp/scenarios",
    pick: (g) => ({ scenarios: g.scenarios }),
    mutate: (g) => {
      const s = structuredClone(g.scenarios);
      s[0].drivers = [...(s[0].drivers ?? []), TAG];
      return { scenarios: s };
    },
    check: (g) => Array.isArray(g?.scenarios?.[0]?.drivers) && g.scenarios[0].drivers.includes(TAG),
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "gates (门禁清单)",
    getPath: "/api/gates",
    pick: (g) => ({ checklists: g.checklists }),
    mutate: (g) => {
      const c = structuredClone(g.checklists);
      c[0].items[0].note = TAG;
      return { checklists: c };
    },
    check: (g) => g?.checklists?.[0]?.items?.[0]?.note === TAG,
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "stacks (资本栈 capStack)",
    getPath: "/api/stacks",
    pick: (g) => ({ capStack: g.capStack }),
    mutate: (g) => {
      const capStack = structuredClone(g.capStack);
      capStack.cashPeakMonth = "2099-12";
      return { capStack };
    },
    check: (g) => g?.capStack?.cashPeakMonth === "2099-12",
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "culture/handbook (文化手册)",
    getPath: "/api/culture/handbook",
    pick: (g) => ({ handbook: g.handbook }),
    mutate: (g) => {
      const handbook = structuredClone(g.handbook);
      handbook.doctrines[0].hint = `${handbook.doctrines[0].hint} ${TAG}`;
      return { handbook };
    },
    check: (g) => typeof g?.handbook?.doctrines?.[0]?.hint === "string" && g.handbook.doctrines[0].hint.includes(TAG),
    restore: (orig) => orig,
  });

  await roundTripConfig({
    name: "strategy/one-pager (战略一页纸)",
    getPath: "/api/strategy/one-pager",
    pick: (g) => ({ content: g.content }),
    mutate: (g) => ({ content: { ...g.content, periodLabel: TAG } }),
    check: (g) => g?.content?.periodLabel === TAG,
    restore: (orig) => orig,
  });

  // command/decisions: starts "derived" (null). Write then reset.
  try {
    const name = "command/decisions (命令决策)";
    const sample = [{ id: "d-verify", title: TAG, owner: "verify", status: "open", crux: "verify" }];
    const w = await api("PUT", "/api/command/decisions", { decisions: sample });
    const after = await api("GET", "/api/command/decisions");
    const ok = w.status === 200 && JSON.stringify(after.json).includes(TAG);
    await api("PUT", "/api/command/decisions", { reset: "decisions" });
    record(name, ok, ok ? "save→read-back ✓ · reset" : `status ${w.status}`);
  } catch (e) {
    record("command/decisions (命令决策)", false, e instanceof Error ? e.message : String(e));
  }

  // execution/scoreboard: GET returns a resolved view, so verify the source
  // flips off "derived" once a config is persisted.
  try {
    const name = "execution/scoreboard (记分牌)";
    const cfg = { wigObjectiveId: null, leadingKrIds: [], laggingKrIds: [] };
    const w = await api("PUT", "/api/execution/scoreboard", { config: cfg });
    const after = await api("GET", "/api/execution/scoreboard");
    const src = after.json?.source ?? after.json?.configSource;
    const ok = w.status === 200 && src !== "derived";
    await api("PUT", "/api/execution/scoreboard", { reset: true });
    record(name, ok, ok ? `save→read-back ✓ (source=${src}) · reset` : `status ${w.status} src=${src} ${JSON.stringify(w.json).slice(0,80)}`);
  } catch (e) {
    record("execution/scoreboard (记分牌)", false, e instanceof Error ? e.message : String(e));
  }

  console.log("\n── 列表型可编辑槽位（新增→读回→删除）──");
  await listRoundTrip({
    name: "mandate (战略职责)",
    createBody: { code: SHORT, title: TAG, status: "ACTIVE" },
    idFrom: (r) => r.mandate?.id ?? r.id,
    listPath: null, // no GET API; read path is the server component
    createResponseContains: (r) => Boolean(r.mandate?.id) && r.mandate?.title === TAG,
    listContains: () => false,
    createPath: "/api/mandate",
    deletePath: (id) => `/api/mandate?id=${id}`,
  });

  await listRoundTrip({
    name: "execution/maturity (项目成熟度)",
    createBody: { projectCode: SHORT, projectName: TAG },
    idFrom: (r) => r.maturity?.id ?? r.id,
    listPath: "/api/execution/maturity",
    listContains: (list) => JSON.stringify(list).includes(TAG),
    createPath: "/api/execution/maturity",
    deletePath: (id) => `/api/execution/maturity?id=${id}`,
  });

  await listRoundTrip({
    name: "execution/tension (执行张力)",
    createBody: { projectCode: SHORT, projectName: TAG, tensionType: "capability", signal: TAG },
    idFrom: (r) => r.tension?.id ?? r.id,
    listPath: "/api/execution/tension",
    listContains: (list) => JSON.stringify(list).includes(TAG),
    createPath: "/api/execution/tension",
    deletePath: (id) => `/api/execution/tension?id=${id}`,
  });

  await listRoundTrip({
    name: "execution/market-evidence (市场证据)",
    createBody: { actionLabel: TAG, evidenceText: TAG },
    idFrom: (r) => r.evidence?.id ?? r.id,
    listPath: "/api/execution/market-evidence",
    listContains: (list) => JSON.stringify(list).includes(TAG),
    createPath: "/api/execution/market-evidence",
    deletePath: (id) => `/api/execution/market-evidence?id=${id}`,
  });

  console.log("\n── 数据流闭环（正向→回流）──");
  await closedLoopRunway();

  // summary
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n${"═".repeat(48)}`);
  console.log(`Persistence verify: ${pass} pass · ${fail} fail · ${results.length} total`);
  if (fail > 0) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => !x.ok)) console.log(`  ✗ ${r.name} — ${r.detail}`);
    process.exit(1);
  }
  console.log("ALL PERSISTENCE CHECKS PASSED");
}

async function listRoundTrip(opts: {
  name: string;
  createBody: unknown;
  createPath: string;
  idFrom: (r: any) => string | undefined;
  listPath: string | null;
  listContains: (list: any) => boolean;
  createResponseContains?: (r: any) => boolean;
  deletePath: (id: string) => string;
}) {
  try {
    const c = await api("POST", opts.createPath, opts.createBody);
    if (c.status !== 200) return record(opts.name, false, `create ${c.status} ${JSON.stringify(c.json).slice(0, 120)}`);
    const id = opts.idFrom(c.json);
    let ok: boolean;
    let how: string;
    if (opts.listPath == null) {
      // No GET API: the persisted row returned by the create call (generated
      // UUID id) is the proof of a DB write.
      ok = Boolean(opts.createResponseContains?.(c.json));
      how = "create-response (persisted row)";
    } else {
      const list = await api("GET", opts.listPath);
      ok = list.status === 200 && opts.listContains(list.json);
      how = "read-back";
    }
    if (id) await api("DELETE", opts.deletePath(id));
    record(opts.name, ok, ok ? `create→${how} ✓ · deleted` : `not persisted (${how})`);
  } catch (e) {
    record(opts.name, false, e instanceof Error ? e.message : String(e));
  }
}

async function closedLoopRunway() {
  try {
    // Forward: sync-runway derives runway from the company FPA and persists a
    // CashPosition + HealthAssertion (it does not accept an injected value).
    const sync = await api("POST", "/api/fpa/sync-runway");
    if (sync.status !== 200) return record("closed-loop: fpa→runway 同步", false, `sync ${sync.status}`);
    const R = Number(sync.json?.runwayMonths);
    record("closed-loop: fpa→runway 同步", Number.isFinite(R), `runway=${R}`);

    // Return flow #1: the persisted CashPosition is what fpa/period reads back.
    const period = await api("GET", "/api/fpa/period");
    const back = Number(period.json?.fpa?.cashRunwayMonths);
    record(
      "closed-loop: runway→CashPosition→fpa/period 回流一致",
      Math.abs(back - R) < 1e-6,
      `sync=${R} · readback=${back}`,
    );

    // Return flow #2: idempotent — re-running yields the same persisted runway.
    const sync2 = await api("POST", "/api/fpa/sync-runway");
    record(
      "closed-loop: 同步幂等（再次同步一致）",
      Math.abs(Number(sync2.json?.runwayMonths) - R) < 1e-6,
      `again=${sync2.json?.runwayMonths}`,
    );

    // Return flow #3: compass audit reachable (health/runway feeds premise audit).
    const compass = await api("GET", "/api/compass/northstar");
    record("closed-loop: runway→compass 审计可达", compass.status === 200, `compass GET ${compass.status}`);
  } catch (e) {
    record("closed-loop: fpa→runway→health", false, e instanceof Error ? e.message : String(e));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
