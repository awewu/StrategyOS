"use client";

import Link from "next/link";
import { useState } from "react";
import { RehearsalPresentMode } from "@/components/rehearsal/RehearsalPresentMode";
import { Q3_REHEARSAL_AGENDA, REHEARSAL_TOTAL_MIN } from "@/lib/rehearsal/q3-agenda";
import type { RehearsalLiveContext } from "@/lib/rehearsal/live-context";

function LiveBanner({ live }: { live: RehearsalLiveContext }) {
  return (
    <section className="grid gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4 text-sm md:grid-cols-4">
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">Crux · 数据源 {live.source}</div>
        <div className="font-medium text-[var(--color-accent)]">{live.crux}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">Runway · Robust</div>
        <div>
          {live.runwayMonths} 月 · R {live.robustOverall}
        </div>
      </div>
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">StratDiff · 刻意率</div>
        <div>
          {live.diffCount} 条 · WORKING {live.workingSnapshotRate}%
        </div>
      </div>
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">HardBlock</div>
        <div className={live.hardBlock ? "text-[var(--signal-red)]" : "text-[var(--signal-green)]"}>
          {live.hardBlock ?? "无活跃否决"}
        </div>
      </div>
    </section>
  );
}

export function RehearsalWalkthrough({ live }: { live: RehearsalLiveContext }) {
  const [active, setActive] = useState(0);
  const [present, setPresent] = useState(false);
  const step = Q3_REHEARSAL_AGENDA[active];
  const progress = Math.round(((active + 1) / Q3_REHEARSAL_AGENDA.length) * 100);

  if (present) {
    return (
      <RehearsalPresentMode initialStep={active} live={live} onExit={() => setPresent(false)} />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">2026 Q3 · 战略会标准包 · EVOLUTION §9.3</p>
          <h1 className="text-2xl font-semibold text-[var(--color-accent)]">彩排 Walkthrough</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            总时长 {REHEARSAL_TOTAL_MIN} 分钟 · 6 环节 · 30 人核心层 · 实时数据驱动
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPresent(true)}
            className="rounded bg-[var(--color-accent)]/20 px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30"
          >
            进入投屏模式 →
          </button>
          <Link
            href="/print/panorama"
            className="rounded border border-[var(--color-accent)]/40 px-4 py-2 text-sm text-[var(--color-accent)]"
          >
            打印签到一页纸
          </Link>
          <Link
            href="/admin/access"
            className="rounded border border-[var(--surface-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            访问管理
          </Link>
        </div>
      </div>

      <LiveBanner live={live} />

      <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <nav className="flex flex-wrap gap-2">
        {Q3_REHEARSAL_AGENDA.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded px-3 py-1.5 text-xs ${
              i === active
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                : "bg-black/[0.04] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s.segment} {s.durationMin}m
          </button>
        ))}
      </nav>

      <article className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-bg-surface)] p-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-3">
          <span className="font-data text-3xl text-[var(--color-accent)]">{step.durationMin}′</span>
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              {step.segment}
            </div>
            <h2 className="text-xl font-semibold">{step.title}</h2>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {step.routes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded border border-[var(--surface-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              {r.label} →
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <section>
            <h3 className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">目标</h3>
            <ul className="space-y-1 text-sm">
              {step.objectives.map((o) => (
                <li key={o}>· {o}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">话术要点</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              {step.talkingPoints.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">环节清单</h3>
            <ul className="space-y-1 text-sm">
              {step.checklist.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-[var(--color-accent)]">☐</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 flex justify-between border-t border-[var(--surface-border)] pt-4">
          <button
            type="button"
            disabled={active === 0}
            onClick={() => setActive((a) => a - 1)}
            className="text-sm text-[var(--color-text-muted)] disabled:opacity-30"
          >
            ← 上一环节
          </button>
          <button
            type="button"
            disabled={active === Q3_REHEARSAL_AGENDA.length - 1}
            onClick={() => setActive((a) => a + 1)}
            className="text-sm text-[var(--color-accent)] disabled:opacity-30"
          >
            下一环节 →
          </button>
        </div>
      </article>
    </div>
  );
}
