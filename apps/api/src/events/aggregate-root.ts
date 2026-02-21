import type { DomainEvent } from './domain-event';

/**
 * Abstract base class for aggregate roots that can emit domain events.
 *
 * Aggregates collect domain events internally as state changes occur.
 * Events are then pulled and published after the aggregate is persisted.
 *
 * Usage pattern:
 * 1. Aggregate method calls `this.addDomainEvent(event)` during a state change
 * 2. Repository persists the aggregate to the database
 * 3. Repository (or application service) calls `pullDomainEvents()` and publishes them
 *
 * This ensures the "persist first, then publish" invariant is maintained.
 */
export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  /**
   * Collects a domain event to be published after the aggregate is persisted.
   * Events are stored in the order they are added.
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Returns all collected domain events and clears the internal list.
   *
   * This is a destructive read - calling it twice in a row will return
   * an empty array the second time. This prevents events from being
   * accidentally published more than once.
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  /**
   * Checks whether there are any pending domain events to be published.
   */
  hasDomainEvents(): boolean {
    return this.domainEvents.length > 0;
  }
}
