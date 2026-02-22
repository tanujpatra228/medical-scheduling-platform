import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppointmentCancelledHandler } from "../../../events/handlers/appointment-cancelled.handler";
import type { IJobQueuePort } from "@msp/application";

function createMockEvent(cancellationReason?: string) {
  return {
    eventId: "evt-1",
    eventType: "APPOINTMENT_CANCELLED",
    occurredAt: new Date(),
    aggregateId: "appt-1",
    toPayload: () => ({
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt: "2025-01-20T10:00:00.000Z",
      endsAt: "2025-01-20T10:30:00.000Z",
      cancelledBy: "user-1",
      cancellationReason,
    }),
  };
}

describe("AppointmentCancelledHandler", () => {
  let jobQueue: IJobQueuePort;
  let handler: AppointmentCancelledHandler;

  beforeEach(() => {
    jobQueue = {
      enqueue: vi.fn().mockResolvedValue(undefined),
      schedule: vi.fn().mockResolvedValue(undefined),
    };
    handler = new AppointmentCancelledHandler(jobQueue);
  });

  it("should enqueue an email-dispatch job with appointment-cancellation template", async () => {
    await handler.handle(createMockEvent("Doctor unavailable"));

    expect(jobQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(jobQueue.enqueue).toHaveBeenCalledWith("email-dispatch", {
      templateId: "appointment-cancellation",
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt: "2025-01-20T10:00:00.000Z",
      endsAt: "2025-01-20T10:30:00.000Z",
      cancellationReason: "Doctor unavailable",
    });
  });

  it("should include undefined cancellationReason when no reason provided", async () => {
    await handler.handle(createMockEvent());

    expect(jobQueue.enqueue).toHaveBeenCalledWith(
      "email-dispatch",
      expect.objectContaining({ cancellationReason: undefined }),
    );
  });
});
