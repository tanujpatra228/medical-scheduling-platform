import { Router } from "express";
import { healthRouter } from "./health.routes";
import { createAuthRouter } from "./auth.routes";
import { AuthController } from "../controllers/auth.controller";
import type { Container } from "../container";

export function registerRoutes(container?: Container): Router {
  const router = Router();

  router.use(healthRouter);

  if (container) {
    const authController = new AuthController(
      container.registerPatient,
      container.login,
      container.refreshToken,
    );
    router.use(createAuthRouter(authController));
  }

  return router;
}
