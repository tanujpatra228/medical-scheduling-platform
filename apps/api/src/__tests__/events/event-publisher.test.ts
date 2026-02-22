import { describe, it, expect, beforeEach } from 'vitest';
import { InProcessEventPublisher } from '@api/events/event-publisher';
import { TypedEventBus } from '@api/events/event-bus';
import type { EventHandler } from '@api/events/event-bus';
import type { DomainEvent } from '@api/events/domain-event';
import { createEventId } from '@api/events/domain-event';

// -- Test Helpers --

/** Creates a concrete domain event for testing */
function createTestEvent(
  eventType: string,
  aggregateId: string = 'test-aggregate-1'
): DomainEvent {
  return {
    eventId: createEventId(),
    eventType,
    occurredAt: new Date(),
    aggregateId,
    toPayload: () => ({ eventType, aggregateId }),
  };
}

/** A handler that collects received events for assertion */
class CollectingHandler implements EventHandler {
  readonly receivedEvents: DomainEvent[] = [];

  async handle(event: DomainEvent): Promise<void> {
    this.receivedEvents.push(event);
  }
}

// -- Tests --

describe('InProcessEventPublisher', () => {
  let eventBus: TypedEventBus;
  let publisher: InProcessEventPublisher;

  beforeEach(() => {
    eventBus = new TypedEventBus();
    publisher = new InProcessEventPublisher(eventBus);
  });

  it('delegates publish calls to the underlying TypedEventBus', async () => {
    const handler = new CollectingHandler();
    eventBus.register('AppointmentCreated', handler);

    const event = createTestEvent('AppointmentCreated');
    await publisher.publish(event);

    expect(handler.receivedEvents).toHaveLength(1);
    expect(handler.receivedEvents[0]).toBe(event);
  });

  it('publishing through publisher triggers all registered handlers', async () => {
    const handler1 = new CollectingHandler();
    const handler2 = new CollectingHandler();

    eventBus.register('AppointmentCancelled', handler1);
    eventBus.register('AppointmentCancelled', handler2);

    const event = createTestEvent('AppointmentCancelled');
    await publisher.publish(event);

    expect(handler1.receivedEvents).toHaveLength(1);
    expect(handler2.receivedEvents).toHaveLength(1);
  });

  it('publishing with no handlers does not throw', async () => {
    const event = createTestEvent('UnhandledEvent');

    await expect(publisher.publish(event)).resolves.toBeUndefined();
  });
});
