import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmDoctorRepository } from "../../repositories/typeorm-doctor.repository";
import { DoctorMapper } from "../../database/mappers";
import { DoctorEntity } from "../../database/entities";
import { Doctor } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  DoctorMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

const mockQueryBuilder = {
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  take: vi.fn().mockReturnThis(),
  getManyAndCount: vi.fn(),
};

function createMockDoctorEntity(overrides: Partial<DoctorEntity> = {}): DoctorEntity {
  return {
    id: "doctor-1",
    userId: "user-1",
    clinicId: "clinic-1",
    specialization: "Cardiology",
    slotDurationMin: 30,
    maxDailyAppointments: null,
    googleCalendarId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    user: {} as any,
    clinic: {} as any,
    ...overrides,
  } as DoctorEntity;
}

function createMockDoctor(): Doctor {
  return new Doctor({
    id: "doctor-1",
    userId: "user-1",
    clinicId: "clinic-1",
    specialization: "Cardiology",
    slotDurationMin: 30,
    maxDailyAppointments: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmDoctorRepository", () => {
  let repository: TypeOrmDoctorRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrmRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    // Reset chainable methods
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();

    repository = new TypeOrmDoctorRepository(mockOrmRepo as any);
  });

  describe("findById", () => {
    it("should scope query by clinicId and id", async () => {
      const entity = createMockDoctorEntity();
      const domainDoctor = createMockDoctor();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(DoctorMapper.toDomain).mockReturnValue(domainDoctor);

      const result = await repository.findById("clinic-1", "doctor-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: "doctor-1", clinicId: "clinic-1" },
      });
      expect(result).toBe(domainDoctor);
    });

    it("should return null when not found", async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById("clinic-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should scope query by clinicId and userId", async () => {
      const entity = createMockDoctorEntity();
      const domainDoctor = createMockDoctor();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(DoctorMapper.toDomain).mockReturnValue(domainDoctor);

      const result = await repository.findByUserId("clinic-1", "user-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { userId: "user-1", clinicId: "clinic-1" },
      });
      expect(result).toBe(domainDoctor);
    });
  });

  describe("findByClinicId", () => {
    it("should return paginated result with correct skip/take", async () => {
      const entity1 = createMockDoctorEntity({ id: "d1" });
      const entity2 = createMockDoctorEntity({ id: "d2" });
      const doctor1 = createMockDoctor();
      const doctor2 = createMockDoctor();

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[entity1, entity2], 5]);
      vi.mocked(DoctorMapper.toDomain)
        .mockReturnValueOnce(doctor1)
        .mockReturnValueOnce(doctor2);

      const result = await repository.findByClinicId("clinic-1", { page: 2, limit: 2 });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "doctor.clinicId = :clinicId",
        { clinicId: "clinic-1" },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(2); // (page 2 - 1) * limit 2
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(2);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe("save", () => {
    it("should map, persist, and return domain entity", async () => {
      const domainDoctor = createMockDoctor();
      const ormData = { id: "doctor-1" };
      const savedEntity = createMockDoctorEntity();
      const resultDoctor = createMockDoctor();

      vi.mocked(DoctorMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(DoctorMapper.toDomain).mockReturnValue(resultDoctor);

      const result = await repository.save(domainDoctor);

      expect(DoctorMapper.toOrm).toHaveBeenCalledWith(domainDoctor);
      expect(mockOrmRepo.save).toHaveBeenCalledWith(ormData);
      expect(result).toBe(resultDoctor);
    });
  });
});
