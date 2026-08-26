"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FileImage, FileText, Presentation, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  classifyProjectionAttachment,
  moveProjectionSource,
  type ProjectionAttachment,
  type ProjectionManifest,
  type ProjectionSelection,
  type ProjectionSourceKey,
} from "@/lib/rehearsal/projection";

type PreparationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; manifest: ProjectionManifest }
  | { status: "error"; message: string };

function sourceAttachmentId(source: ProjectionSourceKey): string | null {
  return source === "generated" ? null : source.slice("attachment:".length);
}

function formatSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function preparationLabel(state: PreparationState | undefined): string {
  if (!state || state.status === "idle") return "待准备";
  if (state.status === "loading") return "正在准备";
  if (state.status === "error") return state.message;
  return state.manifest.kind === "image" ? "1 页" : `${state.manifest.pageCount} 页`;
}

export function PresentationSetupModal({
  generatedSlideCount,
  attachments,
  onClose,
  onStart,
}: {
  generatedSlideCount: number;
  attachments: ProjectionAttachment[];
  onClose: () => void;
  onStart: (selection: ProjectionSelection) => void;
}) {
  const [sources, setSources] = useState<ProjectionSourceKey[]>(generatedSlideCount > 0 ? ["generated"] : []);
  const [preparation, setPreparation] = useState<Record<string, PreparationState>>({});
  const attachmentById = useMemo(() => new Map(attachments.map((attachment) => [attachment.id, attachment])), [attachments]);
  const manifests = useMemo(() => {
    const next = new Map<string, ProjectionManifest>();
    for (const [id, state] of Object.entries(preparation)) {
      if (state.status === "ready") next.set(id, state.manifest);
    }
    return next;
  }, [preparation]);

  async function prepareAttachment(attachment: ProjectionAttachment) {
    setPreparation((current) => ({ ...current, [attachment.id]: { status: "loading" } }));
    try {
      const response = await fetch(attachment.manifestUrl);
      const data = await response.json().catch(() => null) as (ProjectionManifest & { error?: string }) | null;
      if (!response.ok || !data || (data.kind !== "document" && data.kind !== "image") || !Number.isInteger(data.pageCount)) {
        throw new Error(data?.error || "附件准备失败");
      }
      setPreparation((current) => ({
        ...current,
        [attachment.id]: { status: "ready", manifest: { kind: data.kind, pageCount: data.pageCount } },
      }));
    } catch (error) {
      setPreparation((current) => ({
        ...current,
        [attachment.id]: { status: "error", message: error instanceof Error ? error.message : "附件准备失败" },
      }));
    }
  }

  function toggleGenerated() {
    setSources((current) => current.includes("generated")
      ? current.filter((source) => source !== "generated")
      : ["generated", ...current]);
  }

  function toggleAttachment(attachment: ProjectionAttachment) {
    const source = `attachment:${attachment.id}` as const;
    if (sources.includes(source)) {
      setSources((current) => current.filter((item) => item !== source));
      return;
    }
    setSources((current) => [...current, source]);
    const state = preparation[attachment.id];
    if (!state || state.status === "idle" || state.status === "error") void prepareAttachment(attachment);
  }

  const selectedAttachmentIds = new Set(sources.flatMap((source) => sourceAttachmentId(source) ?? []));
  const selectedAttachmentsReady = [...selectedAttachmentIds].every((id) => preparation[id]?.status === "ready");
  const canStart = sources.length > 0 && selectedAttachmentsReady;

  return (
    <Modal
      onClose={onClose}
      size="2xl"
      title="选择投屏内容"
      subtitle="投屏内容仅在本次会议页面生效，不修改战略版本和附件数据。"
    >
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)]">播放顺序</h4>
          <span className="text-caption">{sources.length} 项</span>
        </div>
        <div className="divide-y divide-[var(--surface-border)] rounded border border-[var(--surface-border)]">
          {sources.map((source, index) => {
            const attachmentId = sourceAttachmentId(source);
            const attachment = attachmentId ? attachmentById.get(attachmentId) : null;
            const state = attachmentId ? preparation[attachmentId] : undefined;
            return (
              <div key={source} className="flex min-h-12 items-center gap-3 px-3 py-2">
                <span className="w-5 shrink-0 text-center text-xs text-[var(--color-text-muted)]">{index + 1}</span>
                {source === "generated" ? <Presentation size={17} /> : <FileText size={17} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {source === "generated" ? "系统生成内容" : attachment?.filename}
                  </p>
                  <p className={`truncate text-xs ${state?.status === "error" ? "text-[var(--signal-red-text)]" : "text-[var(--color-text-muted)]"}`}>
                    {source === "generated" ? `${generatedSlideCount} 页` : preparationLabel(state)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => setSources((current) => moveProjectionSource(current, index, -1))}
                  className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-black/[0.05] disabled:opacity-25"
                  title="上移"
                  aria-label="上移"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={index === sources.length - 1}
                  onClick={() => setSources((current) => moveProjectionSource(current, index, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-black/[0.05] disabled:opacity-25"
                  title="下移"
                  aria-label="下移"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => source === "generated" ? toggleGenerated() : attachment && toggleAttachment(attachment)}
                  className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-black/[0.05] hover:text-[var(--signal-red-text)]"
                  title="移出投屏"
                  aria-label="移出投屏"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
          {sources.length === 0 ? (
            <div className="flex min-h-16 items-center justify-center text-sm text-[var(--color-text-muted)]">尚未选择投屏内容</div>
          ) : null}
        </div>
      </section>

      <section className="mt-5 border-t border-[var(--surface-border)] pt-4">
        <h4 className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">可用内容</h4>
        <label className="flex cursor-pointer items-center gap-3 py-2 text-sm">
          <input type="checkbox" checked={sources.includes("generated")} onChange={toggleGenerated} disabled={generatedSlideCount === 0} />
          <Presentation size={17} className="text-[var(--color-accent)]" />
          <span className="flex-1">系统生成内容</span>
          <span className="text-caption">{generatedSlideCount} 页</span>
        </label>
        <div className="max-h-64 overflow-y-auto border-t border-[var(--surface-border)]">
          {attachments.map((attachment) => {
            const format = classifyProjectionAttachment(attachment.filename, attachment.mimeType);
            const supported = format !== "unsupported";
            const selected = selectedAttachmentIds.has(attachment.id);
            const state = preparation[attachment.id];
            return (
              <label key={attachment.id} className={`flex items-center gap-3 border-b border-[var(--surface-border)]/60 py-2.5 text-sm ${supported ? "cursor-pointer" : "opacity-45"}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={!supported}
                  onChange={() => toggleAttachment(attachment)}
                />
                {format === "image" ? <FileImage size={17} /> : <FileText size={17} />}
                <span className="min-w-0 flex-1 truncate" title={attachment.filename}>{attachment.filename}</span>
                <span className={`max-w-52 truncate text-xs ${state?.status === "error" ? "text-[var(--signal-red-text)]" : "text-[var(--color-text-muted)]"}`} title={state?.status === "error" ? state.message : undefined}>
                  {supported ? (state ? preparationLabel(state) : format.toUpperCase()) : "暂不支持"}
                </span>
                <span className="w-16 text-right text-xs text-[var(--color-text-muted)]">{formatSize(attachment.sizeBytes)}</span>
              </label>
            );
          })}
          {attachments.length === 0 ? <p className="py-5 text-center text-sm text-[var(--color-text-muted)]">当前版本暂无附件</p> : null}
        </div>
      </section>

      <div className="mt-5 flex justify-end gap-2 border-t border-[var(--surface-border)] pt-4">
        <button type="button" onClick={onClose} className="stratos-btn stratos-btn--ghost">取消</button>
        <button
          type="button"
          disabled={!canStart}
          onClick={() => onStart({ sources, manifests })}
          className="stratos-btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          开始投屏
        </button>
      </div>
    </Modal>
  );
}
