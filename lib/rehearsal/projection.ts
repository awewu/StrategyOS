export type ProjectionAttachmentFormat = "pdf" | "office" | "image" | "unsupported";

export interface ProjectionAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  manifestUrl: string;
}

export interface ProjectionManifest {
  kind: "document" | "image";
  pageCount: number;
}

export type ProjectionSourceKey = "generated" | `attachment:${string}`;

export interface ProjectionSelection {
  sources: ProjectionSourceKey[];
  manifests: Map<string, ProjectionManifest>;
}

export type ProjectionLaunchAction =
  | { kind: "open" }
  | { kind: "navigate"; href: string };

export function resolveProjectionLaunch(
  currentSelectionKey: string | null | undefined,
  selectedOption: { key: string; href: string } | null | undefined,
): ProjectionLaunchAction {
  if (!selectedOption || selectedOption.key === currentSelectionKey) return { kind: "open" };
  const url = new URL(selectedOption.href, "http://stratos.local");
  url.searchParams.set("setup", "1");
  return { kind: "navigate", href: `${url.pathname}${url.search}${url.hash}` };
}

export type ProjectionPage =
  | {
      kind: "generated";
      sourceKey: "generated";
      slideIndex: number;
    }
  | {
      kind: "attachment";
      sourceKey: `attachment:${string}`;
      attachmentId: string;
      filename: string;
      mimeType: string;
      pageNumber: number;
      pageCount: number;
      imageUrl: string;
    };

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"]);
const OFFICE_EXTENSIONS = new Set(["ppt", "pptx", "doc", "docx"]);

function extension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function classifyProjectionAttachment(filename: string, mimeType: string): ProjectionAttachmentFormat {
  const ext = extension(filename);
  const normalizedMime = mimeType.toLowerCase();
  if (ext === "pdf" || normalizedMime === "application/pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(ext) || normalizedMime.startsWith("image/")) return "image";
  if (OFFICE_EXTENSIONS.has(ext)) return "office";
  return "unsupported";
}

export function moveProjectionSource(
  sources: ProjectionSourceKey[],
  index: number,
  direction: -1 | 1,
): ProjectionSourceKey[] {
  const target = index + direction;
  if (index < 0 || index >= sources.length || target < 0 || target >= sources.length) return sources;
  const next = [...sources];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function attachmentPageUrl(manifestUrl: string, pageNumber: number): string {
  const separator = manifestUrl.includes("?") ? "&" : "?";
  return `${manifestUrl}${separator}page=${pageNumber}`;
}

export function buildProjectionPages({
  sources,
  generatedSlideCount,
  attachments,
  manifests,
}: {
  sources: ProjectionSourceKey[];
  generatedSlideCount: number;
  attachments: ProjectionAttachment[];
  manifests: ReadonlyMap<string, ProjectionManifest>;
}): ProjectionPage[] {
  const attachmentById = new Map(attachments.map((attachment) => [attachment.id, attachment]));
  const pages: ProjectionPage[] = [];

  for (const source of sources) {
    if (source === "generated") {
      for (let slideIndex = 0; slideIndex < generatedSlideCount; slideIndex += 1) {
        pages.push({ kind: "generated", sourceKey: "generated", slideIndex });
      }
      continue;
    }

    const attachmentId = source.slice("attachment:".length);
    const attachment = attachmentById.get(attachmentId);
    const manifest = manifests.get(attachmentId);
    if (!attachment || !manifest || manifest.pageCount < 1) continue;
    for (let pageNumber = 1; pageNumber <= manifest.pageCount; pageNumber += 1) {
      pages.push({
        kind: "attachment",
        sourceKey: source,
        attachmentId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        pageNumber,
        pageCount: manifest.pageCount,
        imageUrl: attachmentPageUrl(attachment.manifestUrl, pageNumber),
      });
    }
  }

  return pages;
}
