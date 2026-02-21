import { Repository } from "typeorm";
import { AuditLogEntity } from "../database/entities";
import { AuditLogMapper } from "../database/mappers";
import { IAuditLogRepository } from "@msp/application";
import { AuditLog } from "@msp/domain";

export class TypeOrmAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly ormRepository: Repository<AuditLogEntity>) {}

  async findByAppointmentId(
    clinicId: string,
    appointmentId: string,
  ): Promise<AuditLog[]> {
    const entities = await this.ormRepository.find({
      where: { clinicId, appointmentId },
      order: { createdAt: "ASC" },
    });

    return entities.map(AuditLogMapper.toDomain);
  }

  async save(auditLog: AuditLog): Promise<AuditLog> {
    const ormData = AuditLogMapper.toOrm(auditLog);
    const savedEntity = await this.ormRepository.save(ormData);

    return AuditLogMapper.toDomain(savedEntity as AuditLogEntity);
  }
}
