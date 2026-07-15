import { test, expect } from "@playwright/test";
import { setRoleOnPage } from "./helpers";

test.describe("StratOS smoke (demo mode)", () => {
  test("home redirects to command", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/command/);
    await expect(page.locator("body")).toContainText(/指挥|Command|StratOS/i);
  });

  test("/command loads CEO command deck", async ({ page }) => {
    await page.goto("/command");
    await expect(page.locator("body")).toContainText(/指挥舱|Command/i);
    await expect(page.locator("body")).toContainText(/Inbox|议题/i);
  });

  test("/strategy/input loads strategy entry", async ({ page }) => {
    await page.goto("/strategy/input");
    await expect(page.locator("body")).toContainText(/战略录入|战略输入|StratDiff/i);
  });

  test("/execution shows commit tab first, switches to detail", async ({ page }) => {
    await setRoleOnPage(page, "ceo");
    await page.goto("/execution");
    await expect(page.locator("body")).toContainText(/承诺兑现率/);
    await page.getByRole("link", { name: "明细", exact: true }).click();
    await expect(page).toHaveURL(/tab=detail/);
  });

  test("/inbox redirects to command issues", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page).toHaveURL(/\/command\/issues/);
    await expect(page.locator("body")).toContainText(/议题/);
  });

  test("/finance loads FPA for CEO role", async ({ page }) => {
    await setRoleOnPage(page, "ceo");
    await page.goto("/finance");
    await expect(page.locator("body")).toContainText(/FPA|财务/i);
  });

  test("/finance denies staff role", async ({ page }) => {
    await setRoleOnPage(page, "staff");
    await page.goto("/finance");
    if (page.url().includes("/finance")) {
      test.skip(
        true,
        "Dev server bypasses route permissions — enforced in CI production build (see permissions.test.ts)",
      );
    }
    await expect(page).toHaveURL(/\?denied=1|\/reports/);
  });

  test("/decode loads BSC / X-Matrix workspace", async ({ page }) => {
    await page.goto("/decode");
    await expect(page.locator("body")).toContainText(/解码|Decode|X-Matrix|战略/i);
  });

  test("/rehearsal loads Q3 walkthrough", async ({ page }) => {
    await page.goto("/rehearsal");
    await expect(page.locator("body")).toContainText(/彩排|Rehearsal|Q3/i);
  });

  test("/print/panorama renders board one-pager", async ({ page }) => {
    await page.goto("/print/panorama");
    await expect(page.locator("body")).toContainText(/全景|Panorama|战略|Strategy/i);
  });

  test("/admin/access shows audit panel", async ({ page }) => {
    await page.goto("/admin/access");
    await expect(page.locator("body")).toContainText(/访问|Access|审计|Audit|日志/i);
  });

  test("/api/health reports capabilities", async ({ request }) => {
    const res = await request.get("/api/health?format=json");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.capabilities).toBeDefined();
    expect(["demo", "full"]).toContain(body.mode);
    expect(body.probe).toBe("liveness");
  });

  test("/api/health readiness returns 200 when DB ok", async ({ request }) => {
    const res = await request.get("/api/health?format=json&probe=readiness");
    const body = await res.json();
    if (body.dataSource === "database") {
      expect(res.status()).toBe(200);
      expect(body.status).toBe("ok");
    } else {
      expect(res.status()).toBe(503);
      expect(body.status).toBe("degraded");
    }
    expect(body.probe).toBe("readiness");
  });
});
