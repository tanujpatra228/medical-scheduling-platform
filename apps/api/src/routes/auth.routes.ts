import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validation.middleware";
import { AuthController } from "../controllers/auth.controller";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 100;

const registerSchema = z.object({
  clinicId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  firstName: z.string().min(1).max(MAX_NAME_LENGTH),
  lastName: z.string().min(1).max(MAX_NAME_LENGTH),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  insuranceNumber: z.string().optional(),
});

const loginSchema = z.object({
  clinicId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/auth/register", validate(registerSchema), controller.register);
  router.post("/auth/login", validate(loginSchema), controller.login);
  router.post("/auth/refresh", validate(refreshTokenSchema), controller.refreshToken);

  return router;
}
