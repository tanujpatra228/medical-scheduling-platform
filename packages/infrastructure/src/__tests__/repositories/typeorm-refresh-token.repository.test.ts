import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmRefreshTokenRepository } from "../../repositories/typeorm-refresh-token.repository";
import { RefreshTokenEntity } from "../../database/entities";

function createMockRefreshTokenEntity(
  overrides: Partial<RefreshTokenEntity> = {},
): RefreshTokenEntity {
  const entity = {
    id: "token-1",
    userId: "user-1",
    tokenHash: "hash-abc123",
    expiresAt: new Date("2025-07-01"),
    revokedAt: null,
    createdAt: new Date("2025-01-01"),
    user: {} as any,
    get isExpired() {
      return new Date() > this.expiresAt;
    },
    get isRevoked() {
      return this.revokedAt !== null;
    },
    get isValid() {
      return !this.isExpired && !this.isRevoked;
    },
    ...overrides,
  } as RefreshTokenEntity;
  return entity;
}

describe("TypeOrmRefreshTokenRepository", () => {
  let repository: TypeOrmRefreshTokenRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmRefreshTokenRepository(mockOrmRepo as any);
  });

  describe("findByTokenHash", () => {
    it("should return a RefreshToken when entity is found", async () => {
      const entity = createMockRefreshTokenEntity();
      mockOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByTokenHash("hash-abc123");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { tokenHash: "hash-abc123" },
      });
      expect(result).toEqual({
        id: "token-1",
        userId: "user-1",
        tokenHash: "hash-abc123",
        expiresAt: new Date("2025-07-01"),
        revokedAt: null,
        createdAt: new Date("2025-01-01"),
      });
    });

    it("should return null when entity is not found", async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByTokenHash("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("should persist and return the refresh token", async () => {
      const token = {
        id: "token-1",
        userId: "user-1",
        tokenHash: "hash-abc123",
        expiresAt: new Date("2025-07-01"),
        revokedAt: null,
        createdAt: new Date("2025-01-01"),
      };
      const savedEntity = createMockRefreshTokenEntity();
      mockOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await repository.save(token);

      expect(mockOrmRepo.save).toHaveBeenCalledWith({
        id: "token-1",
        userId: "user-1",
        tokenHash: "hash-abc123",
        expiresAt: new Date("2025-07-01"),
        revokedAt: null,
        createdAt: new Date("2025-01-01"),
      });
      expect(result.id).toBe("token-1");
      expect(result.tokenHash).toBe("hash-abc123");
    });
  });

  describe("revokeByUserId", () => {
    it("should update non-revoked tokens for user with revokedAt timestamp", async () => {
      mockOrmRepo.update.mockResolvedValue({ affected: 2 });

      await repository.revokeByUserId("user-1");

      expect(mockOrmRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1" }),
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });
  });

  describe("revokeByTokenHash", () => {
    it("should update the specific token with revokedAt timestamp", async () => {
      mockOrmRepo.update.mockResolvedValue({ affected: 1 });

      await repository.revokeByTokenHash("hash-abc123");

      expect(mockOrmRepo.update).toHaveBeenCalledWith(
        { tokenHash: "hash-abc123" },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });
  });
});
