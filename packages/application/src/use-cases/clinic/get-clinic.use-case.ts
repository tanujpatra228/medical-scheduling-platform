import { Clinic } from "@msp/domain";
import { IClinicRepository } from "../../ports/repositories/clinic.repository.port";

export class GetClinicUseCase {
  constructor(private readonly clinicRepo: IClinicRepository) {}

  async execute(clinicId: string): Promise<Clinic | null> {
    return this.clinicRepo.findById(clinicId);
  }
}
