import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmUserRepository } from "../../repositories/typeorm-user.repository";
import { UserMapper } from "../../database/mappers";
import { UserEntity, UserRoleEnum } from "../../database/entities";
import { User, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";

vi.mock("../../database/mappers", () => ({
  UserMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

function createMockUserEntity(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: "user-1",
    clinicId: "clinic-1",
    email: "test@example.com",
    passwordHash: "hashed",
    firstName: "John",
    lastName: "Doe",
    role: UserRoleEnum.DOCTOR,
    phone: null,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    clinic: {} as any,
    ...overrides,
  } as UserEntity;
}

function createMockUser(): User {
  return new User({
    id: "user-1",
    clinicId: "clinic-1",
    email: Email.create("test@example.com"),
    passwordHash: "hashed",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.DOCTOR,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmUserRepository", () => {
  let repository: TypeOrmUserRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmUserRepository(mockOrmRepo as any);
  });

  describe("findById", () => {
    it("should return a domain user when entity is found with matching clinicId", async () => {
      const entity = createMockUserEntity();
      const domainUser = createMockUser();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(UserMapper.toDomain).mockReturnValue(domainUser);

      const result = await repository.findById("clinic-1", "user-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: "user-1", clinicId: "clinic-1" },
      });
      expect(UserMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toBe(domainUser);
    });

    it("should return null when entity is not found", async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById("clinic-1", "nonexistent");

      expect(result).toBeNull();
      expect(UserMapper.toDomain).not.toHaveBeenCalled();
    });
  });

  describe("findByEmail", () => {
    it("should scope query by clinicId and email", async () => {
      const entity = createMockUserEntity();
      const domainUser = createMockUser();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(UserMapper.toDomain).mockReturnValue(domainUser);

      const result = await repository.findByEmail("clinic-1", "test@example.com");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com", clinicId: "clinic-1" },
      });
      expect(result).toBe(domainUser);
    });
  });

  describe("save", () => {
    it("should map domain to ORM, persist, and return the mapped domain entity", async () => {
      const domainUser = createMockUser();
      const ormData = { id: "user-1", email: "test@example.com" };
      const savedEntity = createMockUserEntity();
      const resultUser = createMockUser();

      vi.mocked(UserMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(UserMapper.toDomain).mockReturnValue(resultUser);

      const result = await repository.save(domainUser);

      expect(UserMapper.toOrm).toHaveBeenCalledWith(domainUser);
      expect(mockOrmRepo.save).toHaveBeenCalledWith(ormData);
      expect(UserMapper.toDomain).toHaveBeenCalledWith(savedEntity);
      expect(result).toBe(resultUser);
    });
  });
});
