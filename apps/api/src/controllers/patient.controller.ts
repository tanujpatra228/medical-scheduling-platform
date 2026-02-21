import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import {
  GetPatientProfileUseCase,
  UpdatePatientProfileUseCase,
} from "@msp/application";
import type { UpdatePatientProfileDTO } from "@msp/application";
import type { Patient } from "@msp/domain";

interface PatientResponse {
  id: string;
  userId: string;
  clinicId: string;
  dateOfBirth?: Date;
  insuranceNumber?: string;
  notes?: string;
}

function toPatientResponse(patient: Patient): PatientResponse {
  return {
    id: patient.id,
    userId: patient.userId,
    clinicId: patient.clinicId,
    dateOfBirth: patient.dateOfBirth,
    insuranceNumber: patient.insuranceNumber,
    notes: patient.notes,
  };
}

export class PatientController {
  constructor(
    private readonly getPatientProfileUseCase: GetPatientProfileUseCase,
    private readonly updatePatientProfileUseCase: UpdatePatientProfileUseCase,
  ) {}

  getProfile: RequestHandler = async (req, res, next) => {
    try {
      const patient = await this.getPatientProfileUseCase.execute(
        req.user!.clinicId,
        req.user!.userId,
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: toPatientResponse(patient),
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile: RequestHandler = async (req, res, next) => {
    try {
      const body = req.validatedBody as Omit<UpdatePatientProfileDTO, "clinicId" | "userId">;
      const dto: UpdatePatientProfileDTO = {
        clinicId: req.user!.clinicId,
        userId: req.user!.userId,
        ...body,
      };

      const patient = await this.updatePatientProfileUseCase.execute(dto);

      res.status(StatusCodes.OK).json({
        success: true,
        data: toPatientResponse(patient),
      });
    } catch (error) {
      next(error);
    }
  };
}
