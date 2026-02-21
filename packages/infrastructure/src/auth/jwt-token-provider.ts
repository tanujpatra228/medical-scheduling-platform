import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { ITokenProviderPort } from "@msp/application";

const REFRESH_TOKEN_BYTES = 64;

export interface TokenPayload {
  userId: string;
  clinicId: string;
  role: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export class JwtTokenProvider implements ITokenProviderPort {
  constructor(private readonly config: JwtConfig) {}

  generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: this.config.expiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, this.config.secret, options);
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.config.secret) as jwt.JwtPayload &
        TokenPayload;
      return {
        userId: decoded.userId,
        clinicId: decoded.clinicId,
        role: decoded.role,
      };
    } catch {
      return null;
    }
  }
}
