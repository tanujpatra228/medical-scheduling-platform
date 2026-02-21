import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { GetAvailableSlotsUseCase } from "@msp/application";
import type { Slot } from "@msp/application";

interface SlotsQuery {
  from: Date;
  to: Date;
}

export class AvailabilityController {
  constructor(
    private readonly getAvailableSlotsUseCase: GetAvailableSlotsUseCase,
  ) {}

  getSlots: RequestHandler = async (req, res, next) => {
    try {
      const query = req.validatedQuery as SlotsQuery;
      const doctorId = req.params.doctorId as string;
      const slots = await this.getAvailableSlotsUseCase.execute(
        req.user!.clinicId,
        doctorId,
        query.from,
        query.to,
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: slots.map((slot: Slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
          isAvailable: slot.isAvailable,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}
