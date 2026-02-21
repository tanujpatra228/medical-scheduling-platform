import { Patient } from "@msp/domain";

export interface IPatientRepository {
  findById(clinicId: string, id: string): Promise<Patient | null>;
  findByUserId(clinicId: string, userId: string): Promise<Patient | null>;
  save(patient: Patient): Promise<Patient>;
  update(patient: Patient): Promise<Patient>;
}
