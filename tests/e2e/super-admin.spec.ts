import { expect, test } from "@playwright/test";

import {
  emptyStorageState,
  getStorageState,
  missingStorageStateMessage,
} from "./helpers/auth";
import { superAdminSmokeRoutes } from "./helpers/routes";

const superAdminStorageState = getStorageState("superAdmin");

test.use({ storageState: superAdminStorageState ?? emptyStorageState() });

test.describe("super admin smoke flows", () => {
  test.skip(!superAdminStorageState, missingStorageStateMessage("superAdmin"));

  for (const route of superAdminSmokeRoutes) {
    test(`${route.path} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    });
  }
});
