import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHash } from "node:crypto";
import { User, Email, Patient } from "@msp/domain";
import { UserRole } from "@msp/shared";
import {
  RegisterPatientUseCase,
  EmailAlreadyExistsError,
} from "../../../use-cases/auth/register-patient.use-case";
import { IUserRepository } from "../../../ports/repositories/user.repository.port";
import { IPatientRepository } from "../../../ports/repositories/patient.repository.port";
import {
  IRefreshTokenRepository,
  RefreshToken,
} from "../../../ports/repositories/refresh-token.repository.port";
import {
  IPasswordHasherPort,
  ITokenProviderPort,
} from "../../../ports/services";
import { RegisterPatientDTO } from "../../../dtos";

function createMockUserRepository(): IUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findAllByEmail: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation((user: User) => Promise.resolve(user)),
    update: vi.fn().mockImplementation((user: User) => Promise.resolve(user)),
  };
}

function createMockPatientRepository(): IPatientRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByUserId: vi.fn().mockResolvedValue(null),
    save: vi
      .fn()
      .mockImplementation((patient: Patient) => Promise.resolve(patient)),
    update: vi
      .fn()
      .mockImplementation((patient: Patient) => Promise.resolve(patient)),
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

function createValidDTO(): RegisterPatientDTO {
  return {
    clinicId: "clinic-1",
    email: "john@example.com",
    password: "SecurePass123!",
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890",
    dateOfBirth: new Date("1990-01-01"),
    insuranceNumber: "INS-12345",
  };
}

describe("RegisterPatientUseCase", () => {
  let useCase: RegisterPatientUseCase;
  let userRepository: IUserRepository;
  let patientRepository: IPatientRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let passwordHasher: IPasswordHasherPort;
  let tokenProvider: ITokenProviderPort;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    patientRepository = createMockPatientRepository();
    refreshTokenRepository = createMockRefreshTokenRepository();
    passwordHasher = createMockPasswordHasher();
    tokenProvider = createMockTokenProvider();

    useCase = new RegisterPatientUseCase({
      userRepository,
      patientRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenProvider,
    });
  });

  it("should successfully register a patient and return auth tokens", async () => {
    const dto = createValidDTO();

    const result = await useCase.execute(dto);

    expect(result.accessToken).toBe("access_token_123");
    expect(result.refreshToken).toBe("refresh_token_456");
    expect(result.user.email).toBe(dto.email);
    expect(result.user.firstName).toBe(dto.firstName);
    expect(result.user.lastName).toBe(dto.lastName);
    expect(result.user.role).toBe(UserRole.PATIENT);
    expect(result.user.clinicId).toBe(dto.clinicId);
    expect(result.user.id).toBeDefined();
  });

  it("should throw EmailAlreadyExistsError when email is already registered in the clinic", async () => {
    const dto = createValidDTO();
    const existingUser = new User({
      id: "existing-user-id",
      clinicId: dto.clinicId,
      email: Email.create(dto.email),
      passwordHash: "existing_hash",
      firstName: "Existing",
      lastName: "User",
      role: UserRole.PATIENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);

    await expect(useCase.execute(dto)).rejects.toThrow(
      EmailAlreadyExistsError,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(patientRepository.save).not.toHaveBeenCalled();
  });

  it("should hash the password before storing the user", async () => {
    const dto = createValidDTO();
    vi.mocked(passwordHasher.hash).mockResolvedValue("securely_hashed");

    await useCase.execute(dto);

    expect(passwordHasher.hash).toHaveBeenCalledWith(dto.password);
    const savedUser = vi.mocked(userRepository.save).mock.calls[0][0];
    expect(savedUser.passwordHash).toBe("securely_hashed");
  });

  it("should create the user with PATIENT role", async () => {
    const dto = createValidDTO();

    await useCase.execute(dto);

    const savedUser = vi.mocked(userRepository.save).mock.calls[0][0];
    expect(savedUser.role).toBe(UserRole.PATIENT);
    expect(savedUser.isActive).toBe(true);
  });

  it("should create a patient record linked to the user", async () => {
    const dto = createValidDTO();

    await useCase.execute(dto);

    expect(patientRepository.save).toHaveBeenCalledTimes(1);
    const savedPatient = vi.mocked(patientRepository.save).mock.calls[0][0];
    const savedUser = vi.mocked(userRepository.save).mock.calls[0][0];

    expect(savedPatient.userId).toBe(savedUser.id);
    expect(savedPatient.clinicId).toBe(dto.clinicId);
    expect(savedPatient.dateOfBirth).toEqual(dto.dateOfBirth);
    expect(savedPatient.insuranceNumber).toBe(dto.insuranceNumber);
  });

  it("should save a refresh token hash to the repository", async () => {
    const dto = createValidDTO();

    await useCase.execute(dto);

    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
    const savedToken = vi.mocked(refreshTokenRepository.save).mock
      .calls[0][0];
    const expectedHash = createHash("sha256")
      .update("refresh_token_456")
      .digest("hex");

    expect(savedToken.tokenHash).toBe(expectedHash);
    expect(savedToken.revokedAt).toBeNull();
    expect(savedToken.expiresAt).toBeInstanceOf(Date);
    expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should generate access token with correct payload", async () => {
    const dto = createValidDTO();

    await useCase.execute(dto);

    expect(tokenProvider.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: dto.clinicId,
        role: UserRole.PATIENT,
      }),
    );
  });

  it("should check for existing email in the correct clinic", async () => {
    const dto = createValidDTO();

    await useCase.execute(dto);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      dto.clinicId,
      dto.email,
    );
  });
});
