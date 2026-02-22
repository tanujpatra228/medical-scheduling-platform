import { Router } from "express";
import { healthRouter } from "./health.routes";
import { createAuthRouter } from "./auth.routes";
import { createClinicRouter } from "./clinic.routes";
import { createDoctorRouter } from "./doctor.routes";
import { createPatientRouter } from "./patient.routes";
import { createAppointmentRouter } from "./appointment.routes";
import { createAvailabilityRouter } from "./availability.routes";
import { AuthController } from "../controllers/auth.controller";
import { ClinicController } from "../controllers/clinic.controller";
import { DoctorController } from "../controllers/doctor.controller";
import { PatientController } from "../controllers/patient.controller";
import { AppointmentController } from "../controllers/appointment.controller";
import { AvailabilityController } from "../controllers/availability.controller";
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
    const appointmentController = new AppointmentController(
      container.createAppointment,
      container.confirmAppointment,
      container.cancelAppointment,
      container.completeAppointment,
      container.getAppointment,
      container.listAppointments,
      container.patientRepo,
    );
    const availabilityController = new AvailabilityController(
      container.getAvailableSlots,
    );

    router.use(authMiddleware, createClinicRouter(clinicController));
    router.use(authMiddleware, createDoctorRouter(doctorController));
    router.use(authMiddleware, createPatientRouter(patientController));
    router.use(authMiddleware, createAppointmentRouter(appointmentController));
    router.use(authMiddleware, createAvailabilityRouter(availabilityController));
  }

  return router;
}
