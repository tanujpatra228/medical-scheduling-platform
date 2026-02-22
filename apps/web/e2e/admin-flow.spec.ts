import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Admin flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await loginAs(page, "admin");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("dashboard shows stats cards", async ({ page }) => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("main").getByText("Doctors")).toBeVisible();
    await expect(page.getByText(/today's appointments/i)).toBeVisible();
  });

  test("doctors page shows list with pagination", async ({ page }) => {
    await page.goto("/admin/doctors");
    await expect(
      page.getByRole("heading", { name: "Doctors" }),
    ).toBeVisible();
    // Table should have at least one doctor
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("create new doctor and verify in list", async ({ page }) => {
    await page.goto("/admin/doctors/new");
    await expect(page.getByText("Add New Doctor")).toBeVisible();

    const uniqueSuffix = Date.now().toString().slice(-6);

    await page.getByLabel("First Name").fill("Test");
    await page.getByLabel("Last Name").fill(`Doctor${uniqueSuffix}`);
    await page.getByLabel("Email").fill(`testdoc${uniqueSuffix}@test.com`);
    await page.getByLabel("Password").fill("TestDoctor123!");
    await page.getByLabel("Specialization").fill("Cardiology");

    await page
      .getByRole("button", { name: /create doctor/i })
      .click();

    // Should redirect back to doctors list
    await expect(page).toHaveURL(/\/admin\/doctors$/);
    // The new doctor should appear in the list
    await expect(
      page.getByText(`Doctor${uniqueSuffix}`),
    ).toBeVisible();
  });
});
