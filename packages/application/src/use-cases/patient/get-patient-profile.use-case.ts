import { Patient } from "@msp/domain";
import { IPatientRepository } from "../../ports/repositories/patient.repository.port";

export class PatientNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Patient not found: ${identifier}`);
    this.name = "PatientNotFoundError";
  }
}

export class GetPatientProfileUseCase {
  constructor(private readonly patientRepo: IPatientRepository) {}

  async execute(clinicId: string, userId: string): Promise<Patient> {
    const patient = await this.patientRepo.findByUserId(clinicId, userId);
    if (!patient) {
      throw new PatientNotFoundError(userId);
    }
    return patient;
  }
}
