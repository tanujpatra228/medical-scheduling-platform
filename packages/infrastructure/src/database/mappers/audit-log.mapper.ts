import { AuditLog, AuditLogProps } from "@msp/domain";
import { AuditLogEntity } from "../entities";

export class AuditLogMapper {
  static toDomain(entity: AuditLogEntity): AuditLog {
    const props: AuditLogProps = {
      id: entity.id,
      clinicId: entity.clinicId,
      appointmentId: entity.appointmentId,
      actorId: entity.actorId,
      action: entity.action,
      fromStatus: entity.fromStatus ?? undefined,
      toStatus: entity.toStatus ?? undefined,
      metadata: entity.metadata ?? undefined,
      createdAt: entity.createdAt,
    };
    return new AuditLog(props);
  }

  static toOrm(domain: AuditLog): Partial<AuditLogEntity> {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      appointmentId: domain.appointmentId,
      actorId: domain.actorId,
      action: domain.action,
      fromStatus: domain.fromStatus ?? null,
      toStatus: domain.toStatus ?? null,
      metadata: domain.metadata ?? null,
      createdAt: domain.createdAt,
    };
  }
}
