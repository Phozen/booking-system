import { expect, type Page } from "@playwright/test";

export type E2ERole = "employee" | "admin" | "superAdmin";

type Credentials = {
  email: string;
  password: string;
};

const credentialEnv: Record<E2ERole, { email: string; password: string }> = {
  employee: {
    email: "E2E_EMPLOYEE_EMAIL",
    password: "E2E_EMPLOYEE_PASSWORD",
  },
  admin: {
    email: "E2E_ADMIN_EMAIL",
    password: "E2E_ADMIN_PASSWORD",
  },
  superAdmin: {
    email: "E2E_SUPER_ADMIN_EMAIL",
    password: "E2E_SUPER_ADMIN_PASSWORD",
  },
};

export function getCredentials(role: E2ERole): Credentials | null {
  const keys = credentialEnv[role];
  const email = process.env[keys.email]?.trim();
  const password = process.env[keys.password]?.trim();

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export function missingCredentialsMessage(role: E2ERole) {
  const keys = credentialEnv[role];
  return `Set ${keys.email} and ${keys.password} to run ${role} E2E tests.`;
}

export async function login(page: Page, credentials: Credentials) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: /^Log in$/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

export async function logout(page: Page) {
  const logoutButton = page.getByRole("button", { name: /log out/i }).first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }
}

export async function expectRedirectedToLogin(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login\?auth=required/);
}
