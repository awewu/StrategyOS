"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_GROUP_ORG_UNIT_ID } from "@/lib/data/strategic-plan-data";
import { planStatusLabel, type PlanLifecycleView } from "@/lib/strategy/plan-lifecycle";

const ORG_UNIT_ID = DEFAULT_GROUP_ORG_UNIT_ID;
const HORIZON = "2026–2028";

function statusChip(status: PlanLifecycleView["status"]): string {
  if (status === "LOCKED") return "stratos-chip stratos-chip--ok";
  if (status === "SUBMITTED") return "stratos-chip stratos-chip--warn";
  return "stratos-chip";
}

export function PlanLifecycleBar() {
  const [lifecycle, setLifecycle] = useState<PlanLifecycleView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/strategy/plan/lifecycle?orgUnitId=${encodeURIComponent(ORG_UNIT_ID)}&horizonStart=2026&horizonEnd=2028`,
      );
      const data = (await res.json()) as { lifecycle?: PlanLifecycleView | null };
      setLifecycle(data.lifecycle ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void load();
  }, [load]);

  async function runAction(action: "submit" | "lock" | "reopen") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/strategy/plan/lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgUnitId: ORG_UNIT_ID, horizonStart: 2026, horizonEnd: 2028, action }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; lifecycle?: PlanLifecycleView };
      if (!res.ok || !data.ok) {
        setMsg(data.error ?? "操作失败");
        return;
      }
      if (data.lifecycle) setLifecycle(data.lifecycle);
      setMsg(
        action === "submit" ? "已提交审核" : action === "lock" ? "已定稿锁定 — 导入写入已冻结" : "已重新打开为草稿",
      );
    } catch {
      setMsg("网络错误");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="stratos-card stratos-card--padded text-xs text-[var(--color-text-muted)]">加载计划状态…</div>
    );
  }

  if (!lifecycle) {
    return (
      <div className="stratos-card stratos-card--padded border-dashed text-xs text-[var(--color-text-muted)]">
        暂无 {HORIZON} 战略计划记录
      </div>
    );
  }

  return (
    <div className="stratos-card stratos-card--padded flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={statusChip(lifecycle.status)}>{planStatusLabel(lifecycle.status)}</span>
          <span className="text-[var(--color-text-muted)]">
            {lifecycle.objectiveCount} 目标 · {lifecycle.keyResultCount} KR · {HORIZON}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lifecycle.canSubmit ? (
            <button type="button" disabled={busy} onClick={() => void runAction("submit")} className="stratos-btn px-3 py-1.5 text-xs">
              提交审核
            </button>
          ) : null}
          {lifecycle.canLock ? (
            <button type="button" disabled={busy} onClick={() => void runAction("lock")} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs">
              定稿锁定
            </button>
          ) : null}
          {lifecycle.canReopen ? (
            <button type="button" disabled={busy} onClick={() => void runAction("reopen")} className="stratos-btn px-3 py-1.5 text-xs text-[var(--signal-red)]">
              重新打开
            </button>
          ) : null}
        </div>
      </div>

      {lifecycle.status === "LOCKED" && lifecycle.lockedAt ? (
        <p className="text-[11px] text-[var(--color-text-muted)]">
          锁定于 {new Date(lifecycle.lockedAt).toLocaleString("zh-CN")} · 定稿后导入写入冻结，推演预览仍可用
        </p>
      ) : null}
      {msg ? <p className="text-xs text-[var(--color-text-muted)]">{msg}</p> : null}
    </div>
  );
}
