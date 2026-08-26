"use client";

import { useMemo, useRef, useState } from "react";

type Source = { kind: string; label: string; needsPeriod: boolean; sheetHint: string };

type Preview = {
  sheetName: string;
  rowCount: number;
  columns: string[];
  sample: Record<string, unknown>[];
  issues: string[];
};

type CommitResult = {
  status: "imported" | "skipped" | "failed";
  rowCount: number;
  message: string;
};

export function LedgerImportClient({ sources }: { sources: Source[] }) {
  const [kind, setKind] = useState(sources[0]?.kind ?? "");
  const [period, setPeriod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"" | "preview" | "commit">("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const spec = useMemo(() => sources.find((s) => s.kind === kind), [sources, kind]);

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
  }

  function buildForm(stage: "preview" | "commit"): FormData | null {
    if (!file) {
      setError("请先选择 Excel 文件");
      return null;
    }
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    fd.set("stage", stage);
    fd.set("period", period);
    return fd;
  }

  async function runPreview() {
    reset();
    const fd = buildForm("preview");
    if (!fd) return;
    setBusy("preview");
    try {
      const res = await fetch("/api/fpa/ledger-import", { method: "POST", body: fd });
      const data = (await res.json()) as Preview & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "预检失败");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "预检失败");
    } finally {
      setBusy("");
    }
  }

  async function runCommit() {
    const fd = buildForm("commit");
    if (!fd) return;
    setBusy("commit");
    setError(null);
    try {
      const res = await fetch("/api/fpa/ledger-import", { method: "POST", body: fd });
      const data = (await res.json()) as CommitResult & { error?: string };
      if (!res.ok && !data.status) throw new Error(data.error ?? "入库失败");
      setResult(data);
      if (data.status === "imported" || data.status === "skipped") {
        setPreview(null);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "入库失败");
    } finally {
      setBusy("");
    }
  }

  const inputCls =
    "rounded border border-[var(--surface-border)] bg-transparent px-2.5 py-1.5 text-caption";

  return (
    <div className="stratos-card stratos-card--padded space-y-4">
      <header className="stratos-section-header">
        <div>
          <h3 className="stratos-section-title">网页导入 · 上传 → 预检 → 确认入库</h3>
          <p className="stratos-section-desc">
            OneStream 月度关账工作簿 · 内容哈希幂等（同文件重复上传自动跳过）
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-caption text-[var(--color-text-muted)]">数据来源</span>
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              reset();
            }}
            className={inputCls}
          >
            {sources.map((s) => (
              <option key={s.kind} value={s.kind}>{s.label}</option>
            ))}
          </select>
        </label>

        {spec?.needsPeriod ? (
          <label className="flex flex-col gap-1">
            <span className="text-caption text-[var(--color-text-muted)]">期间 (YYYY-MM)</span>
            <input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2025-01"
              className={`${inputCls} w-28 font-data`}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1">
          <span className="text-caption text-[var(--color-text-muted)]">Excel 文件 (.xlsx)</span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              reset();
            }}
            className="text-caption"
          />
        </label>

        <button
          type="button"
          disabled={busy !== "" || !file}
          className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption"
          onClick={() => void runPreview()}
        >
          {busy === "preview" ? "预检中…" : "预检"}
        </button>
      </div>

      {spec ? (
        <p className="text-caption text-[var(--color-text-muted)]">{spec.sheetHint}</p>
      ) : null}

      {error ? (
        <div className="rounded border border-[var(--signal-red)] px-3 py-2 text-caption text-[var(--signal-red-text)]">
          {error}
        </div>
      ) : null}

      {result ? (
        <div
          className="rounded border px-3 py-2 text-caption"
          style={{
            borderColor: result.status === "failed" ? "var(--signal-red)" : "var(--signal-green)",
            color: result.status === "failed" ? "var(--signal-red-text)" : "var(--signal-green-text)",
          }}
        >
          {result.status === "imported" ? "✓ " : result.status === "skipped" ? "⏭ " : "✗ "}
          {result.message}
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption">
              工作表 <span className="font-data">{preview.sheetName}</span> · 解析{" "}
              <span className="font-data">{preview.rowCount}</span> 行
              <span className="ml-2 text-[var(--color-text-muted)]">（预览前 {preview.sample.length} 行）</span>
            </p>
            <button
              type="button"
              disabled={busy !== "" || preview.rowCount === 0}
              className="stratos-btn stratos-btn--primary px-3 py-1.5 text-caption"
              onClick={() => void runCommit()}
            >
              {busy === "commit" ? "入库中…" : "确认入库"}
            </button>
          </div>

          {preview.issues.length > 0 ? (
            <ul className="space-y-1">
              {preview.issues.map((i, idx) => (
                <li key={idx} className="text-caption text-[var(--signal-yellow-text)]">· {i}</li>
              ))}
            </ul>
          ) : null}

          {preview.sample.length > 0 ? (
            <div className="stratos-table-wrap max-h-96 overflow-auto">
              <table className="stratos-table">
                <thead>
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c} className="text-left">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row, i) => (
                    <tr key={i}>
                      {preview.columns.map((c) => (
                        <td key={c} className="font-data">{String(row[c] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-[var(--surface-border)] pt-3">
        <p className="mb-2 text-caption text-[var(--color-text-muted)]">
          下载当前已入库数据（Excel · 备份 / 离线核对）
        </p>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <a
              key={s.kind}
              href={`/api/fpa/ledger-export?kind=${s.kind}`}
              className="stratos-btn stratos-btn--ghost px-2.5 py-1 text-caption"
            >
              ↓ {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
