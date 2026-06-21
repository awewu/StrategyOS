import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXPECTED_APIS, EXPECTED_PAGES, REQUIRED_FILES } from "@/lib/harness/manifest";
import { formatHarnessReport, runRuntimeHarness } from "@/lib/harness/runner";

describe("harness manifest", () => {
  it("has non-empty route inventories", () => {
    assert.ok(EXPECTED_PAGES.length >= 10);
    assert.ok(EXPECTED_APIS.length >= 10);
    assert.ok(REQUIRED_FILES.length >= 8);
    assert.ok(EXPECTED_APIS.includes("/api/harness"));
    assert.ok(EXPECTED_PAGES.includes("/command"));
  });
});

describe("harness runtime", () => {
  it("produces a valid report shape", async () => {
    const report = await runRuntimeHarness();
    assert.ok(report.timestamp);
    assert.ok(report.summary.total >= 4);
    assert.equal(typeof report.exitCode, "number");
    assert.ok(report.checks.some((c) => c.id === "schema-sync"));
    for (const c of report.checks) {
      assert.ok(["pass", "warn", "fail", "skip"].includes(c.status));
      assert.ok(c.id.length > 0);
    }
  });

  it("formats human-readable output", async () => {
    const report = await runRuntimeHarness();
    const text = formatHarnessReport(report);
    assert.match(text, /StratOS Harness Report/);
    assert.match(text, /Harness: (PASS|FAIL)/);
  });
});
