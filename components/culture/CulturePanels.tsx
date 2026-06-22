import type { ReactNode } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/ui/KpiTile";
import { typography } from "@/lib/brand/typography";
import { stacks } from "@/lib/brand/tokens";
import {
  BEHAVIOR_GUIDELINES,
  CI_CONTINUOUS_IMPROVEMENT,
  CORE_VALUES_INTRO,
  FOUR_SATISFACTION_PILLARS,
  HANDBOOK_MISSION,
  HANDBOOK_VISION,
  type CultureHandbookContent,
  VALUES_AWARD_CATALOG,
  VALUES_AWARD_WINNERS,
  VALUES_UNDERSTANDING_INTRO,
  VALUES_UNDERSTANDING_RECORDS,
} from "@/lib/culture/content";
import { DOCTRINES } from "@/lib/constants";
import type { NorthStar } from "@/lib/compass/types";

const DOCTRINE_COLORS = [stacks.cap.color, stacks.prod.color, stacks.gtm.color] as const;

const PILLAR_COLORS = [
  "var(--bsc-financial)",
  "var(--bsc-learning)",
  "var(--bsc-customer)",
  "var(--bsc-process)",
] as const;

function defaultHandbook(): CultureHandbookContent {
  return {
    doctrines: DOCTRINES.map((d) => ({ ...d })),
    fourSatisfactionPillars: [...FOUR_SATISFACTION_PILLARS],
    coreValuesIntro: {
      headline: CORE_VALUES_INTRO.headline,
      body: CORE_VALUES_INTRO.body,
      principles: [...CORE_VALUES_INTRO.principles],
      decisionTest: CORE_VALUES_INTRO.decisionTest,
    },
    behaviorGuidelines: BEHAVIOR_GUIDELINES.map((g) => ({
      id: g.id,
      title: g.title,
      items: [...g.items],
    })),
  };
}

export function MissionVisionPanel({
  northStar,
  action,
}: {
  northStar: NorthStar | null;
  action?: ReactNode;
}) {
  const mission = northStar?.mission ?? HANDBOOK_MISSION;
  const vision = northStar?.vision ?? HANDBOOK_VISION;
  const targetYear = northStar?.targetYear;

  return (
    <SectionCard title="使命愿景" subtitle="North Star · 文化手册同源" accent="gold" action={action}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--surface-border)] bg-black/[0.02] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">使命 · 为何存在</p>
          <p className={`${typography.body} mt-3 text-[var(--color-text-primary)]`}>{mission}</p>
        </div>
        <div className="rounded-xl border border-[var(--surface-border)] bg-black/[0.02] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            愿景{targetYear ? ` · ${targetYear}` : ""} · 渴望抵达的远方
          </p>
          <p className={`${typography.body} mt-3 text-[var(--color-text-secondary)]`}>{vision}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-caption">
        <Link href="/compass" className="text-[var(--color-text-muted)] hover:underline">
          战略罗盘 · 里程碑与前提 →
        </Link>
        <Link href="/strategy" className="text-[var(--color-text-muted)] hover:underline">
          董事会一页纸 →
        </Link>
      </div>
    </SectionCard>
  );
}

export function DoctrinesPanel({ handbook }: { handbook?: CultureHandbookContent }) {
  const doctrines = handbook?.doctrines ?? defaultHandbook().doctrines;
  return (
    <SectionCard title="三大信条" subtitle="Doctrine · 精神审计，不打分" accent="green">
      <div className="grid gap-4 lg:grid-cols-3">
        {doctrines.map((d, i) => (
          <article
            key={d.en}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-5 py-4"
            style={{ borderTopWidth: 3, borderTopColor: DOCTRINE_COLORS[i] }}
          >
            <p className="font-data text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: DOCTRINE_COLORS[i] }}>
              {d.en}
            </p>
            <h3 className={`${typography.h3} mt-2`}>{d.zh}</h3>
            <p className={`${typography.caption} mt-2`}>{d.hint}</p>
            <p className="mt-4 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-[var(--color-text-muted)]">
              自检：{d.scenario}
            </p>
          </article>
        ))}
      </div>
      <p className={`${typography.caption} mt-5`}>
        每笔重大决策须挂 Doctrine 审计 · 见{" "}
        <Link href="/gates" className="text-[var(--color-accent)] hover:underline">
          战略会准入
        </Link>
      </p>
    </SectionCard>
  );
}

export function CoreValuesPanel({ handbook }: { handbook?: CultureHandbookContent }) {
  const h = handbook ?? defaultHandbook();
  const intro = h.coreValuesIntro;
  const pillars = h.fourSatisfactionPillars;
  return (
    <SectionCard title="四个满意" subtitle="核心价值观 · 系统最优，非零和博弈" accent="gold">
      <p className={`${typography.body} text-[var(--color-text-secondary)]`}>{intro.body}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {pillars.map((label, i) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-3 text-center"
            style={{ borderBottomWidth: 3, borderBottomColor: PILLAR_COLORS[i] }}
          >
            <p className="text-sm font-semibold" style={{ color: PILLAR_COLORS[i] }}>
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className={`${typography.h3} mt-5 text-[var(--color-accent)]`}>{intro.headline}</p>
      <ul className="mt-3 space-y-2">
        {intro.principles.map((p) => (
          <li key={p} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <blockquote className="mt-5 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.05] px-4 py-3 text-sm italic text-[var(--color-text-primary)]">
        决策自检：{intro.decisionTest}
      </blockquote>
    </SectionCard>
  );
}

export function BehaviorGuidelinesPanel({ handbook }: { handbook?: CultureHandbookContent }) {
  const guidelines = handbook?.behaviorGuidelines ?? defaultHandbook().behaviorGuidelines;
  return (
    <SectionCard title="六项基本原则" subtitle="行为准则 · 抵达四个满意的核心路径" accent="sky">
      <p className={`${typography.caption} mb-4`}>
        将抽象的价值理念转化为具体可操作的行为指南——让每一位员工都知道在日常工作中「该如何做」。
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guidelines.map((g) => (
          <article
            key={g.id}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-4"
          >
            <p className="font-data text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              原则 {g.id}
            </p>
            <h3 className={`${typography.h3} mt-1.5`}>{g.title}</h3>
            <ul className="mt-3 space-y-2">
              {g.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="mt-0.5 shrink-0 text-[var(--color-accent)]" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

export function ValuesAwardPanel() {
  return (
    <SectionCard title="价值观评选大奖" subtitle="七大奖项 · 让优秀行为被看见" accent="gold">
      <p className={`${typography.caption} mb-4`}>
        「四个满意」是行为准则，更是员工成长与企业长期发展的核心逻辑。符合价值观的行为应得到表彰和肯定。
      </p>
      <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)] bg-black/[0.02]">
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">奖项名称</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">核心表彰标准</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {VALUES_AWARD_CATALOG.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-accent)]">{a.name}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{a.criteria}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">近期获奖公示</p>
        {VALUES_AWARD_WINNERS.map((w) => (
          <article
            key={w.id}
            className="rounded-xl border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent-gold)]/[0.06] to-transparent px-5 py-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-data text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                {w.period} · {w.year}
              </p>
              {w.awardName !== "—" ? (
                <span className="rounded-full border border-[var(--surface-border)] px-2.5 py-0.5 text-xs">{w.awardName}</span>
              ) : null}
            </div>
            <h3 className={`${typography.h3} mt-2`}>
              {w.winner === "—" ? "待录入" : w.winner}
              {w.unit !== "—" ? (
                <span className="ml-2 text-base font-normal text-[var(--color-text-muted)]">· {w.unit}</span>
              ) : null}
            </h3>
            <p className={`${typography.body} mt-2 text-[var(--color-text-secondary)]`}>{w.citation}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

export function ValuesUnderstandingPanel() {
  return (
    <SectionCard title="理解价值观公示" subtitle="典型案例 · 全员可见" accent="green">
      <p className={`${typography.body} mb-4 text-[var(--color-text-secondary)]`}>{VALUES_UNDERSTANDING_INTRO}</p>
      <ul className="divide-y divide-[var(--surface-border)] rounded-xl border border-[var(--surface-border)]">
        {VALUES_UNDERSTANDING_RECORDS.map((r) => (
          <li key={r.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time className="font-data text-xs text-[var(--color-text-muted)]">{r.date}</time>
              {r.unit !== "—" ? <span className="text-xs text-[var(--color-text-muted)]">{r.unit}</span> : null}
              {r.relatedPrinciple ? (
                <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {r.relatedPrinciple}
                </span>
              ) : null}
            </div>
            <h3 className={`${typography.h3} mt-1`}>{r.title}</h3>
            <p className={`${typography.body} mt-2 text-[var(--color-text-secondary)]`}>{r.summary}</p>
            {r.author !== "—" ? <p className={`${typography.caption} mt-2`}>发布：{r.author}</p> : null}
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-xl border border-dashed border-[var(--surface-border-strong)] bg-black/[0.02] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {CI_CONTINUOUS_IMPROVEMENT.title}
        </p>
        <p className={`${typography.body} mt-2 text-[var(--color-text-secondary)]`}>{CI_CONTINUOUS_IMPROVEMENT.body}</p>
        <ul className="mt-3 space-y-1.5">
          {CI_CONTINUOUS_IMPROVEMENT.channels.map((c) => (
            <li key={c} className="text-sm text-[var(--color-text-muted)]">
              · {c}
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

export function CultureLinksBar() {
  const links = [
    { href: "/compass", label: "战略罗盘" },
    { href: "/decode", label: "战略解码" },
    { href: "/gates", label: "Gate 清单" },
    { href: "/monitor/health", label: "集团健康" },
  ] as const;

  return (
    <nav
      className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-5 py-3 text-sm"
      aria-label="文化相关模块"
    >
      <span className="mr-2 text-xs text-[var(--color-text-muted)]">相关模块</span>
      {links.map((link, i) => (
        <span key={link.href} className="inline-flex items-center">
          {i > 0 ? <span className="mx-2 text-[var(--color-text-muted)]">·</span> : null}
          <Link
            href={link.href}
            className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
