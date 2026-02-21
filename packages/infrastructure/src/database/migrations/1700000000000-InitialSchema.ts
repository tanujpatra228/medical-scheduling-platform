import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('CLINIC_ADMIN', 'DOCTOR', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "appointment_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')`,
    );

    // 1. clinics (no foreign key dependencies)
    await queryRunner.query(`
      CREATE TABLE "clinics" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(100) NOT NULL,
        "address" TEXT NOT NULL,
        "phone" VARCHAR(50) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Berlin',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinics" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clinics_slug" UNIQUE ("slug")
      )
    `);

    // 2. users (depends on clinics)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" UUID NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "phone" VARCHAR(50),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_clinic_email" UNIQUE ("clinic_id", "email"),
        CONSTRAINT "FK_users_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_users_clinic_id" ON "users" ("clinic_id")`,
    );

    // 3. doctors (depends on users, clinics)
    await queryRunner.query(`
      CREATE TABLE "doctors" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "clinic_id" UUID NOT NULL,
        "specialization" VARCHAR(255) NOT NULL,
        "slot_duration_min" INTEGER NOT NULL DEFAULT 30,
        "max_daily_appointments" INTEGER,
        "google_calendar_id" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctors" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_doctors_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_doctors_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_doctors_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_doctors_clinic_id" ON "doctors" ("clinic_id")`,
    );

    // 4. patients (depends on users, clinics)
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "clinic_id" UUID NOT NULL,
        "date_of_birth" DATE,
        "insurance_number" VARCHAR(100),
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patients" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patients_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_patients_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_patients_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_patients_clinic_id" ON "patients" ("clinic_id")`,
    );

    // 5. appointments (depends on clinics, doctors, patients, users)
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" UUID NOT NULL,
        "doctor_id" UUID NOT NULL,
        "patient_id" UUID NOT NULL,
        "starts_at" TIMESTAMPTZ NOT NULL,
        "ends_at" TIMESTAMPTZ NOT NULL,
        "status" "appointment_status_enum" NOT NULL DEFAULT 'PENDING',
        "reason" TEXT,
        "cancellation_reason" TEXT,
        "cancelled_by" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_appointments_ends_after_starts" CHECK ("ends_at" > "starts_at"),
        CONSTRAINT "FK_appointments_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_cancelled_by" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_clinic_id" ON "appointments" ("clinic_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_doctor_date" ON "appointments" ("doctor_id", "starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_patient_id" ON "appointments" ("patient_id")`,
    );

    // 6. availability_rules (depends on clinics, doctors)
    await queryRunner.query(`
      CREATE TABLE "availability_rules" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" UUID NOT NULL,
        "doctor_id" UUID NOT NULL,
        "day_of_week" SMALLINT NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_availability_rules" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_availability_rules_doctor_day_start" UNIQUE ("doctor_id", "day_of_week", "start_time"),
        CONSTRAINT "CHK_availability_rules_day_of_week" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6),
        CONSTRAINT "CHK_availability_rules_end_after_start" CHECK ("end_time" > "start_time"),
        CONSTRAINT "FK_availability_rules_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_availability_rules_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_availability_rules_clinic_id" ON "availability_rules" ("clinic_id")`,
    );

    // 7. availability_overrides (depends on clinics, doctors)
    await queryRunner.query(`
      CREATE TABLE "availability_overrides" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" UUID NOT NULL,
        "doctor_id" UUID NOT NULL,
        "date" DATE NOT NULL,
        "start_time" TIME,
        "end_time" TIME,
        "is_available" BOOLEAN NOT NULL,
        "reason" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_availability_overrides" PRIMARY KEY ("id"),
        CONSTRAINT "FK_availability_overrides_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_availability_overrides_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_availability_overrides_doctor_date" ON "availability_overrides" ("doctor_id", "date")`,
    );

    // 8. audit_logs (depends on clinics, appointments, users)
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" UUID NOT NULL,
        "appointment_id" UUID NOT NULL,
        "actor_id" UUID NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "from_status" VARCHAR(20),
        "to_status" VARCHAR(20),
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_audit_logs_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_audit_logs_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_clinic_id" ON "audit_logs" ("clinic_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_appointment" ON "audit_logs" ("appointment_id", "created_at")`,
    );

    // 9. refresh_tokens (depends on users)
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "token_hash" VARCHAR(255) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order

    // 9. refresh_tokens
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_tokens_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    // 8. audit_logs
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_logs_appointment"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_clinic_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);

    // 7. availability_overrides
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_availability_overrides_doctor_date"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "availability_overrides"`);

    // 6. availability_rules
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_availability_rules_clinic_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "availability_rules"`);

    // 5. appointments
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_appointments_patient_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_appointments_doctor_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_appointments_clinic_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);

    // 4. patients
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_patients_clinic_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patients"`);

    // 3. doctors
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_doctors_clinic_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctors"`);

    // 2. users
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_clinic_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // 1. clinics
    await queryRunner.query(`DROP TABLE IF EXISTS "clinics"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
