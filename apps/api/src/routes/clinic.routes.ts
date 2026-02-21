import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validation.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { UserRole } from "@msp/shared";
import { ClinicController } from "../controllers/clinic.controller";

const MAX_NAME_LENGTH = 255;
const MAX_PHONE_LENGTH = 50;

const updateClinicSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).max(MAX_PHONE_LENGTH).optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
});

export function createClinicRouter(controller: ClinicController): Router {
  const router = Router();

  router.get("/clinics/me", controller.getClinic);
  router.patch(
    "/clinics/me",
    requireRole(UserRole.CLINIC_ADMIN),
    validate(updateClinicSchema),
    controller.updateClinic,
  );

  return router;
}
