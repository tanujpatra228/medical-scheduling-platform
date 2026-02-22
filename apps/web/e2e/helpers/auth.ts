import type { Page } from "@playwright/test";

export const TEST_USERS = {
  admin: { email: "admin@musterpraxis.de", password: "Admin123!" },
  doctor: { email: "mueller@musterpraxis.de", password: "Doctor123!" },
  patient: { email: "max@example.de", password: "Patient123!" },
} as const;

export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

export async function loginAs(
  page: Page,
  role: keyof typeof TEST_USERS,
): Promise<void> {
  const { email, password } = TEST_USERS[role];
  await login(page, email, password);
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: /logout/i }).click();
}
