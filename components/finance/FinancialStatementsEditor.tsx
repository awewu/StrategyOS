"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  BalanceSheetPanel,
  CashFlowStatementPanel,
  IncomeStatementPanel,
  type LinePatch,
} from "@/components/finance/FinancialStatements";
import type { ManagementReportBundle } from "@/lib/fpa/management-types";
import type { StatementsOverride } from "@/lib/fpa/management-adjustments-access";
import type { StatementLine } from "@/lib/fpa/management-types";

function patchLines(lines: StatementLine[], key: string, field: keyof StatementLine, value: string | number) {
  return lines.map((l) => (l.key === key ? { ...l, [field]: value } : l));
}

export function FinancialStatementsEditor({
  report,
  statementsSource,
}: {
  report: ManagementReportBundle;
  statementsSource: "database" | "derived";
}) {
  const router = useRouter();
  const [statements, setStatements] = useState<StatementsOverride>({
    incomeStatement: report.incomeStatement,
    balanceSheet: report.balanceSheet,
    cashFlowStatement: report.cashFlowStatement,
  });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onIncomePatch: LinePatch = useCallback((key, field, value) => {
    setStatements((prev) => ({
      ...prev,
      incomeStatement: {
        ...prev.incomeStatement,
        lines: patchLines(prev.incomeStatement.lines, key, field, value),
      },
    }));
  }, []);

  const onBalancePatch: LinePatch = useCallback((key, field, value) => {
    setStatements((prev) => ({
      ...prev,
      balanceSheet: {
        ...prev.balanceSheet,
        assets: patchLines(prev.balanceSheet.assets, key, field, value),
        liabilities: patchLines(prev.balanceSheet.liabilities, key, field, value),
        equity: patchLines(prev.balanceSheet.equity, key, field, value),
      },
    }));
  }, []);

  const onCashPatch: LinePatch = useCallback((key, field, value) => {
    setStatements((prev) => ({
      ...prev,
      cashFlowStatement: {
        ...prev.cashFlowStatement,
        lines: patchLines(prev.cashFlowStatement.lines, key, field, value),
      },
    }));
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/management-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statements }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("三张表已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function resetStatements() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/management-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: "statements" }),
      });
      if (!res.ok) throw new Error("重置失败");
      setEditing(false);
      setMsg("已恢复 FPA 推导三张表");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "重置失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stratos-section-gap flex flex-col">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs text-[var(--color-text-muted)]">
          三张表 {statementsSource === "database" ? "· 已自定义" : "· FPA 推导"}
          {editing ? " · 行级编辑" : ""}
        </span>
        {msg ? <span className="text-xs text-[var(--signal-green)]">{msg}</span> : null}
        {editing ? (
          <>
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>
              取消
            </button>
            <button type="button" disabled={busy} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs" onClick={() => void save()}>
              {busy ? "保存中…" : "保存三张表"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
              编辑三张表
            </button>
            {statementsSource === "database" ? (
              <button type="button" disabled={busy} className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => void resetStatements()}>
                恢复推导
              </button>
            ) : null}
          </>
        )}
      </div>

      <IncomeStatementPanel statement={statements.incomeStatement} editing={editing} onLinePatch={onIncomePatch} />
      <BalanceSheetPanel sheet={statements.balanceSheet} editing={editing} onLinePatch={onBalancePatch} />
      <CashFlowStatementPanel statement={statements.cashFlowStatement} editing={editing} onLinePatch={onCashPatch} />
    </div>
  );
}
