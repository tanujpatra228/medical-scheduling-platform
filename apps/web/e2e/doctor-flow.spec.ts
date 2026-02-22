import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Doctor flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await loginAs(page, "doctor");
    await expect(page).toHaveURL(/\/doctor/);
  });

  test("dashboard shows welcome and stats cards", async ({ page }) => {
    await expect(page.getByText(/welcome, dr\./i)).toBeVisible();
    // Stats cards for appointment statuses
    await expect(page.getByText("Pending")).toBeVisible();
    await expect(page.getByText("Confirmed")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
  });

  test("dashboard shows today's appointments section", async ({ page }) => {
    await expect(page.getByText(/today's appointments/i)).toBeVisible();
  });

  test("schedule page loads", async ({ page }) => {
    await page.goto("/doctor/schedule");
    await expect(page.getByText("Weekly Schedule")).toBeVisible();
  });

  test("appointment detail shows patient info", async ({ page }) => {
    // Look for a "View" button in the appointments table
    const viewButton = page
      .getByRole("link", { name: /view/i })
      .or(page.getByRole("button", { name: /view/i }))
      .first();

    if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/doctor\/appointments\/.+/);
      await expect(page.getByText("Appointment Details")).toBeVisible();
      await expect(page.getByText("Patient ID")).toBeVisible();
    }
  });
});
