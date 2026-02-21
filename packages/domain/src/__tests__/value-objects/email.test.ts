import { describe, it, expect } from "vitest";
import { Email, InvalidEmailError } from "../../value-objects/email";
import { DomainError } from "../../errors";

describe("Email", () => {
  describe("create", () => {
    it("should create a valid email and normalize to lowercase", () => {
      const email = Email.create("User@Example.COM");
      expect(email.toString()).toBe("user@example.com");
    });

    it("should trim whitespace from email", () => {
      const email = Email.create("  user@example.com  ");
      expect(email.toString()).toBe("user@example.com");
    });

    it("should reject email missing @ symbol", () => {
      expect(() => Email.create("userexample.com")).toThrow(InvalidEmailError);
    });

    it("should reject email shorter than 5 characters", () => {
      expect(() => Email.create("a@b")).toThrow(InvalidEmailError);
    });

    it("should reject email without domain part", () => {
      expect(() => Email.create("user@")).toThrow(InvalidEmailError);
    });

    it("should reject empty string", () => {
      expect(() => Email.create("")).toThrow(InvalidEmailError);
    });

    it("should reject email without local part", () => {
      expect(() => Email.create("@example.com")).toThrow(InvalidEmailError);
    });
  });

  describe("equals", () => {
    it("should return true for emails with same value", () => {
      const email1 = Email.create("user@example.com");
      const email2 = Email.create("USER@EXAMPLE.COM");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for emails with different values", () => {
      const email1 = Email.create("user1@example.com");
      const email2 = Email.create("user2@example.com");
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return the normalized email value", () => {
      const email = Email.create("Test.User@Example.COM");
      expect(email.toString()).toBe("test.user@example.com");
    });
  });
});

describe("InvalidEmailError", () => {
  it("should extend DomainError", () => {
    const error = new InvalidEmailError("bad");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have code INVALID_EMAIL", () => {
    const error = new InvalidEmailError("bad");
    expect(error.code).toBe("INVALID_EMAIL");
  });

  it("should include the invalid email in the message", () => {
    const error = new InvalidEmailError("not-an-email");
    expect(error.message).toContain("not-an-email");
  });
});
