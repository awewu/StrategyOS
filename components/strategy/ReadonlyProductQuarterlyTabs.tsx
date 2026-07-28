"use client";

import { useMemo, useState } from "react";
import {
  normalizeProductQuarterlyYears,
  productQuarterlyYearOrLegacy,
} from "@/lib/strategy/product-quarterly";

export interface ReadonlyProductQuarterlyRow {
  year: number;
  productName: string;
  unit: string;
  q1Qty: string;
  q1Revenue: string;
  q2Qty: string;
  q2Revenue: string;
  q3Qty: string;
  q3Revenue: string;
  q4Qty: string;
  q4Revenue: string;
  annualQty: string;
  annualRevenue: string;
  note: string;
}

const COLUMNS = [
  "产品",
  "单位",
  "Q1量",
  "Q1收入",
  "Q2量",
  "Q2收入",
  "Q3量",
  "Q3收入",
  "Q4量",
  "Q4收入",
  "年度数量",
  "年度收入",
  "备注",
];

export function ReadonlyProductQuarterlyTabs({
  years: rawYears,
  rows,
}: {
  years: unknown;
  rows: ReadonlyProductQuarterlyRow[];
}) {
  const [activeYear, setActiveYear] = useState(2027);
  const years = useMemo(() => normalizeProductQuarterlyYears(rawYears, rows), [rawYears, rows]);
  const resolvedActiveYear = years.includes(activeYear) ? activeYear : 2027;
  const activeRows = rows.filter((row) => productQuarterlyYearOrLegacy(row.year) === resolvedActiveYear);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex overflow-x-auto border-b border-[var(--surface-border)]">
        {years.map((year) => {
          const active = year === resolvedActiveYear;
          return (
            <button
              key={year}
              type="button"
              onClick={() => setActiveYear(year)}
              className={'min-w-[112px] border border-b-0 px-4 py-2 text-center text-sm font-medium transition-colors ' + (
                active
                  ? "border-[var(--surface-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
                  : "border-transparent bg-black/[0.02] text-[var(--color-text-muted)] hover:bg-black/[0.04]"
              )}
            >
              {year}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        {resolvedActiveYear} 年产品数量与金额季度推进计划（收入单位：万元）
      </p>

      {activeRows.length === 0 ? (
        <div className="border-y border-[var(--surface-border)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
          当前年度暂无产品数据
        </div>
      ) : (
        <div className="stratos-table-wrap max-w-full min-w-0">
          <table
            className="stratos-table table-fixed text-[11px] [&_th]:whitespace-normal [&_th]:px-1 [&_td]:px-1 [&_td_span]:whitespace-normal [&_th:first-child]:w-24"
            style={{ minWidth: 900 }}
          >
            <thead>
              <tr>
                {COLUMNS.map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, index) => (
                <tr key={`${row.year}-${row.productName}-${index}`}>
                  <td><span className="block break-words leading-relaxed">{row.productName}</span></td>
                  <td><span className="block whitespace-nowrap">{row.unit}</span></td>
                  <td>{row.q1Qty}</td>
                  <td>{row.q1Revenue}</td>
                  <td>{row.q2Qty}</td>
                  <td>{row.q2Revenue}</td>
                  <td>{row.q3Qty}</td>
                  <td>{row.q3Revenue}</td>
                  <td>{row.q4Qty}</td>
                  <td>{row.q4Revenue}</td>
                  <td>{row.annualQty}</td>
                  <td>{row.annualRevenue}</td>
                  <td><span className="block whitespace-pre-line break-words leading-relaxed">{row.note}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
