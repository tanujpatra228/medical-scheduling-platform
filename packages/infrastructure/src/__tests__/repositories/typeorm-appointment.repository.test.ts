import { describe, it, expect, vi, beforeEach } from "vitest";
import { TypeOrmAppointmentRepository } from "../../repositories/typeorm-appointment.repository";
import { AppointmentMapper } from "../../database/mappers";
import { AppointmentEntity, AppointmentStatusEnum } from "../../database/entities";
import { Appointment, AppointmentStatus, TimeSlot } from "@msp/domain";

vi.mock("../../database/mappers", () => ({
  AppointmentMapper: {
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
  getMany: vi.fn(),
  getManyAndCount: vi.fn(),
};

function createMockAppointmentEntity(
  overrides: Partial<AppointmentEntity> = {},
): AppointmentEntity {
  return {
    id: "apt-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    startsAt: new Date("2025-06-01T09:00:00Z"),
    endsAt: new Date("2025-06-01T09:30:00Z"),
    status: AppointmentStatusEnum.PENDING,
    reason: null,
    cancellationReason: null,
    cancelledBy: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    clinic: {} as any,
    doctor: {} as any,
    patient: {} as any,
    cancelledByUser: null,
    ...overrides,
  } as AppointmentEntity;
}

function createMockAppointment(): Appointment {
  const timeSlot = TimeSlot.create(
    new Date("2025-06-01T09:00:00Z"),
    new Date("2025-06-01T09:30:00Z"),
  );
  return Appointment.reconstitute({
    id: "apt-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    timeSlot,
    status: AppointmentStatus.PENDING,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("TypeOrmAppointmentRepository", () => {
  let repository: TypeOrmAppointmentRepository;
  const mockOrmRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrmRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();

    repository = new TypeOrmAppointmentRepository(mockOrmRepo as any);
  });

  describe("findById", () => {
    it("should scope query by clinicId and id", async () => {
      const entity = createMockAppointmentEntity();
      const domainAppointment = createMockAppointment();
      mockOrmRepo.findOne.mockResolvedValue(entity);
      vi.mocked(AppointmentMapper.toDomain).mockReturnValue(domainAppointment);

      const result = await repository.findById("clinic-1", "apt-1");

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: "apt-1", clinicId: "clinic-1" },
      });
      expect(result).toBe(domainAppointment);
    });

    it("should return null when not found", async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById("clinic-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findOverlapping", () => {
    it("should build query with overlap conditions and exclude cancelled", async () => {
      const entity = createMockAppointmentEntity();
      const domainAppointment = createMockAppointment();
      mockQueryBuilder.getMany.mockResolvedValue([entity]);
      vi.mocked(AppointmentMapper.toDomain).mockReturnValue(domainAppointment);

      const startsAt = new Date("2025-06-01T09:00:00Z");
      const endsAt = new Date("2025-06-01T09:30:00Z");

      const result = await repository.findOverlapping(
        "clinic-1",
        "doctor-1",
        startsAt,
        endsAt,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "appointment.clinicId = :clinicId",
        { clinicId: "clinic-1" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.doctorId = :doctorId",
        { doctorId: "doctor-1" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.startsAt < :endsAt",
        { endsAt },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.endsAt > :startsAt",
        { startsAt },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.status NOT IN (:...excludedStatuses)",
        { excludedStatuses: ["CANCELLED"] },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("findAll", () => {
    it("should apply filters and return paginated result", async () => {
      const entity = createMockAppointmentEntity();
      const domainAppointment = createMockAppointment();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[entity], 1]);
      vi.mocked(AppointmentMapper.toDomain).mockReturnValue(domainAppointment);

      const fromDate = new Date("2025-06-01");
      const result = await repository.findAll(
        "clinic-1",
        { status: "PENDING", doctorId: "doctor-1", fromDate },
        { page: 1, limit: 10 },
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "appointment.clinicId = :clinicId",
        { clinicId: "clinic-1" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.status = :status",
        { status: "PENDING" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.doctorId = :doctorId",
        { doctorId: "doctor-1" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.startsAt >= :fromDate",
        { fromDate },
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should not apply optional filters when not provided", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findAll(
        "clinic-1",
        {},
        { page: 1, limit: 10 },
      );

      // Only the clinicId where clause should be called
      expect(mockQueryBuilder.where).toHaveBeenCalledTimes(1);
      // andWhere should not have been called for any filters
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("save", () => {
    it("should map, persist, and return domain entity", async () => {
      const domainAppointment = createMockAppointment();
      const ormData = { id: "apt-1" };
      const savedEntity = createMockAppointmentEntity();
      const resultAppointment = createMockAppointment();

      vi.mocked(AppointmentMapper.toOrm).mockReturnValue(ormData as any);
      mockOrmRepo.save.mockResolvedValue(savedEntity);
      vi.mocked(AppointmentMapper.toDomain).mockReturnValue(resultAppointment);

      const result = await repository.save(domainAppointment);

      expect(AppointmentMapper.toOrm).toHaveBeenCalledWith(domainAppointment);
      expect(mockOrmRepo.save).toHaveBeenCalledWith(ormData);
      expect(result).toBe(resultAppointment);
    });
  });
});
