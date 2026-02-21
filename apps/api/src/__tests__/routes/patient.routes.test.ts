import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { RequestHandler } from "express";
import { createPatientRouter } from "@api/routes/patient.routes";
import { PatientController } from "@api/controllers/patient.controller";
import { globalErrorHandler } from "@api/middleware/error-handler";
import { Patient } from "@msp/domain";
import {
  PatientNotFoundError,
  PatientProfileNotFoundError,
} from "@msp/application";
import { UserRole } from "@msp/shared";

function createMockUseCase() {
  return { execute: vi.fn() };
}

const CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";
const PATIENT_ID = "d4e5f6a7-b8c9-0123-4567-890abcdef123";

function createMockPatient(): Patient {
  return new Patient({
    id: PATIENT_ID,
    userId: USER_ID,
    clinicId: CLINIC_ID,
    dateOfBirth: new Date("1990-05-15"),
    insuranceNumber: "INS-12345",
    notes: "No allergies",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

function createMockAuth(role: string = UserRole.PATIENT): RequestHandler {
  return (req, _res, next) => {
    req.user = { userId: USER_ID, clinicId: CLINIC_ID, role };
    next();
  };
}

function createTestApp(
  getPatientProfileUseCase: ReturnType<typeof createMockUseCase>,
  updatePatientProfileUseCase: ReturnType<typeof createMockUseCase>,
  role: string = UserRole.PATIENT,
) {
  const app = express();
  app.use(express.json());
  app.use(createMockAuth(role));

  const controller = new PatientController(
    getPatientProfileUseCase as any,
    updatePatientProfileUseCase as any,
  );
  app.use(createPatientRouter(controller));
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

describe("Patient Routes", () => {
  let getPatientProfileUseCase: ReturnType<typeof createMockUseCase>;
  let updatePatientProfileUseCase: ReturnType<typeof createMockUseCase>;

  beforeEach(() => {
    getPatientProfileUseCase = createMockUseCase();
    updatePatientProfileUseCase = createMockUseCase();
  });

  describe("GET /patients/me", () => {
    it("returns 200 with patient profile data on success", async () => {
      const patient = createMockPatient();
      getPatientProfileUseCase.execute.mockResolvedValue(patient);

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app).get("/patients/me");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: PATIENT_ID,
        userId: USER_ID,
        clinicId: CLINIC_ID,
        dateOfBirth: "1990-05-15T00:00:00.000Z",
        insuranceNumber: "INS-12345",
        notes: "No allergies",
      });
      expect(getPatientProfileUseCase.execute).toHaveBeenCalledWith(CLINIC_ID, USER_ID);
    });

    it("returns 403 when user is not PATIENT role", async () => {
      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase, UserRole.DOCTOR);
      const response = await request(app).get("/patients/me");

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 when user is CLINIC_ADMIN role", async () => {
      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase, UserRole.CLINIC_ADMIN);
      const response = await request(app).get("/patients/me");

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("propagates PatientNotFoundError from use case", async () => {
      getPatientProfileUseCase.execute.mockRejectedValue(
        new PatientNotFoundError(USER_ID),
      );

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app).get("/patients/me");

      expect(response.status).toBe(500);
    });

    it("passes errors to the error handler", async () => {
      getPatientProfileUseCase.execute.mockRejectedValue(new Error("Database error"));

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app).get("/patients/me");

      expect(response.status).toBe(500);
    });
  });

  describe("PATCH /patients/me", () => {
    it("returns 200 with updated patient data on success", async () => {
      const patient = createMockPatient();
      updatePatientProfileUseCase.execute.mockResolvedValue(patient);

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app)
        .patch("/patients/me")
        .send({ insuranceNumber: "INS-99999" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(PATIENT_ID);
      expect(updatePatientProfileUseCase.execute).toHaveBeenCalledWith({
        clinicId: CLINIC_ID,
        userId: USER_ID,
        insuranceNumber: "INS-99999",
      });
    });

    it("returns 403 when user is not PATIENT role", async () => {
      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase, UserRole.DOCTOR);
      const response = await request(app)
        .patch("/patients/me")
        .send({ notes: "Updated notes" });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("accepts dateOfBirth as a date string", async () => {
      const patient = createMockPatient();
      updatePatientProfileUseCase.execute.mockResolvedValue(patient);

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app)
        .patch("/patients/me")
        .send({ dateOfBirth: "1985-03-20" });

      expect(response.status).toBe(200);
      expect(updatePatientProfileUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId: CLINIC_ID,
          userId: USER_ID,
          dateOfBirth: new Date("1985-03-20"),
        }),
      );
    });

    it("accepts multiple optional fields", async () => {
      const patient = createMockPatient();
      updatePatientProfileUseCase.execute.mockResolvedValue(patient);

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app)
        .patch("/patients/me")
        .send({
          dateOfBirth: "1992-07-10",
          insuranceNumber: "INS-NEW",
          notes: "Updated notes",
        });

      expect(response.status).toBe(200);
      expect(updatePatientProfileUseCase.execute).toHaveBeenCalledWith({
        clinicId: CLINIC_ID,
        userId: USER_ID,
        dateOfBirth: new Date("1992-07-10"),
        insuranceNumber: "INS-NEW",
        notes: "Updated notes",
      });
    });

    it("allows empty body (no fields to update)", async () => {
      const patient = createMockPatient();
      updatePatientProfileUseCase.execute.mockResolvedValue(patient);

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app)
        .patch("/patients/me")
        .send({});

      expect(response.status).toBe(200);
    });

    it("propagates PatientProfileNotFoundError from use case", async () => {
      updatePatientProfileUseCase.execute.mockRejectedValue(
        new PatientProfileNotFoundError(USER_ID),
      );

      const app = createTestApp(getPatientProfileUseCase, updatePatientProfileUseCase);
      const response = await request(app)
        .patch("/patients/me")
        .send({ notes: "Updated" });

      expect(response.status).toBe(500);
    });
  });
});
