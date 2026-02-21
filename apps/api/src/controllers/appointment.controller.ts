import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import {
  CreateAppointmentUseCase,
  ConfirmAppointmentUseCase,
  CancelAppointmentUseCase,
  CompleteAppointmentUseCase,
  GetAppointmentUseCase,
  ListAppointmentsUseCase,
} from "@msp/application";
import type {
  BookAppointmentDTO,
  AppointmentListFiltersDTO,
} from "@msp/application";

interface ListQueryParams {
  status?: string;
  doctorId?: string;
  patientId?: string;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}

interface CancelBody {
  reason?: string;
}

export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly confirmAppointmentUseCase: ConfirmAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly completeAppointmentUseCase: CompleteAppointmentUseCase,
    private readonly getAppointmentUseCase: GetAppointmentUseCase,
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      const body = req.validatedBody as Omit<BookAppointmentDTO, "clinicId">;
      const result = await this.createAppointmentUseCase.execute({
        ...body,
        clinicId: req.user!.clinicId,
      });
      res.status(StatusCodes.CREATED).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const query = req.validatedQuery as ListQueryParams;
      const { page, limit, ...filters } = query;
      const result = await this.listAppointmentsUseCase.execute(
        req.user!.clinicId,
        filters as AppointmentListFiltersDTO,
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

  getById: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.getAppointmentUseCase.execute(
        req.user!.clinicId,
        req.params.id as string,
      );
      if (!result) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Appointment not found" },
        });
        return;
      }
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  confirm: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.confirmAppointmentUseCase.execute(
        req.user!.clinicId,
        req.params.id as string,
      );
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  cancel: RequestHandler = async (req, res, next) => {
    try {
      const body = (req.validatedBody || {}) as CancelBody;
      const result = await this.cancelAppointmentUseCase.execute({
        clinicId: req.user!.clinicId,
        appointmentId: req.params.id as string,
        cancelledBy: req.user!.userId,
        reason: body.reason,
      });
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  complete: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.completeAppointmentUseCase.execute(
        req.user!.clinicId,
        req.params.id as string,
      );
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
