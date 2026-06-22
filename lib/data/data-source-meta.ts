/**
 * Data source freshness and staleness metadata for global banner.
 */
import { prisma } from "@/lib/db";
import { getDataSource } from "@/lib/data/strategy-data";

export type DataSourceSignal = "green" | "yellow" | "red";

export interface DataSourceMeta {
  source: "database" | "demo";
  signal: DataSourceSignal;
  lastUpdates: Record<string, string | null>;
  staleItems: string[];
  message: string;
}

const STALE_DAYS_STRATEGIC = 30;
const STALE_DAYS_OPERATIONAL = 7;

function formatDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function daysSince(d: Date | null): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export async function getDataSourceMeta(): Promise<DataSourceMeta> {
  const source = await getDataSource();
  if (source === "demo") {
    return {
      source: "demo",
      signal: "red",
      lastUpdates: {},
      staleItems: [],
      message: "当前使用演示数据，请勿用于战略会决策",
    };
  }

  const period = await prisma.systemSetting.findUnique({ where: { key: "active_period" } });

  const [
    diagnosis,
    fpaPeriod,
    latestIc,
    latestProject,
    latestReport,
    latestAssertion,
  ] = await Promise.all([
    prisma.strategicDiagnosis.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.fpaPeriod.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.investmentCase.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.project.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.report.findFirst({ orderBy: { uploadedAt: "desc" } }),
    prisma.healthAssertion.findFirst({ orderBy: { triggeredAt: "desc" } }),
  ]);

  const lastUpdates: Record<string, string | null> = {
    activePeriod: period?.value ?? null,
    diagnosis: formatDate(diagnosis?.updatedAt ?? null),
    fpa: formatDate(fpaPeriod?.updatedAt ?? null),
    investmentCase: formatDate(latestIc?.updatedAt ?? null),
    project: formatDate(latestProject?.updatedAt ?? null),
    report: formatDate(latestReport?.uploadedAt ?? null),
    healthAssertion: formatDate(latestAssertion?.triggeredAt ?? null),
  };

  const staleItems: string[] = [];
  if ((daysSince(diagnosis?.updatedAt ?? null) ?? 0) > STALE_DAYS_STRATEGIC) {
    staleItems.push("诊断");
  }
  if ((daysSince(fpaPeriod?.updatedAt ?? null) ?? 0) > STALE_DAYS_OPERATIONAL) {
    staleItems.push("FPA");
  }
  if ((daysSince(latestProject?.updatedAt ?? null) ?? 0) > STALE_DAYS_OPERATIONAL) {
    staleItems.push("项目");
  }
  if ((daysSince(latestReport?.uploadedAt ?? null) ?? 0) > STALE_DAYS_OPERATIONAL) {
    staleItems.push("报告");
  }

  const signal: DataSourceSignal =
    staleItems.length >= 2 ? "red" : staleItems.length === 1 ? "yellow" : "green";

  const message =
    signal === "red"
      ? `多项核心数据超过更新阈值：${staleItems.join("、")}`
      : signal === "yellow"
        ? `${staleItems[0]} 数据较旧，建议更新`
        : "数据来自数据库，核心表近期有更新";

  return { source, signal, lastUpdates, staleItems, message };
}
