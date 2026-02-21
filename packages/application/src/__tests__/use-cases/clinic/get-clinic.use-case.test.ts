import { describe, it, expect, vi } from "vitest";
import { Clinic, Email } from "@msp/domain";
import { GetClinicUseCase } from "../../../use-cases/clinic/get-clinic.use-case";
import { IClinicRepository } from "../../../ports/repositories/clinic.repository.port";

function createMockClinic(overrides: Partial<{ id: string }> = {}): Clinic {
  return new Clinic({
    id: overrides.id ?? "clinic-1",
    name: "Test Clinic",
    slug: "test-clinic",
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
    update: vi.fn(),
    ...overrides,
  };
}

describe("GetClinicUseCase", () => {
  it("should return the clinic when found", async () => {
    const clinic = createMockClinic({ id: "clinic-1" });
    const clinicRepo = createMockClinicRepo({
      findById: vi.fn().mockResolvedValue(clinic),
    });
    const useCase = new GetClinicUseCase(clinicRepo);

    const result = await useCase.execute("clinic-1");

    expect(result).toBe(clinic);
    expect(clinicRepo.findById).toHaveBeenCalledWith("clinic-1");
  });

  it("should return null when the clinic is not found", async () => {
    const clinicRepo = createMockClinicRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetClinicUseCase(clinicRepo);

    const result = await useCase.execute("nonexistent-clinic");

    expect(result).toBeNull();
    expect(clinicRepo.findById).toHaveBeenCalledWith("nonexistent-clinic");
  });
});
