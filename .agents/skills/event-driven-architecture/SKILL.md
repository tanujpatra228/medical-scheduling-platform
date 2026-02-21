---
name: event-driven-architecture
description: Use when designing or implementing event-driven systems in Node.js. Covers domain events, event bus patterns, handler isolation, and testing strategies.
user-invocable: true
risk: safe
---

# Event-Driven Architecture Skill

Decouple producers from consumers. Emit events, not direct calls.

**Core principle:** The producer doesn't know or care who listens. Consumers don't know about each other.

## When to Use

**Always:**
- Use case triggers multiple side effects (email, notifications, audit logs, analytics)
- Adding a new reaction should not require modifying existing code
- Side effects are secondary to the main operation
- Handler failure should not fail the main operation

**Strong signal:**
- You're injecting 4+ services into a single use case just for side effects
- Adding a feature means touching a class that shouldn't need to change
- Tests require mocking every downstream dependency

**Not appropriate:**
- Caller needs the result of the side effect immediately
- Only one consumer exists and won't change
- Side effect is part of the core transaction (e.g., deducting inventory)

## The Iron Rule

```
PERSIST FIRST, THEN PUBLISH
```

Never emit an event before the database write succeeds. Consumers must never act on data that doesn't exist.

## Event Design

### Naming: Past Tense, Domain Language

```typescript
// Good
OrderPlaced
PaymentProcessed
UserRegistered

// Bad
CreateOrder        // ← command, not event
OrderUpdate        // ← unclear what happened
HandleNotification // ← describes handler, not event
```

### Structure: Immutable Data Carriers

```typescript
interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
}

class OrderPlacedEvent implements DomainEvent {
  readonly eventType = "OrderPlaced";
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly totalAmount: number
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}
```

## Implementation Patterns

### Pattern 1: Simple Event Bus (EventEmitter wrapper)

```typescript
import { EventEmitter } from "node:events";

type EventHandler<T> = (event: T) => void | Promise<void>;

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.on("error", (err) => {
      console.error("EventBus error:", err);
    });
  }

  publish<T extends DomainEvent>(event: T): void {
    this.emitter.emit(event.eventType, event);
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    this.emitter.on(eventType, handler);
  }

  unsubscribe(eventType: string, handler: EventHandler<unknown>): void {
    this.emitter.off(eventType, handler);
  }
}

export { EventBus };
```

### Pattern 2: Typed Event Bus (handler isolation with `Promise.allSettled`)

```typescript
interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

class TypedEventBus {
  private handlers = new Map<string, EventHandler<DomainEvent>[]>();

  register<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler<DomainEvent>);
    this.handlers.set(eventType, existing);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    const results = await Promise.allSettled(
      handlers.map((h) => h.handle(event))
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(`Handler failed for ${event.eventType}:`, result.reason);
      }
    }
  }
}

export { TypedEventBus };
export type { EventHandler };
```

### Pattern 3: Domain Events on Aggregate Roots

Entities collect events. Use case dispatches after persistence.

```typescript
abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
```

**Use case:**

```typescript
class PlaceOrderUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private eventBus: TypedEventBus
  ) {}

  async execute(dto: PlaceOrderDTO): Promise<Order> {
    const order = Order.create(dto);
    await this.orderRepo.save(order);       // 1. Persist first
    for (const event of order.pullDomainEvents()) {
      await this.eventBus.publish(event);   // 2. Then publish
    }
    return order;
  }
}
```

### Pattern 4: Abstract Publisher (swap implementations)

Depend on the abstraction. Swap in-process for Redis/BullMQ/Kafka without changing business logic.

```typescript
interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

class InProcessEventPublisher implements IEventPublisher {
  constructor(private eventBus: TypedEventBus) {}
  async publish(event: DomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }
}

class RedisEventPublisher implements IEventPublisher {
  constructor(private redisClient: RedisClient) {}
  async publish(event: DomainEvent): Promise<void> {
    await this.redisClient.publish(event.eventType, JSON.stringify(event));
  }
}
```

## Testing Event-Driven Code

Test producers and consumers in isolation.

**Producers -- verify correct event is emitted:**

```typescript
test("emits OrderPlacedEvent when order is created", async () => {
  const fakeEventBus = { publish: vi.fn() };
  const useCase = new PlaceOrderUseCase(fakeOrderRepo, fakeEventBus);

  await useCase.execute({ customerId: "cust-1", items: [] });

  expect(fakeEventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({ eventType: "OrderPlaced", customerId: "cust-1" })
  );
});
```

**Consumers -- verify handler reacts correctly:**

```typescript
test("sends email when OrderPlaced is handled", async () => {
  const fakeEmail = { send: vi.fn() };
  const handler = new SendConfirmationEmailHandler(fakeEmail);

  await handler.handle(new OrderPlacedEvent("order-1", "cust-1", 99.99));

  expect(fakeEmail.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: "cust-1", orderId: "order-1" })
  );
});
```

**Handler isolation -- one failure doesn't break others:**

```typescript
test("continues dispatching when a handler throws", async () => {
  const eventBus = new TypedEventBus();
  const failing = { handle: vi.fn().mockRejectedValue(new Error("down")) };
  const passing = { handle: vi.fn() };

  eventBus.register("OrderPlaced", failing);
  eventBus.register("OrderPlaced", passing);

  await eventBus.publish(new OrderPlacedEvent("o-1", "c-1", 50));

  expect(passing.handle).toHaveBeenCalled();
});
```

## Red Flags

| Smell | Problem |
|-------|---------|
| Use case injects 4+ services for side effects | Needs an event bus |
| Adding a reaction means modifying the emitter | Violates Open/Closed |
| `emit()` called before `save()` | Consumers act on non-existent data |
| No `"error"` listener on EventEmitter | Process will crash |
| Listeners registered per-request without cleanup | Memory leak |
| `Promise.all` in event dispatch | One failure kills all handlers |
| Handler A depends on Handler B's side effect | Hidden ordering dependency |
| Events named as commands (`CreateOrder`) | Confuses intent; events are past tense |

## Implementation Checklist

- [ ] Events named in past tense (`OrderPlaced`, not `CreateOrder`)
- [ ] Events are immutable (all `readonly` fields)
- [ ] Events contain only the data handlers need
- [ ] Persistence happens before event publishing
- [ ] `"error"` listener registered on every EventEmitter
- [ ] `captureRejections: true` when using async listeners
- [ ] `Promise.allSettled` used for multi-handler dispatch (not `Promise.all`)
- [ ] Handlers are independent (no shared mutable state, no ordering assumptions)
- [ ] Listeners cleaned up on teardown (`off()` / `removeAllListeners()`)
- [ ] Producer tests verify event emission
- [ ] Consumer tests verify handler behavior in isolation
- [ ] Isolation tests verify one handler failure doesn't break others

When using EventEmitter directly, read @eventemitter-reference.md for ESM API patterns, error handling, async iteration, and cleanup.

See full guide at: docs/event-driven-architecture.md
