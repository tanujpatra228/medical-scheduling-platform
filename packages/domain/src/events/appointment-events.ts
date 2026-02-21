import { DomainEvent, createEventId } from "./domain-event";

interface AppointmentEventProps {
  appointmentId: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  startsAt: Date;
  endsAt: Date;
}

abstract class BaseAppointmentEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  abstract readonly eventType: string;

  constructor(protected readonly props: AppointmentEventProps) {
    this.eventId = createEventId();
    this.occurredAt = new Date();
    this.aggregateId = props.appointmentId;
  }

  toPayload(): Record<string, unknown> {
    return {
      appointmentId: this.props.appointmentId,
      clinicId: this.props.clinicId,
      doctorId: this.props.doctorId,
      patientId: this.props.patientId,
      startsAt: this.props.startsAt.toISOString(),
      endsAt: this.props.endsAt.toISOString(),
    };
  }
}

export class AppointmentCreatedEvent extends BaseAppointmentEvent {
  readonly eventType = "APPOINTMENT_CREATED";
}

export class AppointmentConfirmedEvent extends BaseAppointmentEvent {
  readonly eventType = "APPOINTMENT_CONFIRMED";
}

export class AppointmentCancelledEvent extends BaseAppointmentEvent {
  readonly eventType = "APPOINTMENT_CANCELLED";

  constructor(
    props: AppointmentEventProps,
    private readonly cancelledBy: string,
    private readonly reason?: string
  ) {
    super(props);
  }

  override toPayload(): Record<string, unknown> {
    return {
      ...super.toPayload(),
      cancelledBy: this.cancelledBy,
      cancellationReason: this.reason,
    };
  }
}

export class AppointmentCompletedEvent extends BaseAppointmentEvent {
  readonly eventType = "APPOINTMENT_COMPLETED";
}

export class AppointmentNoShowEvent extends BaseAppointmentEvent {
  readonly eventType = "APPOINTMENT_NO_SHOW";
}
