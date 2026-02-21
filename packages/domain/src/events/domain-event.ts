export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  toPayload(): Record<string, unknown>;
}

let counter = 0;

export function createEventId(): string {
  counter++;
  return `evt_${Date.now()}_${counter}_${Math.random().toString(36).substring(2, 9)}`;
}
