import Link from "next/link";
import { PrintButton } from "@/components/brand/PrintButton";
import { ChinaStrategyOnePager } from "@/components/strategy/ChinaStrategyOnePager";
import { GemPanel } from "@/components/gems/GemPanel";
import { KpiTile, SectionCard } from "@/components/ui/KpiTile";
import { PageHeader } from "@/components/ui/PageHeader";
import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import { getCommandDeckBundle, getManagementReport } from "@/lib/data/strategy-data";
import { getStrategyOnePagerForViewer } from "@/lib/strategy/one-pager-store";
import { buildTopAlerts } from "@/lib/panorama/scr";
import { getBoardMinutes, getBoardPackLock, getResolutionSignatures } from "@/lib/board/governance";
import { LockPackButton, SignResolutionButton } from "@/components/board/BoardActions";
import { getEffectiveSession, requireRouteAccess } from "@/lib/auth/guard";

export const metadata = { title: "董事会包 · StratOS" };

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

type Resolution = {
  id: string;
  title: string;
  resolution: string | null;
  ownerName: string | null;
  closedAt: string | null;
  status: string;
};

async function getResolutions(limit = 12): Promise<Resolution[]> {
  if (!(await dbAvailable())) return [];
  const rows = await prisma.inboxRecord.findMany({
    where: { status: { in: ["CLOSED", "ASSIGNED"] } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    resolution: r.resolution,
    ownerName: r.ownerName,
    closedAt: r.closedAt?.toISOString().slice(0, 10) ?? null,
    status: r.status,
  }));
}

/** 董事会包：已发布一页纸 · KPI 快照 · 决议记录 · 风险 — 全只读，可打印存 PDF */
export default async function BoardPackPage() {
  // 董事会包固定只读口径：无论谁看，都只展示已发布版本（observer 视角）
  await requireRouteAccess("/board");
  const [onePager, deck, mgmt, resolutions, activePeriod, session] = await Promise.all([
    getStrategyOnePagerForViewer("observer"),
    getCommandDeckBundle(),
    getManagementReport(),
    getResolutions(),
    getActivePeriod(),
    getEffectiveSession(),
  ]);
  const [lock, signatures, minutes] = await Promise.all([
    getBoardPackLock(activePeriod),
    getResolutionSignatures(resolutions.map((r) => r.id)),
    getBoardMinutes(),
  ]);
  const myEmail = session?.email ?? "";
  const kpis = mgmt.kpis;
  const alerts = buildTopAlerts(deck, 6);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="治理 · 只读快照"
        title="董事会包"
        subtitle={`战略主张 · 经营 KPI · 决议记录 · 风险 · ${activePeriod}`}
        actions={
          <>
            <LockPackButton />
            <PrintButton />
          </>
        }
      />

      <GemPanel />

      {lock ? (
        <p className="text-caption">
          ✓ 本期上会材料已锁定 · {lock.lockedBy} · {lock.lockedAt.slice(0, 10)} — 口径冻结，签署有效
        </p>
      ) : (
        <p className="text-caption text-[var(--signal-yellow-text)]">
          本期材料尚未锁定 — 数据仍在滚动更新，建议 CEO/CFO 锁定后再行签署
        </p>
      )}

      {/* ① 经营 KPI 快照 */}
      <SectionCard title="① 经营快照" subtitle={`B-A-F · ${activePeriod}`} accent="teal">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="ROS 销售净利率" value={pct(kpis.rosActual)} sub={`B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)}`} />
          <KpiTile label="EBITDA 利润率" value={pct(kpis.ebitdaMarginActual)} sub={`B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}`} />
          <KpiTile label="EBITDA" value={`${Math.round(kpis.ebitdaActual)} 万`} sub={`B ${Math.round(kpis.ebitdaBudget)} · F ${Math.round(kpis.ebitdaForecast)}`} tone="neutral" />
          <KpiTile
            label="现金 Runway"
            value={`${deck.fpa.cashRunwayMonths} 月`}
            sub="低于 3 月触发资本纪律"
            tone={deck.fpa.cashRunwayMonths < 3 ? "red" : "green"}
          />
        </div>
      </SectionCard>

      {/* ② 风险与预警 */}
      <SectionCard title="② 风险与预警" subtitle="指挥舱 Top 预警 · 治理关注项" accent="sky">
        {alerts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">当前无 critical/warning 预警。</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: a.severity === "critical" ? "var(--signal-red)" : "var(--signal-yellow)" }}
                />
                <span className="text-[var(--color-text-secondary)]">{a.message}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ③ 决议记录 */}
      <SectionCard title="③ 决议记录" subtitle="议题裁决沉淀 · 已议决 / 已指派" accent="green">
        {resolutions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">暂无决议记录。</p>
        ) : (
          <div className="stratos-table-wrap">
            <table className="stratos-table text-sm">
              <thead>
                <tr>
                  <th>议题</th>
                  <th>处置</th>
                  <th>责任人</th>
                  <th>日期</th>
                  <th>签署</th>
                </tr>
              </thead>
              <tbody>
                {resolutions.map((r) => {
                  const sigs = signatures.get(r.id) ?? [];
                  return (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.resolution ?? (r.status === "ASSIGNED" ? "已指派" : "已议决")}</td>
                      <td>{r.ownerName ?? "—"}</td>
                      <td>{r.closedAt ?? "—"}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          {sigs.map((s) => (
                            <span key={s.signedBy} className="text-xs text-[var(--signal-green-text)]" title={`签署于 ${s.signedAt}`}>
                              ✓ {s.signedBy.split("@")[0]}
                            </span>
                          ))}
                          <SignResolutionButton
                            recordId={r.id}
                            signedByMe={sigs.some((s) => s.signedBy === myEmail)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ④½ 会议纪要归档 */}
      <SectionCard title="④ 会议纪要归档" subtitle="MEETING_MINUTES · 只读" accent="sky">
        {minutes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">暂无归档纪要。纪要在报告中心以 MEETING_MINUTES 类型上传后自动归档到此。</p>
        ) : (
          <ul className="space-y-2">
            {minutes.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline gap-3 text-sm">
                <span className="text-[var(--color-text-primary)]">{m.title}</span>
                <span className="text-caption">{m.period} · 归档 {m.uploadedAt}</span>
                <span className="text-xs" style={{ color: m.approvalStatus === "APPROVED" ? "var(--signal-green-text)" : "var(--signal-yellow-text)" }}>
                  {m.approvalStatus === "APPROVED" ? "已审阅" : "待审阅"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ⑤ 战略一页纸（已发布版本） */}
      <SectionCard title="⑤ 战略一页纸" subtitle="已发布版本 · 只读" accent="violet">
        <ChinaStrategyOnePager initial={onePager} />
      </SectionCard>

      <p className="text-caption print:hidden">
        本页为只读治理快照 · 深入分析见{" "}
        <Link href="/strategy" className="text-[var(--color-accent)] hover:underline">一页纸</Link>
        {" · "}
        <Link href="/monitor/health" className="text-[var(--color-accent)] hover:underline">集团健康</Link>
      </p>
    </div>
  );
}
