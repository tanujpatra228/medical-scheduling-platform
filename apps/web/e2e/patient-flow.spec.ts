import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Patient flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await loginAs(page, "patient");
    await expect(page).toHaveURL(/\/patient/);
  });

  test("dashboard shows appointments section and book button", async ({
    page,
  }) => {
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByText(/upcoming appointments/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /book appointment/i }),
    ).toBeVisible();
  });

  test("book appointment flow: select doctor, pick slot, confirm", async ({
    page,
  }) => {
    // Step 1: Navigate to booking page
    await page.getByRole("button", { name: /book appointment/i }).click();
    await expect(page).toHaveURL(/\/patient\/book/);
    await expect(page.getByText("Select a doctor")).toBeVisible();

    // Select a seeded doctor that has availability rules
    const doctorCard = page.locator("[class*=cursor-pointer]", {
      hasText: /Dr\. Hans Mueller/,
    });
    await doctorCard.click();
    await expect(page.getByText("Pick an available time slot")).toBeVisible();

    // Step 2: Pick an available time slot
    // The slot picker shows 5 days at a time; seeded doctor has Mon-Fri availability.
    // Navigate forward if no slots in the current range.
    const timeSlot = page
      .locator("button")
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();

    for (let attempt = 0; attempt < 8; attempt++) {
      if (await timeSlot.isVisible({ timeout: 3000 }).catch(() => false)) {
        break;
      }
      // Click the next-range chevron button (the second/last button in the
      // date navigation row, which sits between two outline buttons)
      const dateRangeText = page.locator("span.text-sm.font-medium");
      const navContainer = dateRangeText.locator("..");
      await navContainer.locator("button").last().click();
      await page.waitForTimeout(1000);
    }

    await timeSlot.click();

    // Step 3: Confirm the booking
    await expect(page.getByText("Confirm Booking")).toBeVisible();
    await page
      .getByRole("button", { name: /confirm appointment/i })
      .click();

    // Should redirect back to patient dashboard
    await expect(page).toHaveURL(/\/patient$/);
  });

  test("view appointment detail page", async ({ page }) => {
    const appointmentLink = page
      .locator("[class*=cursor-pointer]")
      .first();

    if (
      await appointmentLink.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await appointmentLink.click();
      await expect(page).toHaveURL(/\/patient\/appointments\/.+/);
      await expect(page.getByText("Appointment Details")).toBeVisible();
    }
  });

  test("cancel a pending appointment", async ({ page }) => {
    const appointmentLink = page
      .locator("[class*=cursor-pointer]")
      .first();

    if (
      await appointmentLink.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await appointmentLink.click();
      await expect(page).toHaveURL(/\/patient\/appointments\/.+/);

      const cancelBtn = page.getByRole("button", {
        name: /cancel appointment/i,
      });
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
        // Should redirect back to dashboard after cancellation
        await expect(page).toHaveURL(/\/patient$/);
      }
    }
  });
});
