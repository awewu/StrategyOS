"use client";

/**
 * GemPanel — 角色专属审计洞察条 (CEO Gem「帅」样板)。
 * 挂在角色 home 顶部, 把该角色该看的审计项按 风险>变化>建议>待办 排好, 每条带证据引用 + 下钻。
 * 用 B0 原语 (Card/Badge) 渲染, 全部颜色/动效绑 L0 token。
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/primitives";

type Kind = "risk" | "change" | "advice" | "todo";

interface Evidence {
  label: string;
  value: string;
  href?: string;
}
interface InsightCard {
  id: string;
  kind: Kind;
  severity: string;
  title: string;
  detail: string;
  evidence: Evidence[];
  action?: { href: string; label: string };
  source: string;
}
interface GemMetric {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "red" | "green" | "accent";
  href?: string;
}
interface GemResult {
  persona: string;
  tagline: string;
  period: string;
  headline: string;
  stance?: string;
  cards: InsightCard[];
  metrics: GemMetric[];
  counts: Record<Kind, number>;
  drops: number;
  dataSource: string;
}

const METRIC_TONE: Record<NonNullable<GemMetric["tone"]>, string> = {
  neutral: "var(--color-text-primary)",
  red: "var(--signal-red-text)",
  green: "var(--signal-green-text)",
  accent: "var(--color-accent)",
};

/** 严重度只编码一次：仅 critical/high 打红标，其余静默——红色只留给真正的风险。 */
const SEVERITY: Record<string, { label: string; loud: boolean }> = {
  critical: { label: "严重", loud: true },
  high: { label: "高", loud: true },
  medium: { label: "", loud: false },
  low: { label: "", loud: false },
  info: { label: "", loud: false },
};

export function GemPanel({ endpoint = "/api/gems/me" }: { endpoint?: string }) {
  const [data, setData] = useState<GemResult | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    fetch(endpoint, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: GemResult) => {
        if (alive) {
          setData(d);
          setStatus("ok");
        }
      })
      .catch(() => {
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [endpoint]);

  if (status === "error") return null;

  const bright = data?.cards.filter((c) => c.kind === "advice" || c.kind === "change") ?? [];
  const dark = data?.cards.filter((c) => c.kind === "risk" || c.kind === "todo") ?? [];
  const metrics = data?.metrics ?? [];
  const hasMetrics = metrics.length > 0;

  return (
    <Card tone="raised" className="border-l-4 border-l-[var(--color-accent)]">
      <CardBody>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {data ? `${data.persona} · ${data.tagline}` : "审计助理"}
          </p>
          {data?.period ? (
            <span className="shrink-0 text-[var(--type-label)] text-[var(--color-text-muted)]">期次 {data.period}</span>
          ) : null}
        </div>

        {status === "loading" ? (
          <div className="mt-4 h-20 animate-pulse rounded-[var(--radius-control)] bg-[var(--surface-raised)]" />
        ) : (
          <div
            className={`mt-4 grid grid-cols-1 gap-4 md:gap-0 ${
              hasMetrics ? "md:grid-cols-3" : "md:grid-cols-2"
            }`}
          >
            <GemColumn title="亮点" color="var(--signal-green)" count={bright.length}>
              {bright.length > 0 ? (
                <ul className="space-y-1">
                  {bright.map((c) => (
                    <InsightRow key={c.id} card={c} />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">暂无亮点</p>
              )}
            </GemColumn>

            <GemColumn title="暗点" color="var(--signal-red)" count={dark.length}>
              {dark.length > 0 ? (
                <ul className="space-y-1">
                  {dark.map((c) => (
                    <InsightRow key={c.id} card={c} />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--signal-green-text)]">无风险项</p>
              )}
            </GemColumn>

            {hasMetrics ? (
              <GemColumn title="FPA · BSC" color="var(--color-accent)">
                <ul className="space-y-1">
                  {metrics.map((m, i) => (
                    <MetricRow key={i} metric={m} />
                  ))}
                </ul>
              </GemColumn>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function GemColumn({
  title,
  color,
  count,
  children,
}: {
  title: string;
  color: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 md:px-5 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-[var(--surface-border)]">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
        <span className="text-[var(--type-label)] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {title}
        </span>
        {typeof count === "number" && count > 0 ? (
          <span className="text-[var(--type-label)] text-[var(--color-text-muted)]">· {count}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * 每条洞察最多 2 行：陈述句（+仅 critical/high 的红标）＋一行合并的 meta。
 * 明细与证据合并为行内文字，不用 chips 盒子；下钻链接悬停/键盘聚焦时浮现。
 */
function InsightRow({ card }: { card: InsightCard }) {
  const sev = SEVERITY[card.severity] ?? SEVERITY.info;
  const evidenceText = (card.evidence ?? [])
    .slice(0, 2)
    .map((e) => `${e.label} ${e.value}`)
    .join(" · ");
  const meta = [card.detail, evidenceText].filter(Boolean).join(" · ");
  return (
    <li className="group rounded-md px-1.5 py-1.5 transition-colors hover:bg-[var(--surface-raised)]">
      <div className="flex items-baseline gap-1.5">
        {sev.loud ? (
          <span className="shrink-0 rounded-sm bg-[var(--signal-red)]/10 px-1 text-[var(--type-label)] font-semibold leading-tight text-[var(--signal-red-text)]">
            {sev.label}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 text-[var(--type-body-sm)] leading-snug text-[var(--color-text-primary)]">
          {card.title}
        </span>
      </div>
      {meta || card.action ? (
        <div className="mt-0.5 flex items-baseline gap-2 text-[var(--type-label)] leading-snug">
          <span className="min-w-0 flex-1 truncate text-[var(--color-text-muted)]" title={meta}>
            {meta}
          </span>
          {card.action ? (
            <Link
              href={card.action.href}
              className="shrink-0 font-medium text-[var(--color-accent)] no-underline opacity-0 transition-opacity hover:underline focus-visible:opacity-100 group-hover:opacity-100"
            >
              {card.action.label} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function MetricRow({ metric }: { metric: GemMetric }) {
  const color = METRIC_TONE[metric.tone ?? "neutral"];
  const body = (
    <div className="flex items-baseline justify-between gap-2 px-1 py-0.5">
      <span className="text-xs text-[var(--color-text-muted)]">{metric.label}</span>
      <span className="text-right">
        <span className="text-[var(--type-body-sm)] font-semibold tabular-nums" style={{ color }}>
          {metric.value}
        </span>
        {metric.hint ? (
          <span className="ml-1.5 text-[var(--type-label)] text-[var(--color-text-muted)]">{metric.hint}</span>
        ) : null}
      </span>
    </div>
  );
  return (
    <li>
      {metric.href ? (
        <Link
          href={metric.href}
          className="block rounded-[var(--radius-control)] no-underline hover:bg-[var(--surface-raised)]"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
