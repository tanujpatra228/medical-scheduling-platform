import { IAppointmentRepository } from "../../ports/repositories/appointment.repository.port";
import { IEventPublisherPort } from "../../ports/services";
import { AppointmentResponseDTO } from "../../dtos/appointment.dto";
import { toAppointmentResponseDTO } from "./appointment.mapper";
import { AppointmentNotFoundError } from "./appointment-not-found.error";

export class CompleteAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly eventPublisher?: IEventPublisherPort,
  ) {}

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

    appointment.complete();

    const updated = await this.appointmentRepo.update(appointment);

    if (this.eventPublisher) {
      for (const event of updated.pullDomainEvents()) {
        await this.eventPublisher.publish(event);
      }
    }

    return toAppointmentResponseDTO(updated);
  }
}
