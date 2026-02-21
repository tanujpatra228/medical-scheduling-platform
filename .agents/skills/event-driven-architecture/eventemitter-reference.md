# Node.js EventEmitter Reference (ESM)

**Load this reference when:** writing EventEmitter code, handling async events, debugging listener leaks, or using `once()`/`on()` async patterns.

**Reference**: [Node.js Events API](https://nodejs.org/docs/latest/api/events.html)

## Import

All imports use ESM with the `node:` protocol.

```typescript
import { EventEmitter, once, on, errorMonitor } from "node:events";
```

## Method Reference

| Method | Returns | Purpose |
|--------|---------|---------|
| `on(event, fn)` | `EventEmitter` | Add listener (every emission) |
| `once(event, fn)` | `EventEmitter` | Add one-time listener |
| `emit(event, ...args)` | `boolean` | Trigger event, `true` if listeners exist |
| `off(event, fn)` | `EventEmitter` | Remove a specific listener |
| `removeAllListeners([event])` | `EventEmitter` | Remove all (or event-specific) listeners |
| `listeners(event)` | `Function[]` | Get a copy of the listener array |
| `listenerCount(event)` | `number` | Count registered listeners |
| `eventNames()` | `(string\|symbol)[]` | Get all event names with listeners |
| `prependListener(event, fn)` | `EventEmitter` | Add listener to the beginning |
| `prependOnceListener(event, fn)` | `EventEmitter` | One-time listener at the beginning |
| `setMaxListeners(n)` | `EventEmitter` | Set max listener count (default: 10) |
| `getMaxListeners()` | `number` | Get current max listener count |

## Key Behaviors

**Listeners execute synchronously** in registration order. `emit()` blocks until all listeners return:

```typescript
emitter.on("data", () => console.log("first"));
emitter.on("data", () => console.log("second"));
emitter.emit("data");
// Output: "first", then "second" (guaranteed order)
```

**`this` binding**: Regular functions get `this` bound to the emitter. Arrow functions do not:

```typescript
emitter.on("event", function () {
  console.log(this === emitter); // true
});

emitter.on("event", () => {
  console.log(this); // undefined (or enclosing scope)
});
```

## Error Handling

### Critical: Unhandled `"error"` Crashes the Process

```typescript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();

// BAD - will crash the process
emitter.emit("error", new Error("something broke"));

// GOOD - always register an error listener
emitter.on("error", (err) => {
  console.error("Caught:", err.message);
});
emitter.emit("error", new Error("something broke")); // handled
```

### Error Monitoring Without Consuming

Use `errorMonitor` to observe errors without preventing the crash (useful for logging/metrics):

```typescript
import { EventEmitter, errorMonitor } from "node:events";

const emitter = new EventEmitter();

emitter.on(errorMonitor, (err) => {
  monitoringService.log(err); // logs the error
});

// Still crashes unless a regular "error" listener exists
```

### Capturing Async Rejections

When listeners are async, unhandled rejections are silent by default. Use `captureRejections`:

```typescript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter({ captureRejections: true });

emitter.on("request", async () => {
  throw new Error("handler failed");
});

// Rejected promises routed to "error" automatically
emitter.on("error", (err) => {
  console.error("Async rejection:", err.message);
});
```

Set globally for all emitters:

```typescript
import { EventEmitter } from "node:events";

EventEmitter.captureRejections = true;
```

Custom rejection handler per emitter:

```typescript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter({ captureRejections: true });

emitter[Symbol.for("nodejs.rejection")] = (err, eventName) => {
  console.error(`Rejection in "${eventName}":`, err.message);
};
```

## Async Patterns

### `once()` -- Await a Single Event

The static `once()` returns a Promise that resolves when the event fires:

```typescript
import { once, EventEmitter } from "node:events";

const emitter = new EventEmitter();

setTimeout(() => emitter.emit("ready", { port: 3000 }), 100);

const [payload] = await once(emitter, "ready");
console.log(payload.port); // 3000
```

With `AbortSignal` for timeout/cancellation:

```typescript
import { once, EventEmitter } from "node:events";

const emitter = new EventEmitter();
const ac = new AbortController();

setTimeout(() => ac.abort(), 5000);

try {
  const [payload] = await once(emitter, "ready", { signal: ac.signal });
  console.log("Ready:", payload);
} catch (err) {
  if (err.name === "AbortError") {
    console.error("Timed out waiting for ready event");
  }
}
```

**Awaiting multiple events** -- create all Promises before awaiting:

```typescript
import { once, EventEmitter } from "node:events";

const emitter = new EventEmitter();

// WRONG - second event may fire while awaiting the first
const [a] = await once(emitter, "first");
const [b] = await once(emitter, "second"); // may have already missed it

// CORRECT - create Promises eagerly, await together
const firstPromise = once(emitter, "first");
const secondPromise = once(emitter, "second");
const [[a], [b]] = await Promise.all([firstPromise, secondPromise]);
```

### `on()` -- Async Iteration Over Events

The static `on()` returns an `AsyncIterator` for consuming a stream of events:

```typescript
import { on, EventEmitter } from "node:events";

const emitter = new EventEmitter();

setInterval(() => {
  emitter.emit("message", { text: "ping", ts: Date.now() });
}, 1000);

for await (const [message] of on(emitter, "message")) {
  console.log("Received:", message.text);

  if (message.text === "quit") break; // exits and cleans up listeners
}
```

With `AbortSignal`:

```typescript
import { on, EventEmitter } from "node:events";

const emitter = new EventEmitter();
const ac = new AbortController();

setTimeout(() => ac.abort(), 10_000);

try {
  for await (const [event] of on(emitter, "data", { signal: ac.signal })) {
    process.stdout.write(event);
  }
} catch (err) {
  if (err.name === "AbortError") {
    console.log("Stopped listening");
  }
}
```

## Max Listeners

Node.js warns when more than 10 listeners are registered for a single event (potential memory leak). Adjust when you legitimately need more:

```typescript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();

// For a specific emitter
emitter.setMaxListeners(50);

// Globally for all new emitters
EventEmitter.defaultMaxListeners = 50;

// Unlimited (use with caution)
emitter.setMaxListeners(0);
```

## Listener Cleanup

Always clean up listeners to prevent memory leaks, especially in long-running processes:

```typescript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();

function onData(payload) {
  console.log(payload);
}

emitter.on("data", onData);

// Remove specific listener (must pass same function reference)
emitter.off("data", onData);

// Remove all listeners for an event
emitter.removeAllListeners("data");

// Remove ALL listeners on the emitter
emitter.removeAllListeners();
```

## Quick Checklist

- [ ] `"error"` listener registered before any `emit()` calls
- [ ] `captureRejections: true` when using async listeners
- [ ] `once()` for one-shot listeners (auto-cleanup)
- [ ] `off()` called for every `on()` during teardown
- [ ] `AbortController` used for timeout/cancellation in `once()`/`on()`
- [ ] `setMaxListeners()` adjusted only when legitimately needed
- [ ] Arrow functions used intentionally (no `this` binding to emitter)
