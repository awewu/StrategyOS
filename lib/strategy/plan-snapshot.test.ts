import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSnapshotJson } from "./plan-snapshot";

test("buildSnapshotJson keeps attachment metadata with the submitted version", () => {
  const snapshot = buildSnapshotJson({
    orgUnitId: "org-1",
    horizonStart: 2026,
    horizonEnd: 2028,
    intent: "增长",
    northStar: "收入",
    attachments: [
      {
        id: "file-1",
        filename: "战略规划.pptx",
        sizeBytes: 1024,
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        storagePath: "/uploads/plans/file-1.pptx",
      },
    ],
  });

  assert.deepEqual(snapshot.attachments, [
    {
      id: "file-1",
      filename: "战略规划.pptx",
      sizeBytes: 1024,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      storagePath: "/uploads/plans/file-1.pptx",
    },
  ]);
});
