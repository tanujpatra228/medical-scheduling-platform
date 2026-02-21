import { describe, it, expect, vi, beforeEach } from "vitest";
import { Appointment, TimeSlot, AppointmentStatus } from "@msp/domain";
import { ListAppointmentsUseCase } from "../../../use-cases/appointment/list-appointments.use-case";
import { IAppointmentRepository } from "../../../ports/repositories/appointment.repository.port";

function createMockAppointment(id: string, status: AppointmentStatus): Appointment {
  return Appointment.reconstitute({
    id,
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    timeSlot: TimeSlot.create(
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T09:30:00Z"),
    ),
    status,
    reason: "Checkup",
    createdAt: new Date("2024-01-10T00:00:00Z"),
    updatedAt: new Date("2024-01-10T00:00:00Z"),
  });
}

function createMockAppointmentRepo(
  overrides: Partial<IAppointmentRepository> = {},
): IAppointmentRepository {
  return {
    findById: vi.fn(),
    findByDoctorAndDateRange: vi.fn(),
    findOverlapping: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    ...overrides,
  };
}

describe("ListAppointmentsUseCase", () => {
  let appointmentRepo: IAppointmentRepository;
  let useCase: ListAppointmentsUseCase;

  beforeEach(() => {
    appointmentRepo = createMockAppointmentRepo();
    useCase = new ListAppointmentsUseCase(appointmentRepo);
  });

  it("should return paginated results", async () => {
    const appt1 = createMockAppointment("appt-1", AppointmentStatus.PENDING);
    const appt2 = createMockAppointment("appt-2", AppointmentStatus.CONFIRMED);

    appointmentRepo = createMockAppointmentRepo({
      findAll: vi.fn().mockResolvedValue({
        data: [appt1, appt2],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    });
    useCase = new ListAppointmentsUseCase(appointmentRepo);

    const result = await useCase.execute(
      "clinic-1",
      { doctorId: "doctor-1" },
      { page: 1, limit: 10 },
    );

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it("should map appointments to response DTOs", async () => {
    const appt = createMockAppointment("appt-1", AppointmentStatus.PENDING);

    appointmentRepo = createMockAppointmentRepo({
      findAll: vi.fn().mockResolvedValue({
        data: [appt],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    });
    useCase = new ListAppointmentsUseCase(appointmentRepo);

    const result = await useCase.execute(
      "clinic-1",
      {},
      { page: 1, limit: 10 },
    );

    const dto = result.data[0];
    expect(dto.id).toBe("appt-1");
    expect(dto.clinicId).toBe("clinic-1");
    expect(dto.doctorId).toBe("doctor-1");
    expect(dto.patientId).toBe("patient-1");
    expect(dto.startsAt).toBe("2024-01-15T09:00:00.000Z");
    expect(dto.endsAt).toBe("2024-01-15T09:30:00.000Z");
    expect(dto.status).toBe(AppointmentStatus.PENDING);
    expect(dto.reason).toBe("Checkup");
    expect(dto.createdAt).toBe("2024-01-10T00:00:00.000Z");
    expect(dto.updatedAt).toBe("2024-01-10T00:00:00.000Z");
  });
});
