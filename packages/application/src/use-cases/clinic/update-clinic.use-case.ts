import { Clinic, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import { IClinicRepository } from "../../ports/repositories/clinic.repository.port";

export interface UpdateClinicDTO {
  clinicId: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ClinicNotFoundError extends Error {
  constructor(clinicId: string) {
    super(`Clinic not found: ${clinicId}`);
    this.name = "ClinicNotFoundError";
  }
}

export class UpdateClinicUseCase {
  constructor(private readonly clinicRepo: IClinicRepository) {}

  async execute(dto: UpdateClinicDTO, role: string): Promise<Clinic> {
    if (role !== UserRole.CLINIC_ADMIN) {
      throw new UnauthorizedError(
        "Only CLINIC_ADMIN can update clinic settings",
      );
    }

    const clinic = await this.clinicRepo.findById(dto.clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(dto.clinicId);
    }

    clinic.update({
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      email: dto.email ? Email.create(dto.email) : undefined,
      timezone: dto.timezone,
    });

    return this.clinicRepo.update(clinic);
  }
}
