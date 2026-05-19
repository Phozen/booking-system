import { expect, test } from "@playwright/test";

import {
  getCredentials,
  login,
  missingCredentialsMessage,
} from "./helpers/auth";
import { employeeSmokeRoutes } from "./helpers/routes";

const employeeCredentials = getCredentials("employee");

test.describe("employee smoke flows", () => {
  test.skip(!employeeCredentials, missingCredentialsMessage("employee"));

  test.beforeEach(async ({ page }) => {
    const credentials = employeeCredentials;

    if (!credentials) {
      test.skip();
      return;
    }

    await login(page, credentials);
  });

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

  test("waitlist form validates required fields", async ({ page }) => {
    await page.goto("/waitlist");
    await page.getByRole("button", { name: /request waitlist/i }).click();
    await expect(page.getByText(/check the waitlist details/i)).toBeVisible();
  });

  test("recurring booking preview validates required fields", async ({ page }) => {
    await page.goto("/bookings/recurring/new");
    await page.getByRole("button", { name: /preview dates/i }).click();
    await expect(page.getByText(/check the recurring booking details/i)).toBeVisible();
  });
});
