"use client";

/**
 * GemPanel — 角色专属审计洞察条 (CEO Gem「帅」样板)。
 * 挂在角色 home 顶部, 把该角色该看的审计项按 风险>变化>建议>待办 排好, 每条带证据引用 + 下钻。
 * 用 B0 原语 (Card/Badge) 渲染, 全部颜色/动效绑 L0 token。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone, Card, CardBody } from "@/components/ui/primitives";

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
interface GemResult {
  persona: string;
  tagline: string;
  period: string;
  headline: string;
  stance?: string;
  cards: InsightCard[];
  counts: Record<Kind, number>;
  drops: number;
  dataSource: string;
}

const KIND_META: Record<Kind, { label: string; tone: BadgeTone; bar: string }> = {
  risk: { label: "风险", tone: "red", bar: "var(--signal-red)" },
  change: { label: "变化", tone: "accent", bar: "var(--color-accent)" },
  advice: { label: "建议", tone: "green", bar: "var(--signal-green)" },
  todo: { label: "待办", tone: "neutral", bar: "var(--color-text-muted)" },
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

  return (
    <Card tone="raised" className="border-l-4 border-l-[var(--color-accent)]">
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] px-2 text-sm font-bold text-white">
              {data?.persona ?? "…"}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {data ? `${data.persona} · ${data.tagline}` : "审计助理"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {status === "loading" ? "审计中…" : data?.headline}
              </p>
            </div>
          </div>
          {data ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {data.counts.risk > 0 ? (
                <Badge tone="red" dot>
                  {data.counts.risk} 风险
                </Badge>
              ) : null}
              {data.counts.change > 0 ? (
                <Badge tone="accent" dot>
                  {data.counts.change} 变化
                </Badge>
              ) : null}
              {data.counts.advice > 0 ? (
                <Badge tone="green" dot>
                  {data.counts.advice} 建议
                </Badge>
              ) : null}
              {data.counts.todo > 0 ? (
                <Badge tone="neutral" dot>
                  {data.counts.todo} 待办
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {status === "loading" ? (
          <div className="mt-3 h-16 animate-pulse rounded-[var(--radius-control)] bg-[var(--surface-raised)]" />
        ) : data && data.cards.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {data.cards.map((c) => {
              const m = KIND_META[c.kind];
              return (
                <li
                  key={c.id}
                  className="rounded-[var(--radius-control)] border border-[var(--surface-border)] bg-[var(--surface-elevated)] p-3"
                  style={{ borderLeft: `3px solid ${m.bar}` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={m.tone}>{m.label}</Badge>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{c.title}</span>
                      </div>
                      {c.detail ? (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{c.detail}</p>
                      ) : null}
                      {c.evidence.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {c.evidence.map((e, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded bg-[var(--surface-raised)] px-1.5 py-0.5 text-[11px]"
                            >
                              <span className="text-[var(--color-text-muted)]">{e.label}</span>
                              <span className="font-medium text-[var(--color-text-primary)]">{e.value}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {c.action ? (
                      <Link
                        href={c.action.href}
                        className="shrink-0 rounded-[var(--radius-control)] border border-[var(--surface-border-strong)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] no-underline transition-colors duration-[var(--motion-fast)] hover:bg-[var(--surface-raised)] hover:text-[var(--color-accent)]"
                      >
                        {c.action.label} →
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">本期无需 CEO 立即处置的审计项。</p>
        )}

        {data && (data.drops > 0 || data.dataSource) ? (
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
            {data.drops > 0 ? `${data.drops} 条数据因缺少可引用证据被丢弃(防幻觉) · ` : ""}
            数据源 {data.dataSource} · 期次 {data.period}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
