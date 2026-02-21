import { describe, it, expect } from "vitest";
import { ok, fail, isSuccess, isFailure } from "../types/result";

describe("Result", () => {
  describe("ok", () => {
    it("should create a success result", () => {
      const result = ok(42);
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should be identified by isSuccess", () => {
      const result = ok("hello");
      expect(isSuccess(result)).toBe(true);
      expect(isFailure(result)).toBe(false);
    });
  });

  describe("fail", () => {
    it("should create a failure result", () => {
      const error = new Error("something went wrong");
      const result = fail(error);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it("should be identified by isFailure", () => {
      const result = fail("error message");
      expect(isFailure(result)).toBe(true);
      expect(isSuccess(result)).toBe(false);
    });
  });

  describe("type narrowing", () => {
    it("should narrow type after isSuccess check", () => {
      const result = ok(42) as ReturnType<typeof ok<number>> | ReturnType<typeof fail<string>>;
      if (isSuccess(result)) {
        expect(result.value).toBe(42);
      }
    });

    it("should narrow type after isFailure check", () => {
      const result = fail("err") as ReturnType<typeof ok<number>> | ReturnType<typeof fail<string>>;
      if (isFailure(result)) {
        expect(result.error).toBe("err");
      }
    });
  });
});
