import { describe, it, expect } from "vitest";
import {
  DomainError,
  InvalidStateTransitionError,
  SlotNotAvailableError,
  DoubleBookingError,
} from "../../errors";

describe("InvalidStateTransitionError", () => {
  it("should extend DomainError", () => {
    const error = new InvalidStateTransitionError("PENDING", "CANCELLED");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have code INVALID_STATE_TRANSITION", () => {
    const error = new InvalidStateTransitionError("PENDING", "CANCELLED");
    expect(error.code).toBe("INVALID_STATE_TRANSITION");
  });

  it("should include from and to states in message", () => {
    const error = new InvalidStateTransitionError("PENDING", "CANCELLED");
    expect(error.message).toContain("PENDING");
    expect(error.message).toContain("CANCELLED");
  });

  it("should have the correct name", () => {
    const error = new InvalidStateTransitionError("PENDING", "CANCELLED");
    expect(error.name).toBe("InvalidStateTransitionError");
  });
});

describe("SlotNotAvailableError", () => {
  it("should extend DomainError", () => {
    const error = new SlotNotAvailableError();
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have code SLOT_NOT_AVAILABLE", () => {
    const error = new SlotNotAvailableError();
    expect(error.code).toBe("SLOT_NOT_AVAILABLE");
  });

  it("should have a default message", () => {
    const error = new SlotNotAvailableError();
    expect(error.message).toBe(
      "The requested time slot is not available"
    );
  });

  it("should accept a custom message", () => {
    const error = new SlotNotAvailableError("Custom slot error");
    expect(error.message).toBe("Custom slot error");
  });

  it("should have the correct name", () => {
    const error = new SlotNotAvailableError();
    expect(error.name).toBe("SlotNotAvailableError");
  });
});

describe("DoubleBookingError", () => {
  it("should extend DomainError", () => {
    const error = new DoubleBookingError("doc-123", "9:00-10:00");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have code DOUBLE_BOOKING", () => {
    const error = new DoubleBookingError("doc-123", "9:00-10:00");
    expect(error.code).toBe("DOUBLE_BOOKING");
  });

  it("should include doctor ID in message", () => {
    const error = new DoubleBookingError("doc-456", "9:00-10:00");
    expect(error.message).toContain("doc-456");
  });

  it("should include time slot description in message", () => {
    const error = new DoubleBookingError("doc-123", "2026-03-01 9:00-10:00");
    expect(error.message).toContain("2026-03-01 9:00-10:00");
  });

  it("should have the correct name", () => {
    const error = new DoubleBookingError("doc-123", "9:00-10:00");
    expect(error.name).toBe("DoubleBookingError");
  });
});
