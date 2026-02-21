import { describe, it, expect, vi } from "vitest";
import { Appointment, AppointmentStatus, TimeSlot } from "@msp/domain";
import { FreeSlotCalculator } from "../../../services/calendar/free-slot-calculator";
import { IAppointmentRepository } from "../../../ports/repositories/appointment.repository.port";
import { TimeWindow } from "../../../services/calendar/availability-expander";

const CLINIC_ID = "clinic-1";
const DOCTOR_ID = "doctor-1";
const SLOT_DURATION_MIN = 30;

function createAppointment(
  startsAt: Date,
  endsAt: Date,
  status: AppointmentStatus = AppointmentStatus.CONFIRMED,
): Appointment {
  return Appointment.reconstitute({
    id: `appt-${startsAt.getTime()}`,
    clinicId: CLINIC_ID,
    doctorId: DOCTOR_ID,
    patientId: "patient-1",
    timeSlot: TimeSlot.create(startsAt, endsAt),
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockAppointmentRepo(
  appointments: Appointment[] = [],
): IAppointmentRepository {
  return {
    findById: vi.fn(),
    findByDoctorAndDateRange: vi.fn().mockResolvedValue(appointments),
    findOverlapping: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };
}

function makeWindow(date: Date, startH: number, endH: number): TimeWindow {
  const startsAt = new Date(date);
  startsAt.setHours(startH, 0, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(endH, 0, 0, 0);
  return { startsAt, endsAt };
}

describe("FreeSlotCalculator", () => {
  it("should split a time window into the correct number of slots", async () => {
    const repo = createMockAppointmentRepo([]);
    const calculator = new FreeSlotCalculator(repo);

    const monday = new Date(2026, 1, 23);
    const windows: TimeWindow[] = [makeWindow(monday, 9, 12)]; // 3 hours = 6 x 30min slots

    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    expect(slots).toHaveLength(6);
    expect(slots[0].startsAt.getHours()).toBe(9);
    expect(slots[0].startsAt.getMinutes()).toBe(0);
    expect(slots[0].endsAt.getHours()).toBe(9);
    expect(slots[0].endsAt.getMinutes()).toBe(30);
    expect(slots[5].startsAt.getHours()).toBe(11);
    expect(slots[5].startsAt.getMinutes()).toBe(30);
    expect(slots[5].endsAt.getHours()).toBe(12);
    expect(slots[5].endsAt.getMinutes()).toBe(0);
  });

  it("should mark occupied slots correctly", async () => {
    const monday = new Date(2026, 1, 23);
    const apptStart = new Date(monday);
    apptStart.setHours(10, 0, 0, 0);
    const apptEnd = new Date(monday);
    apptEnd.setHours(10, 30, 0, 0);

    const repo = createMockAppointmentRepo([
      createAppointment(apptStart, apptEnd, AppointmentStatus.CONFIRMED),
    ]);
    const calculator = new FreeSlotCalculator(repo);

    const windows: TimeWindow[] = [makeWindow(monday, 9, 12)];
    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    // 10:00-10:30 slot should be occupied
    const occupiedSlots = slots.filter((s) => !s.isAvailable);
    expect(occupiedSlots).toHaveLength(1);
    expect(occupiedSlots[0].startsAt.getHours()).toBe(10);
    expect(occupiedSlots[0].startsAt.getMinutes()).toBe(0);
  });

  it("should mark all slots available when there are no appointments", async () => {
    const repo = createMockAppointmentRepo([]);
    const calculator = new FreeSlotCalculator(repo);

    const monday = new Date(2026, 1, 23);
    const windows: TimeWindow[] = [makeWindow(monday, 9, 11)]; // 4 slots

    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    expect(slots).toHaveLength(4);
    expect(slots.every((s) => s.isAvailable)).toBe(true);
  });

  it("should ignore cancelled appointments", async () => {
    const monday = new Date(2026, 1, 23);
    const apptStart = new Date(monday);
    apptStart.setHours(10, 0, 0, 0);
    const apptEnd = new Date(monday);
    apptEnd.setHours(10, 30, 0, 0);

    const repo = createMockAppointmentRepo([
      createAppointment(apptStart, apptEnd, AppointmentStatus.CANCELLED),
    ]);
    const calculator = new FreeSlotCalculator(repo);

    const windows: TimeWindow[] = [makeWindow(monday, 9, 12)];
    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    expect(slots.every((s) => s.isAvailable)).toBe(true);
  });

  it("should ignore no-show appointments", async () => {
    const monday = new Date(2026, 1, 23);
    const apptStart = new Date(monday);
    apptStart.setHours(10, 0, 0, 0);
    const apptEnd = new Date(monday);
    apptEnd.setHours(10, 30, 0, 0);

    const repo = createMockAppointmentRepo([
      createAppointment(apptStart, apptEnd, AppointmentStatus.NO_SHOW),
    ]);
    const calculator = new FreeSlotCalculator(repo);

    const windows: TimeWindow[] = [makeWindow(monday, 9, 12)];
    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    expect(slots.every((s) => s.isAvailable)).toBe(true);
  });

  it("should handle appointment starting exactly at slot boundary", async () => {
    const monday = new Date(2026, 1, 23);
    const apptStart = new Date(monday);
    apptStart.setHours(9, 30, 0, 0);
    const apptEnd = new Date(monday);
    apptEnd.setHours(10, 0, 0, 0);

    const repo = createMockAppointmentRepo([
      createAppointment(apptStart, apptEnd, AppointmentStatus.CONFIRMED),
    ]);
    const calculator = new FreeSlotCalculator(repo);

    const windows: TimeWindow[] = [makeWindow(monday, 9, 11)];
    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    expect(slots).toHaveLength(4);
    // 9:00-9:30 available, 9:30-10:00 occupied, 10:00-10:30 available, 10:30-11:00 available
    expect(slots[0].isAvailable).toBe(true);
    expect(slots[1].isAvailable).toBe(false);
    expect(slots[2].isAvailable).toBe(true);
    expect(slots[3].isAvailable).toBe(true);
  });

  it("should handle partial overlap with an appointment", async () => {
    const monday = new Date(2026, 1, 23);
    // Appointment from 9:15 to 9:45 overlaps two 30-min slots
    const apptStart = new Date(monday);
    apptStart.setHours(9, 15, 0, 0);
    const apptEnd = new Date(monday);
    apptEnd.setHours(9, 45, 0, 0);

    const repo = createMockAppointmentRepo([
      createAppointment(apptStart, apptEnd, AppointmentStatus.PENDING),
    ]);
    const calculator = new FreeSlotCalculator(repo);

    const windows: TimeWindow[] = [makeWindow(monday, 9, 11)];
    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      windows,
      SLOT_DURATION_MIN,
    );

    // Both 9:00-9:30 and 9:30-10:00 overlap with 9:15-9:45
    expect(slots[0].isAvailable).toBe(false);
    expect(slots[1].isAvailable).toBe(false);
    expect(slots[2].isAvailable).toBe(true);
    expect(slots[3].isAvailable).toBe(true);
  });

  it("should return empty array when windows are empty", async () => {
    const repo = createMockAppointmentRepo([]);
    const calculator = new FreeSlotCalculator(repo);

    const slots = await calculator.calculate(
      CLINIC_ID,
      DOCTOR_ID,
      [],
      SLOT_DURATION_MIN,
    );

    expect(slots).toHaveLength(0);
  });
});
