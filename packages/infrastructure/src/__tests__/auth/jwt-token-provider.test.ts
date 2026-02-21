import { describe, it, expect } from "vitest";
import { JwtTokenProvider } from "../../auth/jwt-token-provider";
import type { TokenPayload, JwtConfig } from "../../auth/jwt-token-provider";

const TEST_SECRET = "test-secret-key-for-jwt-testing";
const EXPECTED_REFRESH_TOKEN_LENGTH = 128; // 64 bytes as hex

function createProvider(overrides: Partial<JwtConfig> = {}): JwtTokenProvider {
  return new JwtTokenProvider({
    secret: TEST_SECRET,
    expiresIn: "1h",
    refreshExpiresIn: "7d",
    ...overrides,
  });
}

function createTestPayload(): TokenPayload {
  return {
    userId: "user-123",
    clinicId: "clinic-456",
    role: "DOCTOR",
  };
}

describe("JwtTokenProvider", () => {
  describe("generateAccessToken", () => {
    it("should return a JWT string with three dot-separated parts", () => {
      const provider = createProvider();
      const payload = createTestPayload();

      const token = provider.generateAccessToken(payload);

      expect(typeof token).toBe("string");
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
    });
  });

  describe("verifyAccessToken", () => {
    it("should return the payload for a valid token", () => {
      const provider = createProvider();
      const payload = createTestPayload();

      const token = provider.generateAccessToken(payload);
      const decoded = provider.verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(payload.userId);
      expect(decoded!.clinicId).toBe(payload.clinicId);
      expect(decoded!.role).toBe(payload.role);
    });

    it("should return null for an expired token", async () => {
      const provider = createProvider({ expiresIn: "1ms" });
      const payload = createTestPayload();

      const token = provider.generateAccessToken(payload);

      // Wait for the token to expire
      await new Promise((resolve) => setTimeout(resolve, 50));

      const decoded = provider.verifyAccessToken(token);
      expect(decoded).toBeNull();
    });

    it("should return null for a tampered token", () => {
      const provider = createProvider();
      const payload = createTestPayload();

      const token = provider.generateAccessToken(payload);
      const tamperedToken = token.slice(0, -5) + "XXXXX";

      const decoded = provider.verifyAccessToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it("should return null when verifying with a different secret", () => {
      const provider = createProvider();
      const otherProvider = createProvider({ secret: "different-secret" });
      const payload = createTestPayload();

      const token = provider.generateAccessToken(payload);
      const decoded = otherProvider.verifyAccessToken(token);

      expect(decoded).toBeNull();
    });
  });

  describe("generateRefreshToken", () => {
    it("should return a hex string of length 128 (64 bytes)", () => {
      const provider = createProvider();

      const refreshToken = provider.generateRefreshToken();

      expect(typeof refreshToken).toBe("string");
      expect(refreshToken).toHaveLength(EXPECTED_REFRESH_TOKEN_LENGTH);
      expect(refreshToken).toMatch(/^[0-9a-f]+$/);
    });

    it("should return unique tokens on each call", () => {
      const provider = createProvider();

      const token1 = provider.generateRefreshToken();
      const token2 = provider.generateRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });
});
