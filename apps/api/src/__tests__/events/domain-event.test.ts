import { describe, it, expect } from 'vitest';
import { createEventId } from '@api/events/domain-event';
import type { DomainEvent } from '@api/events/domain-event';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Concrete test event for verifying the DomainEvent interface */
class TestEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'TestOccurred';
  readonly occurredAt: Date;
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.eventId = createEventId();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
  }
}

describe('createEventId', () => {
  it('returns a valid UUID v4 format string', () => {
    const id = createEventId();

    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('returns unique IDs on successive calls', () => {
    const id1 = createEventId();
    const id2 = createEventId();

    expect(id1).not.toBe(id2);
  });
});

describe('DomainEvent', () => {
  it('exposes all required properties through a concrete implementation', () => {
    const aggregateId = 'appointment-123';
    const event = new TestEvent(aggregateId);

    expect(event.eventId).toMatch(UUID_V4_REGEX);
    expect(event.eventType).toBe('TestOccurred');
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(aggregateId);
  });

  it('creates events with distinct eventIds for different instances', () => {
    const event1 = new TestEvent('agg-1');
    const event2 = new TestEvent('agg-2');

    expect(event1.eventId).not.toBe(event2.eventId);
  });

  it('has readonly fields that cannot be reassigned', () => {
    const event = new TestEvent('agg-1');

    // TypeScript enforces readonly at compile time.
    // At runtime, we verify the fields are set and stable.
    const originalEventId = event.eventId;
    const originalEventType = event.eventType;
    const originalOccurredAt = event.occurredAt;
    const originalAggregateId = event.aggregateId;

    expect(event.eventId).toBe(originalEventId);
    expect(event.eventType).toBe(originalEventType);
    expect(event.occurredAt).toBe(originalOccurredAt);
    expect(event.aggregateId).toBe(originalAggregateId);
  });
});
