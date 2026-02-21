import { describe, it, expect, vi, beforeEach } from "vitest";
import { Appointment, TimeSlot, AppointmentStatus } from "@msp/domain";
import { CreateAppointmentUseCase, SlotAlreadyBookedError, DoctorNotFoundForBookingError, PatientNotFoundForBookingError } from "../../../use-cases/appointment/create-appointment.use-case";
import { IAppointmentRepository } from "../../../ports/repositories/appointment.repository.port";
import { IDoctorRepository } from "../../../ports/repositories/doctor.repository.port";
import { IPatientRepository } from "../../../ports/repositories/patient.repository.port";
import { BookAppointmentDTO } from "../../../dtos/appointment.dto";

function createMockAppointmentRepo(
  overrides: Partial<IAppointmentRepository> = {},
): IAppointmentRepository {
  return {
    findById: vi.fn(),
    findByDoctorAndDateRange: vi.fn(),
    findOverlapping: vi.fn().mockResolvedValue([]),
    findAll: vi.fn(),
    save: vi.fn().mockImplementation((appt) => Promise.resolve(appt)),
    update: vi.fn(),
    ...overrides,
  };
}

function createMockDoctorRepo(
  overrides: Partial<IDoctorRepository> = {},
): IDoctorRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: "doctor-1" }),
    findByUserId: vi.fn(),
    findByClinicId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    ...overrides,
  };
}

function createMockPatientRepo(
  overrides: Partial<IPatientRepository> = {},
): IPatientRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: "patient-1" }),
    findByUserId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    ...overrides,
  };
}

function createDto(overrides: Partial<BookAppointmentDTO> = {}): BookAppointmentDTO {
  return {
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    startsAt: new Date("2024-01-15T09:00:00Z"),
    endsAt: new Date("2024-01-15T09:30:00Z"),
    reason: "Checkup",
    ...overrides,
  };
}

describe("CreateAppointmentUseCase", () => {
  let appointmentRepo: IAppointmentRepository;
  let doctorRepo: IDoctorRepository;
  let patientRepo: IPatientRepository;
  let useCase: CreateAppointmentUseCase;

  beforeEach(() => {
    appointmentRepo = createMockAppointmentRepo();
    doctorRepo = createMockDoctorRepo();
    patientRepo = createMockPatientRepo();
    useCase = new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo);
  });

  it("should successfully create an appointment and return DTO", async () => {
    const dto = createDto();

    const result = await useCase.execute(dto);

    expect(result.clinicId).toBe("clinic-1");
    expect(result.doctorId).toBe("doctor-1");
    expect(result.patientId).toBe("patient-1");
    expect(result.startsAt).toBe("2024-01-15T09:00:00.000Z");
    expect(result.endsAt).toBe("2024-01-15T09:30:00.000Z");
    expect(result.status).toBe(AppointmentStatus.PENDING);
    expect(result.reason).toBe("Checkup");
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it("should throw SlotAlreadyBookedError when overlapping appointment exists", async () => {
    const existingAppointment = Appointment.reconstitute({
      id: "existing-appt",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-2",
      timeSlot: TimeSlot.create(
        new Date("2024-01-15T09:00:00Z"),
        new Date("2024-01-15T09:30:00Z"),
      ),
      status: AppointmentStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    appointmentRepo = createMockAppointmentRepo({
      findOverlapping: vi.fn().mockResolvedValue([existingAppointment]),
    });
    useCase = new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo);

    const dto = createDto();

    await expect(useCase.execute(dto)).rejects.toThrow(SlotAlreadyBookedError);
    expect(appointmentRepo.save).not.toHaveBeenCalled();
  });

  it("should throw DoctorNotFoundForBookingError for invalid doctor", async () => {
    doctorRepo = createMockDoctorRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo);

    const dto = createDto({ doctorId: "nonexistent-doctor" });

    await expect(useCase.execute(dto)).rejects.toThrow(DoctorNotFoundForBookingError);
    expect(appointmentRepo.save).not.toHaveBeenCalled();
  });

  it("should throw PatientNotFoundForBookingError for invalid patient", async () => {
    patientRepo = createMockPatientRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo);

    const dto = createDto({ patientId: "nonexistent-patient" });

    await expect(useCase.execute(dto)).rejects.toThrow(PatientNotFoundForBookingError);
    expect(appointmentRepo.save).not.toHaveBeenCalled();
  });

  it("should call appointmentRepo.save with correct data", async () => {
    const dto = createDto();

    await useCase.execute(dto);

    expect(appointmentRepo.save).toHaveBeenCalledTimes(1);
    const savedAppointment = (appointmentRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as Appointment;
    expect(savedAppointment.clinicId).toBe("clinic-1");
    expect(savedAppointment.doctorId).toBe("doctor-1");
    expect(savedAppointment.patientId).toBe("patient-1");
    expect(savedAppointment.timeSlot.startsAt).toEqual(new Date("2024-01-15T09:00:00Z"));
    expect(savedAppointment.timeSlot.endsAt).toEqual(new Date("2024-01-15T09:30:00Z"));
    expect(savedAppointment.status).toBe(AppointmentStatus.PENDING);
    expect(savedAppointment.reason).toBe("Checkup");
  });
});
