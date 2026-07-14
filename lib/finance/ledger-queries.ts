import { dbAvailable, prisma } from "@/lib/db";

/**
 * 财务数据中台 · 查询层（/finance/ledger 页面消费）
 * 所有金额转 number 输出；DB 不可用时返回 available=false 空壳。
 */

export interface LedgerOverview {
  accounts: number;
  accountsUnmapped: number;
  departments: number;
  tbLines: number;
  glLines: number;
  opsFacts: number;
  periods: string[];
  glBalance: { period: string; debit: number; credit: number }[];
  batches: {
    id: string;
    sourceType: string;
    fileName: string;
    sheetName: string | null;
    period: string | null;
    rowCount: number;
    status: string;
    createdAt: Date;
  }[];
}

export interface TbDisplayRow {
  accountCode: string;
  accountName: string | null;
  accountType: string | null;
  usAccountCode: string | null;
  usAccountDesc: string | null;
  opening: number | null;
  debit: number | null;
  credit: number | null;
  closing: number;
}

export interface GlDisplayRow {
  entryDate: Date | null;
  journalNo: string | null;
  accountCode: string;
  accountName: string | null;
  dim1: string | null;
  drcr: string;
  amount: number;
  currency: string;
}

export interface AccountDisplayRow {
  code: string;
  name: string;
  accountType: string;
  usAccountCode: string | null;
  usAccountDesc: string | null;
  consolidateTo: string | null;
}

export interface DeptDisplayRow {
  code: string;
  name: string;
  usDeptCode: string | null;
  usDeptName: string | null;
  plLevelCode: string | null;
  plLevelName: string | null;
}

export interface FactDisplayRow {
  scenarioCode: string;
  scenarioName: string;
  scenarioKind: string;
  period: string;
  accountCode: string | null;
  metricCode: string | null;
  label: string | null;
  deptCode: string | null;
  productCode: string | null;
  channelCode: string | null;
  bridgeCode: string | null;
  currency: string;
  amount: number;
}

export interface ScenarioSummary {
  code: string;
  name: string;
  kind: string;
  factCount: number;
  total: number;
}

export interface BridgeWalkItem {
  bridgeCode: string;
  amount: number;
  cumulative: number;
}

export interface BridgeWalk {
  scenarioCode: string;
  scenarioName: string;
  scenarioKind: string;
  total: number;
  items: BridgeWalkItem[];
}

export interface PviProductRow {
  productName: string;
  category: string | null;
  channel: string | null;
  launchPeriod: string | null;
  total: number;
  months: number;
}

export interface PviBuGroup {
  businessUnit: string;
  productCount: number;
  total: number;
  products: PviProductRow[];
}

export interface OpsDisplayGroup {
  metricType: string;
  unit: string | null;
  facts: { period: string; dim1: string | null; dim2: string | null; value: number }[];
}

export interface LedgerBundle {
  available: boolean;
  overview: LedgerOverview;
  tbRows: TbDisplayRow[];
  glRows: GlDisplayRow[];
  accountRows: AccountDisplayRow[];
  deptRows: DeptDisplayRow[];
  opsGroups: OpsDisplayGroup[];
  factRows: FactDisplayRow[];
  scenarioSummaries: ScenarioSummary[];
  bridgeWalks: BridgeWalk[];
  pviGroups: PviBuGroup[];
}

const EMPTY_OVERVIEW: LedgerOverview = {
  accounts: 0,
  accountsUnmapped: 0,
  departments: 0,
  tbLines: 0,
  glLines: 0,
  opsFacts: 0,
  periods: [],
  glBalance: [],
  batches: [],
};

export const EMPTY_LEDGER_BUNDLE: LedgerBundle = {
  available: false,
  overview: EMPTY_OVERVIEW,
  tbRows: [],
  glRows: [],
  accountRows: [],
  deptRows: [],
  opsGroups: [],
  factRows: [],
  scenarioSummaries: [],
  bridgeWalks: [],
  pviGroups: [],
};

const num = (v: unknown): number => Number(v ?? 0);

async function getOverview(): Promise<LedgerOverview> {
  const [accounts, accountsUnmapped, departments, tbLines, glLines, opsFacts, batches, periodRows] =
    await Promise.all([
      prisma.ledgerAccount.count(),
      prisma.ledgerAccount.count({ where: { usAccountCode: null } }),
      prisma.ledgerDepartment.count(),
      prisma.ledgerTbLine.count(),
      prisma.ledgerGlLine.count(),
      prisma.opsMetricFact.count(),
      prisma.finImportBatch.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          sourceType: true,
          fileName: true,
          sheetName: true,
          period: true,
          rowCount: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.ledgerTbLine.findMany({
        distinct: ["period"],
        select: { period: true },
        orderBy: { period: "desc" },
      }),
    ]);

  const periods = periodRows.map((r) => r.period);
  const glBalance: LedgerOverview["glBalance"] = [];
  const glPeriods = await prisma.ledgerGlLine.findMany({
    distinct: ["period"],
    select: { period: true },
    orderBy: { period: "desc" },
  });
  for (const { period } of glPeriods) {
    const [dr, cr] = await Promise.all([
      prisma.ledgerGlLine.aggregate({ _sum: { amount: true }, where: { period, drcr: "dr" } }),
      prisma.ledgerGlLine.aggregate({ _sum: { amount: true }, where: { period, drcr: "cr" } }),
    ]);
    glBalance.push({ period, debit: num(dr._sum.amount), credit: num(cr._sum.amount) });
  }

  return { accounts, accountsUnmapped, departments, tbLines, glLines, opsFacts, periods, glBalance, batches };
}

/** 试算平衡：优先展示科目余额表形态（含期初/借/贷），按科目搜索 */
async function getTbRows(period: string | undefined, q: string | undefined): Promise<TbDisplayRow[]> {
  const rows = await prisma.ledgerTbLine.findMany({
    where: {
      ...(period ? { period } : {}),
      opening: { not: null },
      ...(q
        ? {
            OR: [
              { accountCode: { contains: q } },
              { account: { name: { contains: q } } },
              { account: { usAccountCode: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { account: true },
    orderBy: { accountCode: "asc" },
    take: 400,
  });
  return rows.map((r) => ({
    accountCode: r.accountCode,
    accountName: r.account?.name ?? null,
    accountType: r.account?.accountType ?? null,
    usAccountCode: r.account?.usAccountCode ?? null,
    usAccountDesc: r.account?.usAccountDesc ?? null,
    opening: r.opening == null ? null : num(r.opening),
    debit: r.debit == null ? null : num(r.debit),
    credit: r.credit == null ? null : num(r.credit),
    closing: num(r.closing),
  }));
}

async function getGlRows(period: string | undefined, q: string | undefined): Promise<GlDisplayRow[]> {
  const rows = await prisma.ledgerGlLine.findMany({
    where: {
      ...(period ? { period } : {}),
      ...(q
        ? {
            OR: [{ accountCode: { contains: q } }, { account: { name: { contains: q } } }],
          }
        : {}),
    },
    include: { account: true },
    orderBy: [{ amount: "desc" }],
    take: 200,
  });
  return rows.map((r) => ({
    entryDate: r.entryDate,
    journalNo: r.journalNo,
    accountCode: r.accountCode,
    accountName: r.account?.name ?? null,
    dim1: r.dim1,
    drcr: r.drcr,
    amount: num(r.amount),
    currency: r.currency,
  }));
}

async function getAccountRows(q: string | undefined): Promise<AccountDisplayRow[]> {
  const rows = await prisma.ledgerAccount.findMany({
    where: q
      ? {
          OR: [
            { code: { contains: q } },
            { name: { contains: q } },
            { usAccountCode: { contains: q } },
            { usAccountDesc: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { code: "asc" },
    take: 500,
  });
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    accountType: r.accountType,
    usAccountCode: r.usAccountCode,
    usAccountDesc: r.usAccountDesc,
    consolidateTo: r.consolidateTo,
  }));
}

async function getDeptRows(): Promise<DeptDisplayRow[]> {
  const rows = await prisma.ledgerDepartment.findMany({ orderBy: { code: "asc" } });
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    usDeptCode: r.usDeptCode,
    usDeptName: r.usDeptName,
    plLevelCode: r.plLevelCode,
    plLevelName: r.plLevelName,
  }));
}

async function getOpsGroups(): Promise<OpsDisplayGroup[]> {
  const rows = await prisma.opsMetricFact.findMany({
    orderBy: [{ metricType: "asc" }, { period: "asc" }, { dim1: "asc" }],
    take: 1000,
  });
  const groups = new Map<string, OpsDisplayGroup>();
  for (const r of rows) {
    let g = groups.get(r.metricType);
    if (!g) {
      g = { metricType: r.metricType, unit: r.unit, facts: [] };
      groups.set(r.metricType, g);
    }
    g.facts.push({ period: r.period, dim1: r.dim1, dim2: r.dim2, value: num(r.value) });
  }
  return [...groups.values()];
}

/** OneStream UD5 利润桥维度的展示顺序（P&L Walk 惯例：量→价→结构→降本→新品→举措→其他） */
const BRIDGE_ORDER = [
  "Volume",
  "Price",
  "Mix",
  "Inflation",
  "CIP",
  "New2Yr",
  "New5Yr",
  "StratInit1",
  "StratInit2",
  "StratInit3",
  "StratInit4",
  "Acquisition",
  "OtherBridge",
];

async function getBridgeWalks(): Promise<BridgeWalk[]> {
  const scenarios = await prisma.finScenario.findMany({ orderBy: { code: "asc" } });
  const walks: BridgeWalk[] = [];
  for (const s of scenarios) {
    const grouped = await prisma.finFactEntry.groupBy({
      by: ["bridgeCode"],
      _sum: { amount: true },
      where: {
        scenarioId: s.id,
        bridgeCode: { not: null },
        metricCode: { not: "Units" }, // 台数非金额，不进利润桥
      },
    });
    if (grouped.length === 0) continue;
    const byCode = new Map(grouped.map((g) => [g.bridgeCode as string, num(g._sum.amount)]));
    const codes = [
      ...BRIDGE_ORDER.filter((c) => byCode.has(c)),
      ...[...byCode.keys()].filter((c) => !BRIDGE_ORDER.includes(c)).sort(),
    ];
    let cumulative = 0;
    const items: BridgeWalkItem[] = codes.map((code) => {
      const amount = byCode.get(code) ?? 0;
      cumulative += amount;
      return { bridgeCode: code, amount, cumulative };
    });
    walks.push({
      scenarioCode: s.code,
      scenarioName: s.name,
      scenarioKind: s.kind,
      total: cumulative,
      items,
    });
  }
  return walks;
}

export async function getPviGroups(q?: string): Promise<PviBuGroup[]> {
  const rows = await prisma.pviSalesFact.findMany({
    where: q
      ? {
          OR: [
            { productName: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { businessUnit: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ businessUnit: "asc" }, { productName: "asc" }, { period: "asc" }],
  });
  const byBu = new Map<string, Map<string, PviProductRow>>();
  for (const r of rows) {
    let products = byBu.get(r.businessUnit);
    if (!products) {
      products = new Map();
      byBu.set(r.businessUnit, products);
    }
    let p = products.get(r.productName);
    if (!p) {
      p = {
        productName: r.productName,
        category: r.category,
        channel: r.channel,
        launchPeriod: r.launchPeriod,
        total: 0,
        months: 0,
      };
      products.set(r.productName, p);
    }
    p.total += num(r.amount);
    p.months += 1;
  }
  return [...byBu.entries()].map(([businessUnit, products]) => {
    const list = [...products.values()].sort((a, b) => b.total - a.total);
    return {
      businessUnit,
      productCount: list.length,
      total: list.reduce((s, p) => s + p.total, 0),
      products: list,
    };
  }).sort((a, b) => b.total - a.total);
}

async function getFactRows(q: string | undefined): Promise<FactDisplayRow[]> {
  const rows = await prisma.finFactEntry.findMany({
    where: q
      ? {
          OR: [
            { accountCode: { contains: q } },
            { metricCode: { contains: q, mode: "insensitive" } },
            { label: { contains: q, mode: "insensitive" } },
            { bridgeCode: { contains: q, mode: "insensitive" } },
            { productCode: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    include: { scenario: true },
    orderBy: [{ scenario: { code: "asc" } }, { period: "asc" }],
    take: 600,
  });
  return rows.map((r) => ({
    scenarioCode: r.scenario.code,
    scenarioName: r.scenario.name,
    scenarioKind: r.scenario.kind,
    period: r.period,
    accountCode: r.accountCode,
    metricCode: r.metricCode,
    label: r.label,
    deptCode: r.deptCode,
    productCode: r.productCode,
    channelCode: r.channelCode,
    bridgeCode: r.bridgeCode,
    currency: r.currency,
    amount: num(r.amount),
  }));
}

async function getScenarioSummaries(): Promise<ScenarioSummary[]> {
  const scenarios = await prisma.finScenario.findMany({ orderBy: { code: "asc" } });
  const out: ScenarioSummary[] = [];
  for (const s of scenarios) {
    const agg = await prisma.finFactEntry.aggregate({
      _count: { id: true },
      _sum: { amount: true },
      where: { scenarioId: s.id },
    });
    out.push({
      code: s.code,
      name: s.name,
      kind: s.kind,
      factCount: agg._count.id,
      total: num(agg._sum.amount),
    });
  }
  return out;
}

export async function getLedgerBundle(opts: {
  period?: string;
  q?: string;
}): Promise<LedgerBundle> {
  if (!(await dbAvailable())) return EMPTY_LEDGER_BUNDLE;
  const [overview, deptRows, opsGroups] = await Promise.all([
    getOverview(),
    getDeptRows(),
    getOpsGroups(),
  ]);
  const period = opts.period ?? overview.periods[0];
  const [tbRows, glRows, accountRows, factRows, scenarioSummaries] = await Promise.all([
    getTbRows(period, opts.q),
    getGlRows(period, opts.q),
    getAccountRows(opts.q),
    getFactRows(opts.q),
    getScenarioSummaries(),
  ]);
  const [bridgeWalks, pviGroups] = await Promise.all([getBridgeWalks(), getPviGroups(opts.q)]);
  return { available: true, overview, tbRows, glRows, accountRows, deptRows, opsGroups, factRows, scenarioSummaries, bridgeWalks, pviGroups };
}
