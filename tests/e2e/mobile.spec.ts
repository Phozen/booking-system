import { expect, test } from "@playwright/test";

import {
  emptyStorageState,
  getStorageState,
  missingStorageStateMessage,
} from "./helpers/auth";

const employeeStorageState = getStorageState("employee");
const adminStorageState = getStorageState("admin");

test.describe("mobile public access", () => {
  test("Microsoft sign-in is usable without horizontal overflow", async ({ page }) => {
    await page.goto("/login");

    const microsoftSignIn = page.getByRole("button", {
      name: "Continue with Microsoft",
    });
    await expect(microsoftSignIn).toBeVisible();

    const signInBox = await microsoftSignIn.boundingBox();
    expect(signInBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
    await expect(page.getByLabel("Email")).toHaveCount(0);
    await expect(page.getByLabel("Password")).toHaveCount(0);
  });
});

test.describe("mobile employee smoke checks", () => {
  test.use({ storageState: employeeStorageState ?? emptyStorageState() });
  test.skip(!employeeStorageState, missingStorageStateMessage("employee"));

  test("employee dashboard is readable", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("mobile admin smoke checks", () => {
  test.use({ storageState: adminStorageState ?? emptyStorageState() });
  test.skip(!adminStorageState, missingStorageStateMessage("admin"));

  test("admin dashboard is readable", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: /admin dashboard/i }).first()).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("equipment editor is usable without horizontal overflow", async ({ page }) => {
    await page.goto("/admin/equipment");
    const equipmentItem = page.locator("details").first();

    await equipmentItem.locator("summary").click();
    await expect(equipmentItem.getByLabel("Name", { exact: true })).toBeVisible();
    await expect(equipmentItem.getByRole("button", { name: "Save changes" })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
