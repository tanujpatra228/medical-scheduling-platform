import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmAvailabilityRuleRepository } from "../../repositories/typeorm-availability-rule.repository";
import { AvailabilityRuleMapper } from "../../database/mappers";
import { AvailabilityRuleEntity } from "../../database/entities";
import { AvailabilityRule } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  AvailabilityRuleMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

function createMockRuleEntity(overrides: Partial<AvailabilityRuleEntity> = {}): AvailabilityRuleEntity {
  return {
    id: "rule-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    clinic: {} as any,
    doctor: {} as any,
    ...overrides,
  } as AvailabilityRuleEntity;
}

function createMockRule(): AvailabilityRule {
  return new AvailabilityRule({
    id: "rule-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmAvailabilityRuleRepository", () => {
  let repository: TypeOrmAvailabilityRuleRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmAvailabilityRuleRepository(mockOrmRepo as any);
  });

  describe("findByDoctorId", () => {
    it("should scope query by clinicId, doctorId, and isActive", async () => {
      const entity = createMockRuleEntity();
      const domainRule = createMockRule();
      mockOrmRepo.find.mockResolvedValue([entity]);
      vi.mocked(AvailabilityRuleMapper.toDomain).mockReturnValue(domainRule);

      const result = await repository.findByDoctorId("clinic-1", "doctor-1");

      expect(mockOrmRepo.find).toHaveBeenCalledWith({
        where: { clinicId: "clinic-1", doctorId: "doctor-1", isActive: true },
        order: { dayOfWeek: "ASC", startTime: "ASC" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(domainRule);
    });
  });

  describe("findByDoctorAndDay", () => {
    it("should scope query by clinicId, doctorId, dayOfWeek, and isActive", async () => {
      const entity = createMockRuleEntity();
      const domainRule = createMockRule();
      mockOrmRepo.find.mockResolvedValue([entity]);
      vi.mocked(AvailabilityRuleMapper.toDomain).mockReturnValue(domainRule);

      const result = await repository.findByDoctorAndDay("clinic-1", "doctor-1", 1);

      expect(mockOrmRepo.find).toHaveBeenCalledWith({
        where: { clinicId: "clinic-1", doctorId: "doctor-1", dayOfWeek: 1, isActive: true },
        order: { startTime: "ASC" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("softDelete", () => {
    it("should set isActive to false and update updatedAt", async () => {
      mockOrmRepo.update.mockResolvedValue({ affected: 1 });

      await repository.softDelete("clinic-1", "rule-1");

      expect(mockOrmRepo.update).toHaveBeenCalledWith(
        { id: "rule-1", clinicId: "clinic-1" },
        expect.objectContaining({ isActive: false, updatedAt: expect.any(Date) }),
      );
    });
  });

  describe("save", () => {
    it("should map, persist, and return domain entity", async () => {
      const domainRule = createMockRule();
      const ormData = { id: "rule-1" };
      const savedEntity = createMockRuleEntity();
      const resultRule = createMockRule();

      vi.mocked(AvailabilityRuleMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(AvailabilityRuleMapper.toDomain).mockReturnValue(resultRule);

      const result = await repository.save(domainRule);

      expect(AvailabilityRuleMapper.toOrm).toHaveBeenCalledWith(domainRule);
      expect(result).toBe(resultRule);
    });
  });
});
