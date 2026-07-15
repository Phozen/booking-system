import { expect, test } from "@playwright/test";

import {
  getCredentials,
  login,
  missingCredentialsMessage,
} from "./helpers/auth";

const employeeCredentials = getCredentials("employee");
const adminCredentials = getCredentials("admin");

test.describe("mobile smoke checks", () => {
  test("public sign-in is usable without horizontal overflow", async ({ page }) => {
    await page.goto("/login");

    const emailDisclosure = page.getByRole("button", { name: "Email login" });
    await expect(emailDisclosure).toBeVisible();

    const disclosureBox = await emailDisclosure.boundingBox();
    expect(disclosureBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await emailDisclosure.click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Log in$/i })).toBeVisible();
  });

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
