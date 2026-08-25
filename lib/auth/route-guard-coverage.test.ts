import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guard: every server page under app/(dashboard) must enforce access
 * on the server. StratOS has no auth middleware — protection is per-page — so a
 * page that omits a guard is reachable by direct URL for any logged-in role.
 * Accepted guards: requireRouteAccess / requireAdmin / requireMinLevel, or the
 * page is a pure redirect stub. (getEffectiveRole/Session alone is NOT a guard;
 * it fetches identity without enforcing, so it does not count here.)
 */
const DASHBOARD_DIR = join(process.cwd(), "app", "(dashboard)");
const GUARD_RE = /requireRouteAccess|requireAdmin|requireMinLevel|redirect\(/;

function collectPages(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectPages(full));
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

describe("dashboard route guard coverage", () => {
  it("every (dashboard) page enforces a server-side access guard", () => {
    const pages = collectPages(DASHBOARD_DIR);
    assert.ok(pages.length > 0, "expected to find dashboard pages");

    const unguarded = pages
      .filter((p) => !GUARD_RE.test(readFileSync(p, "utf8")))
      .map((p) => p.slice(process.cwd().length + 1).replace(/\\/g, "/"));

    assert.deepEqual(
      unguarded,
      [],
      `Pages missing a server-side access guard (add requireRouteAccess/requireAdmin):\n${unguarded.join("\n")}`,
    );
  });
});
