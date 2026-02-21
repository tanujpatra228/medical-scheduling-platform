import { Patient, PatientProps } from "@msp/domain";
import { PatientEntity } from "../entities";

export class PatientMapper {
  static toDomain(entity: PatientEntity): Patient {
    const props: PatientProps = {
      id: entity.id,
      userId: entity.userId,
      clinicId: entity.clinicId,
      dateOfBirth: entity.dateOfBirth ?? undefined,
      insuranceNumber: entity.insuranceNumber ?? undefined,
      notes: entity.notes ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new Patient(props);
  }

  static toOrm(domain: Patient): Partial<PatientEntity> {
    return {
      id: domain.id,
      userId: domain.userId,
      clinicId: domain.clinicId,
      dateOfBirth: domain.dateOfBirth ?? null,
      insuranceNumber: domain.insuranceNumber ?? null,
      notes: domain.notes ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
