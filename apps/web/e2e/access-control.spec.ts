import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Access control", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("unauthenticated user visiting /patient is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/patient");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /admin is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /doctor is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/doctor");
    await expect(page).toHaveURL(/\/login/);
  });

  test("patient visiting /admin is redirected to /patient", async ({
    page,
  }) => {
    await loginAs(page, "patient");
    await expect(page).toHaveURL(/\/patient/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/patient/);
  });

  test("doctor visiting /admin is redirected to /doctor", async ({
    page,
  }) => {
    await loginAs(page, "doctor");
    await expect(page).toHaveURL(/\/doctor/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/doctor/);
  });

  test("admin visiting /patient is redirected to /admin", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await expect(page).toHaveURL(/\/admin/);

    await page.goto("/patient");
    await expect(page).toHaveURL(/\/admin/);
  });
});
