import type { Job } from "bullmq";
import { AppointmentStatus } from "@msp/domain";
import type { IAppointmentRepository, IJobQueuePort } from "@msp/application";
import { QUEUE_NAMES } from "@msp/infrastructure";

export interface ReminderDeps {
  appointmentRepository: IAppointmentRepository;
  jobQueue: IJobQueuePort;
}

export function createReminderProcessor(deps: ReminderDeps) {
  return async (job: Job): Promise<void> => {
    const { appointmentId, clinicId, doctorId, patientId, startsAt, endsAt } =
      job.data;

    const appointment = await deps.appointmentRepository.findById(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      console.warn(
        `[Reminder] Appointment ${appointmentId} not found, skipping reminder`,
      );
      return;
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      console.info(
        `[Reminder] Appointment ${appointmentId} is ${appointment.status}, skipping reminder`,
      );
      return;
    }

    await deps.jobQueue.enqueue(QUEUE_NAMES.EMAIL_DISPATCH, {
      templateId: "appointment-reminder-24h",
      appointmentId,
      clinicId,
      doctorId,
      patientId,
      startsAt,
      endsAt,
    });
  };
}
