import { describe, it, expect, vi } from "vitest";
import { AvailabilityOverride } from "@msp/domain";
import { OverrideMerger } from "../../../services/calendar/override-merger";
import { IAvailabilityOverrideRepository } from "../../../ports/repositories/availability-override.repository.port";
import { TimeWindow } from "../../../services/calendar/availability-expander";

const CLINIC_ID = "clinic-1";
const DOCTOR_ID = "doctor-1";

function createOverride(
  overrides: Partial<{
    id: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    isAvailable: boolean;
    reason?: string;
  }> = {},
): AvailabilityOverride {
  const now = new Date();
  return new AvailabilityOverride({
    id: overrides.id ?? "override-1",
    clinicId: CLINIC_ID,
    doctorId: DOCTOR_ID,
    date: overrides.date ?? new Date(2026, 1, 25),
    startTime: overrides.startTime,
    endTime: overrides.endTime,
    isAvailable: overrides.isAvailable ?? false,
    reason: overrides.reason,
    createdAt: now,
    updatedAt: now,
  });
}

function createMockOverrideRepo(
  overrides: AvailabilityOverride[] = [],
): IAvailabilityOverrideRepository {
  return {
    findByDoctorAndDateRange: vi.fn().mockResolvedValue(overrides),
    findByDoctorAndDate: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
}

function makeWindow(date: Date, startH: number, endH: number): TimeWindow {
  const startsAt = new Date(date);
  startsAt.setHours(startH, 0, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(endH, 0, 0, 0);
  return { startsAt, endsAt };
}

describe("OverrideMerger", () => {
  it("should remove all windows for a day-off override", async () => {
    const wednesday = new Date(2026, 1, 25); // Wed
    const dayOffOverride = createOverride({
      date: wednesday,
      isAvailable: false,
      reason: "Holiday",
    });

    const repo = createMockOverrideRepo([dayOffOverride]);
    const merger = new OverrideMerger(repo);

    const windows: TimeWindow[] = [
      makeWindow(wednesday, 9, 17),
    ];

    const from = new Date(2026, 1, 25);
    const to = new Date(2026, 1, 25);
    const result = await merger.merge(CLINIC_ID, DOCTOR_ID, from, to, windows);

    expect(result).toHaveLength(0);
  });

  it("should replace windows with custom override times", async () => {
    const wednesday = new Date(2026, 1, 25);
    const timeOverride = createOverride({
      date: wednesday,
      isAvailable: true,
      startTime: "10:00",
      endTime: "14:00",
    });

    const repo = createMockOverrideRepo([timeOverride]);
    const merger = new OverrideMerger(repo);

    const windows: TimeWindow[] = [
      makeWindow(wednesday, 9, 17),
    ];

    const from = new Date(2026, 1, 25);
    const to = new Date(2026, 1, 25);
    const result = await merger.merge(CLINIC_ID, DOCTOR_ID, from, to, windows);

    expect(result).toHaveLength(1);
    expect(result[0].startsAt.getHours()).toBe(10);
    expect(result[0].endsAt.getHours()).toBe(14);
  });

  it("should return original windows when no overrides exist", async () => {
    const repo = createMockOverrideRepo([]);
    const merger = new OverrideMerger(repo);

    const monday = new Date(2026, 1, 23);
    const windows: TimeWindow[] = [
      makeWindow(monday, 9, 17),
    ];

    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 1, 23);
    const result = await merger.merge(CLINIC_ID, DOCTOR_ID, from, to, windows);

    expect(result).toHaveLength(1);
    expect(result[0].startsAt.getHours()).toBe(9);
    expect(result[0].endsAt.getHours()).toBe(17);
  });

  it("should handle multiple overrides on different dates", async () => {
    const wednesday = new Date(2026, 1, 25);
    const thursday = new Date(2026, 1, 26);

    const dayOff = createOverride({
      id: "o1",
      date: wednesday,
      isAvailable: false,
    });
    const modifiedHours = createOverride({
      id: "o2",
      date: thursday,
      isAvailable: true,
      startTime: "10:00",
      endTime: "15:00",
    });

    const repo = createMockOverrideRepo([dayOff, modifiedHours]);
    const merger = new OverrideMerger(repo);

    const windows: TimeWindow[] = [
      makeWindow(wednesday, 9, 17),
      makeWindow(thursday, 9, 17),
    ];

    const from = new Date(2026, 1, 25);
    const to = new Date(2026, 1, 26);
    const result = await merger.merge(CLINIC_ID, DOCTOR_ID, from, to, windows);

    // Wednesday removed, Thursday replaced
    expect(result).toHaveLength(1);
    expect(result[0].startsAt.getDate()).toBe(26);
    expect(result[0].startsAt.getHours()).toBe(10);
    expect(result[0].endsAt.getHours()).toBe(15);
  });
});
