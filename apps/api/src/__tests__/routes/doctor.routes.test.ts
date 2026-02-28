import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { RequestHandler } from "express";
import { createDoctorRouter } from "@api/routes/doctor.routes";
import { DoctorController } from "@api/controllers/doctor.controller";
import { globalErrorHandler } from "@api/middleware/error-handler";
import { DuplicateEmailError } from "@msp/application";
import { UserRole } from "@msp/shared";
import type { DoctorResponseDTO } from "@msp/application";
import type { PaginatedResult } from "@msp/shared";

function createMockUseCase() {
  return { execute: vi.fn() };
}

const CLINIC_ID = "fb18d473-b5a8-413c-a2f6-8ce943536f31";
const USER_ID = "cc64bbdc-5af9-4c47-88e5-ab9482a9bc14";
const DOCTOR_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function createMockDoctorResponseDTO(): DoctorResponseDTO {
  return {
    id: DOCTOR_ID,
    userId: USER_ID,
    clinicId: CLINIC_ID,
    specialization: "Cardiology",
    slotDurationMin: 30,
    maxDailyAppointments: 20,
    user: {
      id: USER_ID,
      email: "doctor@example.com",
      firstName: "John",
      lastName: "Smith",
      phone: "+1234567890",
    },
  };
}

function createMockAuth(role: string = UserRole.CLINIC_ADMIN): RequestHandler {
  return (req, _res, next) => {
    req.user = { userId: USER_ID, clinicId: CLINIC_ID, role };
    next();
  };
}

function createTestApp(
  listDoctorsUseCase: ReturnType<typeof createMockUseCase>,
  getDoctorUseCase: ReturnType<typeof createMockUseCase>,
  createDoctorUseCase: ReturnType<typeof createMockUseCase>,
  updateDoctorUseCase?: ReturnType<typeof createMockUseCase>,
  role: string = UserRole.CLINIC_ADMIN,
) {
  const app = express();
  app.use(express.json());
  app.use(createMockAuth(role));

  const controller = new DoctorController(
    listDoctorsUseCase as any,
    getDoctorUseCase as any,
    createDoctorUseCase as any,
    (updateDoctorUseCase ?? createMockUseCase()) as any,
  );
  app.use(createDoctorRouter(controller));
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

describe("Doctor Routes", () => {
  let listDoctorsUseCase: ReturnType<typeof createMockUseCase>;
  let getDoctorUseCase: ReturnType<typeof createMockUseCase>;
  let createDoctorUseCase: ReturnType<typeof createMockUseCase>;

  beforeEach(() => {
    listDoctorsUseCase = createMockUseCase();
    getDoctorUseCase = createMockUseCase();
    createDoctorUseCase = createMockUseCase();
  });

  describe("GET /doctors", () => {
    it("returns 200 with paginated doctor list", async () => {
      const doctorDto = createMockDoctorResponseDTO();
      const paginatedResult: PaginatedResult<DoctorResponseDTO> = {
        data: [doctorDto],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      listDoctorsUseCase.execute.mockResolvedValue(paginatedResult);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase);
      const response = await request(app).get("/doctors");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(listDoctorsUseCase.execute).toHaveBeenCalledWith(CLINIC_ID, { page: 1, limit: 20 });
    });

    it("accepts custom page and limit query params", async () => {
      const paginatedResult: PaginatedResult<DoctorResponseDTO> = {
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      };
      listDoctorsUseCase.execute.mockResolvedValue(paginatedResult);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase);
      const response = await request(app).get("/doctors?page=2&limit=10");

      expect(response.status).toBe(200);
      expect(listDoctorsUseCase.execute).toHaveBeenCalledWith(CLINIC_ID, { page: 2, limit: 10 });
    });

    it("returns 400 when page is less than 1", async () => {
      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase);
      const response = await request(app).get("/doctors?page=0");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when limit exceeds 100", async () => {
      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase);
      const response = await request(app).get("/doctors?limit=101");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("is accessible to any authenticated role", async () => {
      const paginatedResult: PaginatedResult<DoctorResponseDTO> = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      listDoctorsUseCase.execute.mockResolvedValue(paginatedResult);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.PATIENT);
      const response = await request(app).get("/doctors");

      expect(response.status).toBe(200);
    });
  });

  describe("GET /doctors/:doctorId", () => {
    it("returns 200 with doctor data including user info on success", async () => {
      const doctorDto = createMockDoctorResponseDTO();
      getDoctorUseCase.execute.mockResolvedValue(doctorDto);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase);
      const response = await request(app).get(`/doctors/${DOCTOR_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(doctorDto);
      expect(getDoctorUseCase.execute).toHaveBeenCalledWith(CLINIC_ID, DOCTOR_ID);
    });

    it("returns 404 when doctor is not found", async () => {
      getDoctorUseCase.execute.mockResolvedValue(null);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase);
      const response = await request(app).get(`/doctors/${DOCTOR_ID}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });

    it("is accessible to any authenticated role", async () => {
      const doctorDto = createMockDoctorResponseDTO();
      getDoctorUseCase.execute.mockResolvedValue(doctorDto);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.PATIENT);
      const response = await request(app).get(`/doctors/${DOCTOR_ID}`);

      expect(response.status).toBe(200);
    });
  });

  describe("POST /doctors", () => {
    const validCreateDoctor = {
      email: "newdoc@example.com",
      password: "securePassword123",
      firstName: "Jane",
      lastName: "Doe",
      specialization: "Dermatology",
      slotDurationMin: 30,
    };

    it("returns 201 with created doctor data on success", async () => {
      const doctorDto = createMockDoctorResponseDTO();
      createDoctorUseCase.execute.mockResolvedValue(doctorDto);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .post("/doctors")
        .send(validCreateDoctor);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(doctorDto);
      expect(createDoctorUseCase.execute).toHaveBeenCalledWith(
        { clinicId: CLINIC_ID, ...validCreateDoctor },
        UserRole.CLINIC_ADMIN,
      );
    });

    it("returns 403 when user is not CLINIC_ADMIN", async () => {
      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.DOCTOR);
      const response = await request(app)
        .post("/doctors")
        .send(validCreateDoctor);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 when email is missing", async () => {
      const { email, ...withoutEmail } = validCreateDoctor;

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .post("/doctors")
        .send(withoutEmail);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is too short", async () => {
      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .post("/doctors")
        .send({ ...validCreateDoctor, password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when slotDurationMin is below minimum", async () => {
      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .post("/doctors")
        .send({ ...validCreateDoctor, slotDurationMin: 10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when specialization is missing", async () => {
      const { specialization, ...withoutSpecialization } = validCreateDoctor;

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .post("/doctors")
        .send(withoutSpecialization);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("accepts optional maxDailyAppointments field", async () => {
      const doctorDto = createMockDoctorResponseDTO();
      createDoctorUseCase.execute.mockResolvedValue(doctorDto);

      const app = createTestApp(listDoctorsUseCase, getDoctorUseCase, createDoctorUseCase, undefined, UserRole.CLINIC_ADMIN);
      const response = await request(app)
        .post("/doctors")
        .send({ ...validCreateDoctor, maxDailyAppointments: 15 });

      expect(response.status).toBe(201);
      expect(createDoctorUseCase.execute).toHaveBeenCalledWith(
        { clinicId: CLINIC_ID, ...validCreateDoctor, maxDailyAppointments: 15 },
        UserRole.CLINIC_ADMIN,
      );
    });
  });
});
