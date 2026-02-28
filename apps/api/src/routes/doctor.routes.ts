import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validation.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { UserRole } from "@msp/shared";
import { DoctorController } from "../controllers/doctor.controller";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 100;
const MAX_SPECIALIZATION_LENGTH = 100;
const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  firstName: z.string().min(1).max(MAX_NAME_LENGTH),
  lastName: z.string().min(1).max(MAX_NAME_LENGTH),
  phone: z.string().optional(),
  specialization: z.string().min(1).max(MAX_SPECIALIZATION_LENGTH),
  slotDurationMin: z.number().int().min(MIN_SLOT_DURATION).max(MAX_SLOT_DURATION),
  maxDailyAppointments: z.number().int().min(1).optional(),
});

const updateDoctorSchema = z.object({
  firstName: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  lastName: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  phone: z.string().optional(),
  specialization: z.string().min(1).max(MAX_SPECIALIZATION_LENGTH).optional(),
  slotDurationMin: z.number().int().min(MIN_SLOT_DURATION).max(MAX_SLOT_DURATION).optional(),
  maxDailyAppointments: z.number().int().min(1).optional(),
});

export function createDoctorRouter(controller: DoctorController): Router {
  const router = Router();

  router.get(
    "/doctors",
    validate(paginationQuerySchema, "query"),
    controller.listDoctors,
  );
  router.get("/doctors/:doctorId", controller.getDoctor);
  router.post(
    "/doctors",
    requireRole(UserRole.CLINIC_ADMIN),
    validate(createDoctorSchema),
    controller.createDoctor,
  );
  router.patch(
    "/doctors/:doctorId",
    requireRole(UserRole.CLINIC_ADMIN),
    validate(updateDoctorSchema),
    controller.updateDoctor,
  );

  return router;
}
