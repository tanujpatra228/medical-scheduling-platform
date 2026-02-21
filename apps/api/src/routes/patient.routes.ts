import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validation.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { UserRole } from "@msp/shared";
import { PatientController } from "../controllers/patient.controller";

const updatePatientSchema = z.object({
  dateOfBirth: z.coerce.date().optional(),
  insuranceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export function createPatientRouter(controller: PatientController): Router {
  const router = Router();

  router.get(
    "/patients/me",
    requireRole(UserRole.PATIENT),
    controller.getProfile,
  );
  router.patch(
    "/patients/me",
    requireRole(UserRole.PATIENT),
    validate(updatePatientSchema),
    controller.updateProfile,
  );

  return router;
}
