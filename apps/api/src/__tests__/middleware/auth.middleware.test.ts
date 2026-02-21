import { describe, it, expect } from "vitest";
import express, { type RequestHandler } from "express";
import request from "supertest";
import {
  createAuthMiddleware,
  type ITokenVerifier,
  type TokenPayload,
} from "@api/middleware/auth.middleware";

const VALID_TOKEN = "valid-token";

const VALID_PAYLOAD: TokenPayload = {
  userId: "user-123",
  clinicId: "clinic-456",
  role: "doctor",
};

function createMockTokenVerifier(
  validToken = VALID_TOKEN,
  payload: TokenPayload | null = VALID_PAYLOAD
): ITokenVerifier {
  return {
    verifyAccessToken(token: string): TokenPayload | null {
      return token === validToken ? payload : null;
    },
  };
}

function createAppWithAuth(tokenVerifier: ITokenVerifier) {
  const app = express();
  const authMiddleware = createAuthMiddleware(tokenVerifier);

  const echoUser: RequestHandler = (req, res) => {
    res.status(200).json({ user: req.user });
  };

  app.get("/protected", authMiddleware, echoUser);
  return app;
}

describe("Auth Middleware", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const app = createAppWithAuth(createMockTokenVerifier());

    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      },
    });
  });

  it("returns 401 when Authorization header does not start with Bearer", async () => {
    const app = createAppWithAuth(createMockTokenVerifier());

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Basic some-credentials");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.body.error.message).toBe(
      "Missing or invalid authorization header"
    );
  });

  it("returns 401 when token is invalid", async () => {
    const app = createAppWithAuth(createMockTokenVerifier());

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      },
    });
  });

  it("returns 401 when verifier returns null for expired token", async () => {
    const verifier: ITokenVerifier = {
      verifyAccessToken: () => null,
    };
    const app = createAppWithAuth(verifier);

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer expired-token");

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe("Invalid or expired token");
  });

  it("attaches user context to request when token is valid", async () => {
    const app = createAppWithAuth(createMockTokenVerifier());

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${VALID_TOKEN}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      userId: "user-123",
      clinicId: "clinic-456",
      role: "doctor",
    });
  });

  it("calls next() on successful authentication", async () => {
    const app = createAppWithAuth(createMockTokenVerifier());

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${VALID_TOKEN}`);

    // If next() was called, the route handler returns 200
    expect(response.status).toBe(200);
  });

  it("returns 401 when Authorization header is just 'Bearer ' with no token", async () => {
    const app = createAppWithAuth(createMockTokenVerifier());

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer ");

    // Empty string token won't match the valid token
    expect(response.status).toBe(401);
  });
});
