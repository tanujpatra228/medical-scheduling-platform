import { Doctor } from "@msp/domain";
import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";

export class GetDoctorUseCase {
  constructor(private readonly doctorRepo: IDoctorRepository) {}

  async execute(clinicId: string, doctorId: string): Promise<Doctor | null> {
    return this.doctorRepo.findById(clinicId, doctorId);
  }
}
