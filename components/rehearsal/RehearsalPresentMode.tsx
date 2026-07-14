"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Q3_REHEARSAL_AGENDA, REHEARSAL_TOTAL_MIN } from "@/lib/rehearsal/q3-agenda";
import {
  REHEARSAL_CHECKLIST_STORAGE_KEY,
  type RehearsalLiveContext,
} from "@/lib/rehearsal/live-context";

type PresentView = "slides" | "agenda";

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

function StrategySlide({
  live,
  slideIndex,
}: {
  live: RehearsalLiveContext;
  slideIndex: number;
}) {
  const slides = live.strategySlides ?? [];
  const slide = slides[slideIndex];
  const meta = live.strategyDeckMeta;

  if (!slide) {
    return (
      <section className="flex min-h-[58vh] flex-1 flex-col justify-center rounded-lg border border-[var(--surface-border)] bg-white/[0.03] px-12 py-10">
        <p className="text-sm text-[var(--color-text-muted)]">战略幻灯 · 暂无内容</p>
        <h2 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight text-[var(--color-accent)]">
          尚未找到 /strategy/input 的战略输入
        </h2>
        <p className="mt-6 max-w-3xl text-2xl leading-relaxed text-white/75">
          请先在编制战略页面保存战略意图、目标、举措或路线图。保存后重新进入彩排投屏，即可自动生成可翻页幻灯片。
        </p>
        <Link
          href="/strategy/input"
          target="_blank"
          className="mt-10 w-fit rounded-lg border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 px-6 py-3 text-lg text-[var(--color-accent)]"
        >
          打开编制战略
        </Link>
      </section>
    );
  }

  return (
    <section className="flex min-h-[58vh] flex-1 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.035] px-12 py-10 shadow-2xl">
      <div>
        <p className="text-sm uppercase text-[var(--color-text-muted)]">{slide.eyebrow}</p>
        <h2 className="mt-4 max-w-5xl text-5xl font-semibold leading-tight text-[var(--color-accent)]">
          {slide.title}
        </h2>
        {slide.lead && (
          <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-white/82">{slide.lead}</p>
        )}

        {slide.metrics && slide.metrics.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {slide.metrics.map((m) => (
              <div key={`${m.label}-${m.value}`} className="rounded-lg border border-white/10 bg-black/15 p-5">
                <div className="text-sm text-[var(--color-text-muted)]">{m.label}</div>
                <div className="mt-2 text-3xl font-semibold text-white">{m.value}</div>
                {m.note && <div className="mt-2 text-sm text-white/58">{m.note}</div>}
              </div>
            ))}
          </div>
        )}

        {slide.bullets.length > 0 && (
          <ul className="mt-8 grid gap-4 text-2xl leading-snug text-white/84 md:grid-cols-2">
            {slide.bullets.map((b) => (
              <li key={b} className="rounded-lg border border-white/10 bg-black/10 px-5 py-4">
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-10 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-[var(--color-text-muted)]">
        <span>
          {slide.footer ?? "来源 /strategy/input"}
          {meta ? ` · 更新 ${meta.updatedAt} · ID ${meta.planCode}` : ""}
        </span>
        <span>
          {slideIndex + 1} / {slides.length}
        </span>
      </footer>
    </section>
  );
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
  const [view, setView] = useState<PresentView>("slides");
  const [slideIndex, setSlideIndex] = useState(0);

  const step = Q3_REHEARSAL_AGENDA[active];
  const segmentBudgetSec = step.durationMin * 60;
  const segmentRemaining = Math.max(0, segmentBudgetSec - segmentElapsed);
  const overtime = segmentElapsed > segmentBudgetSec;
  const meetingBudgetSec = REHEARSAL_TOTAL_MIN * 60;
  const slideCount = live.strategySlides?.length ?? 0;
  const deckMeta = live.strategyDeckMeta;

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
    if (view === "slides") {
      setSlideIndex((i) => Math.min(i + 1, Math.max(0, slideCount - 1)));
      return;
    }
    setActive((a) => Math.min(a + 1, Q3_REHEARSAL_AGENDA.length - 1));
    setSegmentElapsed(0);
  }, [slideCount, view]);

  const goPrev = useCallback(() => {
    if (view === "slides") {
      setSlideIndex((i) => Math.max(i - 1, 0));
      return;
    }
    setActive((a) => Math.max(a - 1, 0));
    setSegmentElapsed(0);
  }, [view]);

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
            {view === "slides" ? "战略幻灯" : `${step.segment} — ${step.title}`}
          </h1>
          {view === "slides" && deckMeta ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 px-2 py-1 text-[var(--color-accent)]">
                {deckMeta.orgUnitName}
              </span>
              <span className="rounded border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 px-2 py-1 text-[var(--color-accent)]">
                {deckMeta.versionLabel}
              </span>
              <span className="rounded border border-white/10 bg-black/10 px-2 py-1 text-[var(--color-text-muted)]">
                周期 {deckMeta.horizon}
              </span>
              <span className="rounded border border-white/10 bg-black/10 px-2 py-1 text-[var(--color-text-muted)]">
                状态 {deckMeta.status}
              </span>
              <span className="rounded border border-white/10 bg-black/10 px-2 py-1 text-[var(--color-text-muted)]">
                ID {deckMeta.planCode}
              </span>
              <span className="rounded border border-white/10 bg-black/10 px-2 py-1 text-[var(--color-text-muted)]">
                更新 {deckMeta.updatedAt}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Crux: {live.crux} · Runway {live.runwayMonths}m · Robust {live.robustOverall}
              {live.hardBlock ? ` · ⚠ ${live.hardBlock}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex rounded-lg border border-white/10 bg-black/10 p-1">
            <button
              type="button"
              onClick={() => setView("slides")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                view === "slides"
                  ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              战略幻灯 {slideCount > 0 ? slideCount : ""}
            </button>
            <button
              type="button"
              onClick={() => setView("agenda")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                view === "agenda"
                  ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              彩排议程
            </button>
          </div>
          <div className="text-right">
            <div className="text-caption">本环节</div>
            <div
              className={`font-data text-4xl tabular-nums ${overtime ? "text-[var(--signal-red)]" : "text-[var(--color-accent)]"}`}
            >
              {overtime ? "+" : ""}
              {formatClock(overtime ? segmentElapsed - segmentBudgetSec : segmentRemaining)}
            </div>
            <div className="text-caption">
              预算 {step.durationMin} 分钟 · 清单 {checkedCount}/{step.checklist.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-caption">全会</div>
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
        {view === "slides" ? (
          <StrategySlide live={live} slideIndex={slideIndex} />
        ) : (
          <>
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
                            ? "border-[color-mix(in_srgb,var(--signal-green)_40%,transparent)] bg-[color-mix(in_srgb,var(--signal-green)_10%,white)] text-[var(--signal-green)]"
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
              <div className="rounded-lg border border-[var(--surface-border)] p-4 text-caption">
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
          </>
        )}
      </main>

      <footer className="flex justify-between border-t border-[var(--surface-border)] px-8 py-4">
        <button
          type="button"
          disabled={view === "slides" ? slideIndex === 0 : active === 0}
          onClick={goPrev}
          className="text-lg text-[var(--color-text-muted)] disabled:opacity-30"
        >
          ← {view === "slides" ? "上一页" : "上一环节"}
        </button>
        <button
          type="button"
          disabled={
            view === "slides"
              ? slideIndex >= Math.max(0, slideCount - 1)
              : active === Q3_REHEARSAL_AGENDA.length - 1
          }
          onClick={goNext}
          className="text-lg text-[var(--color-accent)] disabled:opacity-30"
        >
          {view === "slides" ? "下一页" : "下一环节"} →
        </button>
      </footer>
    </div>
  );
}
