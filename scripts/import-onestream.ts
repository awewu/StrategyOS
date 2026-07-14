#!/usr/bin/env npx tsx
/**
 * 财务数据中台 · OneStream 管道导入
 *
 * 把月度关账工作簿导入 Ledger Hub：
 *   1. 科目映射（中→美）      → LedgerAccount
 *   2. 部门映射（单位码→US）  → LedgerDepartment
 *   3. 科目余额表 + Oracle TB → LedgerTbLine
 *   4. GL 日记账明细          → LedgerGlLine
 *   5. 表单导出（人头/发货/CapEx）→ OpsMetricFact
 * 每个来源生成一条 FinImportBatch（内容哈希幂等，重复导入自动跳过）。
 *
 * Usage:
 *   npx tsx scripts/import-onestream.ts               # 使用默认 tmp/ 路径
 *   npx tsx scripts/import-onestream.ts --dir tmp     # 指定根目录
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { FinSourceType, OpsMetricType, Prisma } from "@prisma/client";
import { dbAvailable, prisma } from "../lib/db";
import {
  parseAccountMap,
  parseBalanceSheet,
  parseCapexForm,
  parseDeptMap,
  parseFormMatrix,
  parseGlDetail,
  parseJeSheet,
  parseOracleTb,
  parsePviData,
  type Row,
} from "../lib/finance/onestream";

const argDir = process.argv.indexOf("--dir");
const ROOT = path.resolve(argDir >= 0 ? process.argv[argDir + 1] : "tmp");

const FILES = {
  accountMap: path.join(ROOT, "美国后台数据匹配逻辑/2025Account&Code1#-to US.xlsx"),
  glTb: path.join(ROOT, "上传Onestream数据/20250110GL&TB-2.xlsx"),
  formHeadcount: path.join(ROOT, "上传Onestream数据/20250106Form_Headcount_Export.xlsx"),
  formUnits: path.join(ROOT, "上传Onestream数据/20250106Form_Units_Shipped_Export.xlsx"),
  formCapex: path.join(ROOT, "上传Onestream数据/20250106Form_CapEx_Export.xlsx"),
  mgmtTemplate: path.join(ROOT, "上传Onestream数据/Water Div - Mgmt Input Template 12 2024-RheemChina.xlsx"),
};

/** JE 装载页 → 情景：JE Actual=实际管理层调整；JE Forecast=滚动预测；JE=预算口径调整 */
const JE_SHEETS: { sheet: string; scenarioCode: string }[] = [
  { sheet: "JE Actual", scenarioCode: "ActualAt2024BudgetRate" },
  { sheet: "JE Forecast", scenarioCode: "mgmtadjDecFcst" },
];

const CURRENT_PERIOD = "2024-12";

const BASE_SCENARIOS = [
  { code: "ActualAt2024BudgetRate", name: "实际（按 2024 预算汇率）", kind: "actual" },
  { code: "MgmtAdjBudget", name: "管理层调整后预算", kind: "mgmt_adj" },
  { code: "mgmtadjDecFcst", name: "12 月滚动预测（管理层调整）", kind: "forecast" },
  { code: "Budget", name: "年度预算", kind: "budget" },
] as const;

function readRows(file: string, sheetName?: string, sheetRows?: number): Row[] {
  const wb = XLSX.read(fs.readFileSync(file), { type: "buffer", sheetRows, cellStyles: false });
  const name = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`${path.basename(file)} 缺少工作表 ${sheetName ?? "(first)"}`);
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: "", raw: false });
}

function contentHash(file: string, sheetName: string): string {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  h.update(sheetName);
  return h.digest("hex");
}

/** 幂等批次：同 hash 已导入则返回 null，否则创建 pending 批次 */
async function openBatch(
  sourceType: FinSourceType,
  file: string,
  sheetName: string,
  period: string | null,
): Promise<string | null> {
  const hash = contentHash(file, sheetName);
  const existing = await prisma.finImportBatch.findFirst({
    where: { contentHash: hash, sourceType, status: "imported" },
  });
  if (existing) {
    console.log(`  ⏭  ${sourceType} 已导入（batch ${existing.id.slice(0, 8)}），跳过`);
    return null;
  }
  const batch = await prisma.finImportBatch.create({
    data: {
      sourceType,
      fileName: path.basename(file),
      sheetName,
      period,
      contentHash: hash,
      importedBy: "scripts/import-onestream",
    },
  });
  return batch.id;
}

async function closeBatch(batchId: string, rowCount: number) {
  await prisma.finImportBatch.update({
    where: { id: batchId },
    data: { rowCount, status: "imported" },
  });
}

async function failBatch(batchId: string, err: unknown) {
  await prisma.finImportBatch.update({
    where: { id: batchId },
    data: { status: "failed", errorText: String(err).slice(0, 500) },
  });
}

async function importAccountMap(): Promise<void> {
  console.log("▶ 科目映射");
  const batchId = await openBatch("account_map", FILES.accountMap, "Acct Mapping", null);
  if (!batchId) return;
  try {
    const rows = parseAccountMap(readRows(FILES.accountMap, "Acct Mapping"));
    for (const r of rows) {
      await prisma.ledgerAccount.upsert({
        where: { code: r.code },
        create: { ...r },
        update: { ...r },
      });
    }
    await closeBatch(batchId, rows.length);
    console.log(`  ✓ ${rows.length} 个科目（含中→美映射）`);
  } catch (err) {
    await failBatch(batchId, err);
    throw err;
  }
}

async function importDeptMap(): Promise<void> {
  console.log("▶ 部门映射");
  const batchId = await openBatch("dept_map", FILES.accountMap, "Department Mapping", null);
  if (!batchId) return;
  try {
    const rows = parseDeptMap(readRows(FILES.accountMap, "Department Mapping"));
    for (const r of rows) {
      await prisma.ledgerDepartment.upsert({
        where: { code: r.code },
        create: { ...r },
        update: { ...r },
      });
    }
    await closeBatch(batchId, rows.length);
    console.log(`  ✓ ${rows.length} 个部门`);
  } catch (err) {
    await failBatch(batchId, err);
    throw err;
  }
}

async function accountIdMap(): Promise<Map<string, string>> {
  const accounts = await prisma.ledgerAccount.findMany({ select: { id: true, code: true } });
  return new Map(accounts.map((a) => [a.code, a.id]));
}

async function importTrialBalances(): Promise<void> {
  const codeToId = await accountIdMap();

  console.log("▶ 科目余额表（本币期初/借/贷/期末）");
  let batchId = await openBatch("trial_balance", FILES.glTb, "Sheet1", "2024-12");
  if (batchId) {
    try {
      const rows = parseBalanceSheet(readRows(FILES.glTb, "Sheet1"), "2024-12");
      await prisma.ledgerTbLine.createMany({
        data: rows.map((r) => ({
          ...r,
          batchId: batchId as string,
          accountId: codeToId.get(r.accountCode) ?? null,
        })),
      });
      await closeBatch(batchId, rows.length);
      console.log(`  ✓ ${rows.length} 行`);
    } catch (err) {
      await failBatch(batchId, err);
      throw err;
    }
  }

  console.log("▶ Oracle 段 TB");
  const wb = XLSX.read(fs.readFileSync(FILES.glTb), { type: "buffer", bookSheets: true });
  const tbSheet = wb.SheetNames.find((n) => n.startsWith("TB_"));
  if (!tbSheet) throw new Error("GL&TB 工作簿缺少 TB_ 开头的工作表");
  batchId = await openBatch("trial_balance", FILES.glTb, tbSheet, "2024-12");
  if (batchId) {
    try {
      const rows = parseOracleTb(readRows(FILES.glTb, tbSheet));
      await prisma.ledgerTbLine.createMany({
        data: rows.map((r) => ({
          ...r,
          batchId: batchId as string,
          accountId: codeToId.get(r.accountCode) ?? null,
        })),
      });
      await closeBatch(batchId, rows.length);
      console.log(`  ✓ ${rows.length} 行`);
    } catch (err) {
      await failBatch(batchId, err);
      throw err;
    }
  }
}

async function importGlDetail(): Promise<void> {
  console.log("▶ GL 日记账明细");
  const wb = XLSX.read(fs.readFileSync(FILES.glTb), { type: "buffer", bookSheets: true });
  const glSheet = wb.SheetNames.find((n) => n.startsWith("GL_"));
  if (!glSheet) throw new Error("GL&TB 工作簿缺少 GL_ 开头的工作表");
  const batchId = await openBatch("gl_detail", FILES.glTb, glSheet, "2024-12");
  if (!batchId) return;
  try {
    const codeToId = await accountIdMap();
    const rows = parseGlDetail(readRows(FILES.glTb, glSheet));
    await prisma.ledgerGlLine.createMany({
      data: rows.map((r) => ({
        ...r,
        batchId,
        accountId: codeToId.get(r.accountCode) ?? null,
      })),
    });
    await closeBatch(batchId, rows.length);
    console.log(`  ✓ ${rows.length} 行`);
  } catch (err) {
    await failBatch(batchId, err);
    throw err;
  }
}

async function importForm(
  sourceType: FinSourceType,
  metricType: OpsMetricType,
  file: string,
  parse: (rows: Row[]) => { period: string; dim1: string | null; dim2: string | null; value: number }[],
  unit: string,
): Promise<void> {
  console.log(`▶ 表单 ${metricType}`);
  const batchId = await openBatch(sourceType, file, "(form)", null);
  if (!batchId) return;
  try {
    const facts = parse(readRows(file));
    await prisma.opsMetricFact.createMany({
      data: facts.map((f) => ({ ...f, batchId, metricType, unit })),
    });
    await closeBatch(batchId, facts.length);
    console.log(`  ✓ ${facts.length} 个事实`);
  } catch (err) {
    await failBatch(batchId, err);
    throw err;
  }
}

async function importJeFacts(): Promise<void> {
  for (const { sheet, scenarioCode } of JE_SHEETS) {
    console.log(`▶ 情景事实 ${sheet} → ${scenarioCode}`);
    const scenario = await prisma.finScenario.findUnique({ where: { code: scenarioCode } });
    if (!scenario) throw new Error(`情景 ${scenarioCode} 不存在（先跑 seedScenarios）`);
    const batchId = await openBatch("fact_entry", FILES.mgmtTemplate, sheet, CURRENT_PERIOD);
    if (!batchId) continue;
    try {
      const facts = parseJeSheet(readRows(FILES.mgmtTemplate, sheet), CURRENT_PERIOD);
      await prisma.finFactEntry.createMany({
        data: facts.map((f) => ({ ...f, batchId, scenarioId: scenario.id, entityCode: "5RC" })),
      });
      await closeBatch(batchId, facts.length);
      console.log(`  ✓ ${facts.length} 条事实`);
    } catch (err) {
      await failBatch(batchId, err);
      throw err;
    }
  }
}

async function importPviData(): Promise<void> {
  console.log("▶ PVI 新品活力数据");
  const batchId = await openBatch("pvi_sales", FILES.mgmtTemplate, "PVI Data", CURRENT_PERIOD);
  if (!batchId) return;
  try {
    const facts = parsePviData(readRows(FILES.mgmtTemplate, "PVI Data"));
    await prisma.pviSalesFact.createMany({ data: facts.map((f) => ({ ...f, batchId })) });
    await closeBatch(batchId, facts.length);
    console.log(`  ✓ ${facts.length} 条新品销售事实`);
  } catch (err) {
    await failBatch(batchId, err);
    throw err;
  }
}

async function seedScenarios(): Promise<void> {
  for (const s of BASE_SCENARIOS) {
    await prisma.finScenario.upsert({
      where: { code: s.code },
      create: s as Prisma.FinScenarioCreateInput,
      update: { name: s.name, kind: s.kind },
    });
  }
  console.log(`▶ 情景基线 ✓ ${BASE_SCENARIOS.length} 个（${BASE_SCENARIOS.map((s) => s.code).join(", ")}）`);
}

async function main() {
  if (!(await dbAvailable())) {
    console.error("数据库不可用 — 请先启动 Postgres（docker compose up -d）");
    process.exit(1);
  }
  for (const [key, file] of Object.entries(FILES)) {
    if (!fs.existsSync(file)) {
      console.error(`缺少源文件 [${key}]: ${file}`);
      process.exit(1);
    }
  }

  await seedScenarios();
  await importAccountMap();
  await importDeptMap();
  await importTrialBalances();
  await importGlDetail();
  await importForm("form_headcount", "headcount", FILES.formHeadcount, (rows) => parseFormMatrix(rows, { headerRowIndex: 2, periodRowIndex: 3 }), "人");
  await importForm("form_units", "units_shipped", FILES.formUnits, (rows) => parseFormMatrix(rows, { headerRowIndex: 2, periodRowIndex: 3 }), "台");
  await importForm("form_capex", "capex", FILES.formCapex, parseCapexForm, "USD");
  await importJeFacts();
  await importPviData();

  const [accounts, depts, tb, gl, ops, facts, batches] = await Promise.all([
    prisma.ledgerAccount.count(),
    prisma.ledgerDepartment.count(),
    prisma.ledgerTbLine.count(),
    prisma.ledgerGlLine.count(),
    prisma.opsMetricFact.count(),
    prisma.finFactEntry.count(),
    prisma.finImportBatch.count({ where: { status: "imported" } }),
  ]);
  console.log("\n=== Ledger Hub 汇总 ===");
  console.log(`科目 ${accounts} · 部门 ${depts} · TB 行 ${tb} · GL 行 ${gl} · 运营事实 ${ops} · 情景事实 ${facts} · 已导入批次 ${batches}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
