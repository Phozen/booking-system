import { expect, test } from "@playwright/test";

import {
  getCredentials,
  login,
  missingCredentialsMessage,
} from "./helpers/auth";

const employeeCredentials = getCredentials("employee");
const adminCredentials = getCredentials("admin");
const superAdminCredentials = getCredentials("superAdmin");

test.describe("role access control", () => {
  test("employee is denied admin routes when credentials are available", async ({
    page,
  }) => {
    test.skip(!employeeCredentials, missingCredentialsMessage("employee"));

    if (!employeeCredentials) {
      return;
    }

    await login(page, employeeCredentials);
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("admin can access operational admin routes when credentials are available", async ({
    page,
  }) => {
    test.skip(!adminCredentials, missingCredentialsMessage("admin"));

    if (!adminCredentials) {
      return;
    }

    await login(page, adminCredentials);
    await page.goto("/admin/bookings");
    await expect(page.getByRole("heading", { name: /bookings/i }).first()).toBeVisible();
  });

  test("super admin can access user management when credentials are available", async ({
    page,
  }) => {
    test.skip(!superAdminCredentials, missingCredentialsMessage("superAdmin"));

    if (!superAdminCredentials) {
      return;
    }

    await login(page, superAdminCredentials);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /users/i }).first()).toBeVisible();
  });
});
