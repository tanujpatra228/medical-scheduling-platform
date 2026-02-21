import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmPatientRepository } from "../../repositories/typeorm-patient.repository";
import { PatientMapper } from "../../database/mappers";
import { PatientEntity } from "../../database/entities";
import { Patient } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  PatientMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

function createMockPatientEntity(overrides: Partial<PatientEntity> = {}): PatientEntity {
  return {
    id: "patient-1",
    userId: "user-1",
    clinicId: "clinic-1",
    dateOfBirth: null,
    insuranceNumber: null,
    notes: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    user: {} as any,
    clinic: {} as any,
    ...overrides,
  } as PatientEntity;
}

function createMockPatient(): Patient {
  return new Patient({
    id: "patient-1",
    userId: "user-1",
    clinicId: "clinic-1",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmPatientRepository", () => {
  let repository: TypeOrmPatientRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmPatientRepository(mockOrmRepo as any);
  });

  describe("findById", () => {
    it("should scope query by clinicId and id", async () => {
      const entity = createMockPatientEntity();
      const domainPatient = createMockPatient();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(PatientMapper.toDomain).mockReturnValue(domainPatient);

      const result = await repository.findById("clinic-1", "patient-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: "patient-1", clinicId: "clinic-1" },
      });
      expect(result).toBe(domainPatient);
    });

    it("should return null when not found", async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById("clinic-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should scope query by clinicId and userId", async () => {
      const entity = createMockPatientEntity();
      const domainPatient = createMockPatient();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(PatientMapper.toDomain).mockReturnValue(domainPatient);

      const result = await repository.findByUserId("clinic-1", "user-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { userId: "user-1", clinicId: "clinic-1" },
      });
      expect(result).toBe(domainPatient);
    });
  });

  describe("save", () => {
    it("should map, persist, and return domain entity", async () => {
      const domainPatient = createMockPatient();
      const ormData = { id: "patient-1" };
      const savedEntity = createMockPatientEntity();
      const resultPatient = createMockPatient();

      vi.mocked(PatientMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(PatientMapper.toDomain).mockReturnValue(resultPatient);

      const result = await repository.save(domainPatient);

      expect(PatientMapper.toOrm).toHaveBeenCalledWith(domainPatient);
      expect(mockOrmRepo.save).toHaveBeenCalledWith(ormData);
      expect(result).toBe(resultPatient);
    });
  });
});
