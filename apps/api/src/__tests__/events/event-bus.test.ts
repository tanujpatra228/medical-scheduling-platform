import { describe, it, expect, beforeEach, vi } from 'vitest';
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

/** A handler that always throws an error */
class FailingHandler implements EventHandler {
  async handle(_event: DomainEvent): Promise<void> {
    throw new Error('Handler deliberately failed');
  }
}

// -- Tests --

describe('TypedEventBus', () => {
  let eventBus: TypedEventBus;

  beforeEach(() => {
    eventBus = new TypedEventBus();
  });

  describe('producer tests', () => {
    it('registered handler receives published event', async () => {
      const handler = new CollectingHandler();
      const event = createTestEvent('AppointmentCreated');
      eventBus.register('AppointmentCreated', handler);

      await eventBus.publish(event);

      expect(handler.receivedEvents).toHaveLength(1);
      expect(handler.receivedEvents[0]).toBe(event);
    });

    it('multiple handlers for same event type all receive the event', async () => {
      const handler1 = new CollectingHandler();
      const handler2 = new CollectingHandler();
      const event = createTestEvent('AppointmentCreated');

      eventBus.register('AppointmentCreated', handler1);
      eventBus.register('AppointmentCreated', handler2);

      await eventBus.publish(event);

      expect(handler1.receivedEvents).toHaveLength(1);
      expect(handler1.receivedEvents[0]).toBe(event);
      expect(handler2.receivedEvents).toHaveLength(1);
      expect(handler2.receivedEvents[0]).toBe(event);
    });

    it('handlers for different event types do not receive unrelated events', async () => {
      const appointmentHandler = new CollectingHandler();
      const cancellationHandler = new CollectingHandler();

      eventBus.register('AppointmentCreated', appointmentHandler);
      eventBus.register('AppointmentCancelled', cancellationHandler);

      await eventBus.publish(createTestEvent('AppointmentCreated'));

      expect(appointmentHandler.receivedEvents).toHaveLength(1);
      expect(cancellationHandler.receivedEvents).toHaveLength(0);
    });

    it('publishing with no registered handlers does not throw', async () => {
      const event = createTestEvent('UnhandledEvent');

      await expect(eventBus.publish(event)).resolves.toBeUndefined();
    });
  });

  describe('handler isolation tests', () => {
    it('one handler failure does not prevent other handlers from executing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const successHandler = new CollectingHandler();
      const failingHandler = new FailingHandler();
      const anotherSuccessHandler = new CollectingHandler();

      eventBus.register('AppointmentCreated', successHandler);
      eventBus.register('AppointmentCreated', failingHandler);
      eventBus.register('AppointmentCreated', anotherSuccessHandler);

      const event = createTestEvent('AppointmentCreated');
      await eventBus.publish(event);

      expect(successHandler.receivedEvents).toHaveLength(1);
      expect(anotherSuccessHandler.receivedEvents).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('failed handler is logged via console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingHandler = new FailingHandler();

      eventBus.register('AppointmentCreated', failingHandler);

      const event = createTestEvent('AppointmentCreated');
      await eventBus.publish(event);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AppointmentCreated'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('lifecycle tests', () => {
    it('clear() removes all handlers', async () => {
      const handler = new CollectingHandler();
      eventBus.register('AppointmentCreated', handler);
      eventBus.register('AppointmentCancelled', handler);

      eventBus.clear();

      await eventBus.publish(createTestEvent('AppointmentCreated'));
      await eventBus.publish(createTestEvent('AppointmentCancelled'));

      expect(handler.receivedEvents).toHaveLength(0);
    });

    it('getHandlerCount() returns correct count', () => {
      const handler = new CollectingHandler();

      expect(eventBus.getHandlerCount('AppointmentCreated')).toBe(0);

      eventBus.register('AppointmentCreated', handler);
      expect(eventBus.getHandlerCount('AppointmentCreated')).toBe(1);

      eventBus.register('AppointmentCreated', new CollectingHandler());
      expect(eventBus.getHandlerCount('AppointmentCreated')).toBe(2);
    });

    it('getHandlerCount() returns 0 for unregistered event types', () => {
      expect(eventBus.getHandlerCount('NonExistentEvent')).toBe(0);
    });

    it('can register same handler instance multiple times', async () => {
      const handler = new CollectingHandler();
      eventBus.register('AppointmentCreated', handler);
      eventBus.register('AppointmentCreated', handler);

      await eventBus.publish(createTestEvent('AppointmentCreated'));

      // Same handler registered twice receives the event twice
      expect(handler.receivedEvents).toHaveLength(2);
      expect(eventBus.getHandlerCount('AppointmentCreated')).toBe(2);
    });
  });
});
