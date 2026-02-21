import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmAvailabilityOverrideRepository } from "../../repositories/typeorm-availability-override.repository";
import { AvailabilityOverrideMapper } from "../../database/mappers";
import { AvailabilityOverrideEntity } from "../../database/entities";
import { AvailabilityOverride } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  AvailabilityOverrideMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

function createMockOverrideEntity(
  overrides: Partial<AvailabilityOverrideEntity> = {},
): AvailabilityOverrideEntity {
  return {
    id: "override-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    date: new Date("2025-06-15"),
    startTime: null,
    endTime: null,
    isAvailable: false,
    reason: "Holiday",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    clinic: {} as any,
    doctor: {} as any,
    ...overrides,
  } as AvailabilityOverrideEntity;
}

function createMockOverride(): AvailabilityOverride {
  return new AvailabilityOverride({
    id: "override-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    date: new Date("2025-06-15"),
    isAvailable: false,
    reason: "Holiday",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmAvailabilityOverrideRepository", () => {
  let repository: TypeOrmAvailabilityOverrideRepository;
  const mockOrmRepo = {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmAvailabilityOverrideRepository(mockOrmRepo as any);
  });

  describe("findByDoctorAndDateRange", () => {
    it("should scope query by clinicId, doctorId, and date range", async () => {
      const entity = createMockOverrideEntity();
      const domainOverride = createMockOverride();
      mockOrmRepo.find.mockResolvedValue([entity]);
      vi.mocked(AvailabilityOverrideMapper.toDomain).mockReturnValue(domainOverride);

      const from = new Date("2025-06-01");
      const to = new Date("2025-06-30");

      const result = await repository.findByDoctorAndDateRange(
        "clinic-1",
        "doctor-1",
        from,
        to,
      );

      expect(mockOrmRepo.find).toHaveBeenCalledWith({
        where: {
          clinicId: "clinic-1",
          doctorId: "doctor-1",
          date: expect.anything(), // Between operator
        },
        order: { date: "ASC" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(domainOverride);
    });
  });

  describe("findByDoctorAndDate", () => {
    it("should scope query by clinicId, doctorId, and exact date", async () => {
      const entity = createMockOverrideEntity();
      const domainOverride = createMockOverride();
      mockOrmRepo.find.mockResolvedValue([entity]);
      vi.mocked(AvailabilityOverrideMapper.toDomain).mockReturnValue(domainOverride);

      const date = new Date("2025-06-15");

      const result = await repository.findByDoctorAndDate("clinic-1", "doctor-1", date);

      expect(mockOrmRepo.find).toHaveBeenCalledWith({
        where: { clinicId: "clinic-1", doctorId: "doctor-1", date },
        order: { startTime: "ASC" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("delete", () => {
    it("should delete by clinicId and id", async () => {
      mockOrmRepo.delete.mockResolvedValue({ affected: 1 });

      await repository.delete("clinic-1", "override-1");

      expect(mockOrmRepo.delete).toHaveBeenCalledWith({
        id: "override-1",
        clinicId: "clinic-1",
      });
    });
  });

  describe("save", () => {
    it("should map, persist, and return domain entity", async () => {
      const domainOverride = createMockOverride();
      const ormData = { id: "override-1" };
      const savedEntity = createMockOverrideEntity();
      const resultOverride = createMockOverride();

      vi.mocked(AvailabilityOverrideMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(AvailabilityOverrideMapper.toDomain).mockReturnValue(resultOverride);

      const result = await repository.save(domainOverride);

      expect(AvailabilityOverrideMapper.toOrm).toHaveBeenCalledWith(domainOverride);
      expect(result).toBe(resultOverride);
    });
  });
});
