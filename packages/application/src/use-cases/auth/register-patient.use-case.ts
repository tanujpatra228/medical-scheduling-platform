import { createHash } from "node:crypto";
import { User, Email, Patient, DomainError } from "@msp/domain";
import { UserRole } from "@msp/shared";
import { IUserRepository } from "../../ports/repositories/user.repository.port";
import { IPatientRepository } from "../../ports/repositories/patient.repository.port";
import { IRefreshTokenRepository } from "../../ports/repositories/refresh-token.repository.port";
import { IPasswordHasherPort, ITokenProviderPort } from "../../ports/services";
import { RegisterPatientDTO, AuthResponseDTO } from "../../dtos";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export class EmailAlreadyExistsError extends DomainError {
  readonly code = "EMAIL_ALREADY_EXISTS";

  constructor(email: string) {
    super(`A user with email "${email}" already exists in this clinic`);
  }
}

interface RegisterPatientDependencies {
  userRepository: IUserRepository;
  patientRepository: IPatientRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  passwordHasher: IPasswordHasherPort;
  tokenProvider: ITokenProviderPort;
}

export class RegisterPatientUseCase {
  private readonly userRepository: IUserRepository;
  private readonly patientRepository: IPatientRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;
  private readonly passwordHasher: IPasswordHasherPort;
  private readonly tokenProvider: ITokenProviderPort;

  constructor(deps: RegisterPatientDependencies) {
    this.userRepository = deps.userRepository;
    this.patientRepository = deps.patientRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
    this.passwordHasher = deps.passwordHasher;
    this.tokenProvider = deps.tokenProvider;
  }

  async execute(dto: RegisterPatientDTO): Promise<AuthResponseDTO> {
    const existingUser = await this.userRepository.findByEmail(
      dto.clinicId,
      dto.email,
    );

    if (existingUser) {
      throw new EmailAlreadyExistsError(dto.email);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const email = Email.create(dto.email);
    const now = new Date();
    const userId = crypto.randomUUID();

    const user = new User({
      id: userId,
      clinicId: dto.clinicId,
      email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.PATIENT,
      phone: dto.phone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await this.userRepository.save(user);

    const patient = new Patient({
      id: crypto.randomUUID(),
      userId,
      clinicId: dto.clinicId,
      dateOfBirth: dto.dateOfBirth,
      insuranceNumber: dto.insuranceNumber,
      createdAt: now,
      updatedAt: now,
    });

    await this.patientRepository.save(patient);

    const accessToken = this.tokenProvider.generateAccessToken({
      userId,
      clinicId: dto.clinicId,
      role: UserRole.PATIENT,
    });

    const refreshToken = this.tokenProvider.generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await this.refreshTokenRepository.save({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt: createExpiryDate(REFRESH_TOKEN_EXPIRY_DAYS),
      revokedAt: null,
      createdAt: now,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.PATIENT,
        clinicId: dto.clinicId,
      },
    };
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createExpiryDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
