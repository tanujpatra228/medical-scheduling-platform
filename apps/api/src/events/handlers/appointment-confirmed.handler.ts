import type { EventHandler } from "../event-bus";
import type { DomainEvent } from "../domain-event";
import type { IJobQueuePort } from "@msp/application";
import { QUEUE_NAMES } from "@msp/infrastructure";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export class AppointmentConfirmedHandler implements EventHandler {
  constructor(private readonly jobQueue: IJobQueuePort) {}

  async handle(event: DomainEvent): Promise<void> {
    const payload = event.toPayload();

    await this.jobQueue.enqueue(QUEUE_NAMES.EMAIL_DISPATCH, {
      templateId: "appointment-confirmation",
      appointmentId: payload.appointmentId,
      clinicId: payload.clinicId,
      doctorId: payload.doctorId,
      patientId: payload.patientId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    });

    const startsAt = new Date(payload.startsAt as string);
    const msUntilAppointment = startsAt.getTime() - Date.now();
    const reminderDelay = msUntilAppointment - TWENTY_FOUR_HOURS_MS;

    if (reminderDelay > 0) {
      await this.jobQueue.schedule(
        QUEUE_NAMES.APPOINTMENT_REMINDERS,
        {
          appointmentId: payload.appointmentId,
          clinicId: payload.clinicId,
          doctorId: payload.doctorId,
          patientId: payload.patientId,
          startsAt: payload.startsAt,
          endsAt: payload.endsAt,
        },
        reminderDelay,
      );
    }
  }
}
