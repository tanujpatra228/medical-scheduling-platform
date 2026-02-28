import { AppointmentStatus } from "../value-objects/appointment-status";
import { TimeSlot } from "../value-objects/time-slot";
import { AppointmentStateMachine } from "../state-machine/appointment-state-machine";
import { DomainEvent } from "../events/domain-event";
import {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentNoShowEvent,
} from "../events/appointment-events";

export interface AppointmentProps {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  reason?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;
  patientName?: string;
  doctorName?: string;
}

export class Appointment {
  private domainEvents: DomainEvent[] = [];

  readonly id: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly patientId: string;
  readonly timeSlot: TimeSlot;
  private _status: AppointmentStatus;
  readonly reason?: string;
  private _cancellationReason?: string;
  private _cancelledBy?: string;
  readonly createdAt: Date;
  private _updatedAt: Date;
  readonly patientName?: string;
  readonly doctorName?: string;

  private constructor(props: AppointmentProps) {
    this.id = props.id;
    this.clinicId = props.clinicId;
    this.doctorId = props.doctorId;
    this.patientId = props.patientId;
    this.timeSlot = props.timeSlot;
    this._status = props.status;
    this.reason = props.reason;
    this._cancellationReason = props.cancellationReason;
    this._cancelledBy = props.cancelledBy;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this.patientName = props.patientName;
    this.doctorName = props.doctorName;
  }

  get status(): AppointmentStatus {
    return this._status;
  }

  get cancellationReason(): string | undefined {
    return this._cancellationReason;
  }

  get cancelledBy(): string | undefined {
    return this._cancelledBy;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static create(props: {
    id: string;
    clinicId: string;
    doctorId: string;
    patientId: string;
    timeSlot: TimeSlot;
    reason?: string;
  }): Appointment {
    const now = new Date();
    const appointment = new Appointment({
      ...props,
      status: AppointmentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });

    appointment.addDomainEvent(
      new AppointmentCreatedEvent({
        appointmentId: props.id,
        clinicId: props.clinicId,
        doctorId: props.doctorId,
        patientId: props.patientId,
        startsAt: props.timeSlot.startsAt,
        endsAt: props.timeSlot.endsAt,
      })
    );

    return appointment;
  }

  static reconstitute(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  confirm(): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.CONFIRMED
    );
    this._updatedAt = new Date();

    this.addDomainEvent(
      new AppointmentConfirmedEvent(this.buildEventProps())
    );
  }

  cancel(cancelledBy: string, reason?: string): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.CANCELLED
    );
    this._cancelledBy = cancelledBy;
    this._cancellationReason = reason;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new AppointmentCancelledEvent(this.buildEventProps(), cancelledBy, reason)
    );
  }

  complete(): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.COMPLETED
    );
    this._updatedAt = new Date();

    this.addDomainEvent(
      new AppointmentCompletedEvent(this.buildEventProps())
    );
  }

  markNoShow(): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.NO_SHOW
    );
    this._updatedAt = new Date();

    this.addDomainEvent(
      new AppointmentNoShowEvent(this.buildEventProps())
    );
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  hasDomainEvents(): boolean {
    return this.domainEvents.length > 0;
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  private buildEventProps() {
    return {
      appointmentId: this.id,
      clinicId: this.clinicId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      startsAt: this.timeSlot.startsAt,
      endsAt: this.timeSlot.endsAt,
    };
  }
}
