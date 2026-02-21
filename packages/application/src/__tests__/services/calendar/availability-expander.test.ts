import { describe, it, expect, vi } from "vitest";
import { AvailabilityRule } from "@msp/domain";
import { AvailabilityExpander } from "../../../services/calendar/availability-expander";
import { IAvailabilityRuleRepository } from "../../../ports/repositories/availability-rule.repository.port";

const CLINIC_ID = "clinic-1";
const DOCTOR_ID = "doctor-1";
const TIMEZONE = "Europe/Berlin";

function createRule(
  overrides: Partial<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }> = {},
): AvailabilityRule {
  const now = new Date();
  const rule = new AvailabilityRule({
    id: overrides.id ?? "rule-1",
    clinicId: CLINIC_ID,
    doctorId: DOCTOR_ID,
    dayOfWeek: overrides.dayOfWeek ?? 1,
    startTime: overrides.startTime ?? "09:00",
    endTime: overrides.endTime ?? "17:00",
    isActive: overrides.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  });

  return rule;
}

function createMockRuleRepo(
  rules: AvailabilityRule[] = [],
): IAvailabilityRuleRepository {
  return {
    findByDoctorId: vi.fn().mockResolvedValue(rules),
    findByDoctorAndDay: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };
}

describe("AvailabilityExpander", () => {
  it("should expand rules for a week (Mon-Fri) correctly", async () => {
    const rules = [
      createRule({ id: "r1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }),
      createRule({ id: "r2", dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }),
      createRule({ id: "r3", dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }),
      createRule({ id: "r4", dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }),
      createRule({ id: "r5", dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }),
    ];
    const repo = createMockRuleRepo(rules);
    const expander = new AvailabilityExpander(repo);

    // Mon Feb 23 to Sun Mar 1, 2026
    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 2, 1);
    const windows = await expander.expand(CLINIC_ID, DOCTOR_ID, from, to, TIMEZONE);

    // 5 weekdays: Mon-Fri Feb 23-27
    expect(windows).toHaveLength(5);
    for (const w of windows) {
      expect(w.startsAt.getHours()).toBe(9);
      expect(w.startsAt.getMinutes()).toBe(0);
      expect(w.endsAt.getHours()).toBe(17);
      expect(w.endsAt.getMinutes()).toBe(0);
    }
  });

  it("should return empty array when no rules exist", async () => {
    const repo = createMockRuleRepo([]);
    const expander = new AvailabilityExpander(repo);

    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 1, 27);
    const windows = await expander.expand(CLINIC_ID, DOCTOR_ID, from, to, TIMEZONE);

    expect(windows).toHaveLength(0);
  });

  it("should create windows for multiple rules per day (morning + afternoon)", async () => {
    const rules = [
      createRule({ id: "r1", dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }),
      createRule({ id: "r2", dayOfWeek: 1, startTime: "14:00", endTime: "18:00" }),
    ];
    const repo = createMockRuleRepo(rules);
    const expander = new AvailabilityExpander(repo);

    // Single Monday Feb 23
    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 1, 23);
    const windows = await expander.expand(CLINIC_ID, DOCTOR_ID, from, to, TIMEZONE);

    expect(windows).toHaveLength(2);
    expect(windows[0].startsAt.getHours()).toBe(8);
    expect(windows[0].endsAt.getHours()).toBe(12);
    expect(windows[1].startsAt.getHours()).toBe(14);
    expect(windows[1].endsAt.getHours()).toBe(18);
  });

  it("should skip inactive rules", async () => {
    const activeRule = createRule({ id: "r1", dayOfWeek: 1, isActive: true });
    const inactiveRule = createRule({ id: "r2", dayOfWeek: 1, isActive: true });
    inactiveRule.deactivate();

    const repo = createMockRuleRepo([activeRule, inactiveRule]);
    const expander = new AvailabilityExpander(repo);

    const from = new Date(2026, 1, 23); // Monday
    const to = new Date(2026, 1, 23);
    const windows = await expander.expand(CLINIC_ID, DOCTOR_ID, from, to, TIMEZONE);

    expect(windows).toHaveLength(1);
  });

  it("should handle weekend days with no rules", async () => {
    // Only a Monday rule
    const rules = [
      createRule({ id: "r1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }),
    ];
    const repo = createMockRuleRepo(rules);
    const expander = new AvailabilityExpander(repo);

    // Sat Feb 28 to Mon Mar 2 (includes Sat, Sun, Mon)
    const from = new Date(2026, 1, 28);
    const to = new Date(2026, 2, 2);
    const windows = await expander.expand(CLINIC_ID, DOCTOR_ID, from, to, TIMEZONE);

    // Only Monday March 2 should have a window
    const mondayWindows = windows.filter((w) => w.startsAt.getDay() === 1);
    expect(mondayWindows).toHaveLength(1);

    // No windows for Sat/Sun
    const weekendWindows = windows.filter(
      (w) => w.startsAt.getDay() === 0 || w.startsAt.getDay() === 6,
    );
    expect(weekendWindows).toHaveLength(0);
  });
});
