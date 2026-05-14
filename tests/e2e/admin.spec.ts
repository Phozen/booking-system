import { expect, test } from "@playwright/test";

import {
  getCredentials,
  login,
  missingCredentialsMessage,
} from "./helpers/auth";
import { adminSmokeRoutes } from "./helpers/routes";

const adminCredentials = getCredentials("admin");

test.describe("admin smoke flows", () => {
  test.skip(!adminCredentials, missingCredentialsMessage("admin"));

  test.beforeEach(async ({ page }) => {
    const credentials = adminCredentials;

    if (!credentials) {
      test.skip();
      return;
    }

    await login(page, credentials);
  });

  for (const route of adminSmokeRoutes) {
    test(`${route.path} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    });
  }

  test("admin cannot access super-admin-only pages", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });
});
