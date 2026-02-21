import { Doctor, DoctorProps } from "@msp/domain";
import { DoctorEntity } from "../entities";

export class DoctorMapper {
  static toDomain(entity: DoctorEntity): Doctor {
    const props: DoctorProps = {
      id: entity.id,
      userId: entity.userId,
      clinicId: entity.clinicId,
      specialization: entity.specialization,
      slotDurationMin: entity.slotDurationMin,
      maxDailyAppointments: entity.maxDailyAppointments ?? 0,
      googleCalendarId: entity.googleCalendarId ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new Doctor(props);
  }

  static toOrm(domain: Doctor): Partial<DoctorEntity> {
    return {
      id: domain.id,
      userId: domain.userId,
      clinicId: domain.clinicId,
      specialization: domain.specialization,
      slotDurationMin: domain.slotDurationMin,
      maxDailyAppointments: domain.maxDailyAppointments ?? null,
      googleCalendarId: domain.googleCalendarId ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
