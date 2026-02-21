import { IAppointmentRepository } from "../../ports/repositories/appointment.repository.port";
import { AppointmentResponseDTO } from "../../dtos/appointment.dto";
import { toAppointmentResponseDTO } from "./appointment.mapper";

export class GetAppointmentUseCase {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async execute(
    clinicId: string,
    appointmentId: string,
  ): Promise<AppointmentResponseDTO | null> {
    const appointment = await this.appointmentRepo.findById(
      clinicId,
      appointmentId,
    );
    if (!appointment) {
      return null;
    }

    return toAppointmentResponseDTO(appointment);
  }
}
