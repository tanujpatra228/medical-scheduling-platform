import { describe, it, expect, vi, beforeEach } from "vitest";
import { Appointment, TimeSlot, AppointmentStatus } from "@msp/domain";
import { CancelAppointmentUseCase } from "../../../use-cases/appointment/cancel-appointment.use-case";
import { AppointmentNotFoundError } from "../../../use-cases/appointment/appointment-not-found.error";
import { IAppointmentRepository } from "../../../ports/repositories/appointment.repository.port";
import { CancelAppointmentDTO } from "../../../dtos/appointment.dto";

function createConfirmedAppointment(): Appointment {
  return Appointment.reconstitute({
    id: "appt-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    timeSlot: TimeSlot.create(
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T09:30:00Z"),
    ),
    status: AppointmentStatus.CONFIRMED,
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

describe("CancelAppointmentUseCase", () => {
  let appointmentRepo: IAppointmentRepository;
  let useCase: CancelAppointmentUseCase;

  beforeEach(() => {
    appointmentRepo = createMockAppointmentRepo();
    useCase = new CancelAppointmentUseCase(appointmentRepo);
  });

  it("should successfully cancel an appointment with reason", async () => {
    const appointment = createConfirmedAppointment();
    appointmentRepo = createMockAppointmentRepo({
      findById: vi.fn().mockResolvedValue(appointment),
    });
    useCase = new CancelAppointmentUseCase(appointmentRepo);

    const dto: CancelAppointmentDTO = {
      clinicId: "clinic-1",
      appointmentId: "appt-1",
      cancelledBy: "user-1",
      reason: "Patient requested cancellation",
    };

    const result = await useCase.execute(dto);

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(appointmentRepo.update).toHaveBeenCalledTimes(1);
  });

  it("should throw AppointmentNotFoundError for invalid ID", async () => {
    appointmentRepo = createMockAppointmentRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new CancelAppointmentUseCase(appointmentRepo);

    const dto: CancelAppointmentDTO = {
      clinicId: "clinic-1",
      appointmentId: "nonexistent-appt",
      cancelledBy: "user-1",
      reason: "No reason",
    };

    await expect(useCase.execute(dto)).rejects.toThrow(AppointmentNotFoundError);
    expect(appointmentRepo.update).not.toHaveBeenCalled();
  });

  it("should set cancelledBy and cancellationReason on the response", async () => {
    const appointment = createConfirmedAppointment();
    appointmentRepo = createMockAppointmentRepo({
      findById: vi.fn().mockResolvedValue(appointment),
    });
    useCase = new CancelAppointmentUseCase(appointmentRepo);

    const dto: CancelAppointmentDTO = {
      clinicId: "clinic-1",
      appointmentId: "appt-1",
      cancelledBy: "user-1",
      reason: "Patient requested cancellation",
    };

    const result = await useCase.execute(dto);

    expect(result.cancelledBy).toBe("user-1");
    expect(result.cancellationReason).toBe("Patient requested cancellation");
  });
});
