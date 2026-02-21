import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmClinicRepository } from "../../repositories/typeorm-clinic.repository";
import { ClinicMapper } from "../../database/mappers";
import { ClinicEntity } from "../../database/entities";
import { Clinic, Email } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  ClinicMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

function createMockClinicEntity(overrides: Partial<ClinicEntity> = {}): ClinicEntity {
  return {
    id: "clinic-1",
    name: "Test Clinic",
    slug: "test-clinic",
    address: "123 Main St",
    phone: "+1234567890",
    email: "clinic@example.com",
    timezone: "Europe/Berlin",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    users: [],
    ...overrides,
  } as ClinicEntity;
}

function createMockClinic(): Clinic {
  return new Clinic({
    id: "clinic-1",
    name: "Test Clinic",
    slug: "test-clinic",
    address: "123 Main St",
    phone: "+1234567890",
    email: Email.create("clinic@example.com"),
    timezone: "Europe/Berlin",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmClinicRepository", () => {
  let repository: TypeOrmClinicRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmClinicRepository(mockOrmRepo as any);
  });

  describe("findById", () => {
    it("should return a domain clinic when entity is found", async () => {
      const entity = createMockClinicEntity();
      const domainClinic = createMockClinic();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(ClinicMapper.toDomain).mockReturnValue(domainClinic);

      const result = await repository.findById("clinic-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: "clinic-1" },
      });
      expect(result).toBe(domainClinic);
    });

    it("should return null when entity is not found", async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findBySlug", () => {
    it("should query by slug and return domain entity", async () => {
      const entity = createMockClinicEntity();
      const domainClinic = createMockClinic();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(ClinicMapper.toDomain).mockReturnValue(domainClinic);

      const result = await repository.findBySlug("test-clinic");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { slug: "test-clinic" },
      });
      expect(result).toBe(domainClinic);
    });
  });

  describe("save", () => {
    it("should map domain to ORM, persist, and return mapped domain entity", async () => {
      const domainClinic = createMockClinic();
      const ormData = { id: "clinic-1", name: "Test Clinic" };
      const savedEntity = createMockClinicEntity();
      const resultClinic = createMockClinic();

      vi.mocked(ClinicMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(ClinicMapper.toDomain).mockReturnValue(resultClinic);

      const result = await repository.save(domainClinic);

      expect(ClinicMapper.toOrm).toHaveBeenCalledWith(domainClinic);
      expect(mockOrmRepo.save).toHaveBeenCalledWith(ormData);
      expect(result).toBe(resultClinic);
    });
  });
});
