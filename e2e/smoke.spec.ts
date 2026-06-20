import { test, expect } from "@playwright/test";

test.describe("StratOS smoke (demo mode)", () => {
  test("home redirects to command", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/command/);
    await expect(page.locator("body")).toContainText(/指挥|Command|StratOS/i);
  });

  test("/decode loads StratSim tab area", async ({ page }) => {
    await page.goto("/decode");
    await expect(page.locator("body")).toContainText(/解码|Decode|StratSim|战略/i);
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
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.capabilities).toBeDefined();
    expect(["demo", "full"]).toContain(body.mode);
  });
});
