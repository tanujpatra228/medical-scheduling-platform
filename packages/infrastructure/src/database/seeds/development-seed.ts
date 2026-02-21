import { DataSource } from "typeorm";
import { ClinicEntity } from "../entities/clinic.entity";
import { UserEntity, UserRoleEnum } from "../entities/user.entity";
import { DoctorEntity } from "../entities/doctor.entity";
import { PatientEntity } from "../entities/patient.entity";
import { AvailabilityRuleEntity } from "../entities/availability-rule.entity";
import { Argon2PasswordHasher } from "../../auth/argon2-password-hasher";

// Hardcoded UUIDs for idempotent seeding
const SEED_IDS = {
  clinic: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  adminUser: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  doctorUser1: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  doctorUser2: "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  patientUser1: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  patientUser2: "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  patientUser3: "d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  doctor1: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  doctor2: "e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  patient1: "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  patient2: "f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  patient3: "f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
} as const;

// Weekday constants (Monday=1 through Friday=5, matching JS getDay() convention)
const MONDAY = 1;
const FRIDAY = 5;

export async function seedDevelopmentData(
  dataSource: DataSource,
): Promise<void> {
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv !== "development" && nodeEnv !== "test") {
    console.log(
      `Skipping seed: NODE_ENV is "${nodeEnv}", expected "development" or "test"`,
    );
    return;
  }

  const clinicRepo = dataSource.getRepository(ClinicEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const doctorRepo = dataSource.getRepository(DoctorEntity);
  const patientRepo = dataSource.getRepository(PatientEntity);
  const availabilityRepo = dataSource.getRepository(AvailabilityRuleEntity);

  // Check if seed data already exists (idempotent)
  const existingClinic = await clinicRepo.findOne({
    where: { id: SEED_IDS.clinic },
  });
  if (existingClinic) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  const hasher = new Argon2PasswordHasher();

  // Hash passwords
  const [adminHash, doctorHash, patientHash] = await Promise.all([
    hasher.hash("Admin123!"),
    hasher.hash("Doctor123!"),
    hasher.hash("Patient123!"),
  ]);

  console.log("Seeding clinic...");
  await clinicRepo.save(
    clinicRepo.create({
      id: SEED_IDS.clinic,
      name: "Musterpraxis Berlin",
      slug: "musterpraxis-berlin",
      address: "Friedrichstraße 123, 10117 Berlin, Germany",
      phone: "+49 30 1234567",
      email: "info@musterpraxis.de",
      timezone: "Europe/Berlin",
      isActive: true,
    }),
  );

  console.log("Seeding users...");
  await userRepo.save([
    // Clinic Admin
    userRepo.create({
      id: SEED_IDS.adminUser,
      clinicId: SEED_IDS.clinic,
      email: "admin@musterpraxis.de",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "Musterpraxis",
      role: UserRoleEnum.CLINIC_ADMIN,
      phone: "+49 30 1234567",
      isActive: true,
    }),
    // Doctor 1
    userRepo.create({
      id: SEED_IDS.doctorUser1,
      clinicId: SEED_IDS.clinic,
      email: "mueller@musterpraxis.de",
      passwordHash: doctorHash,
      firstName: "Hans",
      lastName: "Mueller",
      role: UserRoleEnum.DOCTOR,
      phone: "+49 30 1234568",
      isActive: true,
    }),
    // Doctor 2
    userRepo.create({
      id: SEED_IDS.doctorUser2,
      clinicId: SEED_IDS.clinic,
      email: "schmidt@musterpraxis.de",
      passwordHash: doctorHash,
      firstName: "Anna",
      lastName: "Schmidt",
      role: UserRoleEnum.DOCTOR,
      phone: "+49 30 1234569",
      isActive: true,
    }),
    // Patient 1
    userRepo.create({
      id: SEED_IDS.patientUser1,
      clinicId: SEED_IDS.clinic,
      email: "max@example.de",
      passwordHash: patientHash,
      firstName: "Max",
      lastName: "Mustermann",
      role: UserRoleEnum.PATIENT,
      phone: "+49 151 1234567",
      isActive: true,
    }),
    // Patient 2
    userRepo.create({
      id: SEED_IDS.patientUser2,
      clinicId: SEED_IDS.clinic,
      email: "erika@example.de",
      passwordHash: patientHash,
      firstName: "Erika",
      lastName: "Musterfrau",
      role: UserRoleEnum.PATIENT,
      phone: "+49 151 2345678",
      isActive: true,
    }),
    // Patient 3
    userRepo.create({
      id: SEED_IDS.patientUser3,
      clinicId: SEED_IDS.clinic,
      email: "thomas@example.de",
      passwordHash: patientHash,
      firstName: "Thomas",
      lastName: "Weber",
      role: UserRoleEnum.PATIENT,
      phone: "+49 151 3456789",
      isActive: true,
    }),
  ]);

  console.log("Seeding doctors...");
  await doctorRepo.save([
    doctorRepo.create({
      id: SEED_IDS.doctor1,
      userId: SEED_IDS.doctorUser1,
      clinicId: SEED_IDS.clinic,
      specialization: "General Medicine",
      slotDurationMin: 30,
      maxDailyAppointments: 16,
    }),
    doctorRepo.create({
      id: SEED_IDS.doctor2,
      userId: SEED_IDS.doctorUser2,
      clinicId: SEED_IDS.clinic,
      specialization: "Dermatology",
      slotDurationMin: 20,
      maxDailyAppointments: 24,
    }),
  ]);

  console.log("Seeding patients...");
  await patientRepo.save([
    patientRepo.create({
      id: SEED_IDS.patient1,
      userId: SEED_IDS.patientUser1,
      clinicId: SEED_IDS.clinic,
      dateOfBirth: new Date("1985-06-15"),
      insuranceNumber: "A123456789",
      notes: null,
    }),
    patientRepo.create({
      id: SEED_IDS.patient2,
      userId: SEED_IDS.patientUser2,
      clinicId: SEED_IDS.clinic,
      dateOfBirth: new Date("1990-03-22"),
      insuranceNumber: "B987654321",
      notes: null,
    }),
    patientRepo.create({
      id: SEED_IDS.patient3,
      userId: SEED_IDS.patientUser3,
      clinicId: SEED_IDS.clinic,
      dateOfBirth: new Date("1978-11-08"),
      insuranceNumber: "C456789123",
      notes: "Allergic to penicillin",
    }),
  ]);

  console.log("Seeding availability rules...");
  const availabilityRules: Partial<AvailabilityRuleEntity>[] = [];
  const doctorIds = [SEED_IDS.doctor1, SEED_IDS.doctor2];

  // Morning block (09:00-12:00) and afternoon block (14:00-17:00) for Mon-Fri
  const timeBlocks = [
    { startTime: "09:00", endTime: "12:00" },
    { startTime: "14:00", endTime: "17:00" },
  ];

  let ruleIdCounter = 0;
  for (const doctorId of doctorIds) {
    for (let dayOfWeek = MONDAY; dayOfWeek <= FRIDAY; dayOfWeek++) {
      for (const block of timeBlocks) {
        ruleIdCounter++;
        // Generate deterministic UUIDs based on counter for idempotency
        const ruleId = `00000000-0000-4000-a000-${String(ruleIdCounter).padStart(12, "0")}`;
        availabilityRules.push(
          availabilityRepo.create({
            id: ruleId,
            clinicId: SEED_IDS.clinic,
            doctorId,
            dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            isActive: true,
          }),
        );
      }
    }
  }

  await availabilityRepo.save(availabilityRules);

  console.log("Development seed data created successfully!");
  console.log("  - 1 clinic: Musterpraxis Berlin");
  console.log("  - 1 admin: admin@musterpraxis.de / Admin123!");
  console.log("  - 2 doctors: mueller@musterpraxis.de, schmidt@musterpraxis.de / Doctor123!");
  console.log("  - 3 patients: max@example.de, erika@example.de, thomas@example.de / Patient123!");
  console.log(`  - ${availabilityRules.length} availability rules (Mon-Fri, 09:00-12:00 & 14:00-17:00)`);
}
