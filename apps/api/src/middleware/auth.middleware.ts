import { RequestHandler } from "express";

export interface TokenPayload {
  userId: string;
  clinicId: string;
  role: string;
}

export interface ITokenVerifier {
  verifyAccessToken(token: string): TokenPayload | null;
}

const BEARER_PREFIX = "Bearer ";

export function createAuthMiddleware(
  tokenVerifier: ITokenVerifier
): RequestHandler {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization header",
        },
      });
      return;
    }

    const token = authHeader.substring(BEARER_PREFIX.length);
    const payload = tokenVerifier.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
        },
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      clinicId: payload.clinicId,
      role: payload.role,
    };

    next();
  };
}
