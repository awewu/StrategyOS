import { test, expect } from "@playwright/test";
import { setRoleOnPage } from "./helpers";

const SHOT_DIR = "/tmp/stratos-ux";

test.describe("M&A / Innovation UX walkthrough", () => {
  test.beforeEach(async ({ page }) => {
    await setRoleOnPage(page, "ceo");
  });

  test("/ma pipeline board renders", async ({ page }) => {
    await page.goto("/ma");
    await expect(page.locator("body")).toContainText(/并购|M&A|交易/i);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOT_DIR}/ma-board.png`, fullPage: true });
  });

  test("/ma deal detail drawer opens", async ({ page }) => {
    await page.goto("/ma");
    await page.waitForTimeout(1000);
    const card = page.getByText(/热泵控制芯片|苏南区域经销商/).first();
    if ((await card.count()) > 0) {
      await card.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${SHOT_DIR}/ma-detail.png`, fullPage: true });
      const dialog = page.locator("[role=dialog]");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
    } else {
      await page.screenshot({ path: `${SHOT_DIR}/ma-empty.png`, fullPage: true });
    }
  });

  test("/ma new deal editor opens", async ({ page }) => {
    await page.goto("/ma?new=1&dealType=acquisition");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOT_DIR}/ma-new-deal.png`, fullPage: true });
  });

  test("/innovation renders", async ({ page }) => {
    await page.goto("/innovation");
    await expect(page.locator("body")).toContainText(/创新|Innovation/i);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOT_DIR}/innovation.png`, fullPage: true });
  });

  test("/ma mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ma");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOT_DIR}/ma-mobile.png`, fullPage: true });
  });
});
