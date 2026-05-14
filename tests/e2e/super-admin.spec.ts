import { expect, test } from "@playwright/test";

import {
  getCredentials,
  login,
  missingCredentialsMessage,
} from "./helpers/auth";
import { superAdminSmokeRoutes } from "./helpers/routes";

const superAdminCredentials = getCredentials("superAdmin");

test.describe("super admin smoke flows", () => {
  test.skip(!superAdminCredentials, missingCredentialsMessage("superAdmin"));

  test.beforeEach(async ({ page }) => {
    const credentials = superAdminCredentials;

    if (!credentials) {
      test.skip();
      return;
    }

    await login(page, credentials);
  });

  for (const route of superAdminSmokeRoutes) {
    test(`${route.path} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    });
  }
});
