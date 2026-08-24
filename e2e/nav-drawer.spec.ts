import { test, expect } from "@playwright/test";

/**
 * Mobile nav drawer a11y contract (viewport < 768px):
 * - opens/closes via the hamburger
 * - is a proper modal dialog (role/aria-modal)
 * - locks background scroll and makes <main> inert + aria-hidden while open
 * - moves focus into the drawer on open, returns it to the hamburger on close
 * - Escape closes it; clicking a nav link closes it
 */
test.describe("mobile nav drawer a11y", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("open → modal + background inert + scroll lock; Escape → restore + focus", async ({
    page,
  }) => {
    await page.goto("/command");

    const hamburger = page.getByRole("button", { name: "打开导航" });
    await expect(hamburger).toBeVisible();

    const drawer = page.locator("#stratos-sidebar");
    const main = page.locator("main.stratos-shell-main");
    await expect(drawer).not.toHaveClass(/stratos-sidebar--open/);

    // Open the drawer.
    await hamburger.click();
    await expect(drawer).toHaveClass(/stratos-sidebar--open/);
    await expect(drawer).toHaveAttribute("role", "dialog");
    await expect(drawer).toHaveAttribute("aria-modal", "true");

    // Background is removed from interaction + a11y tree, and body scroll is locked.
    await expect(main).toHaveAttribute("aria-hidden", "true");
    await expect(main).toHaveAttribute("inert", "");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    // Focus moved into the drawer.
    const focusInside = await page.evaluate(
      () =>
        document
          .getElementById("stratos-sidebar")
          ?.contains(document.activeElement) ?? false,
    );
    expect(focusInside).toBe(true);

    // Escape closes, restores the background, and returns focus to the hamburger.
    await page.keyboard.press("Escape");
    await expect(drawer).not.toHaveClass(/stratos-sidebar--open/);
    await expect(main).not.toHaveAttribute("inert", "");
    await expect(main).not.toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

    const hamburgerFocused = await page.evaluate(
      () =>
        document.activeElement ===
        document.querySelector(".stratos-sidebar__hamburger"),
    );
    expect(hamburgerFocused).toBe(true);
  });

  test("clicking a nav link inside the drawer closes it", async ({ page }) => {
    await page.goto("/command");
    await page.getByRole("button", { name: "打开导航" }).click();

    const drawer = page.locator("#stratos-sidebar");
    await expect(drawer).toHaveClass(/stratos-sidebar--open/);

    await drawer.locator(".stratos-sidebar__nav a").first().click();
    await expect(drawer).not.toHaveClass(/stratos-sidebar--open/);
  });
});
