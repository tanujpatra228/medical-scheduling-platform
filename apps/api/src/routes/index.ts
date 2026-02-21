import { Router } from "express";
import { healthRouter } from "./health.routes";

export function registerRoutes(): Router {
  const router = Router();

  router.use(healthRouter);

  return router;
}
