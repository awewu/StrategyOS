/**
 * 财务数据中台 · OneStream 管道解析器（纯函数层）
 *
 * 输入统一为 sheet_to_json(header:1) 的二维数组（unknown[][]），
 * 输出为可直接落库的结构化行。所有函数无 IO、可单测。
 *
 * 源表形态（来自 Rheem China 真实工作簿）：
 * - 科目映射: 帐户/说明/帐户类型/…/合并到帐户/中方会计科目/美国会计科目/美国会计科目描述
 * - 部门映射: 单位码/单位码/说明/…/Department/New P&L/Level 0 - New #/Dept Description
 * - 科目余额表: 帐户/帐户说明/…/本币期初/本币借方发生/本币贷方发生/本币期末
 * - Oracle 段 TB: [日期, BSV, BSV, 会计科目, 单位码1-4, 项目, 项目, 余额]（无表头或首行即表头）
 * - GL 明细: [实体, 凭证号, 日期, 币种, _, DR/CR, _, BSV, BSV, 科目, 单位码1-4, 项目, 项目, 借方, 贷方]
 * - 表单导出: Headcount / Units Shipped（行=类别或产品, 列=统计口径或渠道）/ CapEx（列=月份）
 */

export type Cell = unknown;
export type Row = Cell[];

export type LedgerAccountTypeCode =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense"
  | "cost"
  | "other";

export interface AccountMapRow {
  code: string;
  name: string;
  accountType: LedgerAccountTypeCode;
  usAccountCode: string | null;
  usAccountDesc: string | null;
  consolidateTo: string | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
}

export interface DeptMapRow {
  code: string;
  name: string;
  usDeptCode: string | null;
  usDeptName: string | null;
  plLevelCode: string | null;
  plLevelName: string | null;
}

export interface TbLineRow {
  period: string;
  asOfDate: Date | null;
  entityCode: string;
  accountCode: string;
  dim1: string | null;
  dim2: string | null;
  dim3: string | null;
  dim4: string | null;
  opening: number | null;
  debit: number | null;
  credit: number | null;
  closing: number;
}

export interface GlLineRow {
  period: string;
  entryDate: Date | null;
  journalNo: string | null;
  entityCode: string;
  accountCode: string;
  dim1: string | null;
  dim2: string | null;
  dim3: string | null;
  dim4: string | null;
  currency: string;
  drcr: "dr" | "cr";
  amount: number;
}

export interface OpsFactRow {
  period: string;
  dim1: string | null;
  dim2: string | null;
  value: number;
}

// ---------- 基础工具 ----------

export function str(cell: Cell): string {
  return String(cell ?? "").trim();
}

/** 解析金额："25,945,000.34" / "(288.0)" / "$119.9" / "-" / "" */
export function parseNum(cell: Cell): number | null {
  if (cell == null || cell === "") return null;
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  let s = String(cell).trim();
  if (!s || s === "-" || s === "N/A") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$￥,%\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** "Dec 2024" / "2024M12" / "31-Dec-2024" / "2024-12" → "2024-12"；识别失败返回 null */
export function parsePeriod(cell: Cell): string | null {
  const s = str(cell);
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return s;
  m = s.match(/^(\d{4})M(\d{1,2})$/i);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = s.match(/^([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    return mm ? `${m[2]}-${mm}` : null;
  }
  m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m) {
    const mm = MONTHS[m[2].toLowerCase()];
    return mm ? `${m[3]}-${mm}` : null;
  }
  m = s.match(/^([A-Za-z]{3})-(\d{2})$/); // "Jun-24"（PVI Launch Date）
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    return mm ? `20${m[2]}-${mm}` : null;
  }
  return null;
}

/** "31-Dec-2024" / Date / "6/22/14" → Date（UTC 零点）；识别失败返回 null */
export function parseDateCell(cell: Cell): Date | null {
  if (cell instanceof Date) return cell;
  const s = str(cell);
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmy) {
    const mm = MONTHS[dmy[2].toLowerCase()];
    if (!mm) return null;
    return new Date(`${dmy[3]}-${mm}-${dmy[1].padStart(2, "0")}T00:00:00Z`);
  }
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const yr = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return new Date(`${yr}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}T00:00:00Z`);
  }
  return null;
}

export function mapAccountType(raw: Cell): LedgerAccountTypeCode {
  const s = str(raw);
  if (s.includes("资产")) return "asset";
  if (s.includes("负债")) return "liability";
  if (s.includes("权益")) return "equity";
  if (s.includes("收入")) return "revenue";
  if (s.includes("成本")) return "cost";
  if (s.includes("费用") || s.includes("损益")) return "expense";
  return "other";
}

function findHeaderRow(rows: Row[], mustInclude: string[]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map((c) => str(c));
    if (mustInclude.every((k) => cells.some((c) => c.includes(k)))) return i;
  }
  return -1;
}

function colIndex(header: Row, ...names: string[]): number {
  const cells = header.map((c) => str(c).toLowerCase().replace(/\s+/g, ""));
  for (const name of names) {
    const key = name.toLowerCase().replace(/\s+/g, "");
    const exact = cells.findIndex((c) => c === key);
    if (exact >= 0) return exact;
  }
  for (const name of names) {
    const key = name.toLowerCase().replace(/\s+/g, "");
    const partial = cells.findIndex((c) => c.includes(key));
    if (partial >= 0) return partial;
  }
  return -1;
}

function orNull(cell: Cell): string | null {
  const s = str(cell);
  return s ? s : null;
}

// ---------- 1. 科目映射 ----------

export function parseAccountMap(rows: Row[]): AccountMapRow[] {
  const h = findHeaderRow(rows, ["帐户", "说明"]);
  if (h < 0) throw new Error("未识别到科目映射表头（需含: 帐户 / 说明）");
  const header = rows[h];
  const cCode = colIndex(header, "帐户");
  const cName = colIndex(header, "说明");
  const cType = colIndex(header, "帐户类型");
  const cFrom = colIndex(header, "生效日期");
  const cTo = colIndex(header, "失效日期");
  const cCons = colIndex(header, "合并到帐户");
  const cUs = colIndex(header, "美国会计科目");
  const cUsDesc = colIndex(header, "美国会计科目描述");

  const out: AccountMapRow[] = [];
  const seen = new Set<string>();
  for (let i = h + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = str(row[cCode]);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      name: str(row[cName]) || code,
      accountType: cType >= 0 ? mapAccountType(row[cType]) : "other",
      usAccountCode: cUs >= 0 ? orNull(row[cUs]) : null,
      usAccountDesc: cUsDesc >= 0 ? orNull(row[cUsDesc]) : null,
      consolidateTo: cCons >= 0 ? orNull(row[cCons]) : null,
      effectiveFrom: cFrom >= 0 ? parseDateCell(row[cFrom]) : null,
      effectiveTo: cTo >= 0 ? parseDateCell(row[cTo]) : null,
    });
  }
  if (out.length === 0) throw new Error("科目映射表无数据行");
  return out;
}

// ---------- 2. 部门映射 ----------

export function parseDeptMap(rows: Row[]): DeptMapRow[] {
  const h = findHeaderRow(rows, ["单位码", "说明"]);
  if (h < 0) throw new Error("未识别到部门映射表头（需含: 单位码 / 说明）");
  const header = rows[h];
  const cCode = colIndex(header, "单位码");
  const cName = colIndex(header, "说明");
  const cUsDept = colIndex(header, "Department");
  const cUsDeptName = colIndex(header, "New P&L");
  const cLevel = colIndex(header, "Level 0 - New #", "Level0");
  const cLevelName = colIndex(header, "Dept Description");

  const out: DeptMapRow[] = [];
  const seen = new Set<string>();
  for (let i = h + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = str(row[cCode]);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      name: str(row[cName]) || code,
      usDeptCode: cUsDept >= 0 ? orNull(row[cUsDept]) : null,
      usDeptName: cUsDeptName >= 0 ? orNull(row[cUsDeptName]) : null,
      plLevelCode: cLevel >= 0 ? orNull(row[cLevel]) : null,
      plLevelName: cLevelName >= 0 ? orNull(row[cLevelName]) : null,
    });
  }
  if (out.length === 0) throw new Error("部门映射表无数据行");
  return out;
}

// ---------- 3. 科目余额表（本币期初/借/贷/期末） ----------

export function parseBalanceSheet(rows: Row[], period: string): TbLineRow[] {
  const h = findHeaderRow(rows, ["帐户", "本币期末"]);
  if (h < 0) throw new Error("未识别到科目余额表头（需含: 帐户 / 本币期末）");
  const header = rows[h];
  const cCode = colIndex(header, "帐户");
  const cOpen = colIndex(header, "本币期初");
  const cDr = colIndex(header, "本币借方发生", "本币借方");
  const cCr = colIndex(header, "本币贷方发生", "本币贷方");
  const cClose = colIndex(header, "本币期末");

  const out: TbLineRow[] = [];
  for (let i = h + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = str(row[cCode]);
    if (!code) continue;
    const closing = parseNum(row[cClose]);
    out.push({
      period,
      asOfDate: null,
      entityCode: "590",
      accountCode: code,
      dim1: null,
      dim2: null,
      dim3: null,
      dim4: null,
      opening: parseNum(row[cOpen]),
      debit: parseNum(row[cDr]),
      credit: parseNum(row[cCr]),
      closing: closing ?? 0,
    });
  }
  if (out.length === 0) throw new Error("科目余额表无数据行");
  return out;
}

// ---------- 4. Oracle 段 TB（[日期, BSV, BSV, 科目, 单位码1-4, 项目, 项目, 余额]） ----------

export function parseOracleTb(rows: Row[]): TbLineRow[] {
  const out: TbLineRow[] = [];
  for (const row of rows) {
    const date = parseDateCell(row[0]);
    const period = parsePeriod(row[0]);
    const accountCode = str(row[3]);
    const closing = parseNum(row[10]);
    if (!period || !accountCode || closing == null) continue;
    out.push({
      period,
      asOfDate: date,
      entityCode: str(row[1]) || "590",
      accountCode,
      dim1: orNull(row[4]),
      dim2: orNull(row[5]),
      dim3: orNull(row[6]),
      dim4: orNull(row[7]),
      opening: null,
      debit: null,
      credit: null,
      closing,
    });
  }
  if (out.length === 0) throw new Error("Oracle TB 无有效数据行（期望列: 日期/BSV/BSV/科目/单位码1-4/项目/项目/余额）");
  return out;
}

// ---------- 5. GL 明细 ----------

export function parseGlDetail(rows: Row[]): GlLineRow[] {
  const out: GlLineRow[] = [];
  for (const row of rows) {
    const entryDate = parseDateCell(row[2]);
    const period = parsePeriod(row[2]);
    const accountCode = str(row[9]);
    if (!period || !accountCode) continue;
    const debit = parseNum(row[16]);
    const credit = parseNum(row[17]);
    const isCredit = (credit ?? 0) !== 0 && (debit ?? 0) === 0;
    const amount = isCredit ? (credit as number) : (debit ?? 0);
    if (amount === 0) continue;
    out.push({
      period,
      entryDate,
      journalNo: orNull(row[1]),
      entityCode: str(row[7]) || "590",
      accountCode,
      dim1: orNull(row[10]),
      dim2: orNull(row[11]),
      dim3: orNull(row[12]),
      dim4: orNull(row[13]),
      currency: str(row[3]) || "CNY",
      drcr: isCredit ? "cr" : "dr",
      amount,
    });
  }
  if (out.length === 0) throw new Error("GL 明细无有效数据行");
  return out;
}

// ---------- 6. 表单导出（行 × 列 矩阵 → 事实行） ----------

/**
 * 通用矩阵表单解析：
 * - headerRow: 列维度所在行（如 渠道 / 统计口径）
 * - periodRow: 期间所在行（"Dec 2024"），可与 headerRow 相同结构逐列取
 * - 数据行: 首列为行维度（产品 / 类别），其余列为数值
 * 汇总行（含 "Total"/"合计"）默认跳过。
 */
export function parseFormMatrix(
  rows: Row[],
  opts: { headerRowIndex: number; periodRowIndex: number; skipTotals?: boolean },
): OpsFactRow[] {
  const { headerRowIndex, periodRowIndex, skipTotals = true } = opts;
  const header = rows[headerRowIndex] ?? [];
  const periods = rows[periodRowIndex] ?? [];
  const out: OpsFactRow[] = [];
  for (let i = Math.max(headerRowIndex, periodRowIndex) + 1; i < rows.length; i++) {
    const row = rows[i];
    const label = str(row[0]);
    if (!label) continue;
    if (skipTotals && /total|合计|小计/i.test(label)) continue;
    if (/^.+[:：]$/.test(label)) continue; // 分组标题行（"Mfg Hourly:"）
    for (let c = 1; c < row.length; c++) {
      const value = parseNum(row[c]);
      if (value == null) continue;
      const colLabel = str(header[c]);
      if (skipTotals && /total|合计/i.test(colLabel)) continue;
      const period = parsePeriod(periods[c]) ?? parsePeriod(periods[1]) ?? "";
      if (!period) continue;
      out.push({ period, dim1: label, dim2: colLabel || null, value });
    }
  }
  return out;
}

// ---------- 7. JE 装载页（Mgmt Input Template 的 JE / JE Actual / JE Forecast） ----------

export interface JeFactRow {
  period: string;
  entityCode: string;
  accountCode: string | null;
  metricCode: string | null;
  deptCode: string | null;
  productCode: string | null;
  channelCode: string | null;
  bridgeCode: string | null;
  label: string | null;
  currency: string;
  amount: number;
}

function dimOrNull(cell: Cell): string | null {
  const s = str(cell);
  return s && s !== "None" ? s : null;
}

/**
 * 解析 OneStream JE 装载页。
 * 布局：表头行以 Description/CB#/E#/P#/…/UD8# 开头；金额列为
 * "YYYYMx (USD)" 逐月列 + "Current Month"（USD）单列。
 * P# 为纯数字视为科目（530000），否则视为指标（Units/ProdSales/New_Prod_Rev…）。
 * UD2=部门 UD3=产品 UD4=渠道 UD5=利润桥（Volume/Inflation/Acquisition…）。
 * currentPeriodFallback：当 "Current Month" 列无法从邻近表头推断期间时使用。
 */
export function parseJeSheet(rows: Row[], currentPeriodFallback: string): JeFactRow[] {
  let h = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const cells = rows[i].map((c) => str(c));
    if (cells[0] === "Description" && cells.includes("P#")) {
      h = i;
      break;
    }
  }
  if (h < 0) throw new Error("未识别到 JE 表头（需含: Description / P#）");
  const header = rows[h].map((c) => str(c));

  const monthlyUsdCols: { col: number; period: string }[] = [];
  let currentUsdCol = -1;
  let currentPeriod = currentPeriodFallback;
  header.forEach((label, c) => {
    const m = label.match(/^(\d{4}M\d{1,2})\s*\(USD\)$/);
    if (m) {
      const p = parsePeriod(m[1]);
      if (p) monthlyUsdCols.push({ col: c, period: p });
      return;
    }
    if (label === "Current Month") currentUsdCol = c;
    const p = parsePeriod(label);
    if (p) currentPeriod = p; // e.g. JE Actual 的本币当月列表头直接是 "2024M12"
  });
  if (monthlyUsdCols.length === 0 && currentUsdCol < 0) {
    throw new Error("JE 表未识别到金额列（YYYYMx (USD) 或 Current Month）");
  }

  const col = (name: string) => header.indexOf(name);
  const cP = col("P#");
  const cE = col("E#");
  const cUd2 = col("UD2#");
  const cUd3 = col("UD3#");
  const cUd4 = col("UD4#");
  const cUd5 = header.indexOf("UD5") >= 0 ? header.indexOf("UD5") : col("UD5#");

  const out: JeFactRow[] = [];
  for (let i = h + 1; i < rows.length; i++) {
    const row = rows[i];
    const pRaw = str(row[cP]);
    if (!pRaw) continue;
    const isAccount = /^\d+$/.test(pRaw);
    const base = {
      entityCode: str(row[cE]) || "590",
      accountCode: isAccount ? pRaw : null,
      metricCode: isAccount ? null : pRaw,
      deptCode: cUd2 >= 0 ? dimOrNull(row[cUd2]) : null,
      productCode: cUd3 >= 0 ? dimOrNull(row[cUd3]) : null,
      channelCode: cUd4 >= 0 ? dimOrNull(row[cUd4]) : null,
      bridgeCode: cUd5 >= 0 ? dimOrNull(row[cUd5]) : null,
      label: orNull(row[0]),
      currency: "USD",
    };
    for (const { col: c, period } of monthlyUsdCols) {
      const amount = parseNum(row[c]);
      if (amount == null || amount === 0) continue;
      out.push({ ...base, period, amount });
    }
    if (currentUsdCol >= 0) {
      const amount = parseNum(row[currentUsdCol]);
      if (amount != null && amount !== 0) {
        out.push({ ...base, period: currentPeriod, amount });
      }
    }
  }
  return out;
}

// ---------- 8. PVI 新品活力数据（Mgmt Input Template 的 PVI Data 页） ----------

export interface PviFactRow {
  businessUnit: string;
  reportingUnit: string;
  productName: string;
  channel: string | null;
  category: string | null;
  launchPeriod: string | null;
  period: string;
  amount: number;
}

/**
 * 解析 PVI Data 页：每行一个新品（跨 BU），列 = Launch Date + 2024M1..M12（$000s）。
 * 年度合计列（"2024"）跳过；金额为 0/空的月份跳过。
 */
export function parsePviData(rows: Row[]): PviFactRow[] {
  let h = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const cells = rows[i].map((c) => str(c));
    if (cells[0] === "Business Unit" && cells.includes("Product Name")) {
      h = i;
      break;
    }
  }
  if (h < 0) throw new Error("未识别到 PVI 表头（需含: Business Unit / Product Name）");
  const header = rows[h].map((c) => str(c));
  const col = (name: string) => header.indexOf(name);
  const cBu = col("Business Unit");
  const cRu = col("Reporting Unit");
  const cName = col("Product Name");
  const cChannel = col("Trade / Intercompany");
  const cCategory = col("Product Category");
  const cLaunch = col("Launch Date");

  const monthCols: { col: number; period: string }[] = [];
  header.forEach((label, c) => {
    if (/^\d{4}M\d{1,2}$/.test(label)) {
      const p = parsePeriod(label);
      if (p) monthCols.push({ col: c, period: p });
    }
  });
  if (monthCols.length === 0) throw new Error("PVI 表未识别到月份列（YYYYMx）");

  const out: PviFactRow[] = [];
  for (let i = h + 1; i < rows.length; i++) {
    const row = rows[i];
    const productName = str(row[cName]);
    if (!productName) continue;
    const base = {
      businessUnit: str(row[cBu]),
      reportingUnit: str(row[cRu]) || str(row[cBu]),
      productName,
      channel: orNull(row[cChannel]),
      category: orNull(row[cCategory]),
      launchPeriod: parsePeriod(row[cLaunch]) ?? parseDateCell(row[cLaunch])?.toISOString().slice(0, 7) ?? null,
    };
    for (const { col: c, period } of monthCols) {
      const amount = parseNum(row[c]);
      if (amount == null || amount === 0) continue;
      out.push({ ...base, period, amount });
    }
  }
  return out;
}

/** CapEx 表单：单实体行，列 = 月份（值为 YTD 累计） */
export function parseCapexForm(rows: Row[]): OpsFactRow[] {
  let periodRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    if (rows[i].some((c) => parsePeriod(c))) {
      periodRowIndex = i;
      break;
    }
  }
  if (periodRowIndex < 0) throw new Error("CapEx 表单未识别到月份行");
  const periods = rows[periodRowIndex];
  const out: OpsFactRow[] = [];
  for (let i = periodRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const label = str(row[0]);
    if (!label) continue;
    for (let c = 1; c < row.length; c++) {
      const period = parsePeriod(periods[c]);
      const value = parseNum(row[c]);
      if (!period || value == null) continue;
      out.push({ period, dim1: label, dim2: "YTD", value });
    }
  }
  if (out.length === 0) throw new Error("CapEx 表单无数据行");
  return out;
}
