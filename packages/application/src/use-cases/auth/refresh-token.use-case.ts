import { createHash } from "node:crypto";
import { DomainError } from "@msp/domain";
import { IUserRepository } from "../../ports/repositories/user.repository.port";
import { IRefreshTokenRepository } from "../../ports/repositories/refresh-token.repository.port";
import { ITokenProviderPort } from "../../ports/services";
import { RefreshTokenDTO, AuthResponseDTO } from "../../dtos";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export class InvalidRefreshTokenError extends DomainError {
  readonly code = "INVALID_REFRESH_TOKEN";

  constructor() {
    super("The refresh token is invalid, expired, or has been revoked");
  }
}

interface RefreshTokenDependencies {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  tokenProvider: ITokenProviderPort;
}

export class RefreshTokenUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;
  private readonly tokenProvider: ITokenProviderPort;

  constructor(deps: RefreshTokenDependencies) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
    this.tokenProvider = deps.tokenProvider;
  }

  async execute(dto: RefreshTokenDTO): Promise<AuthResponseDTO> {
    const incomingTokenHash = hashToken(dto.refreshToken);

    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(incomingTokenHash);

    if (!storedToken) {
      throw new InvalidRefreshTokenError();
    }

    if (storedToken.revokedAt !== null) {
      throw new InvalidRefreshTokenError();
    }

    if (storedToken.expiresAt < new Date()) {
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokenRepository.revokeByTokenHash(incomingTokenHash);

    const user = await this.userRepository.findById("", storedToken.userId);

    if (!user || !user.isActive) {
      throw new InvalidRefreshTokenError();
    }

    const accessToken = this.tokenProvider.generateAccessToken({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
    });

    const newRefreshToken = this.tokenProvider.generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    const now = new Date();

    await this.refreshTokenRepository.save({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: createExpiryDate(REFRESH_TOKEN_EXPIRY_DAYS),
      revokedAt: null,
      createdAt: now,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
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
