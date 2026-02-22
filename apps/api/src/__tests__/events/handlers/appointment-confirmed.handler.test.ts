import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppointmentConfirmedHandler } from "../../../events/handlers/appointment-confirmed.handler";
import type { IJobQueuePort } from "@msp/application";

function createMockEvent(startsAt: string) {
  return {
    eventId: "evt-1",
    eventType: "APPOINTMENT_CONFIRMED",
    occurredAt: new Date(),
    aggregateId: "appt-1",
    toPayload: () => ({
      appointmentId: "appt-1",
      clinicId: "clinic-1",
      doctorId: "doctor-1",
      patientId: "patient-1",
      startsAt,
      endsAt: "2025-06-20T10:30:00.000Z",
    }),
  };
}

describe("AppointmentConfirmedHandler", () => {
  let jobQueue: IJobQueuePort;
  let handler: AppointmentConfirmedHandler;

  beforeEach(() => {
    jobQueue = {
      enqueue: vi.fn().mockResolvedValue(undefined),
      schedule: vi.fn().mockResolvedValue(undefined),
    };
    handler = new AppointmentConfirmedHandler(jobQueue);
  });

  it("should enqueue an email-dispatch job with appointment-confirmation template", async () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await handler.handle(createMockEvent(futureDate));

    expect(jobQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(jobQueue.enqueue).toHaveBeenCalledWith(
      "email-dispatch",
      expect.objectContaining({
        templateId: "appointment-confirmation",
        appointmentId: "appt-1",
      }),
    );
  });

  it("should schedule a reminder when appointment is more than 24h away", async () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await handler.handle(createMockEvent(futureDate));

    expect(jobQueue.schedule).toHaveBeenCalledTimes(1);
    expect(jobQueue.schedule).toHaveBeenCalledWith(
      "appointment-reminders",
      expect.objectContaining({ appointmentId: "appt-1" }),
      expect.any(Number),
    );

    const scheduledDelay = (jobQueue.schedule as ReturnType<typeof vi.fn>).mock.calls[0][2];
    expect(scheduledDelay).toBeGreaterThan(0);
  });

  it("should NOT schedule a reminder when appointment is less than 24h away", async () => {
    const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    await handler.handle(createMockEvent(soonDate));

    expect(jobQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(jobQueue.schedule).not.toHaveBeenCalled();
  });
});
