import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { expect, type Page } from "@playwright/test";

export type E2ERole = "employee" | "admin" | "superAdmin";

const storageStateEnv: Record<E2ERole, string> = {
  employee: "E2E_EMPLOYEE_STORAGE_STATE",
  admin: "E2E_ADMIN_STORAGE_STATE",
  superAdmin: "E2E_SUPER_ADMIN_STORAGE_STATE",
};

export function getStorageState(role: E2ERole): string | null {
  const configuredPath = process.env[storageStateEnv[role]]?.trim();

  if (!configuredPath) {
    return null;
  }

  const storageStatePath = resolve(configuredPath);
  return existsSync(storageStatePath) && statSync(storageStatePath).isFile()
    ? storageStatePath
    : null;
}

export function missingStorageStateMessage(role: E2ERole) {
  return `Set ${storageStateEnv[role]} to a valid, non-committed Playwright storage-state file created through Microsoft sign-in.`;
}

export function emptyStorageState() {
  return { cookies: [], origins: [] };
}

export async function expectRedirectedToLogin(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login\?auth=required/);
}
