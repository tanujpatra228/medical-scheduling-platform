import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmAuditLogRepository } from "../../repositories/typeorm-audit-log.repository";
import { AuditLogMapper } from "../../database/mappers";
import { AuditLogEntity } from "../../database/entities";
import { AuditLog } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  AuditLogMapper: {
    toDomain: vi.fn(),
    toOrm: vi.fn(),
  },
}));

function createMockAuditLogEntity(
  overrides: Partial<AuditLogEntity> = {},
): AuditLogEntity {
  return {
    id: "log-1",
    clinicId: "clinic-1",
    appointmentId: "apt-1",
    actorId: "user-1",
    action: "CONFIRM",
    fromStatus: "PENDING",
    toStatus: "CONFIRMED",
    metadata: null,
    createdAt: new Date("2025-01-01"),
    clinic: {} as any,
    appointment: {} as any,
    actor: {} as any,
    ...overrides,
  } as AuditLogEntity;
}

function createMockAuditLog(): AuditLog {
  return new AuditLog({
    id: "log-1",
    clinicId: "clinic-1",
    appointmentId: "apt-1",
    actorId: "user-1",
    action: "CONFIRM",
    fromStatus: "PENDING",
    toStatus: "CONFIRMED",
    createdAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmAuditLogRepository", () => {
  let repository: TypeOrmAuditLogRepository;
  const mockOrmRepo = {
    find: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TypeOrmAuditLogRepository(mockOrmRepo as any);
  });

  describe("findByAppointmentId", () => {
    it("should scope query by clinicId and appointmentId", async () => {
      const entity = createMockAuditLogEntity();
      const domainLog = createMockAuditLog();
      mockOrmRepo.find.mockResolvedValue([entity]);
      vi.mocked(AuditLogMapper.toDomain).mockReturnValue(domainLog);

      const result = await repository.findByAppointmentId("clinic-1", "apt-1");

      expect(mockOrmRepo.find).toHaveBeenCalledWith({
        where: { clinicId: "clinic-1", appointmentId: "apt-1" },
        order: { createdAt: "ASC" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(domainLog);
    });

    it("should return empty array when no logs found", async () => {
      mockOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findByAppointmentId("clinic-1", "apt-999");

      expect(result).toHaveLength(0);
    });
  });

  describe("save", () => {
    it("should map, persist, and return domain entity", async () => {
      const domainLog = createMockAuditLog();
      const ormData = { id: "log-1" };
      const savedEntity = createMockAuditLogEntity();
      const resultLog = createMockAuditLog();

      vi.mocked(AuditLogMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(AuditLogMapper.toDomain).mockReturnValue(resultLog);

      const result = await repository.save(domainLog);

      expect(AuditLogMapper.toOrm).toHaveBeenCalledWith(domainLog);
      expect(mockOrmRepo.save).toHaveBeenCalledWith(ormData);
      expect(result).toBe(resultLog);
    });
  });
});
