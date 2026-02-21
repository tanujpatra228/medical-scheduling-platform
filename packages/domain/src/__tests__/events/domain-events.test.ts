import { describe, it, expect } from "vitest";
import { createEventId } from "../../events/domain-event";
import {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentNoShowEvent,
} from "../../events/appointment-events";

function buildEventProps() {
  return {
    appointmentId: "apt-123",
    clinicId: "clinic-1",
    doctorId: "doc-1",
    patientId: "patient-1",
    startsAt: new Date("2026-03-01T09:00:00Z"),
    endsAt: new Date("2026-03-01T09:30:00Z"),
  };
}

describe("createEventId", () => {
  it("generates unique IDs", () => {
    const id1 = createEventId();
    const id2 = createEventId();
    const id3 = createEventId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it("generates IDs with evt_ prefix", () => {
    const id = createEventId();
    expect(id).toMatch(/^evt_/);
  });
});

describe("AppointmentCreatedEvent", () => {
  it("has correct eventType", () => {
    const event = new AppointmentCreatedEvent(buildEventProps());
    expect(event.eventType).toBe("APPOINTMENT_CREATED");
  });

  it("has eventId, occurredAt, and aggregateId", () => {
    const props = buildEventProps();
    const event = new AppointmentCreatedEvent(props);

    expect(event.eventId).toBeDefined();
    expect(event.eventId).toMatch(/^evt_/);
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(props.appointmentId);
  });

  it("produces correct payload", () => {
    const props = buildEventProps();
    const event = new AppointmentCreatedEvent(props);
    const payload = event.toPayload();

    expect(payload).toEqual({
      appointmentId: "apt-123",
      clinicId: "clinic-1",
      doctorId: "doc-1",
      patientId: "patient-1",
      startsAt: "2026-03-01T09:00:00.000Z",
      endsAt: "2026-03-01T09:30:00.000Z",
    });
  });
});

describe("AppointmentConfirmedEvent", () => {
  it("has correct eventType", () => {
    const event = new AppointmentConfirmedEvent(buildEventProps());
    expect(event.eventType).toBe("APPOINTMENT_CONFIRMED");
  });

  it("has eventId, occurredAt, and aggregateId", () => {
    const props = buildEventProps();
    const event = new AppointmentConfirmedEvent(props);

    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(props.appointmentId);
  });
});

describe("AppointmentCancelledEvent", () => {
  it("has correct eventType", () => {
    const event = new AppointmentCancelledEvent(
      buildEventProps(),
      "user-1",
      "No longer needed"
    );
    expect(event.eventType).toBe("APPOINTMENT_CANCELLED");
  });

  it("includes cancelledBy and reason in payload", () => {
    const event = new AppointmentCancelledEvent(
      buildEventProps(),
      "user-1",
      "No longer needed"
    );
    const payload = event.toPayload();

    expect(payload.cancelledBy).toBe("user-1");
    expect(payload.cancellationReason).toBe("No longer needed");
  });

  it("includes undefined reason when not provided", () => {
    const event = new AppointmentCancelledEvent(buildEventProps(), "user-1");
    const payload = event.toPayload();

    expect(payload.cancelledBy).toBe("user-1");
    expect(payload.cancellationReason).toBeUndefined();
  });

  it("has eventId, occurredAt, and aggregateId", () => {
    const props = buildEventProps();
    const event = new AppointmentCancelledEvent(props, "user-1");

    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(props.appointmentId);
  });
});

describe("AppointmentCompletedEvent", () => {
  it("has correct eventType", () => {
    const event = new AppointmentCompletedEvent(buildEventProps());
    expect(event.eventType).toBe("APPOINTMENT_COMPLETED");
  });

  it("has eventId, occurredAt, and aggregateId", () => {
    const props = buildEventProps();
    const event = new AppointmentCompletedEvent(props);

    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(props.appointmentId);
  });
});

describe("AppointmentNoShowEvent", () => {
  it("has correct eventType", () => {
    const event = new AppointmentNoShowEvent(buildEventProps());
    expect(event.eventType).toBe("APPOINTMENT_NO_SHOW");
  });

  it("has eventId, occurredAt, and aggregateId", () => {
    const props = buildEventProps();
    const event = new AppointmentNoShowEvent(props);

    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(props.appointmentId);
  });
});

describe("All events share base properties", () => {
  const eventClasses = [
    { name: "Created", create: () => new AppointmentCreatedEvent(buildEventProps()) },
    { name: "Confirmed", create: () => new AppointmentConfirmedEvent(buildEventProps()) },
    { name: "Cancelled", create: () => new AppointmentCancelledEvent(buildEventProps(), "user-1") },
    { name: "Completed", create: () => new AppointmentCompletedEvent(buildEventProps()) },
    { name: "NoShow", create: () => new AppointmentNoShowEvent(buildEventProps()) },
  ];

  it.each(eventClasses)(
    "$name event has eventId, occurredAt, and aggregateId",
    ({ create }) => {
      const event = create();
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe("string");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe("apt-123");
    }
  );
});
