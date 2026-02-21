import { AvailabilityOverride, AvailabilityOverrideProps } from "@msp/domain";
import { AvailabilityOverrideEntity } from "../entities";

export class AvailabilityOverrideMapper {
  static toDomain(entity: AvailabilityOverrideEntity): AvailabilityOverride {
    const props: AvailabilityOverrideProps = {
      id: entity.id,
      clinicId: entity.clinicId,
      doctorId: entity.doctorId,
      date: entity.date,
      startTime: entity.startTime ?? undefined,
      endTime: entity.endTime ?? undefined,
      isAvailable: entity.isAvailable,
      reason: entity.reason ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new AvailabilityOverride(props);
  }

  static toOrm(domain: AvailabilityOverride): Partial<AvailabilityOverrideEntity> {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      doctorId: domain.doctorId,
      date: domain.date,
      startTime: domain.startTime ?? null,
      endTime: domain.endTime ?? null,
      isAvailable: domain.isAvailable,
      reason: domain.reason ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
