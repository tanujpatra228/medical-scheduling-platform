import type { EventHandler } from "../event-bus";
import type { DomainEvent } from "../domain-event";
import type { IJobQueuePort } from "@msp/application";
import { QUEUE_NAMES } from "@msp/infrastructure";

export class AppointmentCancelledHandler implements EventHandler {
  constructor(private readonly jobQueue: IJobQueuePort) {}

  async handle(event: DomainEvent): Promise<void> {
    const payload = event.toPayload();

    await this.jobQueue.enqueue(QUEUE_NAMES.EMAIL_DISPATCH, {
      templateId: "appointment-cancellation",
      appointmentId: payload.appointmentId,
      clinicId: payload.clinicId,
      doctorId: payload.doctorId,
      patientId: payload.patientId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      cancellationReason: payload.cancellationReason,
    });
  }
}
