"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PostInvestPanel, RealOptionsPanel } from "@/components/finance/RealOptionsPanel";
import { Input, Select, Textarea } from "@/components/ui/primitives";
import type { PostInvestDeviation, RealOptionTag } from "@/lib/types/stratos";

const STATUS_OPTS: PostInvestDeviation["status"][] = ["on_track", "watch", "critical"];

export function CapitalConfigEditor({
  initialOptions,
  initialDeviations,
  source,
}: {
  initialOptions: RealOptionTag[];
  initialDeviations: PostInvestDeviation[];
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [options, setOptions] = useState(initialOptions);
  const [deviations, setDeviations] = useState(initialDeviations);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchOption(index: number, patch: Partial<RealOptionTag>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function patchDeviation(index: number, patch: Partial<PostInvestDeviation>) {
    setDeviations((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/capital-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realOptions: options, postInvestDeviations: deviations }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("资本配置已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setOptions(initialOptions);
    setDeviations(initialDeviations);
    setEditing(false);
    setMsg(null);
  }

  function addOption() {
    setOptions((prev) => [
      ...prev,
      {
        icCode: "",
        title: "",
        stageGate: "",
        abandonRight: false,
        nextCommitAmount: 0,
        optionValueNote: "",
      },
    ]);
    setEditing(true);
  }

  function addDeviation() {
    setDeviations((prev) => [
      ...prev,
      {
        icCode: "",
        title: "",
        approvedCapex: 0,
        actualCapex: 0,
        expectedIrr: 0,
        actualIrr: undefined,
        deviationPct: 0,
        status: "watch" as const,
      },
    ]);
    setEditing(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          数据源 {source === "database" ? "DB · 可持久化" : "Demo · 保存需配置 DATABASE_URL"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {msg ? <span className="text-caption text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" onClick={cancel} className="stratos-btn stratos-btn--ghost" disabled={busy}>
                取消
              </button>
              <button type="button" onClick={() => void save()} className="stratos-btn stratos-btn--primary" disabled={busy}>
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="stratos-btn stratos-btn--primary">
              编辑资本配置
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <section className="stratos-card stratos-card--padded space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="stratos-section-title">Real Options · 分阶段投资</h3>
              <button type="button" onClick={addOption} className="text-xs text-[var(--color-accent)]">
                + 新增期权
              </button>
            </div>
            {options.map((o, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-[var(--surface-border)] p-4 sm:grid-cols-2">
                <Input
                  fullWidth
                  inputSize="sm"
                  value={o.icCode}
                  placeholder="IC 编号"
                  onChange={(e) => patchOption(i, { icCode: e.target.value })}
                />
                <Input
                  fullWidth
                  inputSize="sm"
                  value={o.title}
                  placeholder="标题"
                  onChange={(e) => patchOption(i, { title: e.target.value })}
                />
                <Input
                  fullWidth
                  inputSize="sm"
                  className="sm:col-span-2"
                  value={o.stageGate}
                  placeholder="阶段门"
                  onChange={(e) => patchOption(i, { stageGate: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={o.abandonRight}
                    onChange={(e) => patchOption(i, { abandonRight: e.target.checked })}
                  />
                  放弃权
                </label>
                <Input
                  type="number"
                  fullWidth
                  inputSize="sm"
                  value={o.nextCommitAmount}
                  placeholder="下期 commit（万）"
                  onChange={(e) => patchOption(i, { nextCommitAmount: Number(e.target.value) })}
                />
                <Textarea
                  fullWidth
                  className="sm:col-span-2"
                  rows={2}
                  value={o.optionValueNote}
                  placeholder="期权价值说明"
                  onChange={(e) => patchOption(i, { optionValueNote: e.target.value })}
                />
              </div>
            ))}
          </section>

          <section className="stratos-card stratos-card--padded space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="stratos-section-title">投后偏离追踪</h3>
              <button type="button" onClick={addDeviation} className="text-xs text-[var(--color-accent)]">
                + 新增偏离
              </button>
            </div>
            {deviations.map((d, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-[var(--surface-border)] p-4 sm:grid-cols-3">
                <Input
                  fullWidth
                  inputSize="sm"
                  value={d.icCode}
                  placeholder="IC 编号"
                  onChange={(e) => patchDeviation(i, { icCode: e.target.value })}
                />
                <Input
                  fullWidth
                  inputSize="sm"
                  className="sm:col-span-2"
                  value={d.title}
                  placeholder="标题"
                  onChange={(e) => patchDeviation(i, { title: e.target.value })}
                />
                <Input
                  type="number"
                  fullWidth
                  inputSize="sm"
                  value={d.approvedCapex}
                  placeholder="批准 CAPEX"
                  onChange={(e) => patchDeviation(i, { approvedCapex: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  fullWidth
                  inputSize="sm"
                  value={d.actualCapex}
                  placeholder="实际 CAPEX"
                  onChange={(e) => patchDeviation(i, { actualCapex: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  fullWidth
                  inputSize="sm"
                  value={d.expectedIrr}
                  placeholder="预期 IRR %"
                  onChange={(e) => patchDeviation(i, { expectedIrr: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  fullWidth
                  inputSize="sm"
                  value={d.actualIrr ?? ""}
                  placeholder="实际 IRR %"
                  onChange={(e) =>
                    patchDeviation(i, {
                      actualIrr: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
                <Input
                  type="number"
                  fullWidth
                  inputSize="sm"
                  value={d.deviationPct}
                  placeholder="偏离 %"
                  onChange={(e) => patchDeviation(i, { deviationPct: Number(e.target.value) })}
                />
                <Select
                  fullWidth
                  selectSize="sm"
                  value={d.status}
                  onChange={(e) =>
                    patchDeviation(i, { status: e.target.value as PostInvestDeviation["status"] })
                  }
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </section>
        </>
      ) : (
        <>
          <RealOptionsPanel options={options} />
          <PostInvestPanel deviations={deviations} />
        </>
      )}
    </div>
  );
}
