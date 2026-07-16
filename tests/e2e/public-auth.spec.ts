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

  test("login page exposes Microsoft-only pre-provisioned access", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Continue with Microsoft" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveCount(0);
    await expect(page.getByLabel("Password")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /register|sign up/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /reset password|forgot password/i })).toHaveCount(0);
  });

  test("legacy registration and password-reset routes redirect to disabled login", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/login\?error=disabled/);

    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/login\?error=disabled/);
  });

  test("logged-out employee pages redirect to login", async ({ page }) => {
    await expectRedirectedToLogin(page, "/dashboard");
    await expectRedirectedToLogin(page, "/my-bookings");
    await expectRedirectedToLogin(page, "/calendar");
    await expectRedirectedToLogin(page, "/profile");
  });

  test("logged-out admin pages redirect to login", async ({ page }) => {
    await expectRedirectedToLogin(page, "/admin/dashboard");
  });
});
