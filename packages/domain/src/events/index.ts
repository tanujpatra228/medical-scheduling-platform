export type { DomainEvent } from "./domain-event";
export { createEventId } from "./domain-event";
export {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentNoShowEvent,
} from "./appointment-events";
