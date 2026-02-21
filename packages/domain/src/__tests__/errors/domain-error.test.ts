import { describe, it, expect } from "vitest";
import { DomainError } from "../../errors";

class TestError extends DomainError {
  readonly code = "TEST_ERROR";

  constructor(message: string) {
    super(message);
  }
}

describe("DomainError", () => {
  it("should have the correct name", () => {
    const error = new TestError("test message");
    expect(error.name).toBe("TestError");
  });

  it("should have the correct message", () => {
    const error = new TestError("something went wrong");
    expect(error.message).toBe("something went wrong");
  });

  it("should have a code property", () => {
    const error = new TestError("test");
    expect(error.code).toBe("TEST_ERROR");
  });

  it("should be an instance of Error", () => {
    const error = new TestError("test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });
});
