import {
  Appointment,
  AppointmentProps,
  AppointmentStatus,
  TimeSlot,
} from "@msp/domain";
import { AppointmentEntity, AppointmentStatusEnum } from "../entities";

export class AppointmentMapper {
  static toDomain(entity: AppointmentEntity): Appointment {
    const timeSlot = TimeSlot.create(entity.startsAt, entity.endsAt);
    const props: AppointmentProps = {
      id: entity.id,
      clinicId: entity.clinicId,
      doctorId: entity.doctorId,
      patientId: entity.patientId,
      timeSlot,
      status: entity.status as unknown as AppointmentStatus,
      reason: entity.reason ?? undefined,
      cancellationReason: entity.cancellationReason ?? undefined,
      cancelledBy: entity.cancelledBy ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return Appointment.reconstitute(props);
  }

  static toOrm(domain: Appointment): Partial<AppointmentEntity> {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      doctorId: domain.doctorId,
      patientId: domain.patientId,
      startsAt: domain.timeSlot.startsAt,
      endsAt: domain.timeSlot.endsAt,
      status: domain.status as unknown as AppointmentStatusEnum,
      reason: domain.reason ?? null,
      cancellationReason: domain.cancellationReason ?? null,
      cancelledBy: domain.cancelledBy ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
