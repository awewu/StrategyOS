import type { BrowserContext, Page } from "@playwright/test";

const ROLE_COOKIE = "stratos_role";

/** Set role cookie for permission-matrix E2E (production build enforces route levels). */
export async function setRole(context: BrowserContext, role: string, baseURL: string) {
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: ROLE_COOKIE,
      value: role,
      domain: url.hostname,
      path: "/",
      sameSite: "Lax",
    },
  ]);
}

export async function setRoleOnPage(page: Page, role: string) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3003";
  await setRole(page.context(), role, baseURL);
}
