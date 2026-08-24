import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NAV_HUBS, NAV_STANDALONE } from "./hubs";
import { getPageGuide, PAGE_GUIDES } from "./page-guides";

describe("page-guides", () => {
  it("every nav hub child route resolves to a guide", () => {
    for (const hub of NAV_HUBS) {
      for (const child of hub.children) {
        const path = child.href.split("?")[0]!;
        assert.ok(
          getPageGuide(path),
          `missing PageGuide for ${path} (hub ${hub.id})`,
        );
      }
    }
  });

  it("every standalone nav route resolves to a guide", () => {
    for (const s of NAV_STANDALONE) {
      const path = s.href.split("?")[0]!;
      assert.ok(getPageGuide(path), `missing PageGuide for ${path}`);
    }
  });

  it("guides are well-formed: purpose, principle, non-empty steps", () => {
    for (const [route, guide] of Object.entries(PAGE_GUIDES)) {
      assert.ok(guide.purpose.length > 0, `${route} purpose empty`);
      assert.ok(guide.principle.length > 0, `${route} principle empty`);
      assert.ok(guide.steps.length > 0, `${route} steps empty`);
    }
  });

  it("resolves redirect-stub aliases to canonical guides", () => {
    assert.ok(getPageGuide("/compass"), "/compass alias unresolved");
    assert.ok(getPageGuide("/inbox"), "/inbox alias unresolved");
    assert.ok(getPageGuide("/rehearsal"), "/rehearsal alias unresolved");
  });

  it("resolves nested routes via longest-prefix match", () => {
    // /decode?tab=okr → /decode; /reports/123 → /reports
    assert.ok(getPageGuide("/reports/some-id"), "nested /reports unresolved");
    assert.equal(getPageGuide("/strategy"), PAGE_GUIDES["/strategy"]);
  });
});
