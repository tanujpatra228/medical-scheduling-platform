import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validation.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { AppointmentController } from "../controllers/appointment.controller";

const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().max(500).optional(),
});

const cancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function createAppointmentRouter(
  controller: AppointmentController,
): Router {
  const router = Router();

  router.post(
    "/appointments",
    validate(bookAppointmentSchema),
    controller.create,
  );

  router.get(
    "/appointments",
    validate(listQuerySchema, "query"),
    controller.list,
  );

  router.get("/appointments/:id", controller.getById);

  router.patch(
    "/appointments/:id/confirm",
    requireRole("CLINIC_ADMIN", "DOCTOR"),
    controller.confirm,
  );

  router.patch(
    "/appointments/:id/cancel",
    validate(cancelSchema),
    controller.cancel,
  );

  router.patch(
    "/appointments/:id/complete",
    requireRole("CLINIC_ADMIN", "DOCTOR"),
    controller.complete,
  );

  return router;
}
