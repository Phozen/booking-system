import { expect, test } from "@playwright/test";

import { expectRedirectedToLogin } from "./helpers/auth";
import { publicRoutes } from "./helpers/routes";

test.describe("public and logged-out access", () => {
  for (const route of publicRoutes) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }

  test("login page reveals the email/password form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Email login" }).click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Log in$/i })).toBeVisible();
  });

  test("logged-out employee pages redirect to login", async ({ page }) => {
    test.slow();
    await expectRedirectedToLogin(page, "/dashboard");
    await expectRedirectedToLogin(page, "/my-bookings");
    await expectRedirectedToLogin(page, "/calendar");
    await expectRedirectedToLogin(page, "/waitlist");
    await expectRedirectedToLogin(page, "/profile");
  });

  test("logged-out admin pages redirect to login", async ({ page }) => {
    await expectRedirectedToLogin(page, "/admin/dashboard");
    await expectRedirectedToLogin(page, "/admin/waitlist");
  });
});
