import { describe, it, expect, vi } from "vitest";
import { Clinic, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import {
  UpdateClinicUseCase,
  UnauthorizedError,
  ClinicNotFoundError,
} from "../../../use-cases/clinic/update-clinic.use-case";
import { IClinicRepository } from "../../../ports/repositories/clinic.repository.port";

function createMockClinic(overrides: Partial<{ id: string }> = {}): Clinic {
  return new Clinic({
    id: overrides.id ?? "clinic-1",
    name: "Original Name",
    slug: "original-name",
    address: "123 Main St",
    phone: "+1234567890",
    email: Email.create("clinic@test.com"),
    timezone: "America/New_York",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockClinicRepo(
  overrides: Partial<IClinicRepository> = {},
): IClinicRepository {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    save: vi.fn(),
    update: vi.fn().mockImplementation((clinic: Clinic) =>
      Promise.resolve(clinic),
    ),
    ...overrides,
  };
}

describe("UpdateClinicUseCase", () => {
  it("should update clinic fields when called by CLINIC_ADMIN", async () => {
    const clinic = createMockClinic();
    const clinicRepo = createMockClinicRepo({
      findById: vi.fn().mockResolvedValue(clinic),
    });
    const useCase = new UpdateClinicUseCase(clinicRepo);

    const result = await useCase.execute(
      {
        clinicId: "clinic-1",
        name: "Updated Name",
        address: "456 New St",
      },
      UserRole.CLINIC_ADMIN,
    );

    expect(result.name).toBe("Updated Name");
    expect(result.address).toBe("456 New St");
    expect(clinicRepo.update).toHaveBeenCalledWith(clinic);
  });

  it("should reject non-admin users", async () => {
    const clinicRepo = createMockClinicRepo();
    const useCase = new UpdateClinicUseCase(clinicRepo);

    await expect(
      useCase.execute(
        { clinicId: "clinic-1", name: "New Name" },
        UserRole.DOCTOR,
      ),
    ).rejects.toThrow(UnauthorizedError);

    expect(clinicRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw ClinicNotFoundError when clinic does not exist", async () => {
    const clinicRepo = createMockClinicRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    const useCase = new UpdateClinicUseCase(clinicRepo);

    await expect(
      useCase.execute(
        { clinicId: "nonexistent", name: "New Name" },
        UserRole.CLINIC_ADMIN,
      ),
    ).rejects.toThrow(ClinicNotFoundError);
  });

  it("should update the email when provided", async () => {
    const clinic = createMockClinic();
    const clinicRepo = createMockClinicRepo({
      findById: vi.fn().mockResolvedValue(clinic),
    });
    const useCase = new UpdateClinicUseCase(clinicRepo);

    const result = await useCase.execute(
      {
        clinicId: "clinic-1",
        email: "updated@clinic.com",
      },
      UserRole.CLINIC_ADMIN,
    );

    expect(result.email.toString()).toBe("updated@clinic.com");
  });
});
