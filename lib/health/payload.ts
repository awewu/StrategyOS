import { getCapabilityStatus } from "@/lib/capabilities";
import { prisma } from "@/lib/db";

export interface HealthPayload {
  status: "ok" | "degraded";
  mode: "demo" | "full";
  dataSource: "database" | "demo";
  capabilities: Awaited<ReturnType<typeof getCapabilityStatus>>;
  version: string;
  counts: Record<string, number>;
  notes: string[];
}

export async function buildHealthPayload(): Promise<HealthPayload> {
  const capabilities = await getCapabilityStatus();
  const db = capabilities.db.reachable;
  let counts: Record<string, number> = {};
  const notes: string[] = [];

  if (db) {
    const [diagnoses, cases, assertions] = await Promise.all([
      prisma.strategicDiagnosis.count(),
      prisma.investmentCase.count(),
      prisma.healthAssertion.count({ where: { active: true } }),
    ]);
    counts = { diagnoses, investmentCases: cases, activeAssertions: assertions };
  } else {
    notes.push("数据库未连通，页面数据来自 Demo 示例。");
  }

  if (!capabilities.workos.configured) {
    notes.push("WorkOS 未配置 — 使用 Demo 用户登录，属正常开发态。");
  }
  if (!capabilities.llm.configured) {
    notes.push("LLM 未配置 — Agent 自动回退 Rules 引擎。");
  }
  if (!capabilities.fonts.available) {
    notes.push("中文字体缺失 — 运行 npm run fonts:fetch。");
  }

  return {
    status: db ? "ok" : "degraded",
    mode: capabilities.mode,
    dataSource: db ? "database" : "demo",
    capabilities,
    version: "phase4",
    counts,
    notes,
  };
}

export function renderHealthHtml(payload: HealthPayload): string {
  const cap = payload.capabilities;
  const row = (label: string, ok: boolean, detail: string) =>
    `<tr><td>${label}</td><td class="${ok ? "ok" : "warn"}">${ok ? "正常" : "降级"}</td><td>${detail}</td></tr>`;

  const notes =
    payload.notes.length > 0
      ? `<ul>${payload.notes.map((n) => `<li>${n}</li>`).join("")}</ul>`
      : "<p class=\"muted\">全部能力正常，无降级说明。</p>";

  const counts =
    Object.keys(payload.counts).length > 0
      ? `<pre>${JSON.stringify(payload.counts, null, 2)}</pre>`
      : "<p class=\"muted\">无 DB 计数（demo 模式）</p>";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>StratOS · 系统健康</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }
    .badge.ok { background: #dcfce7; color: #166534; }
    .badge.degraded { background: #fef9c3; color: #854d0e; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e5e5e5; }
    th { color: #666; font-weight: 500; }
    td.ok { color: #166534; }
    td.warn { color: #854d0e; }
    .muted { color: #666; font-size: 0.9rem; }
    a { color: #2563eb; }
    pre { background: #f5f5f5; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; overflow: auto; }
  </style>
</head>
<body>
  <h1>StratOS 系统健康</h1>
  <p>
    <span class="badge ${payload.status === "ok" ? "ok" : "degraded"}">${payload.status === "ok" ? "OK" : "DEGRADED"}</span>
    &nbsp; mode: <strong>${payload.mode}</strong>
    &nbsp; data: <strong>${payload.dataSource}</strong>
    &nbsp; v${payload.version}
  </p>
  <table>
    <thead><tr><th>能力</th><th>状态</th><th>说明</th></tr></thead>
    <tbody>
      ${row("数据库", cap.db.reachable, cap.db.detail ?? "")}
      ${row("WorkOS SSO", cap.workos.configured, cap.workos.detail ?? "")}
      ${row("LLM Agent", cap.llm.configured, cap.llm.detail ?? "")}
      ${row("中文 PDF", cap.fonts.available, cap.fonts.detail ?? "")}
    </tbody>
  </table>
  <h2>说明</h2>
  ${notes}
  <h2>DB 计数</h2>
  ${counts}
  <p class="muted">
    JSON: <a href="/api/health?format=json">/api/health?format=json</a>
    · Harness: <a href="/api/harness">/api/harness</a>
    · 应用: <a href="/command">/command</a>
  </p>
</body>
</html>`;
}
