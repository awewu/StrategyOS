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
    productQuarterlyYears: [2026, 2027, 2028, 2029],
    productQuarterly: [{ year: 2029, productName: "新品" }],
    orgChartNodes: [{ name: "研发中心", headcount2026: 2, headcount2027: 3, headcount2028: 4 }],
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
  assert.deepEqual(snapshot.productQuarterlyYears, [2026, 2027, 2028, 2029]);
  assert.deepEqual(snapshot.productQuarterly, [{ year: 2029, productName: "新品" }]);
  assert.deepEqual(snapshot.orgChartNodes, [{ name: "研发中心", headcount2026: 2, headcount2027: 3, headcount2028: 4 }]);
});
