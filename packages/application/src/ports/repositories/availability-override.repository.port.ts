import { AvailabilityOverride } from "@msp/domain";

export interface IAvailabilityOverrideRepository {
  findByDoctorAndDateRange(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
  ): Promise<AvailabilityOverride[]>;
  findByDoctorAndDate(
    clinicId: string,
    doctorId: string,
    date: Date,
  ): Promise<AvailabilityOverride[]>;
  save(override: AvailabilityOverride): Promise<AvailabilityOverride>;
  delete(clinicId: string, id: string): Promise<void>;
}
