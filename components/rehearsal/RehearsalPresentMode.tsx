"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Q3_REHEARSAL_AGENDA, REHEARSAL_TOTAL_MIN } from "@/lib/rehearsal/q3-agenda";
import {
  REHEARSAL_CHECKLIST_STORAGE_KEY,
  type RehearsalLiveContext,
} from "@/lib/rehearsal/live-context";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function loadChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(REHEARSAL_CHECKLIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function RehearsalPresentMode({
  initialStep = 0,
  live,
  onExit,
}: {
  initialStep?: number;
  live: RehearsalLiveContext;
  onExit: () => void;
}) {
  const [active, setActive] = useState(initialStep);
  const [running, setRunning] = useState(true);
  const [segmentElapsed, setSegmentElapsed] = useState(0);
  const [meetingElapsed, setMeetingElapsed] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  const step = Q3_REHEARSAL_AGENDA[active];
  const segmentBudgetSec = step.durationMin * 60;
  const segmentRemaining = Math.max(0, segmentBudgetSec - segmentElapsed);
  const overtime = segmentElapsed > segmentBudgetSec;
  const meetingBudgetSec = REHEARSAL_TOTAL_MIN * 60;

  const persistCheck = useCallback(
    (key: string, done: boolean) => {
      setChecked((prev) => {
        const next = { ...prev, [key]: done };
        sessionStorage.setItem(REHEARSAL_CHECKLIST_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      fetch("/api/rehearsal/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId: step.id,
          item: key.split(":").slice(1).join(":"),
          checked: done,
          segment: step.segment,
        }),
      }).catch(() => {});
    },
    [step.id, step.segment]
  );

  const goNext = useCallback(() => {
    setActive((a) => Math.min(a + 1, Q3_REHEARSAL_AGENDA.length - 1));
    setSegmentElapsed(0);
  }, []);

  const goPrev = useCallback(() => {
    setActive((a) => Math.max(a - 1, 0));
    setSegmentElapsed(0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSegmentElapsed(0);
  }, [active]); // reset timer on segment change

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSegmentElapsed((e) => e + 1);
      setMeetingElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onExit]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    };
  }, []);

  const checkedCount = step.checklist.filter((c) => checked[`${step.id}:${c}`]).length;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--print-navy)] text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--surface-border)] px-8 py-4">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            StratOS Q3 战略会 · 环节 {active + 1}/{Q3_REHEARSAL_AGENDA.length} ·{" "}
            {live.source === "database" ? "DB" : "Demo"}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-accent)]">
            {step.segment} — {step.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Crux: {live.crux} · Runway {live.runwayMonths}m · Robust {live.robustOverall}
            {live.hardBlock ? ` · ⚠ ${live.hardBlock}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-[var(--color-text-muted)]">本环节</div>
            <div
              className={`font-data text-4xl tabular-nums ${overtime ? "text-[var(--signal-red)]" : "text-[var(--color-accent)]"}`}
            >
              {overtime ? "+" : ""}
              {formatClock(overtime ? segmentElapsed - segmentBudgetSec : segmentRemaining)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              预算 {step.durationMin} 分钟 · 清单 {checkedCount}/{step.checklist.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-text-muted)]">全会</div>
            <div className="font-data text-2xl tabular-nums text-[var(--color-text-muted)]">
              {formatClock(meetingElapsed)} / {REHEARSAL_TOTAL_MIN}:00
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded border border-black/15 px-4 py-2 text-sm"
          >
            {running ? "暂停 Space" : "继续 Space"}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded border border-[var(--signal-red)]/40 px-4 py-2 text-sm text-[var(--signal-red)]"
          >
            退出 Esc
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6 lg:flex-row">
        <section className="flex-1 space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-accent)]">话术要点</h2>
          <ul className="space-y-3 text-xl leading-relaxed text-[var(--color-text-primary)]">
            {step.talkingPoints.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-4">
            {step.routes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                target="_blank"
                className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-5 py-3 text-lg text-[var(--color-accent)]"
              >
                {r.label} ↗
              </Link>
            ))}
          </div>
        </section>

        <aside className="w-full shrink-0 space-y-4 lg:w-96">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)]">环节清单 · 点击勾选</h2>
          <ul className="space-y-2">
            {step.checklist.map((c) => {
              const key = `${step.id}:${c}`;
              const done = checked[key];
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => persistCheck(key, !done)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-[var(--surface-border)] bg-black/[0.04]"
                    }`}
                  >
                    <span>{done ? "☑" : "☐"}</span>
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="rounded-lg border border-[var(--surface-border)] p-4 text-xs text-[var(--color-text-muted)]">
            ← → 切换环节 · Space 暂停 · 超时会标橙 · 清单写入审计
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className={`h-full ${overtime ? "bg-[var(--signal-red)]" : "bg-[var(--color-accent)]"}`}
                style={{
                  width: `${Math.min(100, (segmentElapsed / segmentBudgetSec) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1">
              全会进度 {Math.round((meetingElapsed / meetingBudgetSec) * 100)}%
            </div>
          </div>
        </aside>
      </main>

      <footer className="flex justify-between border-t border-[var(--surface-border)] px-8 py-4">
        <button
          type="button"
          disabled={active === 0}
          onClick={goPrev}
          className="text-lg text-[var(--color-text-muted)] disabled:opacity-30"
        >
          ← 上一环节
        </button>
        <button
          type="button"
          disabled={active === Q3_REHEARSAL_AGENDA.length - 1}
          onClick={goNext}
          className="text-lg text-[var(--color-accent)] disabled:opacity-30"
        >
          下一环节 →
        </button>
      </footer>
    </div>
  );
}
