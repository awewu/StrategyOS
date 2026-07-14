import { test, expect } from "@playwright/test";
import { setRoleOnPage } from "./helpers";

test("bsc targets board drawer", async ({ page }) => {
  await setRoleOnPage(page, "ceo");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/command");
  await page.waitForTimeout(1500);
  const board = page.locator(".stratos-command-board");
  await board.screenshot({ path: "/tmp/stratos-ux/bsc-cards.png" });

  await page.getByRole("button", { name: /股东满意|财务/ }).first().click();
  const dialog = page.locator("[role=dialog]");
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/tmp/stratos-ux/bsc-drawer.png" });

  const editBtn = dialog.getByRole("button", { name: "编辑" });
  if ((await editBtn.count()) > 0) {
    await editBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "/tmp/stratos-ux/bsc-edit.png" });
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
