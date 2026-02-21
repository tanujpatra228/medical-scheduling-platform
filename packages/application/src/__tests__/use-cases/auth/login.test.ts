import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHash } from "node:crypto";
import { User, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import {
  LoginUseCase,
  InvalidCredentialsError,
} from "../../../use-cases/auth/login.use-case";
import { IUserRepository } from "../../../ports/repositories/user.repository.port";
import {
  IRefreshTokenRepository,
  RefreshToken,
} from "../../../ports/repositories/refresh-token.repository.port";
import {
  IPasswordHasherPort,
  ITokenProviderPort,
} from "../../../ports/services";
import { LoginDTO } from "../../../dtos";

function createMockUserRepository(): IUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
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

function createMockPasswordHasher(): IPasswordHasherPort {
  return {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    verify: vi.fn().mockResolvedValue(true),
  };
}

function createMockTokenProvider(): ITokenProviderPort {
  return {
    generateAccessToken: vi.fn().mockReturnValue("access_token_123"),
    generateRefreshToken: vi.fn().mockReturnValue("refresh_token_456"),
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

function createInactiveUser(): User {
  return new User({
    id: "user-2",
    clinicId: "clinic-1",
    email: Email.create("inactive@example.com"),
    passwordHash: "stored_hash",
    firstName: "Inactive",
    lastName: "User",
    role: UserRole.PATIENT,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createValidDTO(): LoginDTO {
  return {
    clinicId: "clinic-1",
    email: "john@example.com",
    password: "SecurePass123!",
  };
}

describe("LoginUseCase", () => {
  let useCase: LoginUseCase;
  let userRepository: IUserRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let passwordHasher: IPasswordHasherPort;
  let tokenProvider: ITokenProviderPort;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    refreshTokenRepository = createMockRefreshTokenRepository();
    passwordHasher = createMockPasswordHasher();
    tokenProvider = createMockTokenProvider();

    useCase = new LoginUseCase({
      userRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenProvider,
    });
  });

  it("should successfully login and return auth tokens", async () => {
    const dto = createValidDTO();
    const user = createActiveUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    const result = await useCase.execute(dto);

    expect(result.accessToken).toBe("access_token_123");
    expect(result.refreshToken).toBe("refresh_token_456");
    expect(result.user.id).toBe(user.id);
    expect(result.user.email).toBe("john@example.com");
    expect(result.user.firstName).toBe("John");
    expect(result.user.lastName).toBe("Doe");
    expect(result.user.role).toBe(UserRole.PATIENT);
    expect(result.user.clinicId).toBe("clinic-1");
  });

  it("should throw InvalidCredentialsError when email is not found", async () => {
    const dto = createValidDTO();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it("should throw InvalidCredentialsError when password is wrong", async () => {
    const dto = createValidDTO();
    const user = createActiveUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(passwordHasher.verify).mockResolvedValue(false);

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
  });

  it("should throw InvalidCredentialsError when user is inactive", async () => {
    const dto = { ...createValidDTO(), email: "inactive@example.com" };
    const user = createInactiveUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    await expect(useCase.execute(dto)).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it("should save a refresh token hash after successful login", async () => {
    const dto = createValidDTO();
    const user = createActiveUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    await useCase.execute(dto);

    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
    const savedToken = vi.mocked(refreshTokenRepository.save).mock
      .calls[0][0];
    const expectedHash = createHash("sha256")
      .update("refresh_token_456")
      .digest("hex");

    expect(savedToken.tokenHash).toBe(expectedHash);
    expect(savedToken.userId).toBe(user.id);
    expect(savedToken.revokedAt).toBeNull();
    expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should verify password with the stored hash", async () => {
    const dto = createValidDTO();
    const user = createActiveUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    await useCase.execute(dto);

    expect(passwordHasher.verify).toHaveBeenCalledWith(
      dto.password,
      user.passwordHash,
    );
  });

  it("should generate access token with the correct user payload", async () => {
    const dto = createValidDTO();
    const user = createActiveUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);

    await useCase.execute(dto);

    expect(tokenProvider.generateAccessToken).toHaveBeenCalledWith({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
    });
  });
});
