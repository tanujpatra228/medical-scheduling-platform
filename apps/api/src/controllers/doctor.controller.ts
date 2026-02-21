import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import {
  ListDoctorsUseCase,
  GetDoctorUseCase,
  CreateDoctorUseCase,
} from "@msp/application";
import type { CreateDoctorDTO } from "@msp/application";
import type { Doctor } from "@msp/domain";

interface DoctorResponse {
  id: string;
  userId: string;
  clinicId: string;
  specialization: string;
  slotDurationMin: number;
  maxDailyAppointments: number;
}

interface PaginationQuery {
  page: number;
  limit: number;
}

function toDoctorResponse(doctor: Doctor): DoctorResponse {
  return {
    id: doctor.id,
    userId: doctor.userId,
    clinicId: doctor.clinicId,
    specialization: doctor.specialization,
    slotDurationMin: doctor.slotDurationMin,
    maxDailyAppointments: doctor.maxDailyAppointments,
  };
}

export class DoctorController {
  constructor(
    private readonly listDoctorsUseCase: ListDoctorsUseCase,
    private readonly getDoctorUseCase: GetDoctorUseCase,
    private readonly createDoctorUseCase: CreateDoctorUseCase,
  ) {}

  listDoctors: RequestHandler = async (req, res, next) => {
    try {
      const { page, limit } = req.validatedQuery as PaginationQuery;

      const result = await this.listDoctorsUseCase.execute(
        req.user!.clinicId,
        { page, limit },
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getDoctor: RequestHandler = async (req, res, next) => {
    try {
      const doctorId = req.params.doctorId as string;
      const doctor = await this.getDoctorUseCase.execute(
        req.user!.clinicId,
        doctorId,
      );

      if (!doctor) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Doctor not found" },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: toDoctorResponse(doctor),
      });
    } catch (error) {
      next(error);
    }
  };

  createDoctor: RequestHandler = async (req, res, next) => {
    try {
      const body = req.validatedBody as Omit<CreateDoctorDTO, "clinicId">;
      const dto: CreateDoctorDTO = {
        clinicId: req.user!.clinicId,
        ...body,
      };

      const result = await this.createDoctorUseCase.execute(dto, req.user!.role);

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
