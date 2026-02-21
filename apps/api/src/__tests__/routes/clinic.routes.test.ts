import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { RequestHandler } from "express";
import { createClinicRouter } from "@api/routes/clinic.routes";
import { ClinicController } from "@api/controllers/clinic.controller";
import { globalErrorHandler } from "@api/middleware/error-handler";
import { Clinic, Email } from "@msp/domain";
import {
  UnauthorizedError,
  ClinicNotFoundError,
} from "@msp/application";
import { UserRole } from "@msp/shared";

function createMockUseCase() {
  return { execute: vi.fn() };
}

const CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";

function createMockClinic(overrides: Partial<Record<string, unknown>> = {}): Clinic {
  return new Clinic({
    id: CLINIC_ID,
    name: "Test Clinic",
    slug: "test-clinic",
    address: "123 Main St",
    phone: "+1234567890",
    email: Email.create("clinic@example.com"),
    timezone: "Europe/Berlin",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  });
}

function createMockAuth(role: string = UserRole.CLINIC_ADMIN): RequestHandler {
  return (req, _res, next) => {
    req.user = { userId: USER_ID, clinicId: CLINIC_ID, role };
    next();
  };
}

function createTestApp(
  getClinicUseCase: ReturnType<typeof createMockUseCase>,
  updateClinicUseCase: ReturnType<typeof createMockUseCase>,
  role: string = UserRole.CLINIC_ADMIN,
) {
  const app = express();
  app.use(express.json());
  app.use(createMockAuth(role));

  const controller = new ClinicController(
    getClinicUseCase as any,
    updateClinicUseCase as any,
  );
  app.use(createClinicRouter(controller));
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

describe("Clinic Routes", () => {
  let getClinicUseCase: ReturnType<typeof createMockUseCase>;
  let updateClinicUseCase: ReturnType<typeof createMockUseCase>;

  beforeEach(() => {
    getClinicUseCase = createMockUseCase();
    updateClinicUseCase = createMockUseCase();
  });

  describe("GET /clinics/me", () => {
    it("returns 200 with clinic data on success", async () => {
      const clinic = createMockClinic();
      getClinicUseCase.execute.mockResolvedValue(clinic);

      const app = createTestApp(getClinicUseCase, updateClinicUseCase);
      const response = await request(app).get("/clinics/me");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: CLINIC_ID,
        name: "Test Clinic",
        slug: "test-clinic",
        address: "123 Main St",
        phone: "+1234567890",
        email: "clinic@example.com",
        timezone: "Europe/Berlin",
        isActive: true,
      });
      expect(getClinicUseCase.execute).toHaveBeenCalledWith(CLINIC_ID);
    });

    it("returns 404 when clinic is not found", async () => {
      getClinicUseCase.execute.mockResolvedValue(null);

      const app = createTestApp(getClinicUseCase, updateClinicUseCase);
      const response = await request(app).get("/clinics/me");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });

    it("is accessible to any authenticated role", async () => {
      const clinic = createMockClinic();
      getClinicUseCase.execute.mockResolvedValue(clinic);

      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.PATIENT);
      const response = await request(app).get("/clinics/me");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("passes errors to the error handler", async () => {
      getClinicUseCase.execute.mockRejectedValue(new Error("Database error"));

      const app = createTestApp(getClinicUseCase, updateClinicUseCase);
      const response = await request(app).get("/clinics/me");

      expect(response.status).toBe(500);
    });
  });

  describe("PATCH /clinics/me", () => {
    it("returns 200 with updated clinic data on success", async () => {
      const updatedClinic = createMockClinic({ name: "Updated Clinic" });
      updateClinicUseCase.execute.mockResolvedValue(updatedClinic);

      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .patch("/clinics/me")
        .send({ name: "Updated Clinic" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Clinic");
      expect(updateClinicUseCase.execute).toHaveBeenCalledWith(
        { clinicId: CLINIC_ID, name: "Updated Clinic" },
        UserRole.CLINIC_ADMIN,
      );
    });

    it("returns 403 when user is not CLINIC_ADMIN", async () => {
      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.PATIENT);
      const response = await request(app)
        .patch("/clinics/me")
        .send({ name: "Updated Clinic" });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 when name is empty string", async () => {
      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .patch("/clinics/me")
        .send({ name: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .patch("/clinics/me")
        .send({ email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("allows partial updates with valid fields", async () => {
      const updatedClinic = createMockClinic();
      updateClinicUseCase.execute.mockResolvedValue(updatedClinic);

      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .patch("/clinics/me")
        .send({ phone: "+9876543210", timezone: "America/New_York" });

      expect(response.status).toBe(200);
      expect(updateClinicUseCase.execute).toHaveBeenCalledWith(
        { clinicId: CLINIC_ID, phone: "+9876543210", timezone: "America/New_York" },
        UserRole.CLINIC_ADMIN,
      );
    });

    it("propagates ClinicNotFoundError from the use case", async () => {
      updateClinicUseCase.execute.mockRejectedValue(
        new ClinicNotFoundError(CLINIC_ID),
      );

      const app = createTestApp(getClinicUseCase, updateClinicUseCase, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .patch("/clinics/me")
        .send({ name: "Updated Clinic" });

      expect(response.status).toBe(500);
    });
  });
});
