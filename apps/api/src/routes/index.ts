import { Router } from "express";
import { healthRouter } from "./health.routes";
import { createAuthRouter } from "./auth.routes";
import { createClinicRouter } from "./clinic.routes";
import { createDoctorRouter } from "./doctor.routes";
import { createPatientRouter } from "./patient.routes";
import { AuthController } from "../controllers/auth.controller";
import { ClinicController } from "../controllers/clinic.controller";
import { DoctorController } from "../controllers/doctor.controller";
import { PatientController } from "../controllers/patient.controller";
import { createAuthMiddleware } from "../middleware/auth.middleware";
import type { Container } from "../container";

export function registerRoutes(container?: Container): Router {
  const router = Router();

  router.use(healthRouter);

  if (container) {
    const authMiddleware = createAuthMiddleware(container.tokenProvider);

    // Auth routes (public)
    const authController = new AuthController(
      container.registerPatient,
      container.login,
      container.refreshToken,
    );
    router.use(createAuthRouter(authController));

    // Protected routes
    const clinicController = new ClinicController(
      container.getClinic,
      container.updateClinic,
    );
    const doctorController = new DoctorController(
      container.listDoctors,
      container.getDoctor,
      container.createDoctor,
    );
    const patientController = new PatientController(
      container.getPatientProfile,
      container.updatePatientProfile,
    );

    router.use(authMiddleware, createClinicRouter(clinicController));
    router.use(authMiddleware, createDoctorRouter(doctorController));
    router.use(authMiddleware, createPatientRouter(patientController));
  }

  return router;
}
