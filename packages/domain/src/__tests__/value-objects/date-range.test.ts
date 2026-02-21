import { describe, it, expect } from "vitest";
import { DateRange, InvalidDateRangeError } from "../../value-objects/date-range";
import { DomainError } from "../../errors";

describe("DateRange", () => {
  describe("create", () => {
    it("should create a valid date range", () => {
      const from = new Date("2026-03-01");
      const to = new Date("2026-03-10");
      const range = DateRange.create(from, to);

      expect(range.from.getTime()).toBe(from.getTime());
      expect(range.to.getTime()).toBe(to.getTime());
    });

    it("should reject when to is before from", () => {
      const from = new Date("2026-03-10");
      const to = new Date("2026-03-01");

      expect(() => DateRange.create(from, to)).toThrow(InvalidDateRangeError);
    });

    it("should reject when to equals from", () => {
      const date = new Date("2026-03-01");

      expect(() => DateRange.create(date, date)).toThrow(InvalidDateRangeError);
    });

    it("should defensively copy dates to prevent external mutation", () => {
      const from = new Date("2026-03-01");
      const to = new Date("2026-03-10");
      const originalFrom = from.getTime();

      const range = DateRange.create(from, to);

      from.setFullYear(2000);

      expect(range.from.getTime()).toBe(originalFrom);
    });
  });

  describe("includes", () => {
    it("should return true for a date within the range", () => {
      const range = DateRange.create(
        new Date("2026-03-01"),
        new Date("2026-03-10")
      );
      const dateInRange = new Date("2026-03-05");

      expect(range.includes(dateInRange)).toBe(true);
    });

    it("should return false for a date outside the range", () => {
      const range = DateRange.create(
        new Date("2026-03-01"),
        new Date("2026-03-10")
      );
      const dateOutside = new Date("2026-03-15");

      expect(range.includes(dateOutside)).toBe(false);
    });

    it("should include the boundary start date", () => {
      const from = new Date("2026-03-01T00:00:00Z");
      const to = new Date("2026-03-10T00:00:00Z");
      const range = DateRange.create(from, to);

      expect(range.includes(new Date("2026-03-01T00:00:00Z"))).toBe(true);
    });

    it("should include the boundary end date", () => {
      const from = new Date("2026-03-01T00:00:00Z");
      const to = new Date("2026-03-10T00:00:00Z");
      const range = DateRange.create(from, to);

      expect(range.includes(new Date("2026-03-10T00:00:00Z"))).toBe(true);
    });
  });

  describe("durationDays", () => {
    it("should calculate the duration in days", () => {
      const range = DateRange.create(
        new Date("2026-03-01T00:00:00Z"),
        new Date("2026-03-10T00:00:00Z")
      );

      expect(range.durationDays).toBe(9);
    });

    it("should round up partial days", () => {
      const range = DateRange.create(
        new Date("2026-03-01T00:00:00Z"),
        new Date("2026-03-02T12:00:00Z")
      );

      expect(range.durationDays).toBe(2);
    });
  });

  describe("overlapsWith", () => {
    it("should detect overlapping ranges", () => {
      const range1 = DateRange.create(
        new Date("2026-03-01"),
        new Date("2026-03-10")
      );
      const range2 = DateRange.create(
        new Date("2026-03-05"),
        new Date("2026-03-15")
      );

      expect(range1.overlapsWith(range2)).toBe(true);
      expect(range2.overlapsWith(range1)).toBe(true);
    });

    it("should return false for non-overlapping ranges", () => {
      const range1 = DateRange.create(
        new Date("2026-03-01"),
        new Date("2026-03-05")
      );
      const range2 = DateRange.create(
        new Date("2026-03-10"),
        new Date("2026-03-15")
      );

      expect(range1.overlapsWith(range2)).toBe(false);
      expect(range2.overlapsWith(range1)).toBe(false);
    });

    it("should return false for adjacent ranges (end equals start)", () => {
      const range1 = DateRange.create(
        new Date("2026-03-01T00:00:00Z"),
        new Date("2026-03-05T00:00:00Z")
      );
      const range2 = DateRange.create(
        new Date("2026-03-05T00:00:00Z"),
        new Date("2026-03-10T00:00:00Z")
      );

      expect(range1.overlapsWith(range2)).toBe(false);
      expect(range2.overlapsWith(range1)).toBe(false);
    });
  });
});

describe("InvalidDateRangeError", () => {
  it("should extend DomainError", () => {
    const error = new InvalidDateRangeError("bad range");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have code INVALID_DATE_RANGE", () => {
    const error = new InvalidDateRangeError("bad range");
    expect(error.code).toBe("INVALID_DATE_RANGE");
  });
});
