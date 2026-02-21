import { describe, it, expect } from "vitest";
import {
  Doctor,
  InvalidSlotDurationError,
} from "../../entities/doctor";
import {
  AvailabilityRule,
  InvalidAvailabilityRuleError,
} from "../../entities/availability-rule";
import {
  AvailabilityOverride,
  InvalidAvailabilityOverrideError,
} from "../../entities/availability-override";
import { AuditLog } from "../../entities/audit-log";
import { User } from "../../entities/user";
import { Patient } from "../../entities/patient";
import { Clinic } from "../../entities/clinic";
import { Email } from "../../value-objects/email";
import { DomainError } from "../../errors";
import { UserRole } from "@msp/shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDoctorProps(
  overrides: Partial<import("../../entities/doctor").DoctorProps> = {},
): import("../../entities/doctor").DoctorProps {
  return {
    id: "doc-1",
    userId: "user-1",
    clinicId: "clinic-1",
    specialization: "General Practice",
    slotDurationMin: 30,
    maxDailyAppointments: 20,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function createAvailabilityRuleProps(
  overrides: Partial<
    import("../../entities/availability-rule").AvailabilityRuleProps
  > = {},
): import("../../entities/availability-rule").AvailabilityRuleProps {
  return {
    id: "rule-1",
    clinicId: "clinic-1",
    doctorId: "doc-1",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function createAvailabilityOverrideProps(
  overrides: Partial<
    import("../../entities/availability-override").AvailabilityOverrideProps
  > = {},
): import("../../entities/availability-override").AvailabilityOverrideProps {
  return {
    id: "override-1",
    clinicId: "clinic-1",
    doctorId: "doc-1",
    date: new Date("2025-06-15"),
    isAvailable: false,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function createUserProps(
  overrides: Partial<import("../../entities/user").UserProps> = {},
): import("../../entities/user").UserProps {
  return {
    id: "user-1",
    clinicId: "clinic-1",
    email: Email.create("doctor@clinic.com"),
    passwordHash: "hashed-password-123",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.DOCTOR,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function createPatientProps(
  overrides: Partial<import("../../entities/patient").PatientProps> = {},
): import("../../entities/patient").PatientProps {
  return {
    id: "patient-1",
    userId: "user-1",
    clinicId: "clinic-1",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function createClinicProps(
  overrides: Partial<import("../../entities/clinic").ClinicProps> = {},
): import("../../entities/clinic").ClinicProps {
  return {
    id: "clinic-1",
    name: "Downtown Medical",
    slug: "downtown-medical",
    address: "123 Main St, Springfield",
    phone: "+1-555-0100",
    email: Email.create("info@downtown-medical.com"),
    timezone: "America/New_York",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------------

describe("Doctor", () => {
  it("should create a doctor with valid properties", () => {
    const doctor = new Doctor(createDoctorProps());
    expect(doctor.id).toBe("doc-1");
    expect(doctor.userId).toBe("user-1");
    expect(doctor.clinicId).toBe("clinic-1");
    expect(doctor.specialization).toBe("General Practice");
    expect(doctor.slotDurationMin).toBe(30);
    expect(doctor.maxDailyAppointments).toBe(20);
  });

  it("should reject slotDurationMin less than 15", () => {
    expect(
      () => new Doctor(createDoctorProps({ slotDurationMin: 10 })),
    ).toThrow(InvalidSlotDurationError);
  });

  it("should reject slotDurationMin greater than 120", () => {
    expect(
      () => new Doctor(createDoctorProps({ slotDurationMin: 150 })),
    ).toThrow(InvalidSlotDurationError);
  });

  it("should accept slotDurationMin at boundary value 15", () => {
    const doctor = new Doctor(createDoctorProps({ slotDurationMin: 15 }));
    expect(doctor.slotDurationMin).toBe(15);
  });

  it("should accept slotDurationMin at boundary value 120", () => {
    const doctor = new Doctor(createDoctorProps({ slotDurationMin: 120 }));
    expect(doctor.slotDurationMin).toBe(120);
  });

  it("should throw InvalidSlotDurationError that extends DomainError", () => {
    try {
      new Doctor(createDoctorProps({ slotDurationMin: 5 }));
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(InvalidSlotDurationError);
      expect((error as InvalidSlotDurationError).code).toBe(
        "INVALID_SLOT_DURATION",
      );
    }
  });

  describe("updateProfile", () => {
    it("should update specialization", () => {
      const doctor = new Doctor(createDoctorProps());
      doctor.updateProfile({ specialization: "Cardiology" });
      expect(doctor.specialization).toBe("Cardiology");
    });

    it("should validate slotDurationMin on update", () => {
      const doctor = new Doctor(createDoctorProps());
      expect(() =>
        doctor.updateProfile({ slotDurationMin: 5 }),
      ).toThrow(InvalidSlotDurationError);
    });

    it("should update slotDurationMin when valid", () => {
      const doctor = new Doctor(createDoctorProps());
      doctor.updateProfile({ slotDurationMin: 60 });
      expect(doctor.slotDurationMin).toBe(60);
    });

    it("should update maxDailyAppointments", () => {
      const doctor = new Doctor(createDoctorProps());
      doctor.updateProfile({ maxDailyAppointments: 30 });
      expect(doctor.maxDailyAppointments).toBe(30);
    });

    it("should update the updatedAt timestamp", () => {
      const doctor = new Doctor(createDoctorProps());
      const beforeUpdate = doctor.updatedAt;
      doctor.updateProfile({ specialization: "Dermatology" });
      expect(doctor.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });
  });

  describe("connectGoogleCalendar", () => {
    it("should set the google calendar id", () => {
      const doctor = new Doctor(createDoctorProps());
      expect(doctor.googleCalendarId).toBeUndefined();
      doctor.connectGoogleCalendar("cal-123");
      expect(doctor.googleCalendarId).toBe("cal-123");
    });

    it("should update the updatedAt timestamp", () => {
      const doctor = new Doctor(createDoctorProps());
      const before = doctor.updatedAt;
      doctor.connectGoogleCalendar("cal-456");
      expect(doctor.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("disconnectGoogleCalendar", () => {
    it("should clear the google calendar id", () => {
      const doctor = new Doctor(
        createDoctorProps({ googleCalendarId: "cal-123" }),
      );
      expect(doctor.googleCalendarId).toBe("cal-123");
      doctor.disconnectGoogleCalendar();
      expect(doctor.googleCalendarId).toBeUndefined();
    });

    it("should update the updatedAt timestamp", () => {
      const doctor = new Doctor(
        createDoctorProps({ googleCalendarId: "cal-123" }),
      );
      const before = doctor.updatedAt;
      doctor.disconnectGoogleCalendar();
      expect(doctor.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// AvailabilityRule
// ---------------------------------------------------------------------------

describe("AvailabilityRule", () => {
  it("should create a valid availability rule", () => {
    const rule = new AvailabilityRule(createAvailabilityRuleProps());
    expect(rule.id).toBe("rule-1");
    expect(rule.clinicId).toBe("clinic-1");
    expect(rule.doctorId).toBe("doc-1");
    expect(rule.dayOfWeek).toBe(1);
    expect(rule.startTime).toBe("09:00");
    expect(rule.endTime).toBe("17:00");
    expect(rule.isActive).toBe(true);
  });

  it("should reject dayOfWeek less than 0", () => {
    expect(
      () =>
        new AvailabilityRule(createAvailabilityRuleProps({ dayOfWeek: -1 })),
    ).toThrow(InvalidAvailabilityRuleError);
  });

  it("should reject dayOfWeek greater than 6", () => {
    expect(
      () =>
        new AvailabilityRule(createAvailabilityRuleProps({ dayOfWeek: 7 })),
    ).toThrow(InvalidAvailabilityRuleError);
  });

  it("should accept dayOfWeek at boundary 0 (Sunday)", () => {
    const rule = new AvailabilityRule(
      createAvailabilityRuleProps({ dayOfWeek: 0 }),
    );
    expect(rule.dayOfWeek).toBe(0);
  });

  it("should accept dayOfWeek at boundary 6 (Saturday)", () => {
    const rule = new AvailabilityRule(
      createAvailabilityRuleProps({ dayOfWeek: 6 }),
    );
    expect(rule.dayOfWeek).toBe(6);
  });

  it("should reject endTime equal to startTime", () => {
    expect(
      () =>
        new AvailabilityRule(
          createAvailabilityRuleProps({
            startTime: "09:00",
            endTime: "09:00",
          }),
        ),
    ).toThrow(InvalidAvailabilityRuleError);
  });

  it("should reject endTime before startTime", () => {
    expect(
      () =>
        new AvailabilityRule(
          createAvailabilityRuleProps({
            startTime: "17:00",
            endTime: "09:00",
          }),
        ),
    ).toThrow(InvalidAvailabilityRuleError);
  });

  it("should throw InvalidAvailabilityRuleError extending DomainError", () => {
    try {
      new AvailabilityRule(createAvailabilityRuleProps({ dayOfWeek: 9 }));
      expect.fail("Expected error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(InvalidAvailabilityRuleError);
      expect((error as InvalidAvailabilityRuleError).code).toBe(
        "INVALID_AVAILABILITY_RULE",
      );
    }
  });

  describe("update", () => {
    it("should update start and end times", () => {
      const rule = new AvailabilityRule(createAvailabilityRuleProps());
      rule.update({ startTime: "10:00", endTime: "18:00" });
      expect(rule.startTime).toBe("10:00");
      expect(rule.endTime).toBe("18:00");
    });

    it("should reject invalid times on update", () => {
      const rule = new AvailabilityRule(createAvailabilityRuleProps());
      expect(() =>
        rule.update({ startTime: "17:00", endTime: "09:00" }),
      ).toThrow(InvalidAvailabilityRuleError);
    });

    it("should update the updatedAt timestamp", () => {
      const rule = new AvailabilityRule(createAvailabilityRuleProps());
      const before = rule.updatedAt;
      rule.update({ startTime: "08:00", endTime: "16:00" });
      expect(rule.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("deactivate / activate", () => {
    it("should deactivate the rule", () => {
      const rule = new AvailabilityRule(
        createAvailabilityRuleProps({ isActive: true }),
      );
      rule.deactivate();
      expect(rule.isActive).toBe(false);
    });

    it("should activate the rule", () => {
      const rule = new AvailabilityRule(
        createAvailabilityRuleProps({ isActive: false }),
      );
      rule.activate();
      expect(rule.isActive).toBe(true);
    });

    it("should update updatedAt on deactivate", () => {
      const rule = new AvailabilityRule(createAvailabilityRuleProps());
      const before = rule.updatedAt;
      rule.deactivate();
      expect(rule.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should update updatedAt on activate", () => {
      const rule = new AvailabilityRule(
        createAvailabilityRuleProps({ isActive: false }),
      );
      const before = rule.updatedAt;
      rule.activate();
      expect(rule.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// AvailabilityOverride
// ---------------------------------------------------------------------------

describe("AvailabilityOverride", () => {
  it("should create a valid override", () => {
    const override = new AvailabilityOverride(
      createAvailabilityOverrideProps(),
    );
    expect(override.id).toBe("override-1");
    expect(override.clinicId).toBe("clinic-1");
    expect(override.doctorId).toBe("doc-1");
    expect(override.isAvailable).toBe(false);
  });

  it("should validate endTime > startTime when both are provided", () => {
    expect(
      () =>
        new AvailabilityOverride(
          createAvailabilityOverrideProps({
            startTime: "17:00",
            endTime: "09:00",
          }),
        ),
    ).toThrow(InvalidAvailabilityOverrideError);
  });

  it("should reject endTime equal to startTime", () => {
    expect(
      () =>
        new AvailabilityOverride(
          createAvailabilityOverrideProps({
            startTime: "09:00",
            endTime: "09:00",
          }),
        ),
    ).toThrow(InvalidAvailabilityOverrideError);
  });

  it("should allow override with valid start and end times", () => {
    const override = new AvailabilityOverride(
      createAvailabilityOverrideProps({
        startTime: "09:00",
        endTime: "12:00",
        isAvailable: true,
      }),
    );
    expect(override.startTime).toBe("09:00");
    expect(override.endTime).toBe("12:00");
  });

  describe("isFullDayOff", () => {
    it("should return true when isAvailable is false and no times set", () => {
      const override = new AvailabilityOverride(
        createAvailabilityOverrideProps({
          isAvailable: false,
          startTime: undefined,
          endTime: undefined,
        }),
      );
      expect(override.isFullDayOff).toBe(true);
    });

    it("should return false when isAvailable is true", () => {
      const override = new AvailabilityOverride(
        createAvailabilityOverrideProps({
          isAvailable: true,
          startTime: undefined,
          endTime: undefined,
        }),
      );
      expect(override.isFullDayOff).toBe(false);
    });

    it("should return false when times are specified even if unavailable", () => {
      const override = new AvailabilityOverride(
        createAvailabilityOverrideProps({
          isAvailable: false,
          startTime: "09:00",
          endTime: "12:00",
        }),
      );
      expect(override.isFullDayOff).toBe(false);
    });
  });

  it("should defensively copy the date", () => {
    const originalDate = new Date("2025-06-15");
    const override = new AvailabilityOverride(
      createAvailabilityOverrideProps({ date: originalDate }),
    );
    // Mutating the original date should not affect the override
    originalDate.setFullYear(2000);
    expect(override.date.getFullYear()).toBe(2025);
  });

  it("should store optional reason", () => {
    const override = new AvailabilityOverride(
      createAvailabilityOverrideProps({ reason: "Holiday" }),
    );
    expect(override.reason).toBe("Holiday");
  });

  it("should throw InvalidAvailabilityOverrideError extending DomainError", () => {
    try {
      new AvailabilityOverride(
        createAvailabilityOverrideProps({
          startTime: "17:00",
          endTime: "09:00",
        }),
      );
      expect.fail("Expected error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(InvalidAvailabilityOverrideError);
      expect((error as InvalidAvailabilityOverrideError).code).toBe(
        "INVALID_AVAILABILITY_OVERRIDE",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------

describe("AuditLog", () => {
  it("should create with correct values", () => {
    const now = new Date();
    const log = new AuditLog({
      id: "log-1",
      clinicId: "clinic-1",
      appointmentId: "appt-1",
      actorId: "user-1",
      action: "CONFIRMED",
      fromStatus: "PENDING",
      toStatus: "CONFIRMED",
      metadata: { ip: "127.0.0.1" },
      createdAt: now,
    });

    expect(log.id).toBe("log-1");
    expect(log.clinicId).toBe("clinic-1");
    expect(log.appointmentId).toBe("appt-1");
    expect(log.actorId).toBe("user-1");
    expect(log.action).toBe("CONFIRMED");
    expect(log.fromStatus).toBe("PENDING");
    expect(log.toStatus).toBe("CONFIRMED");
    expect(log.metadata).toEqual({ ip: "127.0.0.1" });
    expect(log.createdAt).toBe(now);
  });

  it("should have all readonly properties", () => {
    const log = new AuditLog({
      id: "log-1",
      clinicId: "clinic-1",
      appointmentId: "appt-1",
      actorId: "user-1",
      action: "CANCELLED",
      createdAt: new Date(),
    });

    // Verify that the properties exist and are accessible
    expect(log.id).toBeDefined();
    expect(log.clinicId).toBeDefined();
    expect(log.appointmentId).toBeDefined();
    expect(log.actorId).toBeDefined();
    expect(log.action).toBeDefined();
    expect(log.createdAt).toBeDefined();
  });

  it("should handle optional metadata being undefined", () => {
    const log = new AuditLog({
      id: "log-2",
      clinicId: "clinic-1",
      appointmentId: "appt-2",
      actorId: "user-2",
      action: "CREATED",
      createdAt: new Date(),
    });

    expect(log.metadata).toBeUndefined();
    expect(log.fromStatus).toBeUndefined();
    expect(log.toStatus).toBeUndefined();
  });

  it("should shallow-copy metadata to avoid external mutation", () => {
    const metadata: Record<string, unknown> = { key: "original" };
    const log = new AuditLog({
      id: "log-3",
      clinicId: "clinic-1",
      appointmentId: "appt-3",
      actorId: "user-3",
      action: "UPDATED",
      metadata,
      createdAt: new Date(),
    });

    // Mutating the original metadata should not affect the log
    metadata.key = "mutated";
    expect(log.metadata!.key).toBe("original");
  });
});

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

describe("User", () => {
  it("should create a user with correct properties", () => {
    const user = new User(createUserProps());
    expect(user.id).toBe("user-1");
    expect(user.clinicId).toBe("clinic-1");
    expect(user.firstName).toBe("John");
    expect(user.lastName).toBe("Doe");
    expect(user.role).toBe(UserRole.DOCTOR);
    expect(user.isActive).toBe(true);
  });

  describe("fullName", () => {
    it("should concatenate firstName and lastName", () => {
      const user = new User(createUserProps());
      expect(user.fullName).toBe("John Doe");
    });

    it("should reflect updated names", () => {
      const user = new User(createUserProps());
      user.updateProfile({ firstName: "Jane", lastName: "Smith" });
      expect(user.fullName).toBe("Jane Smith");
    });
  });

  describe("updateProfile", () => {
    it("should update firstName", () => {
      const user = new User(createUserProps());
      user.updateProfile({ firstName: "Jane" });
      expect(user.firstName).toBe("Jane");
      expect(user.lastName).toBe("Doe"); // unchanged
    });

    it("should update lastName", () => {
      const user = new User(createUserProps());
      user.updateProfile({ lastName: "Smith" });
      expect(user.firstName).toBe("John"); // unchanged
      expect(user.lastName).toBe("Smith");
    });

    it("should update phone", () => {
      const user = new User(createUserProps());
      user.updateProfile({ phone: "+1-555-0199" });
      expect(user.phone).toBe("+1-555-0199");
    });

    it("should update the updatedAt timestamp", () => {
      const user = new User(createUserProps());
      const before = user.updatedAt;
      user.updateProfile({ firstName: "Updated" });
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("updatePassword", () => {
    it("should update the password hash", () => {
      const user = new User(createUserProps());
      user.updatePassword("new-hashed-password");
      expect(user.passwordHash).toBe("new-hashed-password");
    });

    it("should update the updatedAt timestamp", () => {
      const user = new User(createUserProps());
      const before = user.updatedAt;
      user.updatePassword("new-hash");
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("deactivate / activate", () => {
    it("should deactivate the user", () => {
      const user = new User(createUserProps({ isActive: true }));
      user.deactivate();
      expect(user.isActive).toBe(false);
    });

    it("should activate the user", () => {
      const user = new User(createUserProps({ isActive: false }));
      user.activate();
      expect(user.isActive).toBe(true);
    });

    it("should update updatedAt on deactivate", () => {
      const user = new User(createUserProps());
      const before = user.updatedAt;
      user.deactivate();
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should update updatedAt on activate", () => {
      const user = new User(createUserProps({ isActive: false }));
      const before = user.updatedAt;
      user.activate();
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  it("should handle optional phone being undefined", () => {
    const user = new User(createUserProps({ phone: undefined }));
    expect(user.phone).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------

describe("Patient", () => {
  it("should create a patient with correct properties", () => {
    const patient = new Patient(createPatientProps());
    expect(patient.id).toBe("patient-1");
    expect(patient.userId).toBe("user-1");
    expect(patient.clinicId).toBe("clinic-1");
  });

  it("should handle optional fields being undefined", () => {
    const patient = new Patient(createPatientProps());
    expect(patient.dateOfBirth).toBeUndefined();
    expect(patient.insuranceNumber).toBeUndefined();
    expect(patient.notes).toBeUndefined();
  });

  describe("updateProfile", () => {
    it("should update dateOfBirth", () => {
      const patient = new Patient(createPatientProps());
      const dob = new Date("1990-05-15");
      patient.updateProfile({ dateOfBirth: dob });
      expect(patient.dateOfBirth).toBe(dob);
    });

    it("should update insuranceNumber", () => {
      const patient = new Patient(createPatientProps());
      patient.updateProfile({ insuranceNumber: "INS-12345" });
      expect(patient.insuranceNumber).toBe("INS-12345");
    });

    it("should update notes", () => {
      const patient = new Patient(createPatientProps());
      patient.updateProfile({ notes: "Allergic to penicillin" });
      expect(patient.notes).toBe("Allergic to penicillin");
    });

    it("should update multiple fields at once", () => {
      const patient = new Patient(createPatientProps());
      const dob = new Date("1985-03-20");
      patient.updateProfile({
        dateOfBirth: dob,
        insuranceNumber: "INS-999",
        notes: "No known allergies",
      });
      expect(patient.dateOfBirth).toBe(dob);
      expect(patient.insuranceNumber).toBe("INS-999");
      expect(patient.notes).toBe("No known allergies");
    });

    it("should update the updatedAt timestamp", () => {
      const patient = new Patient(createPatientProps());
      const before = patient.updatedAt;
      patient.updateProfile({ notes: "Updated notes" });
      expect(patient.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Clinic
// ---------------------------------------------------------------------------

describe("Clinic", () => {
  it("should create a clinic with correct properties", () => {
    const clinic = new Clinic(createClinicProps());
    expect(clinic.id).toBe("clinic-1");
    expect(clinic.name).toBe("Downtown Medical");
    expect(clinic.slug).toBe("downtown-medical");
    expect(clinic.address).toBe("123 Main St, Springfield");
    expect(clinic.phone).toBe("+1-555-0100");
    expect(clinic.email.toString()).toBe("info@downtown-medical.com");
    expect(clinic.timezone).toBe("America/New_York");
    expect(clinic.isActive).toBe(true);
  });

  describe("update", () => {
    it("should update name", () => {
      const clinic = new Clinic(createClinicProps());
      clinic.update({ name: "Uptown Clinic" });
      expect(clinic.name).toBe("Uptown Clinic");
    });

    it("should update address", () => {
      const clinic = new Clinic(createClinicProps());
      clinic.update({ address: "456 Oak Ave" });
      expect(clinic.address).toBe("456 Oak Ave");
    });

    it("should update phone", () => {
      const clinic = new Clinic(createClinicProps());
      clinic.update({ phone: "+1-555-0200" });
      expect(clinic.phone).toBe("+1-555-0200");
    });

    it("should update email", () => {
      const clinic = new Clinic(createClinicProps());
      const newEmail = Email.create("new@clinic.com");
      clinic.update({ email: newEmail });
      expect(clinic.email.toString()).toBe("new@clinic.com");
    });

    it("should update timezone", () => {
      const clinic = new Clinic(createClinicProps());
      clinic.update({ timezone: "Europe/London" });
      expect(clinic.timezone).toBe("Europe/London");
    });

    it("should update multiple fields at once", () => {
      const clinic = new Clinic(createClinicProps());
      clinic.update({
        name: "New Name",
        address: "New Address",
        timezone: "US/Pacific",
      });
      expect(clinic.name).toBe("New Name");
      expect(clinic.address).toBe("New Address");
      expect(clinic.timezone).toBe("US/Pacific");
    });

    it("should update the updatedAt timestamp", () => {
      const clinic = new Clinic(createClinicProps());
      const before = clinic.updatedAt;
      clinic.update({ name: "Updated" });
      expect(clinic.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should not change fields not included in update", () => {
      const clinic = new Clinic(createClinicProps());
      clinic.update({ name: "New Name" });
      expect(clinic.address).toBe("123 Main St, Springfield");
      expect(clinic.phone).toBe("+1-555-0100");
    });
  });

  describe("deactivate / activate", () => {
    it("should deactivate the clinic", () => {
      const clinic = new Clinic(createClinicProps({ isActive: true }));
      clinic.deactivate();
      expect(clinic.isActive).toBe(false);
    });

    it("should activate the clinic", () => {
      const clinic = new Clinic(createClinicProps({ isActive: false }));
      clinic.activate();
      expect(clinic.isActive).toBe(true);
    });

    it("should update updatedAt on deactivate", () => {
      const clinic = new Clinic(createClinicProps());
      const before = clinic.updatedAt;
      clinic.deactivate();
      expect(clinic.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should update updatedAt on activate", () => {
      const clinic = new Clinic(createClinicProps({ isActive: false }));
      const before = clinic.updatedAt;
      clinic.activate();
      expect(clinic.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  it("should have readonly id, slug, and createdAt", () => {
    const clinic = new Clinic(createClinicProps());
    expect(clinic.id).toBe("clinic-1");
    expect(clinic.slug).toBe("downtown-medical");
    expect(clinic.createdAt).toEqual(new Date("2025-01-01"));
  });
});
