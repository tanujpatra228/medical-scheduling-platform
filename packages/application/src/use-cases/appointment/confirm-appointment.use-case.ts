import { IAppointmentRepository } from "../../ports/repositories/appointment.repository.port";
import { AppointmentResponseDTO } from "../../dtos/appointment.dto";
import { toAppointmentResponseDTO } from "./appointment.mapper";
import { AppointmentNotFoundError } from "./appointment-not-found.error";

export class ConfirmAppointmentUseCase {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async execute(
    clinicId: string,
    appointmentId: string,
  ): Promise<AppointmentResponseDTO> {
    const appointment = await this.appointmentRepo.findById(
      clinicId,
      appointmentId,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(appointmentId);
    }

    appointment.confirm();

    const updated = await this.appointmentRepo.update(appointment);
    return toAppointmentResponseDTO(updated);
  }
}
