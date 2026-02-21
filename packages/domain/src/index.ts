// Errors
export {
  DomainError,
  InvalidStateTransitionError,
  SlotNotAvailableError,
  DoubleBookingError,
} from "./errors";

// Value Objects
export {
  Email,
  InvalidEmailError,
  AppointmentStatus,
  TimeSlot,
  InvalidTimeSlotError,
  DateRange,
  InvalidDateRangeError,
} from "./value-objects";

// State Machine
export { AppointmentStateMachine } from "./state-machine";

// Events
export type { DomainEvent } from "./events";
export { createEventId } from "./events";
export {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentNoShowEvent,
} from "./events";

// Entities
export { Appointment } from "./entities";
export type { AppointmentProps } from "./entities";
export { Clinic } from "./entities";
export type { ClinicProps } from "./entities";
export { User } from "./entities";
export type { UserProps } from "./entities";
export { Doctor, InvalidSlotDurationError } from "./entities";
export type { DoctorProps } from "./entities";
export { Patient } from "./entities";
export type { PatientProps } from "./entities";
export { AvailabilityRule, InvalidAvailabilityRuleError } from "./entities";
export type { AvailabilityRuleProps } from "./entities";
export { AvailabilityOverride, InvalidAvailabilityOverrideError } from "./entities";
export type { AvailabilityOverrideProps } from "./entities";
export { AuditLog } from "./entities";
export type { AuditLogProps } from "./entities";
