import { DataSource } from "typeorm";
import { ClinicEntity } from "../entities/clinic.entity";
import { UserEntity, UserRoleEnum } from "../entities/user.entity";
import { DoctorEntity } from "../entities/doctor.entity";
import { PatientEntity } from "../entities/patient.entity";
import { AppointmentEntity, AppointmentStatusEnum } from "../entities/appointment.entity";
import { AvailabilityRuleEntity } from "../entities/availability-rule.entity";
import { Argon2PasswordHasher } from "../../auth/argon2-password-hasher";

const CLINIC_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const ADMIN_USER_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

const PASSWORD = "Test@123";

// Weekday constants
const MONDAY = 1;
const FRIDAY = 5;

function generateUuid(prefix: string, index: number): string {
  const hex = index.toString(16).padStart(4, "0");
  return `${prefix}0000-0000-4000-a000-00000000${hex}`;
}

interface DoctorSeedData {
  firstName: string;
  lastName: string;
  specialization: string;
  slotDurationMin: number;
  maxDailyAppointments: number;
  phone: string;
}

interface PatientSeedData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  insuranceNumber: string;
  notes: string | null;
  phone: string;
}

const DOCTOR_DATA: DoctorSeedData[] = [
  { firstName: "Hans", lastName: "Mueller", specialization: "General Medicine", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000001" },
  { firstName: "Anna", lastName: "Schmidt", specialization: "Dermatology", slotDurationMin: 20, maxDailyAppointments: 24, phone: "+49 30 1000002" },
  { firstName: "Klaus", lastName: "Fischer", specialization: "Cardiology", slotDurationMin: 45, maxDailyAppointments: 12, phone: "+49 30 1000003" },
  { firstName: "Petra", lastName: "Weber", specialization: "Pediatrics", slotDurationMin: 30, maxDailyAppointments: 20, phone: "+49 30 1000004" },
  { firstName: "Wolfgang", lastName: "Wagner", specialization: "Orthopedics", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000005" },
  { firstName: "Sabine", lastName: "Becker", specialization: "Neurology", slotDurationMin: 45, maxDailyAppointments: 12, phone: "+49 30 1000006" },
  { firstName: "Juergen", lastName: "Hoffmann", specialization: "Ophthalmology", slotDurationMin: 20, maxDailyAppointments: 24, phone: "+49 30 1000007" },
  { firstName: "Monika", lastName: "Schaefer", specialization: "Gynecology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000008" },
  { firstName: "Dieter", lastName: "Koch", specialization: "Urology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000009" },
  { firstName: "Ursula", lastName: "Richter", specialization: "Psychiatry", slotDurationMin: 60, maxDailyAppointments: 8, phone: "+49 30 1000010" },
  { firstName: "Thomas", lastName: "Klein", specialization: "Radiology", slotDurationMin: 20, maxDailyAppointments: 24, phone: "+49 30 1000011" },
  { firstName: "Brigitte", lastName: "Wolf", specialization: "Endocrinology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000012" },
  { firstName: "Helmut", lastName: "Schroeder", specialization: "Gastroenterology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000013" },
  { firstName: "Renate", lastName: "Neumann", specialization: "Rheumatology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000014" },
  { firstName: "Gerhard", lastName: "Schwarz", specialization: "Pulmonology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000015" },
  { firstName: "Ingrid", lastName: "Zimmermann", specialization: "Allergology", slotDurationMin: 20, maxDailyAppointments: 24, phone: "+49 30 1000016" },
  { firstName: "Manfred", lastName: "Braun", specialization: "Anesthesiology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000017" },
  { firstName: "Erika", lastName: "Krueger", specialization: "Oncology", slotDurationMin: 45, maxDailyAppointments: 12, phone: "+49 30 1000018" },
  { firstName: "Friedrich", lastName: "Hartmann", specialization: "ENT", slotDurationMin: 20, maxDailyAppointments: 24, phone: "+49 30 1000019" },
  { firstName: "Hildegard", lastName: "Lange", specialization: "Nephrology", slotDurationMin: 30, maxDailyAppointments: 16, phone: "+49 30 1000020" },
];

const PATIENT_DATA: PatientSeedData[] = [
  { firstName: "Max", lastName: "Mustermann", dateOfBirth: "1985-06-15", insuranceNumber: "DE100000001", notes: null, phone: "+49 151 2000001" },
  { firstName: "Sophie", lastName: "Bauer", dateOfBirth: "1990-03-22", insuranceNumber: "DE100000002", notes: null, phone: "+49 151 2000002" },
  { firstName: "Lukas", lastName: "Huber", dateOfBirth: "1978-11-08", insuranceNumber: "DE100000003", notes: "Allergic to penicillin", phone: "+49 151 2000003" },
  { firstName: "Lena", lastName: "Maier", dateOfBirth: "1995-01-30", insuranceNumber: "DE100000004", notes: null, phone: "+49 151 2000004" },
  { firstName: "Felix", lastName: "Schulz", dateOfBirth: "1982-07-19", insuranceNumber: "DE100000005", notes: "Diabetes Type 2", phone: "+49 151 2000005" },
  { firstName: "Marie", lastName: "Frank", dateOfBirth: "1992-09-12", insuranceNumber: "DE100000006", notes: null, phone: "+49 151 2000006" },
  { firstName: "Paul", lastName: "Berger", dateOfBirth: "1970-04-25", insuranceNumber: "DE100000007", notes: "Hypertension", phone: "+49 151 2000007" },
  { firstName: "Laura", lastName: "Winkler", dateOfBirth: "1988-12-03", insuranceNumber: "DE100000008", notes: null, phone: "+49 151 2000008" },
  { firstName: "Jonas", lastName: "Lorenz", dateOfBirth: "2000-02-14", insuranceNumber: "DE100000009", notes: null, phone: "+49 151 2000009" },
  { firstName: "Hannah", lastName: "Baumann", dateOfBirth: "1975-08-21", insuranceNumber: "DE100000010", notes: "Asthma", phone: "+49 151 2000010" },
  { firstName: "Leon", lastName: "Herrmann", dateOfBirth: "1998-05-07", insuranceNumber: "DE100000011", notes: null, phone: "+49 151 2000011" },
  { firstName: "Mia", lastName: "Koenig", dateOfBirth: "1986-10-18", insuranceNumber: "DE100000012", notes: null, phone: "+49 151 2000012" },
  { firstName: "Tim", lastName: "Walter", dateOfBirth: "1993-06-29", insuranceNumber: "DE100000013", notes: null, phone: "+49 151 2000013" },
  { firstName: "Klara", lastName: "Mayer", dateOfBirth: "1980-03-11", insuranceNumber: "DE100000014", notes: "Allergic to ibuprofen", phone: "+49 151 2000014" },
  { firstName: "Niklas", lastName: "Kaiser", dateOfBirth: "1972-12-24", insuranceNumber: "DE100000015", notes: null, phone: "+49 151 2000015" },
  { firstName: "Emma", lastName: "Fuchs", dateOfBirth: "1996-07-08", insuranceNumber: "DE100000016", notes: null, phone: "+49 151 2000016" },
  { firstName: "Benjamin", lastName: "Scholz", dateOfBirth: "1984-09-15", insuranceNumber: "DE100000017", notes: "Lactose intolerant", phone: "+49 151 2000017" },
  { firstName: "Johanna", lastName: "Moeller", dateOfBirth: "1991-01-20", insuranceNumber: "DE100000018", notes: null, phone: "+49 151 2000018" },
  { firstName: "David", lastName: "Peters", dateOfBirth: "1977-11-02", insuranceNumber: "DE100000019", notes: null, phone: "+49 151 2000019" },
  { firstName: "Lina", lastName: "Sommer", dateOfBirth: "1999-04-16", insuranceNumber: "DE100000020", notes: null, phone: "+49 151 2000020" },
  { firstName: "Elias", lastName: "Vogt", dateOfBirth: "1983-08-30", insuranceNumber: "DE100000021", notes: "High cholesterol", phone: "+49 151 2000021" },
  { firstName: "Amelie", lastName: "Stein", dateOfBirth: "1994-02-07", insuranceNumber: "DE100000022", notes: null, phone: "+49 151 2000022" },
  { firstName: "Anton", lastName: "Jansen", dateOfBirth: "1969-06-13", insuranceNumber: "DE100000023", notes: "Pacemaker", phone: "+49 151 2000023" },
  { firstName: "Charlotte", lastName: "Brandt", dateOfBirth: "1987-10-25", insuranceNumber: "DE100000024", notes: null, phone: "+49 151 2000024" },
  { firstName: "Moritz", lastName: "Haas", dateOfBirth: "2001-03-19", insuranceNumber: "DE100000025", notes: null, phone: "+49 151 2000025" },
  { firstName: "Greta", lastName: "Schreiber", dateOfBirth: "1976-07-04", insuranceNumber: "DE100000026", notes: "Thyroid condition", phone: "+49 151 2000026" },
  { firstName: "Oskar", lastName: "Graf", dateOfBirth: "1989-12-31", insuranceNumber: "DE100000027", notes: null, phone: "+49 151 2000027" },
  { firstName: "Frieda", lastName: "Dietrich", dateOfBirth: "1981-05-22", insuranceNumber: "DE100000028", notes: null, phone: "+49 151 2000028" },
  { firstName: "Karl", lastName: "Werner", dateOfBirth: "1973-09-09", insuranceNumber: "DE100000029", notes: "Allergic to latex", phone: "+49 151 2000029" },
  { firstName: "Ida", lastName: "Roth", dateOfBirth: "1997-01-17", insuranceNumber: "DE100000030", notes: null, phone: "+49 151 2000030" },
];

const APPOINTMENT_REASONS = [
  "Annual checkup",
  "Follow-up visit",
  "Persistent headache",
  "Back pain consultation",
  "Skin rash examination",
  "Blood pressure monitoring",
  "Flu symptoms",
  "Vaccination",
  "Joint pain",
  "Allergy consultation",
  "Vision check",
  "Chest discomfort",
  "Fatigue and dizziness",
  "Prescription renewal",
  "Lab results review",
];

function buildEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
}

function createAppointmentTimes(
  baseDate: Date,
  dayOffset: number,
  hourOffset: number,
  durationMin: number,
): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(baseDate);
  startsAt.setDate(startsAt.getDate() + dayOffset);
  startsAt.setHours(hourOffset, 0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setMinutes(endsAt.getMinutes() + durationMin);

  return { startsAt, endsAt };
}

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
  const appointmentRepo = dataSource.getRepository(AppointmentEntity);
  const availabilityRepo = dataSource.getRepository(AvailabilityRuleEntity);

  const existingClinic = await clinicRepo.findOne({
    where: { id: CLINIC_ID },
  });
  if (existingClinic) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  const hasher = new Argon2PasswordHasher();
  const passwordHash = await hasher.hash(PASSWORD);

  // --- Clinic ---
  console.log("Seeding clinic...");
  await clinicRepo.save(
    clinicRepo.create({
      id: CLINIC_ID,
      name: "Musterpraxis Berlin",
      slug: "musterpraxis-berlin",
      address: "Friedrichstrasse 123, 10117 Berlin, Germany",
      phone: "+49 30 1234567",
      email: "info@musterpraxis.de",
      timezone: "Europe/Berlin",
      isActive: true,
    }),
  );

  // --- Admin User ---
  console.log("Seeding admin...");
  await userRepo.save(
    userRepo.create({
      id: ADMIN_USER_ID,
      clinicId: CLINIC_ID,
      email: "admin@gmail.com",
      passwordHash,
      firstName: "Admin",
      lastName: "Klinikleitung",
      role: UserRoleEnum.CLINIC_ADMIN,
      phone: "+49 30 1234567",
      isActive: true,
    }),
  );

  // --- Doctor Users ---
  console.log("Seeding 20 doctors...");
  const doctorUserIds: string[] = [];
  const doctorProfileIds: string[] = [];

  const doctorUsers = DOCTOR_DATA.map((doc, i) => {
    const userId = generateUuid("c0ee", i + 1);
    doctorUserIds.push(userId);
    return userRepo.create({
      id: userId,
      clinicId: CLINIC_ID,
      email: buildEmail(doc.firstName, doc.lastName),
      passwordHash,
      firstName: doc.firstName,
      lastName: doc.lastName,
      role: UserRoleEnum.DOCTOR,
      phone: doc.phone,
      isActive: true,
    });
  });
  await userRepo.save(doctorUsers);

  const doctorProfiles = DOCTOR_DATA.map((doc, i) => {
    const doctorId = generateUuid("e0ee", i + 1);
    doctorProfileIds.push(doctorId);
    return doctorRepo.create({
      id: doctorId,
      userId: doctorUserIds[i],
      clinicId: CLINIC_ID,
      specialization: doc.specialization,
      slotDurationMin: doc.slotDurationMin,
      maxDailyAppointments: doc.maxDailyAppointments,
    });
  });
  await doctorRepo.save(doctorProfiles);

  // --- Patient Users ---
  console.log("Seeding 30 patients...");
  const patientUserIds: string[] = [];
  const patientProfileIds: string[] = [];

  const patientUsers = PATIENT_DATA.map((pat, i) => {
    const userId = generateUuid("d0ee", i + 1);
    patientUserIds.push(userId);
    return userRepo.create({
      id: userId,
      clinicId: CLINIC_ID,
      email: buildEmail(pat.firstName, pat.lastName),
      passwordHash,
      firstName: pat.firstName,
      lastName: pat.lastName,
      role: UserRoleEnum.PATIENT,
      phone: pat.phone,
      isActive: true,
    });
  });
  await userRepo.save(patientUsers);

  const patientProfiles = PATIENT_DATA.map((pat, i) => {
    const patientId = generateUuid("f0ee", i + 1);
    patientProfileIds.push(patientId);
    return patientRepo.create({
      id: patientId,
      userId: patientUserIds[i],
      clinicId: CLINIC_ID,
      dateOfBirth: new Date(pat.dateOfBirth),
      insuranceNumber: pat.insuranceNumber,
      notes: pat.notes,
    });
  });
  await patientRepo.save(patientProfiles);

  // --- Availability Rules (Mon-Fri for all doctors) ---
  console.log("Seeding availability rules...");
  const timeBlocks = [
    { startTime: "09:00", endTime: "12:00" },
    { startTime: "14:00", endTime: "17:00" },
  ];

  let ruleCounter = 0;
  const availabilityRules = doctorProfileIds.flatMap((doctorId) => {
    const rules: ReturnType<typeof availabilityRepo.create>[] = [];
    for (let day = MONDAY; day <= FRIDAY; day++) {
      for (const block of timeBlocks) {
        ruleCounter++;
        rules.push(
          availabilityRepo.create({
            id: `00000000-0000-4000-a000-${String(ruleCounter).padStart(12, "0")}`,
            clinicId: CLINIC_ID,
            doctorId,
            dayOfWeek: day,
            startTime: block.startTime,
            endTime: block.endTime,
            isActive: true,
          }),
        );
      }
    }
    return rules;
  });
  await availabilityRepo.save(availabilityRules);

  // --- Appointments ---
  console.log("Seeding appointments...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statuses: AppointmentStatusEnum[] = [
    AppointmentStatusEnum.COMPLETED,
    AppointmentStatusEnum.CONFIRMED,
    AppointmentStatusEnum.PENDING,
  ];

  let apptCounter = 0;
  const appointments: ReturnType<typeof appointmentRepo.create>[] = [];

  // Past appointments (completed) — spread across last 14 days
  for (let i = 0; i < 20; i++) {
    const doctorIdx = i % doctorProfileIds.length;
    const patientIdx = i % patientProfileIds.length;
    const dayOffset = -(14 - i); // -14 to -1 days ago (skipping some)
    const hour = 9 + (i % 7); // 9:00 to 15:00
    const duration = DOCTOR_DATA[doctorIdx].slotDurationMin;

    const { startsAt, endsAt } = createAppointmentTimes(today, dayOffset, hour, duration);
    apptCounter++;

    appointments.push(
      appointmentRepo.create({
        id: generateUuid("aa00", apptCounter),
        clinicId: CLINIC_ID,
        doctorId: doctorProfileIds[doctorIdx],
        patientId: patientProfileIds[patientIdx],
        startsAt,
        endsAt,
        status: AppointmentStatusEnum.COMPLETED,
        reason: APPOINTMENT_REASONS[i % APPOINTMENT_REASONS.length],
      }),
    );
  }

  // Upcoming appointments (confirmed) — next 7 days
  for (let i = 0; i < 20; i++) {
    const doctorIdx = (i + 5) % doctorProfileIds.length;
    const patientIdx = (i + 3) % patientProfileIds.length;
    const dayOffset = 1 + (i % 7); // 1 to 7 days from now
    const hour = 9 + (i % 7);
    const duration = DOCTOR_DATA[doctorIdx].slotDurationMin;

    const { startsAt, endsAt } = createAppointmentTimes(today, dayOffset, hour, duration);
    apptCounter++;

    appointments.push(
      appointmentRepo.create({
        id: generateUuid("aa00", apptCounter),
        clinicId: CLINIC_ID,
        doctorId: doctorProfileIds[doctorIdx],
        patientId: patientProfileIds[patientIdx],
        startsAt,
        endsAt,
        status: AppointmentStatusEnum.CONFIRMED,
        reason: APPOINTMENT_REASONS[(i + 5) % APPOINTMENT_REASONS.length],
      }),
    );
  }

  // Pending appointments — next 8-14 days
  for (let i = 0; i < 10; i++) {
    const doctorIdx = (i + 10) % doctorProfileIds.length;
    const patientIdx = (i + 15) % patientProfileIds.length;
    const dayOffset = 8 + (i % 7);
    const hour = 10 + (i % 6);
    const duration = DOCTOR_DATA[doctorIdx].slotDurationMin;

    const { startsAt, endsAt } = createAppointmentTimes(today, dayOffset, hour, duration);
    apptCounter++;

    appointments.push(
      appointmentRepo.create({
        id: generateUuid("aa00", apptCounter),
        clinicId: CLINIC_ID,
        doctorId: doctorProfileIds[doctorIdx],
        patientId: patientProfileIds[patientIdx],
        startsAt,
        endsAt,
        status: AppointmentStatusEnum.PENDING,
        reason: APPOINTMENT_REASONS[(i + 10) % APPOINTMENT_REASONS.length],
      }),
    );
  }

  await appointmentRepo.save(appointments);

  // --- Summary ---
  console.log("\nDevelopment seed data created successfully!");
  console.log("=============================================");
  console.log(`  Clinic:        Musterpraxis Berlin`);
  console.log(`  Admin:         admin@gmail.com / ${PASSWORD}`);
  console.log(`  Doctors:       ${DOCTOR_DATA.length} (all use ${PASSWORD})`);
  console.log(`  Patients:      ${PATIENT_DATA.length} (all use ${PASSWORD})`);
  console.log(`  Availability:  ${availabilityRules.length} rules (Mon-Fri, 09-12 & 14-17)`);
  console.log(`  Appointments:  ${appointments.length} (20 completed, 20 confirmed, 10 pending)`);
  console.log("=============================================");
  console.log("\nSample logins:");
  console.log(`  Admin:   admin@gmail.com`);
  console.log(`  Doctor:  ${buildEmail(DOCTOR_DATA[0].firstName, DOCTOR_DATA[0].lastName)}`);
  console.log(`  Patient: ${buildEmail(PATIENT_DATA[0].firstName, PATIENT_DATA[0].lastName)}`);
}
