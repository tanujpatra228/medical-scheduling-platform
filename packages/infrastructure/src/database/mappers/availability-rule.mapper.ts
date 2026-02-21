import { AvailabilityRule, AvailabilityRuleProps } from "@msp/domain";
import { AvailabilityRuleEntity } from "../entities";

export class AvailabilityRuleMapper {
  static toDomain(entity: AvailabilityRuleEntity): AvailabilityRule {
    const props: AvailabilityRuleProps = {
      id: entity.id,
      clinicId: entity.clinicId,
      doctorId: entity.doctorId,
      dayOfWeek: entity.dayOfWeek,
      startTime: entity.startTime,
      endTime: entity.endTime,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new AvailabilityRule(props);
  }

  static toOrm(domain: AvailabilityRule): Partial<AvailabilityRuleEntity> {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      doctorId: domain.doctorId,
      dayOfWeek: domain.dayOfWeek,
      startTime: domain.startTime,
      endTime: domain.endTime,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
