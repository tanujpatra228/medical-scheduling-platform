import { AppointmentStatus } from "@msp/domain";
import { IAppointmentRepository } from "../../ports/repositories/appointment.repository.port";
import { TimeWindow } from "./availability-expander";

export interface Slot {
  startsAt: Date;
  endsAt: Date;
  isAvailable: boolean;
}

const EXCLUDED_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
]);

const MS_PER_MINUTE = 60_000;

/**
 * Splits available time windows into fixed-duration slots and marks
 * occupied ones based on existing appointments.
 */
export class FreeSlotCalculator {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async calculate(
    clinicId: string,
    doctorId: string,
    windows: TimeWindow[],
    slotDurationMin: number,
  ): Promise<Slot[]> {
    if (windows.length === 0) return [];

    const from = new Date(
      Math.min(...windows.map((w) => w.startsAt.getTime())),
    );
    const to = new Date(Math.max(...windows.map((w) => w.endsAt.getTime())));

    const appointments = await this.appointmentRepo.findByDoctorAndDateRange(
      clinicId,
      doctorId,
      from,
      to,
    );

    const activeAppointments = appointments.filter(
      (a) => !EXCLUDED_STATUSES.has(a.status),
    );

    const slotDurationMs = slotDurationMin * MS_PER_MINUTE;
    const slots: Slot[] = [];

    for (const window of windows) {
      let slotStart = new Date(window.startsAt);

      while (slotStart.getTime() + slotDurationMs <= window.endsAt.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

        const isOccupied = activeAppointments.some((appt) => {
          const apptStart = appt.timeSlot.startsAt.getTime();
          const apptEnd = appt.timeSlot.endsAt.getTime();
          return (
            slotStart.getTime() < apptEnd && slotEnd.getTime() > apptStart
          );
        });

        slots.push({
          startsAt: new Date(slotStart),
          endsAt: new Date(slotEnd),
          isAvailable: !isOccupied,
        });

        slotStart = slotEnd;
      }
    }

    return slots;
  }
}
