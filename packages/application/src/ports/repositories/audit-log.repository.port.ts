import { AuditLog } from "@msp/domain";

export interface IAuditLogRepository {
  findByAppointmentId(clinicId: string, appointmentId: string): Promise<AuditLog[]>;
  save(auditLog: AuditLog): Promise<AuditLog>;
}
