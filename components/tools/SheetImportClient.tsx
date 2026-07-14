"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface FieldMeta {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface SpecMeta {
  sheetType: string;
  label: string;
  fields: FieldMeta[];
}

interface ProfileMeta {
  id: string;
  sheetType: string;
  name: string;
  columnMap: Record<string, string>;
}

interface DiffRow {
  key: string;
  status: "new" | "update" | "unchanged";
  record: Record<string, unknown>;
  changes: { field: string; before: unknown; after: unknown }[];
}

interface DiffSummary {
  created: number;
  updated: number;
  unchanged: number;
  rows: DiffRow[];
}

interface PreviewResult {
  headers: string[];
  columnMap: Record<string, string>;
  mapSource: "user" | "profile" | "guess";
  totalRows: number;
  validRows: number;
  errorRows: number;
  issues: { row: number; field?: string; severity: "error" | "warning"; message: string }[];
  preview: Record<string, unknown>[];
  diff: DiffSummary | null;
}

interface CommitResult {
  created: number;
  updated: number;
  skipped: number;
  assertionTriggered: boolean;
}

const inp =
  "rounded-md border border-[var(--surface-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none";

const MAP_SOURCE_LABEL: Record<PreviewResult["mapSource"], string> = {
  user: "手动调整",
  profile: "已存画像自动套用",
  guess: "表头相似度猜测 — 请人工确认",
};

export function SheetImportClient() {
  const [specs, setSpecs] = useState<SpecMeta[]>([]);
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [sheetType, setSheetType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [profileName, setProfileName] = useState("默认");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [committed, setCommitted] = useState<CommitResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/import/sheet")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setSpecs(d.specs ?? []);
        setProfiles(d.profiles ?? []);
        if (d.specs?.[0]) setSheetType(d.specs[0].sheetType);
      })
      .catch(() => setError("加载规格失败"));
  }, []);

  const spec = specs.find((s) => s.sheetType === sheetType);

  const upload = useCallback(
    async (columnMap?: Record<string, string>) => {
      if (!file || !sheetType) return;
      setBusy(true);
      setError(null);
      setSavedMsg(null);
      setCommitted(null);
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("sheetType", sheetType);
        if (columnMap) form.set("columnMap", JSON.stringify(columnMap));
        const res = await fetch("/api/import/sheet", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "解析失败");
        setResult(data as PreviewResult);
      } catch (e) {
        setError(e instanceof Error ? e.message : "解析失败");
      } finally {
        setBusy(false);
      }
    },
    [file, sheetType],
  );

  async function remap(fieldKey: string, header: string) {
    if (!result) return;
    const next = { ...result.columnMap };
    if (header === "") delete next[fieldKey];
    else next[fieldKey] = header;
    await upload(next);
  }

  async function commit() {
    if (!file || !result || result.errorRows > 0) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("sheetType", sheetType);
      form.set("stage", "commit");
      form.set("columnMap", JSON.stringify(result.columnMap));
      const res = await fetch("/api/import/sheet", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "入库失败");
      setCommitted(data as CommitResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "入库失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!result || !profileName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetType, name: profileName.trim(), columnMap: result.columnMap }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setSavedMsg(`画像「${profileName.trim()}」已保存 — 下月同模板直接套用`);
      setProfiles((cur) => {
        const rest = cur.filter((p) => !(p.sheetType === sheetType && p.name === profileName.trim()));
        return [data.profile, ...rest];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  const typeProfiles = profiles.filter((p) => p.sheetType === sheetType);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className={inp}
            value={sheetType}
            onChange={(e) => {
              setSheetType(e.target.value);
              setResult(null);
            }}
          >
            {specs.map((s) => (
              <option key={s.sheetType} value={s.sheetType}>{s.label}</option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="text-sm text-[var(--color-text-secondary)]"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
          />
          <button
            type="button"
            disabled={!file || busy}
            onClick={() => upload()}
            className="rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1.5 text-sm text-[var(--color-accent)] disabled:opacity-40"
          >
            {busy ? "解析中…" : "上传并预检"}
          </button>
          {typeProfiles.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              已存画像:{typeProfiles.map((p) => p.name).join("、")}
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-[var(--signal-red)]">{error}</p>}
        {savedMsg && <p className="mt-2 text-sm text-[var(--signal-green)]">{savedMsg}</p>}
      </section>

      {result && spec && (
        <>
          <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">列映射</span>
              <span
                className={`text-xs ${result.mapSource === "guess" ? "text-[var(--signal-yellow)]" : "text-[var(--color-text-muted)]"}`}
              >
                {MAP_SOURCE_LABEL[result.mapSource]}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {spec.fields.map((f) => (
                <div key={f.key} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 text-[var(--color-text-secondary)]">
                    {f.label}
                    {f.required && <span className="text-[var(--signal-red)]"> *</span>}
                  </span>
                  <select
                    className={`${inp} flex-1 ${f.required && !result.columnMap[f.key] ? "border-[var(--signal-red)]" : ""}`}
                    value={result.columnMap[f.key] ?? ""}
                    onChange={(e) => remap(f.key, e.target.value)}
                  >
                    <option value="">（未映射）</option>
                    {result.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className={inp}
                placeholder="画像名称"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || result.errorRows > 0}
                onClick={saveProfile}
                className="rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] disabled:opacity-40"
              >
                保存画像
              </button>
              {result.errorRows > 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">修正 error 后才能保存</span>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-[var(--color-text-primary)]">预检结果</span>
              <span className="font-data text-[var(--color-text-muted)]">共 {result.totalRows} 行</span>
              <span className="font-data text-[var(--signal-green)]">可入库 {result.validRows}</span>
              <span className={`font-data ${result.errorRows > 0 ? "text-[var(--signal-red)]" : "text-[var(--color-text-muted)]"}`}>
                error 行 {result.errorRows}
              </span>
            </div>
            {result.issues.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {result.issues.map((i, k) => (
                  <li key={k} className="text-xs">
                    <span className={i.severity === "error" ? "text-[var(--signal-red)]" : "text-[var(--signal-yellow)]"}>
                      [{i.severity === "error" ? "错误" : "警告"}]
                    </span>{" "}
                    <span className="text-[var(--color-text-muted)]">第 {i.row} 行</span>{" "}
                    <span className="text-[var(--color-text-primary)]">{i.message}</span>
                  </li>
                ))}
              </ul>
            )}
            {result.preview.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[var(--color-text-muted)]">
                      {spec.fields.filter((f) => result.columnMap[f.key]).map((f) => (
                        <th key={f.key} className="whitespace-nowrap px-2 py-1 font-normal">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-t border-[var(--surface-border)] text-[var(--color-text-primary)]">
                        {spec.fields.filter((f) => result.columnMap[f.key]).map((f) => (
                          <td key={f.key} className="whitespace-nowrap px-2 py-1">
                            {r[f.key] === undefined ? "—" : String(r[f.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.preview.length > 8 && (
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    仅展示前 8 行,预检共覆盖 {result.totalRows} 行
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-[var(--color-text-primary)]">差异预览 · 与 DB 现状对比</span>
              {result.diff ? (
                <>
                  <span className="font-data text-[var(--signal-green)]">新增 {result.diff.created}</span>
                  <span className="font-data text-[var(--signal-yellow)]">更新 {result.diff.updated}</span>
                  <span className="font-data text-[var(--color-text-muted)]">不变 {result.diff.unchanged}</span>
                </>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">数据库不可用,无法对比</span>
              )}
            </div>

            {result.diff && result.diff.rows.some((r) => r.status !== "unchanged") && (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {result.diff.rows
                  .filter((r) => r.status !== "unchanged")
                  .map((r, i) => (
                    <li key={i} className="rounded border border-[var(--surface-border)] px-2.5 py-1.5 text-xs">
                      <span
                        className={`mr-2 rounded px-1.5 py-0.5 ${
                          r.status === "new"
                            ? "bg-[var(--signal-green)]/12 text-[var(--signal-green)]"
                            : "bg-[var(--signal-yellow)]/12 text-[var(--signal-yellow)]"
                        }`}
                      >
                        {r.status === "new" ? "新增" : "更新"}
                      </span>
                      <span className="font-data text-[var(--color-text-primary)]">{r.key}</span>
                      {r.changes.length > 0 && (
                        <span className="ml-2 text-[var(--color-text-muted)]">
                          {r.changes
                            .map((c) => `${c.field}: ${c.before ?? "—"} → ${c.after}`)
                            .join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={busy || !result.diff || result.errorRows > 0 || result.validRows === 0 || committed !== null}
                onClick={commit}
                className="rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1.5 text-sm text-[var(--color-accent)] disabled:opacity-40"
              >
                {busy ? "入库中…" : "确认入库"}
              </button>
              {result.errorRows > 0 && (
                <span className="text-xs text-[var(--signal-red)]">存在 error 行,修正后才能入库</span>
              )}
              {committed && (
                <span className="text-xs text-[var(--signal-green)]">
                  已入库:新增 {committed.created} · 更新 {committed.updated}
                  {committed.skipped > 0 ? ` · 跳过 ${committed.skipped}` : ""}
                </span>
              )}
            </div>
            {committed?.assertionTriggered && (
              <p className="mt-2 rounded border border-[var(--signal-red)]/40 bg-[var(--signal-red)]/8 px-2.5 py-1.5 text-xs text-[var(--signal-red)]">
                ⚠ §16.2 一票否决:现金 runway 低于 3 个月,已触发 HealthAssertion — 指挥舱将显示硬阻断条。
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
