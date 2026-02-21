import { PaginationParams, PaginatedResult } from "@msp/shared";
import {
  IAppointmentRepository,
  AppointmentFilters,
} from "../../ports/repositories/appointment.repository.port";
import {
  AppointmentListFiltersDTO,
  AppointmentResponseDTO,
} from "../../dtos/appointment.dto";
import { toAppointmentResponseDTO } from "./appointment.mapper";

export class ListAppointmentsUseCase {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async execute(
    clinicId: string,
    filtersDto: AppointmentListFiltersDTO,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AppointmentResponseDTO>> {
    const filters = this.mapFilters(filtersDto);

    const result = await this.appointmentRepo.findAll(
      clinicId,
      filters,
      pagination,
    );

    return {
      data: result.data.map(toAppointmentResponseDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private mapFilters(dto: AppointmentListFiltersDTO): AppointmentFilters {
    return {
      status: dto.status,
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
      toDate: dto.toDate ? new Date(dto.toDate) : undefined,
    };
  }
}
