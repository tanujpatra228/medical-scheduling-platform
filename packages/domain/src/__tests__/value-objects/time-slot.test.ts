import { describe, it, expect } from "vitest";
import { TimeSlot, InvalidTimeSlotError } from "../../value-objects/time-slot";
import { DomainError } from "../../errors";

function createSlot(startOffset: number, endOffset: number): TimeSlot {
  const base = new Date("2026-03-01T09:00:00Z");
  const startsAt = new Date(base.getTime() + startOffset * 60 * 1000);
  const endsAt = new Date(base.getTime() + endOffset * 60 * 1000);
  return TimeSlot.create(startsAt, endsAt);
}

describe("TimeSlot", () => {
  describe("create", () => {
    it("should create a valid time slot", () => {
      const startsAt = new Date("2026-03-01T09:00:00Z");
      const endsAt = new Date("2026-03-01T09:30:00Z");
      const slot = TimeSlot.create(startsAt, endsAt);

      expect(slot.startsAt.getTime()).toBe(startsAt.getTime());
      expect(slot.endsAt.getTime()).toBe(endsAt.getTime());
    });

    it("should reject when endsAt is before startsAt", () => {
      const startsAt = new Date("2026-03-01T10:00:00Z");
      const endsAt = new Date("2026-03-01T09:00:00Z");

      expect(() => TimeSlot.create(startsAt, endsAt)).toThrow(
        InvalidTimeSlotError
      );
    });

    it("should reject zero-duration slot (endsAt equals startsAt)", () => {
      const time = new Date("2026-03-01T09:00:00Z");

      expect(() => TimeSlot.create(time, time)).toThrow(InvalidTimeSlotError);
    });

    it("should defensively copy dates to prevent external mutation", () => {
      const startsAt = new Date("2026-03-01T09:00:00Z");
      const endsAt = new Date("2026-03-01T09:30:00Z");
      const originalStart = startsAt.getTime();

      const slot = TimeSlot.create(startsAt, endsAt);

      // Mutate the original date
      startsAt.setFullYear(2000);

      // Slot should still have the original value
      expect(slot.startsAt.getTime()).toBe(originalStart);
    });
  });

  describe("durationMinutes", () => {
    it("should calculate 30 minutes correctly", () => {
      const slot = createSlot(0, 30);
      expect(slot.durationMinutes).toBe(30);
    });

    it("should calculate 60 minutes correctly", () => {
      const slot = createSlot(0, 60);
      expect(slot.durationMinutes).toBe(60);
    });
  });

  describe("overlapsWith", () => {
    it("should detect partial overlap", () => {
      const slot1 = createSlot(0, 30); // 9:00 - 9:30
      const slot2 = createSlot(15, 45); // 9:15 - 9:45

      expect(slot1.overlapsWith(slot2)).toBe(true);
      expect(slot2.overlapsWith(slot1)).toBe(true);
    });

    it("should detect containment (one contains the other)", () => {
      const outer = createSlot(0, 60); // 9:00 - 10:00
      const inner = createSlot(15, 45); // 9:15 - 9:45

      expect(outer.overlapsWith(inner)).toBe(true);
      expect(inner.overlapsWith(outer)).toBe(true);
    });

    it("should return false for non-overlapping slots", () => {
      const slot1 = createSlot(0, 30); // 9:00 - 9:30
      const slot2 = createSlot(60, 90); // 10:00 - 10:30

      expect(slot1.overlapsWith(slot2)).toBe(false);
      expect(slot2.overlapsWith(slot1)).toBe(false);
    });

    it("should return false for adjacent slots (end equals start)", () => {
      const slot1 = createSlot(0, 30); // 9:00 - 9:30
      const slot2 = createSlot(30, 60); // 9:30 - 10:00

      expect(slot1.overlapsWith(slot2)).toBe(false);
      expect(slot2.overlapsWith(slot1)).toBe(false);
    });
  });

  describe("contains", () => {
    it("should return true when slot fully contains another", () => {
      const outer = createSlot(0, 60); // 9:00 - 10:00
      const inner = createSlot(15, 45); // 9:15 - 9:45

      expect(outer.contains(inner)).toBe(true);
    });

    it("should return false when slot does not contain another", () => {
      const slot1 = createSlot(0, 30); // 9:00 - 9:30
      const slot2 = createSlot(15, 45); // 9:15 - 9:45

      expect(slot1.contains(slot2)).toBe(false);
    });

    it("should return true for exact same boundaries", () => {
      const slot1 = createSlot(0, 30);
      const slot2 = createSlot(0, 30);

      expect(slot1.contains(slot2)).toBe(true);
    });
  });

  describe("equals", () => {
    it("should return true for slots with same times", () => {
      const slot1 = createSlot(0, 30);
      const slot2 = createSlot(0, 30);

      expect(slot1.equals(slot2)).toBe(true);
    });

    it("should return false for slots with different times", () => {
      const slot1 = createSlot(0, 30);
      const slot2 = createSlot(0, 45);

      expect(slot1.equals(slot2)).toBe(false);
    });
  });
});

describe("InvalidTimeSlotError", () => {
  it("should extend DomainError", () => {
    const error = new InvalidTimeSlotError("bad slot");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have code INVALID_TIME_SLOT", () => {
    const error = new InvalidTimeSlotError("bad slot");
    expect(error.code).toBe("INVALID_TIME_SLOT");
  });
});
