import { Appointment } from "@msp/domain";
import { AppointmentResponseDTO } from "../../dtos/appointment.dto";

export function toAppointmentResponseDTO(
  appointment: Appointment,
): AppointmentResponseDTO {
  return {
    id: appointment.id,
    clinicId: appointment.clinicId,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startsAt: appointment.timeSlot.startsAt.toISOString(),
    endsAt: appointment.timeSlot.endsAt.toISOString(),
    status: appointment.status,
    reason: appointment.reason,
    cancellationReason: appointment.cancellationReason,
    cancelledBy: appointment.cancelledBy,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}
