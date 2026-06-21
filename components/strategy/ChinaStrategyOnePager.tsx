"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  ChinaStrategySummaryData,
  ColumnWidths,
  StrategySubmodule,
} from "@/lib/strategy/china-strategy-summary";
import {
  columnGridTemplate,
  normalizeChinaStrategyContent,
  normalizeColumnWidths,
} from "@/lib/strategy/china-strategy-summary";
import type { OnePagerRecord } from "@/lib/strategy/one-pager-store";
import { renderSimpleMarkdown } from "@/lib/strategy/simple-markdown";
import {
  type OnePagerRevision,
  validateOnePagerBeforeApprove,
} from "@/lib/strategy/one-pager-validation";
import {
  FlowArrowLarge,
  RhauttWordmark,
} from "@/components/strategy/china-strategy-icons";
import { PlacedIconLayer } from "@/components/strategy/PlacedIconLayer";

type Accent = "neutral" | "invest" | "innovate" | "deliver" | "measure";

const MIDDLE_ACCENT: Record<string, Accent> = {
  "mid-1": "invest",
  "mid-2": "innovate",
  "mid-3": "deliver",
};

function fld(on: boolean) {
  return on ? "ppt-field" : "";
}

function BilingualLine({
  en,
  zh,
  editable,
  className,
  onEnChange,
  onZhChange,
  underline,
  enPlaceholder,
  zhPlaceholder,
  as: Tag = "span",
  id,
}: {
  en: string;
  zh: string;
  editable: boolean;
  className?: string;
  onEnChange?: (v: string) => void;
  onZhChange?: (v: string) => void;
  underline?: boolean;
  enPlaceholder?: string;
  zhPlaceholder?: string;
  as?: "span" | "h1" | "h2" | "div";
  id?: string;
}) {
  const cls = ["ppt-bi-line", underline ? "ppt-bi-line--underline" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  if (editable) {
    return (
      <Tag id={id} className={cls}>
        <input
          className={`ppt-bi-line__en ${fld(true)}`}
          value={en}
          size={Math.max(6, en.length + 1)}
          placeholder={enPlaceholder}
          onChange={(e) => onEnChange?.(e.target.value)}
        />
        <span className="ppt-bi-line__sep"> / </span>
        <input
          className={`ppt-bi-line__zh ${fld(true)}`}
          value={zh}
          size={Math.max(4, zh.length + 1)}
          placeholder={zhPlaceholder}
          onChange={(e) => onZhChange?.(e.target.value)}
        />
      </Tag>
    );
  }

  if (!en && !zh) return null;

  return (
    <Tag id={id} className={cls}>
      {en ? <span className="ppt-bi-line__en">{en}</span> : null}
      {en && zh ? <span className="ppt-bi-line__sep"> / </span> : null}
      {zh ? <span className="ppt-bi-line__zh">{zh}</span> : null}
    </Tag>
  );
}

function ColTitle({
  en,
  zh,
  editable,
  onEnChange,
  onZhChange,
}: {
  en: string;
  zh: string;
  editable: boolean;
  onEnChange: (v: string) => void;
  onZhChange: (v: string) => void;
}) {
  if (editable) {
    return (
      <div className="ppt-col-title">
        <BilingualLine
          as="span"
          className="ppt-col-title__line"
          en={en}
          zh={zh}
          editable
          onEnChange={onEnChange}
          onZhChange={onZhChange}
        />
      </div>
    );
  }
  return (
    <h2 className="ppt-col-title">
      <BilingualLine as="span" className="ppt-col-title__line" en={en} zh={zh} editable={false} />
    </h2>
  );
}

function MeasurementColTitle({
  titleEn,
  titleZh,
  period,
  editable,
  onTitleEnChange,
  onTitleZhChange,
  onPeriodChange,
}: {
  titleEn: string;
  titleZh: string;
  period: string;
  editable: boolean;
  onTitleEnChange: (v: string) => void;
  onTitleZhChange: (v: string) => void;
  onPeriodChange: (v: string) => void;
}) {
  if (editable) {
    return (
      <div className="ppt-col-title ppt-col-title--with-period">
        <BilingualLine
          as="span"
          className="ppt-col-title__line"
          en={titleEn}
          zh={titleZh}
          editable
          onEnChange={onTitleEnChange}
          onZhChange={onTitleZhChange}
        />
        <span className="ppt-col-title__paren ppt-col-title__paren--light"> (</span>
        <input
          className={`ppt-col-title__period ${fld(true)}`}
          value={period}
          size={Math.max(7, period.length + 1)}
          placeholder="2020-2025"
          onChange={(e) => onPeriodChange(e.target.value)}
        />
        <span className="ppt-col-title__paren ppt-col-title__paren--light">)</span>
      </div>
    );
  }

  return (
    <h2 className="ppt-col-title ppt-col-title--with-period">
      <BilingualLine as="span" className="ppt-col-title__line" en={titleEn} zh={titleZh} editable={false} />
      {period ? (
        <>
          <span className="ppt-col-title__paren ppt-col-title__paren--light"> (</span>
          <span className="ppt-col-title__period">{period}</span>
          <span className="ppt-col-title__paren ppt-col-title__paren--light">)</span>
        </>
      ) : null}
    </h2>
  );
}

function ColumnResizer({
  label,
  onDrag,
}: {
  label: string;
  onDrag: (deltaPct: number) => void;
}) {
  const startX = useRef(0);
  const dragging = useRef(false);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const body = e.currentTarget.closest(".china-strategy-one-pager__body") as HTMLElement | null;
    const w = body?.clientWidth ?? 1024;
    const deltaPct = ((e.clientX - startX.current) / w) * 100;
    startX.current = e.clientX;
    onDrag(deltaPct);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      className="ppt-col-resizer print:hidden"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}

function SubmoduleBox({
  mod,
  editable,
  accent = "neutral",
  onChange,
}: {
  mod: StrategySubmodule;
  editable: boolean;
  accent?: Accent;
  onChange: (next: StrategySubmodule) => void;
}) {
  const hasContent = Boolean(mod.content.trim());
  const emptyApproved = !editable && !hasContent;

  return (
    <div className="ppt-box ppt-box--sub" data-accent={accent}>
      <div className="ppt-submodule-head">
        <BilingualLine
          en={mod.title}
          zh={mod.titleZh}
          editable={editable}
          className="ppt-submodule-title"
          underline={mod.titleUnderline}
          enPlaceholder="English"
          zhPlaceholder="中文"
          onEnChange={(v) => onChange({ ...mod, title: v })}
          onZhChange={(v) => onChange({ ...mod, titleZh: v })}
        />
      </div>
      <div className="ppt-submodule-body">
        {editable && mod.hint ? <p className="ppt-submodule-hint">{mod.hint}</p> : null}
        <div
          className={[
            "ppt-submodule-content",
            emptyApproved ? "ppt-submodule-content--approved-empty" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!emptyApproved ? (
            editable ? (
              <textarea
                className={`ppt-submodule-content__editor ${fld(true)} ppt-body w-full`}
                value={mod.content}
                placeholder="支持 Markdown：- 列表、**加粗**（超出可模块内滚动）"
                onChange={(e) => onChange({ ...mod, content: e.target.value })}
              />
            ) : hasContent ? (
              <div className="ppt-submodule-content__editor ppt-body ppt-md">
                {renderSimpleMarkdown(mod.content)}
              </div>
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}

function patchModules(
  modules: StrategySubmodule[],
  id: string,
  next: StrategySubmodule
): StrategySubmodule[] {
  return modules.map((m) => (m.id === id ? next : m));
}

function RevisionPanel({ revisions, onClose }: { revisions: OnePagerRevision[]; onClose: () => void }) {
  return (
    <div className="ppt-revisions print:hidden">
      <div className="ppt-revisions__head">
        <strong>审批 / 修订留痕</strong>
        <button type="button" className="ppt-btn ppt-btn--ghost" onClick={onClose}>
          关闭
        </button>
      </div>
      {revisions.length === 0 ? (
        <p className="ppt-revisions__empty">暂无历史记录（需数据库）</p>
      ) : (
        <ul className="ppt-revisions__list">
          {revisions.map((r) => (
            <li key={r.id} className="ppt-revisions__item">
              <div className="ppt-revisions__meta">
                <span className="ppt-revisions__action">{r.action}</span>
                <time>{new Date(r.createdAt).toLocaleString("zh-CN")}</time>
                {r.actor ? <span>· {r.actor}</span> : null}
              </div>
              {r.diff ? (
                <>
                  <p className="ppt-revisions__summary">{r.diff.summary}</p>
                  {r.diff.changedModules.slice(0, 4).map((m) => (
                    <details key={m.moduleId} className="ppt-revisions__diff">
                      <summary>{m.label}</summary>
                      {m.before ? <p className="ppt-revisions__before">前：{m.before.slice(0, 200)}</p> : null}
                      {m.after ? <p className="ppt-revisions__after">后：{m.after.slice(0, 200)}</p> : null}
                    </details>
                  ))}
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ONE_PAGER_LOCAL_KEY = "stratos:china-strategy-one-pager";

function loadLocalOnePager(): ChinaStrategySummaryData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONE_PAGER_LOCAL_KEY);
    if (!raw) return null;
    return normalizeChinaStrategyContent(JSON.parse(raw) as ChinaStrategySummaryData);
  } catch {
    return null;
  }
}

function saveLocalOnePager(content: ChinaStrategySummaryData) {
  localStorage.setItem(ONE_PAGER_LOCAL_KEY, JSON.stringify(content));
}

type Props = { initial: OnePagerRecord };

export function ChinaStrategyOnePager({ initial }: Props) {
  const [record, setRecord] = useState(initial);
  const [data, setData] = useState<ChinaStrategySummaryData>(() => {
    const base = normalizeChinaStrategyContent(initial.content);
    if (initial.id === "demo") {
      return loadLocalOnePager() ?? base;
    }
    return base;
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<OnePagerRevision[]>([]);
  const editable = record.status === "DRAFT";

  const patch = useCallback((p: Partial<ChinaStrategySummaryData>) => {
    setData((d) => ({ ...d, ...p }));
  }, []);

  const resizeColumns = useCallback((handle: 0 | 1, deltaPct: number) => {
    setData((d) => {
      const w = normalizeColumnWidths(d.columnWidths);
      let next: ColumnWidths;
      if (handle === 0) {
        const left = Math.max(15, Math.min(w[0] + deltaPct, 100 - 15 - w[2]));
        next = [left, 100 - left - w[2], w[2]];
      } else {
        const right = Math.max(15, Math.min(w[2] - deltaPct, 100 - 15 - w[0]));
        next = [w[0], 100 - w[0] - right, right];
      }
      return { ...d, columnWidths: normalizeColumnWidths(next) };
    });
  }, []);

  const resetColumnWidths = useCallback(() => {
    patch({ columnWidths: normalizeColumnWidths([29, 38, 29]) });
  }, [patch]);

  useEffect(() => {
    if (!presenting) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPresenting(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting]);

  async function loadRevisions() {
    try {
      const res = await fetch("/api/strategy/one-pager/revisions");
      const json = (await res.json()) as { revisions?: OnePagerRevision[] };
      setRevisions(json.revisions ?? []);
      setShowRevisions(true);
    } catch {
      setRevisions([]);
      setShowRevisions(true);
    }
  }

  async function saveDraft() {
    const payload = normalizeChinaStrategyContent({
      ...data,
      footerBrand: "Rhautt",
      pageNumber: data.pageNumber,
    });
    if (!payload.title.trim() && !payload.titleZh.trim()) {
      setMsg("请填写页标题（中文或英文至少一项）");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/strategy/one-pager", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload }),
      });
      const json = (await res.json()) as OnePagerRecord & { error?: string };
      if (!res.ok) {
        if (res.status === 503 || json.error === "DATABASE_UNAVAILABLE") {
          saveLocalOnePager(payload);
          setData(payload);
          setMsg("已保存到浏览器（数据库未连接）");
          return;
        }
        throw new Error(json.error ?? "保存失败");
      }
      localStorage.removeItem(ONE_PAGER_LOCAL_KEY);
      setRecord(json);
      setData(normalizeChinaStrategyContent(json.content));
      setMsg("草稿已保存");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    const validation = validateOnePagerBeforeApprove(data);
    if (!validation.ok) {
      setMsg(validation.errors.join("；"));
      return;
    }
    if (validation.warnings.length) {
      const ok = window.confirm(`${validation.warnings.join("\n")}\n\n仍要审批入库？`);
      if (!ok) return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const payload = { ...data, footerBrand: "Rhautt", pageNumber: data.pageNumber };
      const res = await fetch("/api/strategy/one-pager/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload, approvedBy: "CEO" }),
      });
      const json = (await res.json()) as OnePagerRecord & { error?: string; validation?: { warnings: string[] } };
      if (!res.ok) throw new Error(json.error ?? "审批失败");
      setRecord(json);
      setData(normalizeChinaStrategyContent(json.content));
      setMsg("已审批入库");
      void loadRevisions();
    } catch (e) {
      const err = e instanceof Error ? e.message : "审批失败";
      setMsg(err === "DATABASE_UNAVAILABLE" ? "数据库未连接，无法审批入库" : err);
    } finally {
      setBusy(false);
    }
  }

  async function revise() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/strategy/one-pager/revise", { method: "POST" });
      const json = (await res.json()) as OnePagerRecord & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "修订失败");
      setRecord(json);
      setMsg("已进入修订模式（草稿）");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "修订失败");
    } finally {
      setBusy(false);
    }
  }

  const pageTitleEn = data.title.trim() || "Strategy Summary";
  const pageTitleZh = data.titleZh.trim() || "战略汇总";

  return (
    <div className={`strategy-one-pager-page ${presenting ? "strategy-one-pager-page--present" : ""} ${editable ? "strategy-one-pager-page--draft" : ""}`}>
      {!presenting && (
        <div className="ppt-toolbar print:hidden">
          <div className="ppt-toolbar__left">
            <span className={`ppt-status ${record.status === "APPROVED" ? "ppt-status--approved" : "ppt-status--draft"}`}>
              {record.status === "APPROVED" ? "已审批" : "草稿"}
            </span>
            {editable && (
              <span className="ppt-toolbar__hint">
                画布 1024×665 · 拖拽栏间竖线调宽 · 右上角 Icon 拖到画布
              </span>
            )}
            {msg && <span className="ppt-toolbar__msg">{msg}</span>}
          </div>
          <div className="ppt-toolbar__actions">
            {editable && (
              <>
                <button type="button" disabled={busy} onClick={saveDraft} className="ppt-btn ppt-btn--ghost">
                  保存草稿
                </button>
                <button type="button" disabled={busy} onClick={approve} className="ppt-btn ppt-btn--primary">
                  审批入库
                </button>
              </>
            )}
            {record.status === "APPROVED" && (
              <button type="button" disabled={busy} onClick={revise} className="ppt-btn ppt-btn--ghost">
                申请修订
              </button>
            )}
            <button type="button" onClick={() => setPresenting(true)} className="ppt-btn ppt-btn--ghost">
              演示模式
            </button>
            <button type="button" onClick={loadRevisions} className="ppt-btn ppt-btn--ghost">
              变更留痕
            </button>
            <a href="/brand/china-strategy-reference.png" target="_blank" rel="noreferrer" className="ppt-btn ppt-btn--ghost">
              查看原稿
            </a>
            <button type="button" onClick={() => window.print()} className="ppt-btn ppt-btn--ghost">
              打印
            </button>
            {editable && (
              <button type="button" onClick={resetColumnWidths} className="ppt-btn ppt-btn--ghost">
                重置栏宽
              </button>
            )}
          </div>
        </div>
      )}

      {presenting && (
        <button type="button" className="ppt-present-exit print:hidden" onClick={() => setPresenting(false)}>
          退出演示 (Esc)
        </button>
      )}

      {showRevisions && !presenting ? (
        <RevisionPanel revisions={revisions} onClose={() => setShowRevisions(false)} />
      ) : null}

      <div className="strategy-viewport">
        <div className="ppt-stage">
          <article className="china-strategy-one-pager" aria-labelledby="ppt-title">
            <header className="china-strategy-one-pager__header">
              {editable ? (
                <BilingualLine
                  as="h1"
                  id="ppt-title"
                  className="china-strategy-one-pager__title"
                  en={data.title}
                  zh={data.titleZh}
                  editable
                  enPlaceholder="Strategy Summary"
                  zhPlaceholder="战略汇总"
                  onEnChange={(v) => patch({ title: v })}
                  onZhChange={(v) => patch({ titleZh: v })}
                />
              ) : (
                <h1 id="ppt-title" className="china-strategy-one-pager__title">
                  <BilingualLine
                    en={pageTitleEn}
                    zh={pageTitleZh}
                    editable={false}
                    className="ppt-page-title-line"
                  />
                </h1>
              )}
            </header>

            <div
              className="china-strategy-one-pager__body"
              style={{ gridTemplateColumns: columnGridTemplate(data.columnWidths, editable) }}
            >
              <div className="ppt-col ppt-col-left">
                <ColTitle
                  en={data.leftColumnTitle}
                  zh={data.leftColumnTitleZh}
                  editable={editable}
                  onEnChange={(v) => patch({ leftColumnTitle: v })}
                  onZhChange={(v) => patch({ leftColumnTitleZh: v })}
                />
                <div className="ppt-col-modules">
                  {data.leftModules.map((mod) => (
                    <SubmoduleBox
                      key={mod.id}
                      mod={mod}
                      accent="neutral"
                      editable={editable}
                      onChange={(next) => patch({ leftModules: patchModules(data.leftModules, mod.id, next) })}
                    />
                  ))}
                </div>
              </div>

              {editable ? (
                <ColumnResizer label="调整左栏与中栏宽度" onDrag={(d) => resizeColumns(0, d)} />
              ) : null}

              <FlowArrowLarge />

              <div className="ppt-col ppt-col-middle">
                <ColTitle
                  en={data.middleColumnTitle}
                  zh={data.middleColumnTitleZh}
                  editable={editable}
                  onEnChange={(v) => patch({ middleColumnTitle: v })}
                  onZhChange={(v) => patch({ middleColumnTitleZh: v })}
                />
                <div className="ppt-col-modules">
                  {data.middleModules.map((mod) => (
                    <SubmoduleBox
                      key={mod.id}
                      mod={mod}
                      accent={MIDDLE_ACCENT[mod.id] ?? "neutral"}
                      editable={editable}
                      onChange={(next) => patch({ middleModules: patchModules(data.middleModules, mod.id, next) })}
                    />
                  ))}
                </div>
              </div>

              {editable ? (
                <ColumnResizer label="调整中栏与右栏宽度" onDrag={(d) => resizeColumns(1, d)} />
              ) : null}

              <FlowArrowLarge />

              <div className="ppt-col ppt-col-right">
                <MeasurementColTitle
                  titleEn={data.rightColumnTitle}
                  titleZh={data.rightColumnTitleZh}
                  period={data.periodLabel}
                  editable={editable}
                  onTitleEnChange={(v) => patch({ rightColumnTitle: v })}
                  onTitleZhChange={(v) => patch({ rightColumnTitleZh: v })}
                  onPeriodChange={(v) => patch({ periodLabel: v })}
                />
                <div className="ppt-col-modules">
                  {data.rightModules.map((mod) => (
                    <SubmoduleBox
                      key={mod.id}
                      mod={mod}
                      accent="measure"
                      editable={editable}
                      onChange={(next) => patch({ rightModules: patchModules(data.rightModules, mod.id, next) })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <footer className="china-strategy-one-pager__footer">
              <RhauttWordmark />
              <div className="ppt-footer-tag">
                {editable ? (
                  <input className={`${fld(true)} ppt-footer-tag__input`} value={data.footerTag} onChange={(e) => patch({ footerTag: e.target.value })} />
                ) : (
                  data.footerTag
                )}
              </div>
              <div className="ppt-footer-page">
                {editable ? (
                  <input className={`${fld(true)} ppt-footer-page__input`} value={String(data.pageNumber)} onChange={(e) => patch({ pageNumber: Number(e.target.value) || 1 })} />
                ) : (
                  data.pageNumber
                )}
              </div>
            </footer>
            <PlacedIconLayer
              icons={data.placedIcons ?? []}
              editable={editable}
              onChange={(placedIcons) => patch({ placedIcons })}
            />
          </article>
        </div>
      </div>
    </div>
  );
}
