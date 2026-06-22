import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseDecisionsJson, parseTimelineJson } from "./decisions-access";
import { buildStrategicTimeline } from "./timeline";
import * as demo from "../stratos-demo-data";

describe("command decisions-access", () => {
  it("parses valid decisions JSON", () => {
    const items = parseDecisionsJson([
      { id: "d1", title: "测试决策", status: "open", owner: "CEO", deadline: "Q2" },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.title, "测试决策");
  });

  it("rejects invalid decisions JSON", () => {
    assert.throws(() => parseDecisionsJson([]), /格式无效/);
  });

  it("parses valid timeline JSON", () => {
    const milestones = parseTimelineJson([
      {
        id: "m1",
        label: "年中战略会",
        period: "2026-Q2",
        kind: "meeting",
        status: "active",
        detail: "复盘",
      },
    ]);
    assert.equal(milestones.length, 1);
    assert.equal(milestones[0]!.kind, "meeting");
  });

  it("rejects invalid timeline JSON", () => {
    assert.throws(() => parseTimelineJson([]), /格式无效/);
    assert.throws(
      () =>
        parseTimelineJson([
          { id: "m1", label: "x", period: "2026-Q2", kind: "invalid", status: "active" },
        ]),
      /类型无效/,
    );
  });
});

describe("strategic timeline", () => {
  it("builds timeline from snapshots and meetings", () => {
    const timeline = buildStrategicTimeline(demo.snapshots);
    assert.ok(timeline.length >= demo.snapshots.length);
    assert.ok(timeline.some((m) => m.kind === "meeting"));
  });
});
