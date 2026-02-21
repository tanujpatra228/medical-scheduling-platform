import { describe, it, expect, vi } from "vitest";
import { Patient } from "@msp/domain";
import {
  GetPatientProfileUseCase,
  PatientNotFoundError,
} from "../../../use-cases/patient/get-patient-profile.use-case";
import { IPatientRepository } from "../../../ports/repositories/patient.repository.port";

function createMockPatient(): Patient {
  return new Patient({
    id: "patient-1",
    userId: "user-1",
    clinicId: "clinic-1",
    dateOfBirth: new Date("1990-01-15"),
    insuranceNumber: "INS-12345",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockPatientRepo(
  overrides: Partial<IPatientRepository> = {},
): IPatientRepository {
  return {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    ...overrides,
  };
}

describe("GetPatientProfileUseCase", () => {
  it("should return the patient when found", async () => {
    const patient = createMockPatient();
    const patientRepo = createMockPatientRepo({
      findByUserId: vi.fn().mockResolvedValue(patient),
    });
    const useCase = new GetPatientProfileUseCase(patientRepo);

    const result = await useCase.execute("clinic-1", "user-1");

    expect(result).toBe(patient);
    expect(patientRepo.findByUserId).toHaveBeenCalledWith("clinic-1", "user-1");
  });

  it("should throw PatientNotFoundError when patient does not exist", async () => {
    const patientRepo = createMockPatientRepo({
      findByUserId: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetPatientProfileUseCase(patientRepo);

    await expect(
      useCase.execute("clinic-1", "nonexistent-user"),
    ).rejects.toThrow(PatientNotFoundError);
  });
});
