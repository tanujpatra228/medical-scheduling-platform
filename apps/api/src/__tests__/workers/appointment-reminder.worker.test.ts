import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createReminderProcessor,
  type ReminderDeps,
} from "../../workers/appointment-reminder.worker";
import { Appointment, TimeSlot, AppointmentStatus } from "@msp/domain";
import type { Job } from "bullmq";

function createMockJob(data: Record<string, unknown>): Job {
  return { data } as unknown as Job;
}

function createConfirmedAppointment(): Appointment {
  const timeSlot = TimeSlot.create(
    new Date("2025-01-20T10:00:00Z"),
    new Date("2025-01-20T10:30:00Z"),
  );
  const appt = Appointment.create({
    id: "appt-1",
    clinicId: "clinic-1",
    doctorId: "doctor-1",
    patientId: "patient-1",
    timeSlot,
  });
  appt.confirm();
  appt.pullDomainEvents(); // clear events
  return appt;
}

function createCancelledAppointment(): Appointment {
  const appt = createConfirmedAppointment();
  appt.cancel("user-1", "No longer needed");
  appt.pullDomainEvents();
  return appt;
}

describe("createReminderProcessor", () => {
  let deps: ReminderDeps;
  let processor: ReturnType<typeof createReminderProcessor>;

  beforeEach(() => {
    deps = {
      appointmentRepository: {
        findById: vi.fn().mockResolvedValue(createConfirmedAppointment()),
        findByDoctorAndDateRange: vi.fn(),
        findOverlapping: vi.fn(),
        findAll: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
      },
      jobQueue: {
        enqueue: vi.fn().mockResolvedValue(undefined),
        schedule: vi.fn().mockResolvedValue(undefined),
      },
    };
    processor = createReminderProcessor(deps);
  });

  it("should enqueue email-dispatch when appointment is still CONFIRMED", async () => {
    const job = createMockJob({
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt: "2025-01-20T10:00:00.000Z",
      endsAt: "2025-01-20T10:30:00.000Z",
    });

    await processor(job);

    expect(deps.jobQueue.enqueue).toHaveBeenCalledWith(
      "email-dispatch",
      expect.objectContaining({
        templateId: "appointment-reminder-24h",
        appointmentId: "appt-1",
      }),
    );
  });

  it("should skip when appointment is not found", async () => {
    (deps.appointmentRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await processor(
      createMockJob({
        appointmentId: "missing",
        clinicId: "clinic-1",
        doctorId: "doctor-1",
        patientId: "patient-1",
        startsAt: "2025-01-20T10:00:00.000Z",
        endsAt: "2025-01-20T10:30:00.000Z",
      }),
    );

    expect(deps.jobQueue.enqueue).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should skip when appointment is CANCELLED", async () => {
    (deps.appointmentRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      createCancelledAppointment(),
    );
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await processor(
      createMockJob({
        appointmentId: "appt-1",
        clinicId: "clinic-1",
        doctorId: "doctor-1",
        patientId: "patient-1",
        startsAt: "2025-01-20T10:00:00.000Z",
        endsAt: "2025-01-20T10:30:00.000Z",
      }),
    );

    expect(deps.jobQueue.enqueue).not.toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
