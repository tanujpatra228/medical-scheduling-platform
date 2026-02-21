import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { RequestHandler } from "express";
import { createAuthRouter } from "@api/routes/auth.routes";
import { AuthController } from "@api/controllers/auth.controller";
import { globalErrorHandler } from "@api/middleware/error-handler";
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "@msp/application";

function createMockUseCase() {
  return { execute: vi.fn() };
}

const VALID_CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const VALID_USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";

function createTestApp(
  registerUseCase: ReturnType<typeof createMockUseCase>,
  loginUseCase: ReturnType<typeof createMockUseCase>,
  refreshTokenUseCase: ReturnType<typeof createMockUseCase>,
) {
  const app = express();
  app.use(express.json());

  const controller = new AuthController(
    registerUseCase as any,
    loginUseCase as any,
    refreshTokenUseCase as any,
  );
  app.use(createAuthRouter(controller));
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

describe("Auth Routes", () => {
  let registerUseCase: ReturnType<typeof createMockUseCase>;
  let loginUseCase: ReturnType<typeof createMockUseCase>;
  let refreshTokenUseCase: ReturnType<typeof createMockUseCase>;
  let app: express.Express;

  beforeEach(() => {
    registerUseCase = createMockUseCase();
    loginUseCase = createMockUseCase();
    refreshTokenUseCase = createMockUseCase();
    app = createTestApp(registerUseCase, loginUseCase, refreshTokenUseCase);
  });

  describe("POST /auth/register", () => {
    const validRegistration = {
      clinicId: VALID_CLINIC_ID,
      email: "jane@example.com",
      password: "securePassword123",
      firstName: "Jane",
      lastName: "Doe",
    };

    const authResponse = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
      user: {
        id: VALID_USER_ID,
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: "PATIENT",
        clinicId: VALID_CLINIC_ID,
      },
    };

    it("returns 201 on successful registration", async () => {
      registerUseCase.execute.mockResolvedValue(authResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true, data: authResponse });
    });

    it("returns 400 when email is missing", async () => {
      const { email, ...withoutEmail } = validRegistration;

      const response = await request(app)
        .post("/auth/register")
        .send(withoutEmail);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ ...validRegistration, email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 400 when password is too short", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ ...validRegistration, password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 400 when clinicId is not a valid UUID", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ ...validRegistration, clinicId: "not-a-uuid" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 400 when firstName is missing", async () => {
      const { firstName, ...withoutFirstName } = validRegistration;

      const response = await request(app)
        .post("/auth/register")
        .send(withoutFirstName);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 400 when lastName is missing", async () => {
      const { lastName, ...withoutLastName } = validRegistration;

      const response = await request(app)
        .post("/auth/register")
        .send(withoutLastName);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 409 when email already exists", async () => {
      registerUseCase.execute.mockRejectedValue(
        new EmailAlreadyExistsError("jane@example.com"),
      );

      const response = await request(app)
        .post("/auth/register")
        .send(validRegistration);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("accepts optional fields like phone and dateOfBirth", async () => {
      registerUseCase.execute.mockResolvedValue(authResponse);

      const response = await request(app)
        .post("/auth/register")
        .send({
          ...validRegistration,
          phone: "+1234567890",
          dateOfBirth: "1990-01-15",
          insuranceNumber: "INS-12345",
        });

      expect(response.status).toBe(201);
    });
  });

  describe("POST /auth/login", () => {
    const validLogin = {
      clinicId: VALID_CLINIC_ID,
      email: "jane@example.com",
      password: "securePassword123",
    };

    const authResponse = {
      accessToken: "access-token-789",
      refreshToken: "refresh-token-012",
      user: {
        id: VALID_USER_ID,
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: "PATIENT",
        clinicId: VALID_CLINIC_ID,
      },
    };

    it("returns 200 on successful login", async () => {
      loginUseCase.execute.mockResolvedValue(authResponse);

      const response = await request(app)
        .post("/auth/login")
        .send(validLogin);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: authResponse });
    });

    it("returns 400 when email is missing", async () => {
      const { email, ...withoutEmail } = validLogin;

      const response = await request(app)
        .post("/auth/login")
        .send(withoutEmail);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is missing", async () => {
      const { password, ...withoutPassword } = validLogin;

      const response = await request(app)
        .post("/auth/login")
        .send(withoutPassword);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 400 when clinicId is not a valid UUID", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ ...validLogin, clinicId: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when credentials are invalid", async () => {
      loginUseCase.execute.mockRejectedValue(new InvalidCredentialsError());

      const response = await request(app)
        .post("/auth/login")
        .send(validLogin);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("POST /auth/refresh", () => {
    const validRefresh = {
      refreshToken: "a-valid-refresh-token-string",
    };

    const authResponse = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: {
        id: VALID_USER_ID,
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: "PATIENT",
        clinicId: VALID_CLINIC_ID,
      },
    };

    it("returns 200 on successful token refresh", async () => {
      refreshTokenUseCase.execute.mockResolvedValue(authResponse);

      const response = await request(app)
        .post("/auth/refresh")
        .send(validRefresh);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: authResponse });
    });

    it("returns 400 when refreshToken is missing", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when refreshToken is empty string", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when refresh token is invalid", async () => {
      refreshTokenUseCase.execute.mockRejectedValue(
        new InvalidRefreshTokenError(),
      );

      const response = await request(app)
        .post("/auth/refresh")
        .send(validRefresh);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });
  });
});
