import { AvailabilityRule } from "@msp/domain";

export interface IAvailabilityRuleRepository {
  findByDoctorId(clinicId: string, doctorId: string): Promise<AvailabilityRule[]>;
  findByDoctorAndDay(
    clinicId: string,
    doctorId: string,
    dayOfWeek: number,
  ): Promise<AvailabilityRule[]>;
  save(rule: AvailabilityRule): Promise<AvailabilityRule>;
  update(rule: AvailabilityRule): Promise<AvailabilityRule>;
  softDelete(clinicId: string, id: string): Promise<void>;
}
