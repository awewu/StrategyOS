import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CEO_RAIL_STANDALONE_IDS, layoutSidebarNav } from "./sidebar-layout";
import { NAV_MONITOR_HUB, NAV_TOOLS_HUB, NAV_STANDALONE, NAV_PRIMARY_HUBS } from "./hubs";

describe("sidebar-layout · CEO", () => {
  it("keeps FPA on rail and folds secondary standalones into 更多", () => {
    const layout = layoutSidebarNav("ceo", {
      primaryHubs: NAV_PRIMARY_HUBS,
      standalone: NAV_STANDALONE,
      bottomHubs: [NAV_MONITOR_HUB, NAV_TOOLS_HUB],
      includeAccess: true,
    });

    assert.equal(layout.railStandalone.length, CEO_RAIL_STANDALONE_IDS.size);
    assert.ok(NAV_PRIMARY_HUBS.some((h) => h.id === "budget"));
    assert.equal(layout.bottomHubs.length, 0);
    assert.ok(layout.moreLinks.some((l) => l.href === "/decode"));
    assert.ok(layout.moreLinks.some((l) => l.href === "/culture"));
    assert.ok(layout.moreLinks.some((l) => l.href === "/reports"));
    assert.ok(layout.moreLinks.some((l) => l.href === "/admin/access"));
  });

  it("returns full nav for VP without 更多", () => {
    const layout = layoutSidebarNav("vp", {
      primaryHubs: NAV_PRIMARY_HUBS,
      standalone: NAV_STANDALONE,
      bottomHubs: [NAV_MONITOR_HUB],
      includeAccess: false,
    });

    assert.equal(layout.moreLinks.length, 0);
    assert.ok(layout.railStandalone.length >= 2);
    assert.equal(layout.bottomHubs.length, 1);
  });
});
