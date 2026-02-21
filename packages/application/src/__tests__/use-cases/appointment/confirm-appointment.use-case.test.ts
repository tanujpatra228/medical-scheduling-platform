import { describe, it, expect, vi, beforeEach } from "vitest";
import { Appointment, TimeSlot, AppointmentStatus } from "@msp/domain";
import { ConfirmAppointmentUseCase } from "../../../use-cases/appointment/confirm-appointment.use-case";
import { AppointmentNotFoundError } from "../../../use-cases/appointment/appointment-not-found.error";
import { IAppointmentRepository } from "../../../ports/repositories/appointment.repository.port";

function createPendingAppointment(): Appointment {
  return Appointment.reconstitute({
    id: "appt-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    timeSlot: TimeSlot.create(
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T09:30:00Z"),
    ),
    status: AppointmentStatus.PENDING,
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
    update: vi.fn().mockImplementation((appt) => Promise.resolve(appt)),
    ...overrides,
  };
}

describe("ConfirmAppointmentUseCase", () => {
  let appointmentRepo: IAppointmentRepository;
  let useCase: ConfirmAppointmentUseCase;

  beforeEach(() => {
    appointmentRepo = createMockAppointmentRepo();
    useCase = new ConfirmAppointmentUseCase(appointmentRepo);
  });

  it("should successfully confirm a pending appointment", async () => {
    const appointment = createPendingAppointment();
    appointmentRepo = createMockAppointmentRepo({
      findById: vi.fn().mockResolvedValue(appointment),
    });
    useCase = new ConfirmAppointmentUseCase(appointmentRepo);

    const result = await useCase.execute("clinic-1", "appt-1");

    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(appointmentRepo.update).toHaveBeenCalledTimes(1);
  });

  it("should throw AppointmentNotFoundError for invalid ID", async () => {
    appointmentRepo = createMockAppointmentRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new ConfirmAppointmentUseCase(appointmentRepo);

    await expect(
      useCase.execute("clinic-1", "nonexistent-appt"),
    ).rejects.toThrow(AppointmentNotFoundError);

    expect(appointmentRepo.update).not.toHaveBeenCalled();
  });

  it("should return the updated appointment response", async () => {
    const appointment = createPendingAppointment();
    appointmentRepo = createMockAppointmentRepo({
      findById: vi.fn().mockResolvedValue(appointment),
    });
    useCase = new ConfirmAppointmentUseCase(appointmentRepo);

    const result = await useCase.execute("clinic-1", "appt-1");

    expect(result.id).toBe("appt-1");
    expect(result.clinicId).toBe("clinic-1");
    expect(result.doctorId).toBe("doctor-1");
    expect(result.patientId).toBe("patient-1");
    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(result.startsAt).toBe("2024-01-15T09:00:00.000Z");
    expect(result.endsAt).toBe("2024-01-15T09:30:00.000Z");
    expect(result.reason).toBe("Checkup");
  });
});
