import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildProjectionPages,
  classifyProjectionAttachment,
  moveProjectionSource,
  resolveProjectionLaunch,
  type ProjectionAttachment,
  type ProjectionManifest,
} from "./projection";

const attachments: ProjectionAttachment[] = [
  {
    id: "deck-1",
    filename: "三年战略.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sizeBytes: 2048,
    manifestUrl: "/api/presentation?id=deck-1",
  },
  {
    id: "image-1",
    filename: "路线图.png",
    mimeType: "image/png",
    sizeBytes: 1024,
    manifestUrl: "/api/presentation?id=image-1",
  },
];

test("projection attachment classification covers supported meeting formats", () => {
  assert.equal(classifyProjectionAttachment("战略会.PDF", "application/octet-stream"), "pdf");
  assert.equal(classifyProjectionAttachment("战略会.pptx", "application/octet-stream"), "office");
  assert.equal(classifyProjectionAttachment("纪要.docx", "application/octet-stream"), "office");
  assert.equal(classifyProjectionAttachment("路线图.webp", "application/octet-stream"), "image");
  assert.equal(classifyProjectionAttachment("预算.xlsx", "application/vnd.ms-excel"), "unsupported");
});

test("projection pages preserve mixed source order and expand attachment pages", () => {
  const manifests = new Map<string, ProjectionManifest>([
    ["deck-1", { kind: "document", pageCount: 2 }],
    ["image-1", { kind: "image", pageCount: 1 }],
  ]);

  const pages = buildProjectionPages({
    sources: ["attachment:deck-1", "generated", "attachment:image-1"],
    generatedSlideCount: 2,
    attachments,
    manifests,
  });

  assert.deepEqual(
    pages.map((page) => page.kind === "generated"
      ? `generated:${page.slideIndex}`
      : `${page.attachmentId}:${page.pageNumber}/${page.pageCount}`),
    ["deck-1:1/2", "deck-1:2/2", "generated:0", "generated:1", "image-1:1/1"],
  );
  assert.equal(pages[0]?.kind, "attachment");
  if (pages[0]?.kind === "attachment") {
    assert.equal(pages[0].imageUrl, "/api/presentation?id=deck-1&page=1");
  }
});

test("projection source ordering moves one selected source without changing the rest", () => {
  assert.deepEqual(
    moveProjectionSource(["generated", "attachment:deck-1", "attachment:image-1"], 2, -1),
    ["generated", "attachment:image-1", "attachment:deck-1"],
  );
  assert.deepEqual(moveProjectionSource(["generated", "attachment:deck-1"], 0, -1), ["generated", "attachment:deck-1"]);
});

test("projection launch reloads a pending strategy selection before opening setup", () => {
  assert.deepEqual(
    resolveProjectionLaunch("current:group", {
      key: "snapshot:hot-water-v3",
      href: "/rehearsal?orgUnitId=hot-water&snapshotId=hot-water-v3",
    }),
    {
      kind: "navigate",
      href: "/rehearsal?orgUnitId=hot-water&snapshotId=hot-water-v3&setup=1",
    },
  );
  assert.deepEqual(
    resolveProjectionLaunch("snapshot:hot-water-v3", {
      key: "snapshot:hot-water-v3",
      href: "/rehearsal?orgUnitId=hot-water&snapshotId=hot-water-v3",
    }),
    { kind: "open" },
  );
});
