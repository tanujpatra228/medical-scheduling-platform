import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { AuthController } from "@api/controllers/auth.controller";
import { StatusCodes } from "http-status-codes";

const VALID_CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const VALID_USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";
const PARAM_CLINIC_ID = "e7a3c2b1-4d56-4f89-a012-3456789abcde";

function createMockUseCase() {
  return { execute: vi.fn() };
}

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    validatedBody: {},
    validatedParams: undefined,
    validatedQuery: undefined,
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("AuthController", () => {
  let registerUseCase: ReturnType<typeof createMockUseCase>;
  let loginUseCase: ReturnType<typeof createMockUseCase>;
  let refreshTokenUseCase: ReturnType<typeof createMockUseCase>;
  let controller: AuthController;
  let next: NextFunction;

  beforeEach(() => {
    registerUseCase = createMockUseCase();
    loginUseCase = createMockUseCase();
    refreshTokenUseCase = createMockUseCase();
    controller = new AuthController(
      registerUseCase as any,
      loginUseCase as any,
      refreshTokenUseCase as any,
    );
    next = vi.fn();
  });

  describe("register", () => {
    const registrationBody = {
      clinicId: VALID_CLINIC_ID,
      email: "patient@example.com",
      password: "securePassword123",
      firstName: "Jane",
      lastName: "Doe",
    };

    const authResponse = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
      user: {
        id: VALID_USER_ID,
        email: "patient@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: "PATIENT",
        clinicId: VALID_CLINIC_ID,
      },
    };

    it("returns 201 with auth response on successful registration", async () => {
      registerUseCase.execute.mockResolvedValue(authResponse);
      const req = createMockRequest({ validatedBody: registrationBody });
      const res = createMockResponse();

      await controller.register(req, res, next);

      expect(registerUseCase.execute).toHaveBeenCalledWith(registrationBody);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: authResponse,
      });
    });

    it("uses clinicId from validatedParams when available", async () => {
      registerUseCase.execute.mockResolvedValue(authResponse);
      const req = createMockRequest({
        validatedBody: registrationBody,
        validatedParams: { clinicId: PARAM_CLINIC_ID },
      });
      const res = createMockResponse();

      await controller.register(req, res, next);

      expect(registerUseCase.execute).toHaveBeenCalledWith({
        ...registrationBody,
        clinicId: PARAM_CLINIC_ID,
      });
    });

    it("calls next with error when use case throws", async () => {
      const error = new Error("Registration failed");
      registerUseCase.execute.mockRejectedValue(error);
      const req = createMockRequest({ validatedBody: registrationBody });
      const res = createMockResponse();

      await controller.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const loginBody = {
      clinicId: VALID_CLINIC_ID,
      email: "patient@example.com",
      password: "securePassword123",
    };

    const authResponse = {
      accessToken: "access-token-789",
      refreshToken: "refresh-token-012",
      user: {
        id: VALID_USER_ID,
        email: "patient@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: "PATIENT",
        clinicId: VALID_CLINIC_ID,
      },
    };

    it("returns 200 with auth response on successful login", async () => {
      loginUseCase.execute.mockResolvedValue(authResponse);
      const req = createMockRequest({ validatedBody: loginBody });
      const res = createMockResponse();

      await controller.login(req, res, next);

      expect(loginUseCase.execute).toHaveBeenCalledWith(loginBody);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: authResponse,
      });
    });

    it("calls next with error when use case throws", async () => {
      const error = new Error("Invalid credentials");
      loginUseCase.execute.mockRejectedValue(error);
      const req = createMockRequest({ validatedBody: loginBody });
      const res = createMockResponse();

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    const refreshBody = { refreshToken: "existing-refresh-token" };

    const authResponse = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: {
        id: VALID_USER_ID,
        email: "patient@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: "PATIENT",
        clinicId: VALID_CLINIC_ID,
      },
    };

    it("returns 200 with new tokens on successful refresh", async () => {
      refreshTokenUseCase.execute.mockResolvedValue(authResponse);
      const req = createMockRequest({ validatedBody: refreshBody });
      const res = createMockResponse();

      await controller.refreshToken(req, res, next);

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith(refreshBody);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: authResponse,
      });
    });

    it("calls next with error when use case throws", async () => {
      const error = new Error("Invalid refresh token");
      refreshTokenUseCase.execute.mockRejectedValue(error);
      const req = createMockRequest({ validatedBody: refreshBody });
      const res = createMockResponse();

      await controller.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
