"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BehaviorGuidelinesPanel,
  CoreValuesPanel,
  DoctrinesPanel,
} from "@/components/culture/CulturePanels";
import { Input, Textarea } from "@/components/ui/primitives";
import type { CultureHandbookContent } from "@/lib/culture/content";

export function CultureHandbookEditor({
  initialHandbook,
  source,
}: {
  initialHandbook: CultureHandbookContent;
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [handbook, setHandbook] = useState(initialHandbook);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/culture/handbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handbook }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("文化手册已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setHandbook(initialHandbook);
    setEditing(false);
    setMsg(null);
  }

  function patchDoctrine(index: number, field: keyof CultureHandbookContent["doctrines"][0], value: string) {
    setHandbook((prev) => ({
      ...prev,
      doctrines: prev.doctrines.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    }));
  }

  function patchPillar(index: number, value: string) {
    setHandbook((prev) => ({
      ...prev,
      fourSatisfactionPillars: prev.fourSatisfactionPillars.map((p, i) => (i === index ? value : p)),
    }));
  }

  function patchIntro(field: keyof CultureHandbookContent["coreValuesIntro"], value: string | string[]) {
    setHandbook((prev) => ({
      ...prev,
      coreValuesIntro: { ...prev.coreValuesIntro, [field]: value },
    }));
  }

  function patchGuideline(index: number, field: "title" | "items", value: string | string[]) {
    setHandbook((prev) => ({
      ...prev,
      behaviorGuidelines: prev.behaviorGuidelines.map((g, i) =>
        i === index ? { ...g, [field]: value } : g,
      ),
    }));
  }

  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-caption">
        手册 {source === "database" ? "DB" : "Demo"}
      </span>
      {msg ? <span className="text-xs text-[var(--color-accent)]">{msg}</span> : null}
      {editing ? (
        <>
          <button type="button" onClick={cancel} className="stratos-btn stratos-btn--ghost" disabled={busy}>
            取消
          </button>
          <button type="button" onClick={() => void save()} className="stratos-btn stratos-btn--primary" disabled={busy}>
            {busy ? "保存中…" : "保存手册"}
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="stratos-btn">
          编辑文化手册
        </button>
      )}
    </div>
  );

  if (editing) {
    return (
      <div className="space-y-6">
        {toolbar}
        <section className="stratos-card stratos-card--padded space-y-4">
          <h3 className="stratos-section-title">三大信条</h3>
          {handbook.doctrines.map((d, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-[var(--surface-border)] p-4 sm:grid-cols-2">
              <Input fullWidth inputSize="sm" value={d.en} placeholder="English" onChange={(e) => patchDoctrine(i, "en", e.target.value)} />
              <Input fullWidth inputSize="sm" value={d.zh} placeholder="中文" onChange={(e) => patchDoctrine(i, "zh", e.target.value)} />
              <Input fullWidth inputSize="sm" className="sm:col-span-2" value={d.hint} placeholder="提示" onChange={(e) => patchDoctrine(i, "hint", e.target.value)} />
              <Textarea fullWidth className="sm:col-span-2" rows={2} value={d.scenario} placeholder="自检场景" onChange={(e) => patchDoctrine(i, "scenario", e.target.value)} />
            </div>
          ))}
        </section>

        <section className="stratos-card stratos-card--padded space-y-4">
          <h3 className="stratos-section-title">四个满意</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {handbook.fourSatisfactionPillars.map((p, i) => (
              <Input key={i} fullWidth inputSize="sm" value={p} onChange={(e) => patchPillar(i, e.target.value)} />
            ))}
          </div>
          <Input fullWidth inputSize="sm" value={handbook.coreValuesIntro.headline} placeholder="标题" onChange={(e) => patchIntro("headline", e.target.value)} />
          <Textarea fullWidth rows={3} value={handbook.coreValuesIntro.body} onChange={(e) => patchIntro("body", e.target.value)} />
          {handbook.coreValuesIntro.principles.map((p, i) => (
            <Input
              key={i}
              fullWidth
              inputSize="sm"
              value={p}
              onChange={(e) => {
                const next = [...handbook.coreValuesIntro.principles];
                next[i] = e.target.value;
                patchIntro("principles", next);
              }}
            />
          ))}
          <Textarea fullWidth rows={2} value={handbook.coreValuesIntro.decisionTest} placeholder="决策自检" onChange={(e) => patchIntro("decisionTest", e.target.value)} />
        </section>

        <section className="stratos-card stratos-card--padded space-y-4">
          <h3 className="stratos-section-title">六项基本原则</h3>
          {handbook.behaviorGuidelines.map((g, gi) => (
            <div key={g.id} className="rounded-lg border border-[var(--surface-border)] p-4">
              <Input fullWidth inputSize="sm" className="mb-2 font-medium" value={g.title} onChange={(e) => patchGuideline(gi, "title", e.target.value)} />
              {g.items.map((item, ii) => (
                <Input
                  key={ii}
                  fullWidth
                  inputSize="sm"
                  className="mb-1"
                  value={item}
                  onChange={(e) => {
                    const next = [...g.items];
                    next[ii] = e.target.value;
                    patchGuideline(gi, "items", next);
                  }}
                />
              ))}
            </div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toolbar}
      <DoctrinesPanel handbook={handbook} />
      <CoreValuesPanel handbook={handbook} />
      <BehaviorGuidelinesPanel handbook={handbook} />
    </div>
  );
}
