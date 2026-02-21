import type { DomainEvent } from './domain-event';
import type { TypedEventBus } from './event-bus';

/**
 * Port interface for publishing domain events.
 *
 * This abstraction decouples business logic from the event delivery mechanism.
 * Application services and repositories depend on this interface, not on concrete
 * implementations like TypedEventBus or a future Redis/BullMQ publisher.
 *
 * Swapping from in-process to distributed messaging requires only providing
 * a new implementation of this interface - no business logic changes needed.
 */
export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

/**
 * In-process implementation of IEventPublisher that delegates to a TypedEventBus.
 *
 * Suitable for single-process deployments and development/testing.
 * For production distributed systems, replace with a Redis/BullMQ implementation
 * that implements the same IEventPublisher interface.
 */
export class InProcessEventPublisher implements IEventPublisher {
  constructor(private readonly eventBus: TypedEventBus) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }
}
