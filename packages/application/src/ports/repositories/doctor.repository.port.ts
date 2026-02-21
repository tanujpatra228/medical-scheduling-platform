import { Doctor } from "@msp/domain";
import { PaginationParams, PaginatedResult } from "@msp/shared";

export interface IDoctorRepository {
  findById(clinicId: string, id: string): Promise<Doctor | null>;
  findByUserId(clinicId: string, userId: string): Promise<Doctor | null>;
  findByClinicId(
    clinicId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Doctor>>;
  save(doctor: Doctor): Promise<Doctor>;
  update(doctor: Doctor): Promise<Doctor>;
}
