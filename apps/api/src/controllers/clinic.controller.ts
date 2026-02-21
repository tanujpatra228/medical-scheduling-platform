import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import {
  GetClinicUseCase,
  UpdateClinicUseCase,
} from "@msp/application";
import type { UpdateClinicDTO } from "@msp/application";
import type { Clinic } from "@msp/domain";

interface ClinicResponse {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
}

function toClinicResponse(clinic: Clinic): ClinicResponse {
  return {
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    address: clinic.address,
    phone: clinic.phone,
    email: clinic.email.toString(),
    timezone: clinic.timezone,
    isActive: clinic.isActive,
  };
}

export class ClinicController {
  constructor(
    private readonly getClinicUseCase: GetClinicUseCase,
    private readonly updateClinicUseCase: UpdateClinicUseCase,
  ) {}

  getClinic: RequestHandler = async (req, res, next) => {
    try {
      const clinic = await this.getClinicUseCase.execute(req.user!.clinicId);

      if (!clinic) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Clinic not found" },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: toClinicResponse(clinic),
      });
    } catch (error) {
      next(error);
    }
  };

  updateClinic: RequestHandler = async (req, res, next) => {
    try {
      const dto: UpdateClinicDTO = {
        clinicId: req.user!.clinicId,
        ...req.validatedBody as Omit<UpdateClinicDTO, "clinicId">,
      };

      const clinic = await this.updateClinicUseCase.execute(dto, req.user!.role);

      res.status(StatusCodes.OK).json({
        success: true,
        data: toClinicResponse(clinic),
      });
    } catch (error) {
      next(error);
    }
  };
}
