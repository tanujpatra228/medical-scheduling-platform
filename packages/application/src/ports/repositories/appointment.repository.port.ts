import { Appointment } from "@msp/domain";
import { PaginationParams, PaginatedResult } from "@msp/shared";

export interface AppointmentFilters {
  status?: string;
  doctorId?: string;
  patientId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IAppointmentRepository {
  findById(clinicId: string, id: string): Promise<Appointment | null>;
  findByDoctorAndDateRange(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]>;
  findOverlapping(
    clinicId: string,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]>;
  findAll(
    clinicId: string,
    filters: AppointmentFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Appointment>>;
  save(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
}
