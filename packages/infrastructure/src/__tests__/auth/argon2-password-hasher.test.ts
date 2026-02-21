import { describe, it, expect } from "vitest";
import { Argon2PasswordHasher } from "../../auth/argon2-password-hasher";

describe("Argon2PasswordHasher", () => {
  const hasher = new Argon2PasswordHasher();
  const testPassword = "SecurePassword123!";

  it("should produce a hash different from the input", async () => {
    const hash = await hasher.hash(testPassword);
    expect(hash).not.toBe(testPassword);
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should produce unique hashes for the same input due to salting", async () => {
    const hash1 = await hasher.hash(testPassword);
    const hash2 = await hasher.hash(testPassword);
    expect(hash1).not.toBe(hash2);
  });

  it("should return true when verifying the correct password", async () => {
    const hash = await hasher.hash(testPassword);
    const result = await hasher.verify(testPassword, hash);
    expect(result).toBe(true);
  });

  it("should return false when verifying a wrong password", async () => {
    const hash = await hasher.hash(testPassword);
    const result = await hasher.verify("WrongPassword456!", hash);
    expect(result).toBe(false);
  });

  it("should return false when verifying against an invalid hash string", async () => {
    const result = await hasher.verify(testPassword, "not-a-valid-hash");
    expect(result).toBe(false);
  });
});
