import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHash } from "node:crypto";
import { User, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import {
  RefreshTokenUseCase,
  InvalidRefreshTokenError,
} from "../../../use-cases/auth/refresh-token.use-case";
import { IUserRepository } from "../../../ports/repositories/user.repository.port";
import {
  IRefreshTokenRepository,
  RefreshToken,
} from "../../../ports/repositories/refresh-token.repository.port";
import { ITokenProviderPort } from "../../../ports/services";
import { RefreshTokenDTO } from "../../../dtos";

function createMockUserRepository(): IUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findAllByEmail: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation((user: User) => Promise.resolve(user)),
    update: vi.fn().mockImplementation((user: User) => Promise.resolve(user)),
  };
}

function createMockRefreshTokenRepository(): IRefreshTokenRepository {
  return {
    findByTokenHash: vi.fn().mockResolvedValue(null),
    save: vi
      .fn()
      .mockImplementation((token: RefreshToken) => Promise.resolve(token)),
    revokeByUserId: vi.fn().mockResolvedValue(undefined),
    revokeByTokenHash: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockTokenProvider(): ITokenProviderPort {
  return {
    generateAccessToken: vi.fn().mockReturnValue("new_access_token"),
    generateRefreshToken: vi.fn().mockReturnValue("new_refresh_token"),
    verifyAccessToken: vi.fn().mockReturnValue(null),
  };
}

function createActiveUser(): User {
  return new User({
    id: "user-1",
    clinicId: "clinic-1",
    email: Email.create("john@example.com"),
    passwordHash: "stored_hash",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.PATIENT,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createValidStoredToken(
  overrides: Partial<RefreshToken> = {},
): RefreshToken {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  return {
    id: "token-1",
    userId: "user-1",
    tokenHash: createHash("sha256")
      .update("existing_refresh_token")
      .digest("hex"),
    expiresAt: futureDate,
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createValidDTO(): RefreshTokenDTO {
  return {
    refreshToken: "existing_refresh_token",
  };
}

describe("RefreshTokenUseCase", () => {
  let useCase: RefreshTokenUseCase;
  let userRepository: IUserRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let tokenProvider: ITokenProviderPort;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    refreshTokenRepository = createMockRefreshTokenRepository();
    tokenProvider = createMockTokenProvider();

    useCase = new RefreshTokenUseCase({
      userRepository,
      refreshTokenRepository,
      tokenProvider,
    });
  });

  it("should successfully refresh and return a new token pair", async () => {
    const dto = createValidDTO();
    const storedToken = createValidStoredToken();
    const user = createActiveUser();

    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      storedToken,
    );
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    const result = await useCase.execute(dto);

    expect(result.accessToken).toBe("new_access_token");
    expect(result.refreshToken).toBe("new_refresh_token");
    expect(result.user.id).toBe(user.id);
    expect(result.user.email).toBe("john@example.com");
    expect(result.user.firstName).toBe("John");
    expect(result.user.lastName).toBe("Doe");
    expect(result.user.role).toBe(UserRole.PATIENT);
    expect(result.user.clinicId).toBe("clinic-1");
  });

  it("should reject an expired token", async () => {
    const dto = createValidDTO();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const expiredToken = createValidStoredToken({ expiresAt: pastDate });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      expiredToken,
    );

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
  });

  it("should reject a revoked token", async () => {
    const dto = createValidDTO();
    const revokedToken = createValidStoredToken({
      revokedAt: new Date(),
    });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      revokedToken,
    );

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
  });

  it("should reject a non-existent token", async () => {
    const dto = createValidDTO();
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
  });

  it("should revoke the old token during rotation", async () => {
    const dto = createValidDTO();
    const storedToken = createValidStoredToken();
    const user = createActiveUser();

    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      storedToken,
    );
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    await useCase.execute(dto);

    const expectedHash = createHash("sha256")
      .update(dto.refreshToken)
      .digest("hex");

    expect(refreshTokenRepository.revokeByTokenHash).toHaveBeenCalledWith(
      expectedHash,
    );
  });

  it("should save a new refresh token after rotation", async () => {
    const dto = createValidDTO();
    const storedToken = createValidStoredToken();
    const user = createActiveUser();

    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      storedToken,
    );
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    await useCase.execute(dto);

    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
    const savedToken = vi.mocked(refreshTokenRepository.save).mock
      .calls[0][0];
    const expectedNewHash = createHash("sha256")
      .update("new_refresh_token")
      .digest("hex");

    expect(savedToken.tokenHash).toBe(expectedNewHash);
    expect(savedToken.userId).toBe(user.id);
    expect(savedToken.revokedAt).toBeNull();
    expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should reject when user is not found after token validation", async () => {
    const dto = createValidDTO();
    const storedToken = createValidStoredToken();

    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      storedToken,
    );
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("should reject when user is inactive", async () => {
    const dto = createValidDTO();
    const storedToken = createValidStoredToken();
    const inactiveUser = new User({
      id: "user-1",
      clinicId: "clinic-1",
      email: Email.create("john@example.com"),
      passwordHash: "stored_hash",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.PATIENT,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(
      storedToken,
    );
    vi.mocked(userRepository.findById).mockResolvedValue(inactiveUser);

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("should look up the token by its SHA-256 hash", async () => {
    const dto = createValidDTO();
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(null);

    try {
      await useCase.execute(dto);
    } catch {
      // Expected to throw
    }

    const expectedHash = createHash("sha256")
      .update(dto.refreshToken)
      .digest("hex");
    expect(refreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      expectedHash,
    );
  });
});
