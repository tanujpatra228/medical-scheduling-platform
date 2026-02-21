import { Patient } from "@msp/domain";
import { IPatientRepository } from "../../ports/repositories/patient.repository.port";

export interface UpdatePatientProfileDTO {
  clinicId: string;
  userId: string;
  dateOfBirth?: Date;
  insuranceNumber?: string;
  notes?: string;
}

export class PatientProfileNotFoundError extends Error {
  constructor(userId: string) {
    super(`Patient profile not found for user: ${userId}`);
    this.name = "PatientProfileNotFoundError";
  }
}

export class UpdatePatientProfileUseCase {
  constructor(private readonly patientRepo: IPatientRepository) {}

  async execute(dto: UpdatePatientProfileDTO): Promise<Patient> {
    const patient = await this.patientRepo.findByUserId(
      dto.clinicId,
      dto.userId,
    );
    if (!patient) {
      throw new PatientProfileNotFoundError(dto.userId);
    }

    patient.updateProfile({
      dateOfBirth: dto.dateOfBirth,
      insuranceNumber: dto.insuranceNumber,
      notes: dto.notes,
    });

    return this.patientRepo.update(patient);
  }
}
