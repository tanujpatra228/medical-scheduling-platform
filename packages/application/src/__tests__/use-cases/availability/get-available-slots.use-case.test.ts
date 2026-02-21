import { describe, it, expect, vi } from "vitest";
import { Doctor, Clinic, Email } from "@msp/domain";
import {
  GetAvailableSlotsUseCase,
  DoctorNotFoundError,
} from "../../../use-cases/availability/get-available-slots.use-case";
import { IDoctorRepository } from "../../../ports/repositories/doctor.repository.port";
import { IClinicRepository } from "../../../ports/repositories/clinic.repository.port";
import { AvailabilityExpander, TimeWindow } from "../../../services/calendar/availability-expander";
import { OverrideMerger } from "../../../services/calendar/override-merger";
import { FreeSlotCalculator, Slot } from "../../../services/calendar/free-slot-calculator";

const CLINIC_ID = "clinic-1";
const DOCTOR_ID = "doctor-1";

function createDoctor(): Doctor {
  const now = new Date();
  return new Doctor({
    id: DOCTOR_ID,
    userId: "user-1",
    clinicId: CLINIC_ID,
    specialization: "Cardiology",
    slotDurationMin: 30,
    maxDailyAppointments: 16,
    createdAt: now,
    updatedAt: now,
  });
}

function createClinic(timezone = "Europe/Berlin"): Clinic {
  const now = new Date();
  return new Clinic({
    id: CLINIC_ID,
    name: "Test Clinic",
    slug: "test-clinic",
    address: "123 Main St",
    phone: "+491234567890",
    email: Email.create("clinic@test.com"),
    timezone,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

function createMockDoctorRepo(doctor: Doctor | null = null): IDoctorRepository {
  return {
    findById: vi.fn().mockResolvedValue(doctor),
    findByUserId: vi.fn(),
    findByClinicId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };
}

function createMockClinicRepo(clinic: Clinic | null = null): IClinicRepository {
  return {
    findById: vi.fn().mockResolvedValue(clinic),
    findBySlug: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };
}

function createMockExpander(windows: TimeWindow[] = []): AvailabilityExpander {
  return {
    expand: vi.fn().mockResolvedValue(windows),
  } as unknown as AvailabilityExpander;
}

function createMockMerger(windows: TimeWindow[] = []): OverrideMerger {
  return {
    merge: vi.fn().mockResolvedValue(windows),
  } as unknown as OverrideMerger;
}

function createMockCalculator(slots: Slot[] = []): FreeSlotCalculator {
  return {
    calculate: vi.fn().mockResolvedValue(slots),
  } as unknown as FreeSlotCalculator;
}

describe("GetAvailableSlotsUseCase", () => {
  it("should return available slots for a valid doctor", async () => {
    const doctor = createDoctor();
    const clinic = createClinic();
    const monday = new Date(2026, 1, 23);

    const startsAt = new Date(monday);
    startsAt.setHours(9, 0, 0, 0);
    const endsAt = new Date(monday);
    endsAt.setHours(9, 30, 0, 0);

    const expectedSlots: Slot[] = [
      { startsAt, endsAt, isAvailable: true },
    ];

    const windows: TimeWindow[] = [{ startsAt, endsAt: new Date(monday.setHours(17, 0, 0, 0)) }];
    const mergedWindows = [...windows];

    const doctorRepo = createMockDoctorRepo(doctor);
    const clinicRepo = createMockClinicRepo(clinic);
    const expander = createMockExpander(windows);
    const merger = createMockMerger(mergedWindows);
    const calculator = createMockCalculator(expectedSlots);

    const useCase = new GetAvailableSlotsUseCase(
      doctorRepo,
      clinicRepo,
      expander,
      merger,
      calculator,
    );

    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 1, 23);
    const result = await useCase.execute(CLINIC_ID, DOCTOR_ID, from, to);

    expect(result).toEqual(expectedSlots);
    expect(doctorRepo.findById).toHaveBeenCalledWith(CLINIC_ID, DOCTOR_ID);
    expect(clinicRepo.findById).toHaveBeenCalledWith(CLINIC_ID);
    expect((expander.expand as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      CLINIC_ID,
      DOCTOR_ID,
      from,
      to,
      "Europe/Berlin",
    );
    expect((calculator.calculate as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      CLINIC_ID,
      DOCTOR_ID,
      mergedWindows,
      30,
    );
  });

  it("should throw DoctorNotFoundError for an invalid doctor", async () => {
    const doctorRepo = createMockDoctorRepo(null);
    const clinicRepo = createMockClinicRepo(createClinic());
    const expander = createMockExpander();
    const merger = createMockMerger();
    const calculator = createMockCalculator();

    const useCase = new GetAvailableSlotsUseCase(
      doctorRepo,
      clinicRepo,
      expander,
      merger,
      calculator,
    );

    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 1, 23);

    await expect(
      useCase.execute(CLINIC_ID, "non-existent", from, to),
    ).rejects.toThrow(DoctorNotFoundError);

    await expect(
      useCase.execute(CLINIC_ID, "non-existent", from, to),
    ).rejects.toThrow("Doctor not found: non-existent");
  });

  it("should use default timezone when clinic is not found", async () => {
    const doctor = createDoctor();
    const doctorRepo = createMockDoctorRepo(doctor);
    const clinicRepo = createMockClinicRepo(null); // Clinic not found
    const expander = createMockExpander([]);
    const merger = createMockMerger([]);
    const calculator = createMockCalculator([]);

    const useCase = new GetAvailableSlotsUseCase(
      doctorRepo,
      clinicRepo,
      expander,
      merger,
      calculator,
    );

    const from = new Date(2026, 1, 23);
    const to = new Date(2026, 1, 23);
    await useCase.execute(CLINIC_ID, DOCTOR_ID, from, to);

    expect((expander.expand as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      CLINIC_ID,
      DOCTOR_ID,
      from,
      to,
      "Europe/Berlin",
    );
  });
});
