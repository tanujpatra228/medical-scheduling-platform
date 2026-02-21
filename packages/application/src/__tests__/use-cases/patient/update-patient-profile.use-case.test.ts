import { describe, it, expect, vi } from "vitest";
import { Patient } from "@msp/domain";
import {
  UpdatePatientProfileUseCase,
  PatientProfileNotFoundError,
} from "../../../use-cases/patient/update-patient-profile.use-case";
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
    update: vi.fn().mockImplementation((patient: Patient) =>
      Promise.resolve(patient),
    ),
    ...overrides,
  };
}

describe("UpdatePatientProfileUseCase", () => {
  it("should update patient profile fields", async () => {
    const patient = createMockPatient();
    const patientRepo = createMockPatientRepo({
      findByUserId: vi.fn().mockResolvedValue(patient),
    });
    const useCase = new UpdatePatientProfileUseCase(patientRepo);

    const result = await useCase.execute({
      clinicId: "clinic-1",
      userId: "user-1",
      insuranceNumber: "INS-99999",
      notes: "Updated notes",
    });

    expect(result.insuranceNumber).toBe("INS-99999");
    expect(result.notes).toBe("Updated notes");
    expect(patientRepo.update).toHaveBeenCalledWith(patient);
  });

  it("should throw PatientProfileNotFoundError when patient does not exist", async () => {
    const patientRepo = createMockPatientRepo({
      findByUserId: vi.fn().mockResolvedValue(null),
    });
    const useCase = new UpdatePatientProfileUseCase(patientRepo);

    await expect(
      useCase.execute({
        clinicId: "clinic-1",
        userId: "nonexistent",
        notes: "test",
      }),
    ).rejects.toThrow(PatientProfileNotFoundError);
  });
});
