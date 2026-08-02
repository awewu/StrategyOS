"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NorthStarEditModal,
  saveNorthStarToApi,
  type NorthStarForm,
} from "@/components/compass/NorthStarEditModal";
import {
  CultureLinksBar,
  MissionVisionPanel,
} from "@/components/culture/CulturePanels";
import { CultureHandbookEditor } from "@/components/culture/CultureHandbookEditor";
import { WushiPanel } from "@/components/culture/WushiPanel";
import { Input, Textarea } from "@/components/ui/primitives";
import { SectionCard } from "@/components/ui/KpiTile";
import { typography } from "@/lib/brand/typography";
import {
  CI_CONTINUOUS_IMPROVEMENT,
  VALUES_AWARD_CATALOG,
  VALUES_UNDERSTANDING_INTRO,
  type ValuesAwardWinner,
  type ValuesUnderstandingRecord,
} from "@/lib/culture/content";
import type { CultureHandbookContent } from "@/lib/culture/content";
import type { NorthStar } from "@/lib/compass/types";
import type { WushiAssessment } from "@/lib/culture/wushi";

type Tab = "culture" | "awards" | "assessment";

type Props = {
  northStar: NorthStar | null;
  initialHandbook: CultureHandbookContent;
  handbookSource: "database" | "demo";
  initialWinners: ValuesAwardWinner[];
  initialRecords: ValuesUnderstandingRecord[];
  source: "database" | "demo";
  wushi: { assessment: WushiAssessment; source: "database" | "demo" };
};

export function CultureTabs({
  northStar: initialNorthStar,
  initialHandbook,
  handbookSource,
  initialWinners,
  initialRecords,
  source,
  wushi,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("culture");

  const [northStar, setNorthStar] = useState(initialNorthStar);
  const [editNorthStar, setEditNorthStar] = useState(false);
  const [savingNorthStar, setSavingNorthStar] = useState(false);

  const [winners, setWinners] = useState(initialWinners);
  const [records, setRecords] = useState(initialRecords);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = useCallback((text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(null), 3500);
  }, []);

  async function saveAward(w: ValuesAwardWinner) {
    const res = await fetch("/api/culture/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(w),
    });
    const j = (await res.json()) as { winner?: ValuesAwardWinner; error?: string };
    if (!res.ok) throw new Error(j.error ?? "保存失败");
    return j.winner!;
  }

  async function saveRecord(r: ValuesUnderstandingRecord) {
    const res = await fetch("/api/culture/understanding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
    });
    const j = (await res.json()) as { record?: ValuesUnderstandingRecord; error?: string };
    if (!res.ok) throw new Error(j.error ?? "保存失败");
    return j.record!;
  }

  async function handleSaveNorthStar(form: NorthStarForm) {
    setSavingNorthStar(true);
    try {
      const { id } = await saveNorthStarToApi(form, northStar);
      setNorthStar({
        id,
        mission: form.mission,
        vision: form.vision,
        targetYear: form.targetYear,
        revenueTarget: form.revenueTarget,
        profitMarginTarget: form.profitMarginTarget,
        marketPositionDesc: form.marketPositionDesc,
        geographyDesc: form.geographyDesc,
        brandDesc: form.brandDesc,
      });
      setEditNorthStar(false);
      flash("使命愿景已保存");
      router.refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSavingNorthStar(false);
    }
  }

  async function handleSaveAll() {
    setBusy(true);
    try {
      const savedWinners = await Promise.all(
        winners
          .filter((w) => w.winner !== "—" && w.awardName !== "—")
          .map((w) => saveAward(w)),
      );
      const savedRecords = await Promise.all(
        records
          .filter((r) => r.title !== "暂无公示记录")
          .map((r) => saveRecord(r)),
      );
      setWinners(savedWinners.length ? savedWinners : winners);
      setRecords(savedRecords.length ? savedRecords : records);
      setEditing(false);
      flash("文化公示已保存");
    } catch (e) {
      flash(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function addWinner() {
    setWinners((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        year: new Date().getFullYear(),
        period: "年度",
        awardName: "价值观奖",
        winner: "",
        unit: "",
        citation: "",
      },
    ]);
    setEditing(true);
  }

  function addRecord() {
    setRecords((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        title: "",
        unit: "",
        author: "",
        summary: "",
      },
    ]);
    setEditing(true);
  }

  const tabs = [
    { id: "culture", label: "企业文化" },
    { id: "awards", label: "价值观评选" },
    { id: "assessment", label: "组织评估（五事七计）" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] pb-3">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-black/[0.04]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "awards" ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-caption">
              数据源 {source === "database" ? "DB" : "Demo"}
            </span>
            {msg ? <span className="text-xs text-[var(--color-accent)]">{msg}</span> : null}
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSaveAll()}
                  className="stratos-btn stratos-btn--primary"
                >
                  {busy ? "保存中…" : "保存获奖与公示"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="stratos-btn">
                编辑获奖与公示
              </button>
            )}
          </div>
        ) : null}
      </div>

      {tab === "culture" ? (
        <div className="space-y-6">
          <MissionVisionPanel
            northStar={northStar}
            action={
              <button
                type="button"
                onClick={() => setEditNorthStar(true)}
                className="stratos-btn stratos-btn--primary"
              >
                编辑使命愿景
              </button>
            }
          />
          {editNorthStar ? (
            <NorthStarEditModal
              northStar={northStar}
              saving={savingNorthStar}
              onClose={() => setEditNorthStar(false)}
              onSave={(form) => void handleSaveNorthStar(form)}
            />
          ) : null}
          <CultureHandbookEditor initialHandbook={initialHandbook} source={handbookSource} />
          <CultureLinksBar />
        </div>
      ) : null}

      {tab === "awards" ? (
        <div className="space-y-6">
          <SectionCard title="价值观评选大奖" subtitle="七大奖项 · 让优秀行为被看见" accent="teal">
            <p className={`${typography.caption} mb-4`}>
              「四个满意」是行为准则，更是员工成长与企业长期发展的核心逻辑。
            </p>
            <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] bg-black/[0.02]">
                    <th className="px-4 py-3 font-semibold">奖项名称</th>
                    <th className="px-4 py-3 font-semibold">核心表彰标准</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {VALUES_AWARD_CATALOG.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-accent)]">
                        {a.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{a.criteria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">
                  近期获奖公示
                </p>
                {editing ? (
                  <button type="button" onClick={addWinner} className="text-xs text-[var(--color-accent)]">
                    + 新增获奖
                  </button>
                ) : null}
              </div>
              {winners.map((w, i) => (
                <article
                  key={w.id}
                  className="rounded-xl border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent)]/[0.06] to-transparent px-5 py-4"
                >
                  {editing ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={w.period}
                        onChange={(e) =>
                          setWinners((prev) => prev.map((x, j) => (j === i ? { ...x, period: e.target.value } : x)))
                        }
                        placeholder="期次"
                      />
                      <Input
                        type="number"
                        fullWidth
                        inputSize="sm"
                        value={w.year}
                        onChange={(e) =>
                          setWinners((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, year: Number(e.target.value) } : x)),
                          )
                        }
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        className="sm:col-span-2"
                        value={w.awardName}
                        onChange={(e) =>
                          setWinners((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, awardName: e.target.value } : x)),
                          )
                        }
                        placeholder="奖项名称"
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={w.winner}
                        onChange={(e) =>
                          setWinners((prev) => prev.map((x, j) => (j === i ? { ...x, winner: e.target.value } : x)))
                        }
                        placeholder="获奖人/团队"
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={w.unit}
                        onChange={(e) =>
                          setWinners((prev) => prev.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))
                        }
                        placeholder="单位"
                      />
                      <Textarea
                        fullWidth
                        className="sm:col-span-2"
                        rows={2}
                        value={w.citation}
                        onChange={(e) =>
                          setWinners((prev) => prev.map((x, j) => (j === i ? { ...x, citation: e.target.value } : x)))
                        }
                        placeholder="事迹摘要"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-data text-xs font-semibold tracking-wide text-[var(--color-accent)]">
                          {w.period} · {w.year}
                        </p>
                        {w.awardName !== "—" ? (
                          <span className="rounded-full border border-[var(--surface-border)] px-2.5 py-0.5 text-xs">
                            {w.awardName}
                          </span>
                        ) : null}
                      </div>
                      <h3 className={`${typography.h3} mt-2`}>
                        {w.winner === "—" ? "待录入" : w.winner}
                        {w.unit !== "—" ? (
                          <span className="ml-2 text-base font-normal text-[var(--color-text-muted)]">· {w.unit}</span>
                        ) : null}
                      </h3>
                      <p className={`${typography.body} mt-2 text-[var(--color-text-secondary)]`}>{w.citation}</p>
                    </>
                  )}
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="理解价值观公示" subtitle="典型案例 · 全员可见" accent="green">
            <p className={`${typography.body} mb-4 text-[var(--color-text-secondary)]`}>
              {VALUES_UNDERSTANDING_INTRO}
            </p>
            <div className="mb-3 flex justify-end">
              {editing ? (
                <button type="button" onClick={addRecord} className="text-xs text-[var(--color-accent)]">
                  + 新增案例
                </button>
              ) : null}
            </div>
            <ul className="divide-y divide-[var(--surface-border)] rounded-xl border border-[var(--surface-border)]">
              {records.map((r, i) => (
                <li key={r.id} className="px-5 py-4">
                  {editing ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={r.date}
                        onChange={(e) =>
                          setRecords((prev) => prev.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))
                        }
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={r.unit}
                        onChange={(e) =>
                          setRecords((prev) => prev.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))
                        }
                        placeholder="单位"
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        className="sm:col-span-2"
                        value={r.title}
                        onChange={(e) =>
                          setRecords((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                        }
                        placeholder="标题"
                      />
                      <Textarea
                        fullWidth
                        className="sm:col-span-2"
                        rows={3}
                        value={r.summary}
                        onChange={(e) =>
                          setRecords((prev) => prev.map((x, j) => (j === i ? { ...x, summary: e.target.value } : x)))
                        }
                        placeholder="摘要"
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={r.author}
                        onChange={(e) =>
                          setRecords((prev) => prev.map((x, j) => (j === i ? { ...x, author: e.target.value } : x)))
                        }
                        placeholder="发布人"
                      />
                      <Input
                        fullWidth
                        inputSize="sm"
                        value={r.relatedPrinciple ?? ""}
                        onChange={(e) =>
                          setRecords((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, relatedPrinciple: e.target.value || undefined } : x)),
                          )
                        }
                        placeholder="关联原则"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <time className="font-data text-caption">{r.date}</time>
                        {r.unit !== "—" ? <span className="text-caption">{r.unit}</span> : null}
                        {r.relatedPrinciple ? (
                          <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-caption">
                            {r.relatedPrinciple}
                          </span>
                        ) : null}
                      </div>
                      <h3 className={`${typography.h3} mt-1`}>{r.title}</h3>
                      <p className={`${typography.body} mt-2 text-[var(--color-text-secondary)]`}>{r.summary}</p>
                      {r.author !== "—" ? <p className={`${typography.caption} mt-2`}>发布：{r.author}</p> : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-dashed border-[var(--surface-border-strong)] bg-black/[0.02] px-5 py-4">
              <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">
                {CI_CONTINUOUS_IMPROVEMENT.title}
              </p>
              <p className={`${typography.body} mt-2 text-[var(--color-text-secondary)]`}>
                {CI_CONTINUOUS_IMPROVEMENT.body}
              </p>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {tab === "assessment" ? (
        <WushiPanel assessment={wushi.assessment} source={wushi.source} />
      ) : null}
    </div>
  );
}
