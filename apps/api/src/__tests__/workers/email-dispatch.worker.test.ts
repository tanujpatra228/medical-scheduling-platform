import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEmailDispatchProcessor,
  type EmailDispatchDeps,
} from "../../workers/email-dispatch.worker";
import type { Job } from "bullmq";

function createMockJob(data: Record<string, unknown>): Job {
  return { data } as unknown as Job;
}

function createMockUser(overrides = {}) {
  return {
    id: "user-1",
    clinicId: "clinic-1",
    email: { toString: () => "patient@example.com" },
    fullName: "John Doe",
    firstName: "John",
    lastName: "Doe",
    ...overrides,
  };
}

function createMockDoctor(overrides = {}) {
  return { id: "doctor-1", userId: "doc-user-1", clinicId: "clinic-1", ...overrides };
}

function createMockPatient(overrides = {}) {
  return { id: "patient-1", userId: "user-1", clinicId: "clinic-1", ...overrides };
}

function createMockClinic(overrides = {}) {
  return { id: "clinic-1", name: "HealthFirst Clinic", ...overrides };
}

describe("createEmailDispatchProcessor", () => {
  let deps: EmailDispatchDeps;
  let processor: ReturnType<typeof createEmailDispatchProcessor>;

  beforeEach(() => {
    deps = {
      emailPort: { send: vi.fn().mockResolvedValue(undefined) },
      userRepository: {
        findById: vi.fn().mockResolvedValue(createMockUser()),
        findByEmail: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
      },
      patientRepository: {
        findById: vi.fn().mockResolvedValue(createMockPatient()),
        findByUserId: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
      } as any,
      doctorRepository: {
        findById: vi.fn().mockResolvedValue(createMockDoctor()),
        findAll: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
      } as any,
      clinicRepository: {
        findById: vi.fn().mockResolvedValue(createMockClinic()),
        findBySlug: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
      } as any,
    };
    processor = createEmailDispatchProcessor(deps);
  });

  it("should send email with resolved patient/doctor/clinic names", async () => {
    const job = createMockJob({
      templateId: "appointment-confirmation",
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt: "2025-01-20T10:00:00.000Z",
      endsAt: "2025-01-20T10:30:00.000Z",
    });

    (deps.userRepository.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createMockUser()) // patient user
      .mockResolvedValueOnce(
        createMockUser({
          id: "doc-user-1",
          fullName: "Dr. Jane Smith",
          email: { toString: () => "dr.smith@example.com" },
        }),
      ); // doctor user

    await processor(job);

    expect(deps.emailPort.send).toHaveBeenCalledTimes(1);
    expect(deps.emailPort.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "patient@example.com",
        templateId: "appointment-confirmation",
        variables: expect.objectContaining({
          patientName: "John Doe",
          doctorName: "Dr. Jane Smith",
          clinicName: "HealthFirst Clinic",
        }),
      }),
    );
  });

  it("should skip when patient not found", async () => {
    (deps.patientRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await processor(
      createMockJob({
        templateId: "appointment-confirmation",
        appointmentId: "appt-1",
        clinicId: "clinic-1",
        doctorId: "doctor-1",
        patientId: "missing",
        startsAt: "2025-01-20T10:00:00.000Z",
      }),
    );

    expect(deps.emailPort.send).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should skip when doctor not found", async () => {
    (deps.doctorRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await processor(
      createMockJob({
        templateId: "appointment-confirmation",
        appointmentId: "appt-1",
        clinicId: "clinic-1",
        doctorId: "missing",
        patientId: "patient-1",
        startsAt: "2025-01-20T10:00:00.000Z",
      }),
    );

    expect(deps.emailPort.send).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should skip when clinic not found", async () => {
    (deps.clinicRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await processor(
      createMockJob({
        templateId: "appointment-confirmation",
        appointmentId: "appt-1",
        clinicId: "missing",
        doctorId: "doctor-1",
        patientId: "patient-1",
        startsAt: "2025-01-20T10:00:00.000Z",
      }),
    );

    expect(deps.emailPort.send).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should include cancellation reason when present", async () => {
    (deps.userRepository.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createMockUser())
      .mockResolvedValueOnce(createMockUser({ id: "doc-user-1", fullName: "Dr. Smith" }));

    await processor(
      createMockJob({
        templateId: "appointment-cancellation",
        appointmentId: "appt-1",
        clinicId: "clinic-1",
        doctorId: "doctor-1",
        patientId: "patient-1",
        startsAt: "2025-01-20T10:00:00.000Z",
        cancellationReason: "Doctor unavailable",
      }),
    );

    expect(deps.emailPort.send).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ reason: "Doctor unavailable" }),
      }),
    );
  });
});
