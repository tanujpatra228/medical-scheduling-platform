import { createHash } from "node:crypto";
import { DomainError } from "@msp/domain";
import { IUserRepository } from "../../ports/repositories/user.repository.port";
import { IRefreshTokenRepository } from "../../ports/repositories/refresh-token.repository.port";
import { IPasswordHasherPort, ITokenProviderPort } from "../../ports/services";
import { LoginDTO, AuthResponseDTO } from "../../dtos";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";

  constructor() {
    super("Invalid email or password");
  }
}

interface LoginDependencies {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  passwordHasher: IPasswordHasherPort;
  tokenProvider: ITokenProviderPort;
}

export class LoginUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;
  private readonly passwordHasher: IPasswordHasherPort;
  private readonly tokenProvider: ITokenProviderPort;

  constructor(deps: LoginDependencies) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
    this.passwordHasher = deps.passwordHasher;
    this.tokenProvider = deps.tokenProvider;
  }

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    let user;

    if (dto.clinicId) {
      user = await this.userRepository.findByEmail(dto.clinicId, dto.email);
    } else {
      const matches = await this.userRepository.findAllByEmail(dto.email);
      user = matches.length === 1 ? matches[0] : null;
    }

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.verify(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenProvider.generateAccessToken({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
    });

    const refreshToken = this.tokenProvider.generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const now = new Date();

    await this.refreshTokenRepository.save({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt: createExpiryDate(REFRESH_TOKEN_EXPIRY_DAYS),
      revokedAt: null,
      createdAt: now,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId,
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
