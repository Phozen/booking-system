import { expect, test } from "@playwright/test";

import {
  emptyStorageState,
  getStorageState,
  missingStorageStateMessage,
} from "./helpers/auth";

const employeeStorageState = getStorageState("employee");
const adminStorageState = getStorageState("admin");
const superAdminStorageState = getStorageState("superAdmin");

test.describe("employee role access control", () => {
  test.use({ storageState: employeeStorageState ?? emptyStorageState() });
  test.skip(!employeeStorageState, missingStorageStateMessage("employee"));

  test("employee is denied admin routes", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("admin role access control", () => {
  test.use({ storageState: adminStorageState ?? emptyStorageState() });
  test.skip(!adminStorageState, missingStorageStateMessage("admin"));

  test("admin can access operational admin routes", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page.getByRole("heading", { name: /bookings/i }).first()).toBeVisible();
  });
});

test.describe("super-admin role access control", () => {
  test.use({ storageState: superAdminStorageState ?? emptyStorageState() });
  test.skip(!superAdminStorageState, missingStorageStateMessage("superAdmin"));

  test("super admin can access user management", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /users/i }).first()).toBeVisible();
  });
});
