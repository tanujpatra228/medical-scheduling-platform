import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppointmentCreatedHandler } from "../../../events/handlers/appointment-created.handler";
import type { IJobQueuePort } from "@msp/application";

function createMockEvent(overrides = {}) {
  return {
    eventId: "evt-1",
    eventType: "APPOINTMENT_CREATED",
    occurredAt: new Date(),
    aggregateId: "appt-1",
    toPayload: () => ({
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt: "2025-01-20T10:00:00.000Z",
      endsAt: "2025-01-20T10:30:00.000Z",
      ...overrides,
    }),
  };
}

describe("AppointmentCreatedHandler", () => {
  let jobQueue: IJobQueuePort;
  let handler: AppointmentCreatedHandler;

  beforeEach(() => {
    jobQueue = {
      enqueue: vi.fn().mockResolvedValue(undefined),
      schedule: vi.fn().mockResolvedValue(undefined),
    };
    handler = new AppointmentCreatedHandler(jobQueue);
  });

  it("should enqueue an email-dispatch job with appointment-confirmation template", async () => {
    const event = createMockEvent();
    await handler.handle(event);

    expect(jobQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(jobQueue.enqueue).toHaveBeenCalledWith("email-dispatch", {
      templateId: "appointment-confirmation",
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt: "2025-01-20T10:00:00.000Z",
      endsAt: "2025-01-20T10:30:00.000Z",
    });
  });

  it("should not schedule a reminder job", async () => {
    await handler.handle(createMockEvent());
    expect(jobQueue.schedule).not.toHaveBeenCalled();
  });
});
