import { test, expect } from "@playwright/test";
import { login, loginAs, logout, TEST_USERS } from "./helpers/auth";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Clear persisted auth state so each test starts logged-out
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("admin login redirects to /admin", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
  });

  test("patient login redirects to /patient", async ({ page }) => {
    await loginAs(page, "patient");
    await expect(page).toHaveURL(/\/patient/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("doctor login redirects to /doctor", async ({ page }) => {
    await loginAs(page, "doctor");
    await expect(page).toHaveURL(/\/doctor/);
    await expect(page.getByText(/welcome, dr\./i)).toBeVisible();
  });

  test("invalid credentials shows error", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, "WrongPassword99!");
    // Should stay on login and show error toast (sonner renders in [data-sonner-toast])
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /invalid|failed/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("logout redirects to /login", async ({ page }) => {
    await loginAs(page, "patient");
    await expect(page).toHaveURL(/\/patient/);
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test("session persists after page refresh", async ({ page }) => {
    await loginAs(page, "patient");
    await expect(page).toHaveURL(/\/patient/);

    await page.reload();
    // Should still be on patient dashboard after refresh
    await expect(page).toHaveURL(/\/patient/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
