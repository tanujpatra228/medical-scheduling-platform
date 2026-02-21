import type { DomainEvent } from './domain-event';

/**
 * Interface for handling a specific type of domain event.
 *
 * Handlers are independent units - they should not share mutable state
 * or make assumptions about execution order relative to other handlers.
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

/** Event type used for internal error reporting within the event bus */
const ERROR_EVENT_TYPE = 'error';

/**
 * Typed, in-process event bus for dispatching domain events to registered handlers.
 *
 * Design decisions:
 * - Uses Promise.allSettled (NOT Promise.all) so one handler failure doesn't prevent
 *   other handlers from executing. Each handler is independent.
 * - Failed handlers are logged via console.error (replaceable with a proper logger later).
 * - Handlers are dispatched in registration order but should NOT depend on ordering.
 * - No shared mutable state between handlers.
 */
export class TypedEventBus {
  private readonly handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Registers a handler for a specific event type.
   *
   * Multiple handlers can be registered for the same event type.
   * The same handler instance can be registered multiple times.
   */
  register(eventType: string, handler: EventHandler): void {
    const existingHandlers = this.handlers.get(eventType) ?? [];
    existingHandlers.push(handler);
    this.handlers.set(eventType, existingHandlers);
  }

  /**
   * Publishes a domain event to all registered handlers for that event type.
   *
   * Uses Promise.allSettled to ensure all handlers execute independently.
   * If any handler throws, it is logged but does not affect other handlers.
   *
   * IMPORTANT: Follow the "persist first, then publish" pattern.
   * Save aggregate state before calling publish.
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventType) ?? [];

    const results = await Promise.allSettled(
      eventHandlers.map((handler) => handler.handle(event))
    );

    this.logFailedHandlers(event, results);
  }

  /**
   * Removes all registered handlers. Useful for test cleanup.
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Returns the number of handlers registered for a specific event type.
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length ?? 0;
  }

  /**
   * Logs any handler failures from a Promise.allSettled result set.
   * Dispatches to error handlers if registered, otherwise logs to console.
   */
  private logFailedHandlers(
    event: DomainEvent,
    results: PromiseSettledResult<void>[]
  ): void {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const errorContext = {
          eventType: event.eventType,
          eventId: event.eventId,
          handlerIndex: index,
          reason: result.reason,
        };

        console.error(
          `Event handler failed for "${event.eventType}" (eventId: ${event.eventId}, handler index: ${index}):`,
          result.reason
        );

        this.dispatchToErrorHandlers(errorContext);
      }
    });
  }

  /**
   * Safety net: dispatches error information to any registered "error" handlers.
   * This allows external monitoring/alerting to hook into handler failures.
   */
  private dispatchToErrorHandlers(errorContext: {
    eventType: string;
    eventId: string;
    handlerIndex: number;
    reason: unknown;
  }): void {
    const errorHandlers = this.handlers.get(ERROR_EVENT_TYPE) ?? [];

    for (const handler of errorHandlers) {
      try {
        handler.handle(errorContext as unknown as DomainEvent);
      } catch {
        // Prevent infinite error loops - if error handler itself fails, silently drop
      }
    }
  }
}
