import { describe, it, expect } from "vitest";
import { Appointment } from "../../entities/appointment";
import { AppointmentStatus } from "../../value-objects/appointment-status";
import { TimeSlot } from "../../value-objects/time-slot";
import {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentNoShowEvent,
} from "../../events/appointment-events";
import { InvalidStateTransitionError } from "../../errors";

function createTestTimeSlot(): TimeSlot {
  return TimeSlot.create(
    new Date("2026-03-01T09:00:00Z"),
    new Date("2026-03-01T09:30:00Z")
  );
}

function createTestAppointment(): Appointment {
  return Appointment.create({
    id: "apt-1",
    clinicId: "clinic-1",
    doctorId: "doc-1",
    patientId: "patient-1",
    timeSlot: createTestTimeSlot(),
    reason: "Routine checkup",
  });
}

describe("Appointment", () => {
  describe("create()", () => {
    it("sets status to PENDING", () => {
      const appointment = createTestAppointment();
      expect(appointment.status).toBe(AppointmentStatus.PENDING);
    });

    it("emits AppointmentCreatedEvent", () => {
      const appointment = createTestAppointment();
      const events = appointment.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AppointmentCreatedEvent);
      expect(events[0].eventType).toBe("APPOINTMENT_CREATED");
    });

    it("sets all properties correctly", () => {
      const appointment = createTestAppointment();

      expect(appointment.id).toBe("apt-1");
      expect(appointment.clinicId).toBe("clinic-1");
      expect(appointment.doctorId).toBe("doc-1");
      expect(appointment.patientId).toBe("patient-1");
      expect(appointment.reason).toBe("Routine checkup");
      expect(appointment.createdAt).toBeInstanceOf(Date);
      expect(appointment.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("confirm()", () => {
    it("transitions PENDING -> CONFIRMED and emits event", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents(); // clear creation event

      appointment.confirm();

      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
      const events = appointment.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AppointmentConfirmedEvent);
      expect(events[0].eventType).toBe("APPOINTMENT_CONFIRMED");
    });
  });

  describe("cancel()", () => {
    it("transitions CONFIRMED -> CANCELLED with reason", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      appointment.confirm();
      appointment.pullDomainEvents();

      appointment.cancel("user-1", "Patient requested cancellation");

      expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.cancellationReason).toBe("Patient requested cancellation");
    });

    it("includes cancelledBy", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      appointment.confirm();
      appointment.pullDomainEvents();

      appointment.cancel("admin-1", "Doctor unavailable");

      expect(appointment.cancelledBy).toBe("admin-1");
    });

    it("emits AppointmentCancelledEvent with cancel details", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      appointment.confirm();
      appointment.pullDomainEvents();

      appointment.cancel("user-1", "No longer needed");

      const events = appointment.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AppointmentCancelledEvent);

      const payload = events[0].toPayload();
      expect(payload.cancelledBy).toBe("user-1");
      expect(payload.cancellationReason).toBe("No longer needed");
    });

    it("throws on PENDING -> CANCELLED (must confirm first)", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();

      expect(() => appointment.cancel("user-1", "Changed my mind")).toThrow(
        InvalidStateTransitionError
      );
    });
  });

  describe("complete()", () => {
    it("transitions CONFIRMED -> COMPLETED", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      appointment.confirm();
      appointment.pullDomainEvents();

      appointment.complete();

      expect(appointment.status).toBe(AppointmentStatus.COMPLETED);
      const events = appointment.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AppointmentCompletedEvent);
      expect(events[0].eventType).toBe("APPOINTMENT_COMPLETED");
    });
  });

  describe("markNoShow()", () => {
    it("transitions CONFIRMED -> NO_SHOW", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      appointment.confirm();
      appointment.pullDomainEvents();

      appointment.markNoShow();

      expect(appointment.status).toBe(AppointmentStatus.NO_SHOW);
      const events = appointment.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AppointmentNoShowEvent);
      expect(events[0].eventType).toBe("APPOINTMENT_NO_SHOW");
    });
  });

  describe("invalid transitions", () => {
    it("throws on PENDING -> COMPLETED", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();

      expect(() => appointment.complete()).toThrow(InvalidStateTransitionError);
    });

    it("throws on CANCELLED -> any transition", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      appointment.confirm();
      appointment.cancel("user-1");
      appointment.pullDomainEvents();

      expect(() => appointment.confirm()).toThrow(InvalidStateTransitionError);
      expect(() => appointment.complete()).toThrow(InvalidStateTransitionError);
      expect(() => appointment.markNoShow()).toThrow(InvalidStateTransitionError);
      expect(() => appointment.cancel("user-1")).toThrow(InvalidStateTransitionError);
    });
  });

  describe("pullDomainEvents()", () => {
    it("returns and clears events", () => {
      const appointment = createTestAppointment();

      const firstPull = appointment.pullDomainEvents();
      expect(firstPull).toHaveLength(1);

      const secondPull = appointment.pullDomainEvents();
      expect(secondPull).toHaveLength(0);
    });

    it("called twice returns empty on second call", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();

      appointment.confirm();
      const events = appointment.pullDomainEvents();
      expect(events).toHaveLength(1);

      const emptyEvents = appointment.pullDomainEvents();
      expect(emptyEvents).toHaveLength(0);
    });
  });

  describe("hasDomainEvents()", () => {
    it("returns true when events exist", () => {
      const appointment = createTestAppointment();
      expect(appointment.hasDomainEvents()).toBe(true);
    });

    it("returns false after events are pulled", () => {
      const appointment = createTestAppointment();
      appointment.pullDomainEvents();
      expect(appointment.hasDomainEvents()).toBe(false);
    });
  });

  describe("reconstitute()", () => {
    it("creates appointment without emitting events", () => {
      const appointment = Appointment.reconstitute({
        id: "apt-1",
        clinicId: "clinic-1",
        doctorId: "doc-1",
        patientId: "patient-1",
        timeSlot: createTestTimeSlot(),
        status: AppointmentStatus.CONFIRMED,
        reason: "Follow-up",
        createdAt: new Date("2026-02-20T10:00:00Z"),
        updatedAt: new Date("2026-02-20T10:05:00Z"),
      });

      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.hasDomainEvents()).toBe(false);
      expect(appointment.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("full lifecycle", () => {
    it("create -> confirm -> complete emits correct events", () => {
      const appointment = createTestAppointment();

      // Pull the creation event
      const creationEvents = appointment.pullDomainEvents();
      expect(creationEvents).toHaveLength(1);
      expect(creationEvents[0]).toBeInstanceOf(AppointmentCreatedEvent);

      // Confirm and complete
      appointment.confirm();
      appointment.complete();

      // Pull both events
      const lifecycleEvents = appointment.pullDomainEvents();
      expect(lifecycleEvents).toHaveLength(2);
      expect(lifecycleEvents[0]).toBeInstanceOf(AppointmentConfirmedEvent);
      expect(lifecycleEvents[1]).toBeInstanceOf(AppointmentCompletedEvent);
    });
  });
});
