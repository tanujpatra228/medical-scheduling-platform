import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validation.middleware";
import { AvailabilityController } from "../controllers/availability.controller";

const slotsQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export function createAvailabilityRouter(
  controller: AvailabilityController,
): Router {
  const router = Router();

  router.get(
    "/doctors/:doctorId/slots",
    validate(slotsQuerySchema, "query"),
    controller.getSlots,
  );

  return router;
}
