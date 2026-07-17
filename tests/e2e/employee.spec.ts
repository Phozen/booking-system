import { expect, test } from "@playwright/test";

import {
  emptyStorageState,
  getStorageState,
  missingStorageStateMessage,
} from "./helpers/auth";
import { employeeSmokeRoutes } from "./helpers/routes";

const employeeStorageState = getStorageState("employee");

test.use({ storageState: employeeStorageState ?? emptyStorageState() });

test.describe("employee smoke flows", () => {
  test.skip(!employeeStorageState, missingStorageStateMessage("employee"));

  for (const route of employeeSmokeRoutes) {
    test(`${route.path} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    });
  }

  test("employee cannot access the admin dashboard", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("booking form shows required field errors", async ({ page }) => {
    await page.goto("/bookings/new");
    await page.getByRole("button", { name: /create booking/i }).click();
    await expect(page.locator("[aria-invalid='true']").first()).toBeVisible();
  });

});
