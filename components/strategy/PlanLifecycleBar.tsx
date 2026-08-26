"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_GROUP_ORG_UNIT_ID } from "@/lib/data/strategic-plan-data";
import { planStatusLabel, type PlanLifecycleView } from "@/lib/strategy/plan-lifecycle";

const ORG_UNIT_ID = DEFAULT_GROUP_ORG_UNIT_ID;
const HORIZON = "2026–2028";

const LIFECYCLE_STEPS = [
  { status: "DRAFT", label: "草稿" },
  { status: "SUBMITTED", label: "已提交" },
  { status: "LOCKED", label: "已定稿锁定" },
] as const;

function statusChip(status: PlanLifecycleView["status"]): string {
  if (status === "LOCKED") return "stratos-chip stratos-chip--ok";
  if (status === "SUBMITTED") return "stratos-chip stratos-chip--warn";
  return "stratos-chip";
}

function PlanLifecycleHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">战略计划生命周期</h3>
      <span className="rounded bg-black/[0.04] px-2 py-0.5 text-caption">{HORIZON}</span>
    </div>
  );
}

function PlanLifecycleTimeline({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {LIFECYCLE_STEPS.map((s, i) => {
        const active = i <= activeIndex;
        const current = i === activeIndex;
        return (
          <div key={s.status} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                current
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : active
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-[var(--surface-border)] text-[var(--color-text-muted)]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: current ? "white" : active ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
              />
              {s.label}
            </div>
            {i < LIFECYCLE_STEPS.length - 1 ? (
              <div className={`h-px w-6 ${active ? "bg-[var(--color-accent)]" : "bg-[var(--surface-border)]"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
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

  const currentStep = lifecycle ? LIFECYCLE_STEPS.findIndex((s) => s.status === lifecycle.status) : -1;

  if (loading) {
    return (
      <div className="stratos-card stratos-card--padded space-y-4">
        <PlanLifecycleHeader />
        <div className="flex flex-wrap items-center gap-2">
          {LIFECYCLE_STEPS.map((s, i) => (
            <div key={s.status} className="flex items-center gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-[var(--surface-border)]" />
              {i < LIFECYCLE_STEPS.length - 1 ? <div className="h-px w-6 bg-[var(--surface-border)]" /> : null}
            </div>
          ))}
        </div>
        <div className="h-3 w-48 animate-pulse rounded bg-[var(--surface-border)]" />
      </div>
    );
  }

  if (!lifecycle) {
    return (
      <div className="stratos-card stratos-card--padded space-y-4">
        <PlanLifecycleHeader />
        <PlanLifecycleTimeline activeIndex={-1} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption">
            暂无 {HORIZON} 战略计划。在「战略一页纸」或「战略解码」完成规划后，此处会自动识别生命周期状态。
          </p>
          <button type="button" disabled className="stratos-btn px-3 py-1.5 text-xs opacity-50">
            等待规划中
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stratos-card stratos-card--padded space-y-4">
      <PlanLifecycleHeader />
      <PlanLifecycleTimeline activeIndex={currentStep} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={statusChip(lifecycle.status)}>{planStatusLabel(lifecycle.status)}</span>
          <span className="text-[var(--color-text-muted)]">
            {lifecycle.objectiveCount} 目标 · {lifecycle.keyResultCount} KR
          </span>
          {lifecycle.submittedAt ? (
            <span className="text-[var(--color-text-muted)]">
              提交于 {new Date(lifecycle.submittedAt).toLocaleString("zh-CN")}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/strategy/submissions?planId=${lifecycle.planId}`}
            className={`stratos-btn px-3 py-1.5 text-xs ${
              lifecycle.status === "SUBMITTED" ? "stratos-btn--primary" : "stratos-btn--ghost"
            }`}
          >
            {lifecycle.status === "SUBMITTED" ? "查看并审核" : "查看计划内容"}
          </Link>
          {lifecycle.canSubmit ? (
            <button type="button" disabled={busy} onClick={() => void runAction("submit")} className="stratos-btn px-3 py-1.5 text-xs">
              提交审核
            </button>
          ) : null}
          {lifecycle.canLock && lifecycle.status !== "SUBMITTED" ? (
            <button type="button" disabled={busy} onClick={() => void runAction("lock")} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs">
              定稿锁定
            </button>
          ) : null}
          {lifecycle.canReopen ? (
            <button type="button" disabled={busy} onClick={() => void runAction("reopen")} className="stratos-btn px-3 py-1.5 text-xs text-[var(--signal-red-text)]">
              重新打开
            </button>
          ) : null}
        </div>
      </div>

      {lifecycle.status === "LOCKED" && lifecycle.lockedAt ? (
        <p className="text-caption">
          锁定于 {new Date(lifecycle.lockedAt).toLocaleString("zh-CN")} · 定稿后导入写入冻结，推演预览仍可用
        </p>
      ) : null}
      {msg ? <p className="text-caption">{msg}</p> : null}
    </div>
  );
}
