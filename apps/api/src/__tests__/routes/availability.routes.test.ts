import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { RequestHandler } from "express";
import { createAvailabilityRouter } from "@api/routes/availability.routes";
import { AvailabilityController } from "@api/controllers/availability.controller";
import { globalErrorHandler } from "@api/middleware/error-handler";
import { UserRole } from "@msp/shared";

function createMockUseCase() {
  return { execute: vi.fn() };
}

const CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";
const DOCTOR_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function createMockAuth(role: string = UserRole.PATIENT): RequestHandler {
  return (req, _res, next) => {
    req.user = { userId: USER_ID, clinicId: CLINIC_ID, role };
    next();
  };
}

function createTestApp(
  getAvailableSlotsUseCase: ReturnType<typeof createMockUseCase>,
  role: string = UserRole.PATIENT,
) {
  const app = express();
  app.use(express.json());
  app.use(createMockAuth(role));

  const controller = new AvailabilityController(
    getAvailableSlotsUseCase as any,
  );
  app.use(createAvailabilityRouter(controller));
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

describe("Availability Routes", () => {
  let getAvailableSlotsUseCase: ReturnType<typeof createMockUseCase>;

  beforeEach(() => {
    getAvailableSlotsUseCase = createMockUseCase();
  });

  describe("GET /doctors/:doctorId/slots", () => {
    it("returns 200 with available slots", async () => {
      const mockSlots = [
        {
          startsAt: new Date("2026-03-01T09:00:00.000Z"),
          endsAt: new Date("2026-03-01T09:30:00.000Z"),
          isAvailable: true,
        },
        {
          startsAt: new Date("2026-03-01T09:30:00.000Z"),
          endsAt: new Date("2026-03-01T10:00:00.000Z"),
          isAvailable: false,
        },
      ];
      getAvailableSlotsUseCase.execute.mockResolvedValue(mockSlots);

      const app = createTestApp(getAvailableSlotsUseCase);
      const response = await request(app)
        .get(`/doctors/${DOCTOR_ID}/slots`)
        .query({
          from: "2026-03-01T00:00:00.000Z",
          to: "2026-03-02T00:00:00.000Z",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toEqual({
        startsAt: "2026-03-01T09:00:00.000Z",
        endsAt: "2026-03-01T09:30:00.000Z",
        isAvailable: true,
      });
      expect(response.body.data[1]).toEqual({
        startsAt: "2026-03-01T09:30:00.000Z",
        endsAt: "2026-03-01T10:00:00.000Z",
        isAvailable: false,
      });
    });

    it("returns 400 when 'from' query param is missing", async () => {
      const app = createTestApp(getAvailableSlotsUseCase);
      const response = await request(app)
        .get(`/doctors/${DOCTOR_ID}/slots`)
        .query({ to: "2026-03-02T00:00:00.000Z" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when 'to' query param is missing", async () => {
      const app = createTestApp(getAvailableSlotsUseCase);
      const response = await request(app)
        .get(`/doctors/${DOCTOR_ID}/slots`)
        .query({ from: "2026-03-01T00:00:00.000Z" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("passes correct parameters to the use case", async () => {
      getAvailableSlotsUseCase.execute.mockResolvedValue([]);

      const app = createTestApp(getAvailableSlotsUseCase);
      await request(app)
        .get(`/doctors/${DOCTOR_ID}/slots`)
        .query({
          from: "2026-03-01T00:00:00.000Z",
          to: "2026-03-02T00:00:00.000Z",
        });

      expect(getAvailableSlotsUseCase.execute).toHaveBeenCalledWith(
        CLINIC_ID,
        DOCTOR_ID,
        expect.any(Date),
        expect.any(Date),
      );
    });
  });
});
