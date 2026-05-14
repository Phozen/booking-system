import { expect, test } from "@playwright/test";

import {
  getCredentials,
  login,
  missingCredentialsMessage,
} from "./helpers/auth";

const employeeCredentials = getCredentials("employee");
const adminCredentials = getCredentials("admin");

test.describe("mobile smoke checks", () => {
  test("employee dashboard is readable on mobile when credentials are available", async ({
    page,
  }) => {
    test.skip(!employeeCredentials, missingCredentialsMessage("employee"));

    if (!employeeCredentials) {
      return;
    }

    await login(page, employeeCredentials);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin dashboard is readable on mobile when credentials are available", async ({
    page,
  }) => {
    test.skip(!adminCredentials, missingCredentialsMessage("admin"));

    if (!adminCredentials) {
      return;
    }

    await login(page, adminCredentials);
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: /admin dashboard/i }).first()).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });
});
