import { IAppointmentRepository } from "../../ports/repositories/appointment.repository.port";
import { IEventPublisherPort } from "../../ports/services";
import {
  CancelAppointmentDTO,
  AppointmentResponseDTO,
} from "../../dtos/appointment.dto";
import { toAppointmentResponseDTO } from "./appointment.mapper";
import { AppointmentNotFoundError } from "./appointment-not-found.error";

export class CancelAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly eventPublisher?: IEventPublisherPort,
  ) {}

  async execute(dto: CancelAppointmentDTO): Promise<AppointmentResponseDTO> {
    const appointment = await this.appointmentRepo.findById(
      dto.clinicId,
      dto.appointmentId,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(dto.appointmentId);
    }

    appointment.cancel(dto.cancelledBy, dto.reason);

    const updated = await this.appointmentRepo.update(appointment);

    if (this.eventPublisher) {
      for (const event of updated.pullDomainEvents()) {
        await this.eventPublisher.publish(event);
      }
    }

    return toAppointmentResponseDTO(updated);
  }
}
