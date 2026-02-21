import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '@api/events/aggregate-root';
import type { DomainEvent } from '@api/events/domain-event';
import { createEventId } from '@api/events/domain-event';

// -- Test Helpers --

/** Concrete test aggregate that exposes addDomainEvent for testing */
class TestAggregate extends AggregateRoot {
  /** Public wrapper so tests can call the protected addDomainEvent */
  emitEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}

/** Creates a simple domain event for testing */
function createTestDomainEvent(
  eventType: string,
  aggregateId: string = 'test-agg-1'
): DomainEvent {
  return {
    eventId: createEventId(),
    eventType,
    occurredAt: new Date(),
    aggregateId,
  };
}

// -- Tests --

describe('AggregateRoot', () => {
  it('fresh aggregate has no domain events', () => {
    const aggregate = new TestAggregate();

    expect(aggregate.hasDomainEvents()).toBe(false);
    expect(aggregate.pullDomainEvents()).toEqual([]);
  });

  it('entity can add domain events', () => {
    const aggregate = new TestAggregate();
    const event = createTestDomainEvent('AppointmentCreated');

    aggregate.emitEvent(event);

    expect(aggregate.hasDomainEvents()).toBe(true);
  });

  it('pullDomainEvents() returns all added events in order', () => {
    const aggregate = new TestAggregate();
    const event1 = createTestDomainEvent('AppointmentCreated');
    const event2 = createTestDomainEvent('AppointmentConfirmed');
    const event3 = createTestDomainEvent('AppointmentRescheduled');

    aggregate.emitEvent(event1);
    aggregate.emitEvent(event2);
    aggregate.emitEvent(event3);

    const events = aggregate.pullDomainEvents();

    expect(events).toHaveLength(3);
    expect(events[0]).toBe(event1);
    expect(events[1]).toBe(event2);
    expect(events[2]).toBe(event3);
  });

  it('pullDomainEvents() clears the internal event list', () => {
    const aggregate = new TestAggregate();
    aggregate.emitEvent(createTestDomainEvent('AppointmentCreated'));
    aggregate.emitEvent(createTestDomainEvent('AppointmentConfirmed'));

    const firstPull = aggregate.pullDomainEvents();
    const secondPull = aggregate.pullDomainEvents();

    expect(firstPull).toHaveLength(2);
    expect(secondPull).toHaveLength(0);
  });

  it('hasDomainEvents() returns true when events exist, false when empty', () => {
    const aggregate = new TestAggregate();

    expect(aggregate.hasDomainEvents()).toBe(false);

    aggregate.emitEvent(createTestDomainEvent('AppointmentCreated'));
    expect(aggregate.hasDomainEvents()).toBe(true);

    aggregate.pullDomainEvents();
    expect(aggregate.hasDomainEvents()).toBe(false);
  });

  it('pullDomainEvents() returns a copy, not the internal array', () => {
    const aggregate = new TestAggregate();
    const event = createTestDomainEvent('AppointmentCreated');
    aggregate.emitEvent(event);

    const pulledEvents = aggregate.pullDomainEvents();

    // Mutating the returned array should not affect the aggregate
    pulledEvents.push(createTestDomainEvent('ShouldNotAppear'));

    // After pull, aggregate should have no events (not the mutated array)
    expect(aggregate.hasDomainEvents()).toBe(false);
    expect(aggregate.pullDomainEvents()).toEqual([]);
  });
});
