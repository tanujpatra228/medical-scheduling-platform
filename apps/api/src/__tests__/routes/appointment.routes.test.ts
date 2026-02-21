import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { RequestHandler } from "express";
import { createAppointmentRouter } from "@api/routes/appointment.routes";
import { AppointmentController } from "@api/controllers/appointment.controller";
import { globalErrorHandler } from "@api/middleware/error-handler";
import { UserRole } from "@msp/shared";
import {
  SlotAlreadyBookedError,
  AppointmentNotFoundError,
} from "@msp/application";
import type { AppointmentResponseDTO } from "@msp/application";
import type { PaginatedResult } from "@msp/shared";

function createMockUseCase() {
  return { execute: vi.fn() };
}

const CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";
const DOCTOR_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const PATIENT_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const APPOINTMENT_ID = "d4e5f6a7-b8c9-0123-def0-123456789abc";

function createMockAppointmentResponse(): AppointmentResponseDTO {
  return {
    id: APPOINTMENT_ID,
    clinicId: CLINIC_ID,
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID,
    startsAt: "2026-03-01T09:00:00.000Z",
    endsAt: "2026-03-01T09:30:00.000Z",
    status: "SCHEDULED",
    reason: "Checkup",
    createdAt: "2026-02-22T00:00:00.000Z",
    updatedAt: "2026-02-22T00:00:00.000Z",
  };
}

function createMockAuth(role: string = UserRole.CLINIC_ADMIN): RequestHandler {
  return (req, _res, next) => {
    req.user = { userId: USER_ID, clinicId: CLINIC_ID, role };
    next();
  };
}

function createTestApp(
  useCases: {
    create: ReturnType<typeof createMockUseCase>;
    confirm: ReturnType<typeof createMockUseCase>;
    cancel: ReturnType<typeof createMockUseCase>;
    complete: ReturnType<typeof createMockUseCase>;
    get: ReturnType<typeof createMockUseCase>;
    list: ReturnType<typeof createMockUseCase>;
  },
  role: string = UserRole.CLINIC_ADMIN,
) {
  const app = express();
  app.use(express.json());
  app.use(createMockAuth(role));

  const controller = new AppointmentController(
    useCases.create as any,
    useCases.confirm as any,
    useCases.cancel as any,
    useCases.complete as any,
    useCases.get as any,
    useCases.list as any,
  );
  app.use(createAppointmentRouter(controller));
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

describe("Appointment Routes", () => {
  let useCases: {
    create: ReturnType<typeof createMockUseCase>;
    confirm: ReturnType<typeof createMockUseCase>;
    cancel: ReturnType<typeof createMockUseCase>;
    complete: ReturnType<typeof createMockUseCase>;
    get: ReturnType<typeof createMockUseCase>;
    list: ReturnType<typeof createMockUseCase>;
  };

  beforeEach(() => {
    useCases = {
      create: createMockUseCase(),
      confirm: createMockUseCase(),
      cancel: createMockUseCase(),
      complete: createMockUseCase(),
      get: createMockUseCase(),
      list: createMockUseCase(),
    };
  });

  describe("POST /appointments", () => {
    const validBody = {
      doctorId: DOCTOR_ID,
      patientId: PATIENT_ID,
      startsAt: "2026-03-01T09:00:00.000Z",
      endsAt: "2026-03-01T09:30:00.000Z",
      reason: "Checkup",
    };

    it("returns 201 with created appointment on success", async () => {
      const responseDto = createMockAppointmentResponse();
      useCases.create.execute.mockResolvedValue(responseDto);

      const app = createTestApp(useCases);
      const response = await request(app)
        .post("/appointments")
        .send(validBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(responseDto);
      expect(useCases.create.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId: CLINIC_ID,
          doctorId: DOCTOR_ID,
          patientId: PATIENT_ID,
        }),
      );
    });

    it("returns 400 when doctorId is missing", async () => {
      const { doctorId, ...withoutDoctorId } = validBody;

      const app = createTestApp(useCases);
      const response = await request(app)
        .post("/appointments")
        .send(withoutDoctorId);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when patientId is not a valid UUID", async () => {
      const app = createTestApp(useCases);
      const response = await request(app)
        .post("/appointments")
        .send({ ...validBody, patientId: "not-a-uuid" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when slot is already booked", async () => {
      useCases.create.execute.mockRejectedValue(new SlotAlreadyBookedError());

      const app = createTestApp(useCases);
      const response = await request(app)
        .post("/appointments")
        .send(validBody);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("SLOTALREADYBOOKED");
    });
  });

  describe("GET /appointments", () => {
    it("returns 200 with paginated appointment list", async () => {
      const responseDto = createMockAppointmentResponse();
      const paginatedResult: PaginatedResult<AppointmentResponseDTO> = {
        data: [responseDto],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      useCases.list.execute.mockResolvedValue(paginatedResult);

      const app = createTestApp(useCases);
      const response = await request(app).get("/appointments");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it("passes filter parameters to the use case", async () => {
      const paginatedResult: PaginatedResult<AppointmentResponseDTO> = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      useCases.list.execute.mockResolvedValue(paginatedResult);

      const app = createTestApp(useCases);
      await request(app).get(
        `/appointments?status=SCHEDULED&doctorId=${DOCTOR_ID}&page=1&limit=10`,
      );

      expect(useCases.list.execute).toHaveBeenCalledWith(
        CLINIC_ID,
        expect.objectContaining({
          status: "SCHEDULED",
          doctorId: DOCTOR_ID,
        }),
        { page: 1, limit: 10 },
      );
    });
  });

  describe("GET /appointments/:id", () => {
    it("returns 200 with appointment data on success", async () => {
      const responseDto = createMockAppointmentResponse();
      useCases.get.execute.mockResolvedValue(responseDto);

      const app = createTestApp(useCases);
      const response = await request(app).get(
        `/appointments/${APPOINTMENT_ID}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(responseDto);
      expect(useCases.get.execute).toHaveBeenCalledWith(
        CLINIC_ID,
        APPOINTMENT_ID,
      );
    });

    it("returns 404 when appointment is not found", async () => {
      useCases.get.execute.mockResolvedValue(null);

      const app = createTestApp(useCases);
      const response = await request(app).get(
        `/appointments/${APPOINTMENT_ID}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /appointments/:id/confirm", () => {
    it("returns 200 with confirmed appointment on success", async () => {
      const responseDto = {
        ...createMockAppointmentResponse(),
        status: "CONFIRMED",
      };
      useCases.confirm.execute.mockResolvedValue(responseDto);

      const app = createTestApp(useCases, UserRole.DOCTOR);
      const response = await request(app).patch(
        `/appointments/${APPOINTMENT_ID}/confirm`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("CONFIRMED");
      expect(useCases.confirm.execute).toHaveBeenCalledWith(
        CLINIC_ID,
        APPOINTMENT_ID,
      );
    });

    it("returns 403 when user is a PATIENT", async () => {
      const app = createTestApp(useCases, UserRole.PATIENT);
      const response = await request(app).patch(
        `/appointments/${APPOINTMENT_ID}/confirm`,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("PATCH /appointments/:id/cancel", () => {
    it("returns 200 with cancelled appointment on success", async () => {
      const responseDto = {
        ...createMockAppointmentResponse(),
        status: "CANCELLED",
        cancellationReason: "Patient requested",
        cancelledBy: USER_ID,
      };
      useCases.cancel.execute.mockResolvedValue(responseDto);

      const app = createTestApp(useCases);
      const response = await request(app)
        .patch(`/appointments/${APPOINTMENT_ID}/cancel`)
        .send({ reason: "Patient requested" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("CANCELLED");
      expect(useCases.cancel.execute).toHaveBeenCalledWith({
        clinicId: CLINIC_ID,
        appointmentId: APPOINTMENT_ID,
        cancelledBy: USER_ID,
        reason: "Patient requested",
      });
    });

    it("returns 404 when appointment is not found for cancellation", async () => {
      useCases.cancel.execute.mockRejectedValue(
        new AppointmentNotFoundError(APPOINTMENT_ID),
      );

      const app = createTestApp(useCases);
      const response = await request(app)
        .patch(`/appointments/${APPOINTMENT_ID}/cancel`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /appointments/:id/complete", () => {
    it("returns 200 with completed appointment on success", async () => {
      const responseDto = {
        ...createMockAppointmentResponse(),
        status: "COMPLETED",
      };
      useCases.complete.execute.mockResolvedValue(responseDto);

      const app = createTestApp(useCases, UserRole.DOCTOR);
      const response = await request(app).patch(
        `/appointments/${APPOINTMENT_ID}/complete`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("COMPLETED");
      expect(useCases.complete.execute).toHaveBeenCalledWith(
        CLINIC_ID,
        APPOINTMENT_ID,
      );
    });

    it("returns 403 when user is a PATIENT", async () => {
      const app = createTestApp(useCases, UserRole.PATIENT);
      const response = await request(app).patch(
        `/appointments/${APPOINTMENT_ID}/complete`,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });
});
