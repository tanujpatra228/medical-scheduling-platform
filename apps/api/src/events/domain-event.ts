import crypto from 'crypto';

/**
 * Base interface for all domain events in the system.
 *
 * Domain events represent something that happened in the past within the domain.
 * They are immutable data carriers - all fields are readonly.
 *
 * Naming convention: Use past tense (e.g., "AppointmentCreated", "AppointmentCancelled").
 *
 * Usage pattern: PERSIST FIRST, THEN PUBLISH.
 * Always save the aggregate state to the database before publishing domain events.
 * This ensures consistency - if the publish fails, the state is already persisted.
 */
export interface DomainEvent {
  /** Unique identifier for this specific event instance */
  readonly eventId: string;

  /** Past-tense name describing what happened (e.g., "AppointmentCreated") */
  readonly eventType: string;

  /** Timestamp when the event occurred */
  readonly occurredAt: Date;

  /** ID of the aggregate/entity that emitted this event */
  readonly aggregateId: string;

  /** Serializes the event data to a plain object for handlers/transport */
  toPayload(): Record<string, unknown>;
}

/**
 * Generates a unique event identifier using crypto.randomUUID().
 *
 * @returns A UUID v4 string suitable for use as an eventId
 */
export function createEventId(): string {
  return crypto.randomUUID();
}
