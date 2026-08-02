"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { RehearsalPresentMode } from "@/components/rehearsal/RehearsalPresentMode";
import { PresentationSetupModal } from "@/components/rehearsal/PresentationSetupModal";
import { typography } from "@/lib/brand/typography";
import { Select } from "@/components/ui/primitives";
import { Q3_REHEARSAL_AGENDA, REHEARSAL_TOTAL_MIN } from "@/lib/rehearsal/q3-agenda";
import type { RehearsalLiveContext } from "@/lib/rehearsal/live-context";
import {
  resolveProjectionLaunch,
  type ProjectionSelection,
} from "@/lib/rehearsal/projection";

type StrategyDeckOption = NonNullable<RehearsalLiveContext["strategyOptions"]>[number]["options"][number];

function LiveBanner({ live }: { live: RehearsalLiveContext }) {
  return (
    <section className="grid gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4 text-sm md:grid-cols-4">
      <div>
        <div className="text-caption">Crux · 数据源 {live.source}</div>
        <div className="font-medium text-[var(--color-accent)]">{live.crux}</div>
      </div>
      <div>
        <div className="text-caption">Runway · Robust</div>
        <div>
          {live.runwayMonths} 月 · R {live.robustOverall}
        </div>
      </div>
      <div>
        <div className="text-caption">StratDiff · 刻意率</div>
        <div>
          {live.diffCount} 条 · WORKING {live.workingSnapshotRate}%
        </div>
      </div>
      <div>
        <div className="text-caption">HardBlock</div>
        <div className={live.hardBlock ? "text-[var(--signal-red)]" : "text-[var(--signal-green)]"}>
          {live.hardBlock ?? "无活跃否决"}
        </div>
      </div>
    </section>
  );
}

function strategyPrintHref(option: { key: string; orgUnitId: string } | undefined): string {
  if (!option) return "/print/panorama";
  const params = new URLSearchParams({ source: "rehearsal", orgUnitId: option.orgUnitId });
  if (option.key.startsWith("snapshot:")) params.set("snapshotId", option.key.slice("snapshot:".length));
  return `/print/panorama?${params.toString()}`;
}

function StrategyDeckPicker({
  live,
  onPrintHrefChange,
  onSelectionChange,
}: {
  live: RehearsalLiveContext;
  onPrintHrefChange: (href: string) => void;
  onSelectionChange: (option: StrategyDeckOption | undefined) => void;
}) {
  const orgs = useMemo(() => live.strategyOptions ?? [], [live.strategyOptions]);
  const initialOrgId = live.strategyDeckMeta?.orgUnitId ?? orgs[0]?.id ?? "";
  const initialKey = live.strategyDeckMeta?.selectionKey ?? orgs.find((org) => org.id === initialOrgId)?.options[0]?.key ?? "";
  const [orgUnitId, setOrgUnitId] = useState(initialOrgId);
  const [selectionKey, setSelectionKey] = useState(initialKey);

  const selectedOrg = useMemo(
    () => orgs.find((org) => org.id === orgUnitId) ?? orgs[0],
    [orgUnitId, orgs],
  );
  const versions = selectedOrg?.options ?? [];
  const selectedVersion = versions.find((option) => option.key === selectionKey) ?? versions[0];
  const isCurrentSelection = selectionKey === live.strategyDeckMeta?.selectionKey;

  function changeOrg(nextOrgUnitId: string) {
    const nextOrg = orgs.find((org) => org.id === nextOrgUnitId);
    const nextVersion = nextOrg?.options[0];
    setOrgUnitId(nextOrgUnitId);
    setSelectionKey(nextVersion?.key ?? "");
    onSelectionChange(nextVersion);
    onPrintHrefChange(strategyPrintHref(nextVersion));
  }

  function changeVersion(nextSelectionKey: string) {
    const nextVersion = versions.find((option) => option.key === nextSelectionKey);
    setSelectionKey(nextSelectionKey);
    onSelectionChange(nextVersion);
    onPrintHrefChange(strategyPrintHref(nextVersion));
  }

  function applySelection() {
    if (!selectedVersion) return;
    window.location.href = selectedVersion.href;
  }

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">投屏战略选择</h3>
          <p className="mt-1 text-caption">
            先选部门和版本，再进入投屏；投屏页会锁定这份战略。
          </p>
        </div>
        {live.strategyDeckMeta ? (
          <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs text-[var(--color-accent)]">
            当前：{live.strategyDeckMeta.orgUnitName} · {live.strategyDeckMeta.versionLabel}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
        <label className="text-caption">
          部门
          <Select
            fullWidth
            value={orgUnitId}
            onChange={(e) => changeOrg(e.target.value)}
            className="mt-1"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} · {org.options.length} 版
              </option>
            ))}
          </Select>
        </label>
        <label className="text-caption">
          战略版本
          <Select
            fullWidth
            value={selectedVersion?.key ?? ""}
            onChange={(e) => changeVersion(e.target.value)}
            className="mt-1"
          >
            {versions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <button
          type="button"
          disabled={!selectedVersion || isCurrentSelection}
          onClick={applySelection}
          className="rounded border border-[var(--color-accent)]/40 px-4 py-2 text-sm text-[var(--color-accent)] disabled:opacity-40"
        >
          {isCurrentSelection ? "已选定" : "确认投屏战略"}
        </button>
      </div>
    </section>
  );
}

export function RehearsalWalkthrough({
  live,
  autoOpenSetup = false,
}: {
  live: RehearsalLiveContext;
  autoOpenSetup?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [present, setPresent] = useState(false);
  const [setupOpen, setSetupOpen] = useState(autoOpenSetup);
  const [projectionSelection, setProjectionSelection] = useState<ProjectionSelection | null>(null);
  const currentOption = live.strategyOptions
    ?.flatMap((org) => org.options)
    .find((option) => option.key === live.strategyDeckMeta?.selectionKey);
  const [printHref, setPrintHref] = useState(() => strategyPrintHref(currentOption));
  const [selectedProjectionOption, setSelectedProjectionOption] = useState<StrategyDeckOption | undefined>(currentOption);
  const updatePrintHref = useCallback((href: string) => setPrintHref(href), []);
  const step = Q3_REHEARSAL_AGENDA[active];
  const progress = Math.round(((active + 1) / Q3_REHEARSAL_AGENDA.length) * 100);
  const launchAction = resolveProjectionLaunch(
    live.strategyDeckMeta?.selectionKey,
    selectedProjectionOption,
  );
  const currentDeckHasContent = (live.strategySlides?.length ?? 0) > 0 || (live.strategyAttachments?.length ?? 0) > 0;

  function openProjectionSetup() {
    if (launchAction.kind === "navigate") {
      window.location.href = launchAction.href;
      return;
    }
    setSetupOpen(true);
  }

  if (present && projectionSelection) {
    return (
      <RehearsalPresentMode
        initialStep={active}
        live={live}
        projectionSelection={projectionSelection}
        onExit={() => setPresent(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={typography.eyebrow}>Walkthrough · 环节 {active + 1}/{Q3_REHEARSAL_AGENDA.length}</p>
          <h2 className={`${typography.h2} text-[var(--color-accent)]`}>{step.title}</h2>
          <p className={typography.caption}>
            总时长 {REHEARSAL_TOTAL_MIN} 分钟 · 6 环节 · 30 人核心层 · 实时数据驱动
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openProjectionSetup}
            disabled={!live.strategyDeckMeta || !selectedProjectionOption || (launchAction.kind === "open" && !currentDeckHasContent)}
            className="rounded bg-[var(--color-accent)]/20 px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 disabled:opacity-40"
          >
            进入投屏模式 →
          </button>
          <Link
            href={printHref}
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

      <StrategyDeckPicker
        live={live}
        onPrintHrefChange={updatePrintHref}
        onSelectionChange={setSelectedProjectionOption}
      />

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
            <div className="text-xs tracking-wide text-[var(--color-text-muted)]">
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
      {setupOpen ? (
        <PresentationSetupModal
          generatedSlideCount={live.strategySlides?.length ?? 0}
          attachments={live.strategyAttachments ?? []}
          onClose={() => setSetupOpen(false)}
          onStart={(selection) => {
            setProjectionSelection(selection);
            setSetupOpen(false);
            setPresent(true);
          }}
        />
      ) : null}
    </div>
  );
}
