import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import {
  ListDoctorsUseCase,
  GetDoctorUseCase,
  CreateDoctorUseCase,
  UpdateDoctorUseCase,
} from "@msp/application";
import type { CreateDoctorDTO, UpdateDoctorDTO } from "@msp/application";

interface PaginationQuery {
  page: number;
  limit: number;
}

export class DoctorController {
  constructor(
    private readonly listDoctorsUseCase: ListDoctorsUseCase,
    private readonly getDoctorUseCase: GetDoctorUseCase,
    private readonly createDoctorUseCase: CreateDoctorUseCase,
    private readonly updateDoctorUseCase: UpdateDoctorUseCase,
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
        data: doctor,
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

  updateDoctor: RequestHandler = async (req, res, next) => {
    try {
      const doctorId = req.params.doctorId as string;
      const dto = req.validatedBody as UpdateDoctorDTO;

      const result = await this.updateDoctorUseCase.execute(
        req.user!.clinicId,
        doctorId,
        dto,
        req.user!.role,
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
