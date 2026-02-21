# Medical Scheduling Platform -- Architecture & Implementation Plan

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [Domain Layer Design](#3-domain-layer-design)
4. [Application Layer Design](#4-application-layer-design)
5. [Infrastructure Layer Design](#5-infrastructure-layer-design)
6. [API Layer Design](#6-api-layer-design)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Docker & DevOps](#8-docker--devops)
9. [Security Considerations](#9-security-considerations)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Architecture Overview

### Clean Architecture Layers

The system follows strict Clean Architecture with inward-pointing dependencies. No inner layer knows about any outer layer. Communication crosses boundaries only through ports (interfaces) defined in the inner layers and implemented by the outer layers.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (apps/web)                         │
│         React 19 + TanStack Query + React Router + Tailwind        │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐   │
│  │   Pages   │  │Components │  │   Hooks   │  │  API Client   │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────┬───────┘   │
└───────────────────────────────────────────────────────┬─────────────┘
                                                        │ HTTP/JSON
┌───────────────────────────────────────────────────────┼─────────────┐
│                     API LAYER (apps/api)               │             │
│                Express.js + TypeScript                  │             │
│                                                        ▼             │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────────────┐    │
│  │  Routes  │──│ Middleware │──│      Thin Controllers        │    │
│  │ /api/v1  │  │ Auth,RBAC  │  │  (validate → call use case)  │    │
│  └──────────┘  │ Validation │  └──────────────┬───────────────┘    │
│                │ Rate Limit │                  │                     │
│                │ Tenant Ctx │                  │                     │
│                └────────────┘                  │                     │
└────────────────────────────────────────────────┼─────────────────────┘
                                                 │ calls
┌────────────────────────────────────────────────┼─────────────────────┐
│              APPLICATION LAYER (packages/application)                │
│                                                │                     │
│  ┌─────────────────────────────────────────────▼──────────────────┐ │
│  │                       USE CASES                                │ │
│  │  BookAppointment, CancelAppointment, GetAvailableSlots, ...   │ │
│  └──────────┬─────────────────────────────────┬──────────────────┘ │
│             │                                  │                     │
│  ┌──────────▼──────────┐          ┌────────────▼─────────────┐     │
│  │    PORT INTERFACES  │          │          DTOs             │     │
│  │  IAppointmentRepo   │          │  BookAppointmentDTO      │     │
│  │  IUserRepo          │          │  AppointmentResponseDTO  │     │
│  │  ICachePort         │          │  SlotResponseDTO         │     │
│  │  IEmailPort         │          └──────────────────────────┘     │
│  │  IJobQueuePort      │                                           │
│  └──────────┬──────────┘                                           │
└─────────────┼───────────────────────────────────────────────────────┘
              │ depends on (interfaces only)
┌─────────────┼───────────────────────────────────────────────────────┐
│             │         DOMAIN LAYER (packages/domain)                │
│             │                                                       │
│  ┌──────────▼──────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │      ENTITIES       │  │ VALUE OBJECTS   │  │ DOMAIN EVENTS  │  │
│  │  Appointment        │  │ TimeSlot        │  │ AppointmentCre │  │
│  │  User               │  │ AppointmentStat │  │ AppointmentCon │  │
│  │  Clinic             │  │ UserRole        │  │ AppointmentCan │  │
│  │  Doctor             │  │ Email           │  │ AppointmentCom │  │
│  │  Patient            │  │ DateRange       │  │ AppointmentNoS │  │
│  │  AvailabilityRule   │  └────────────────┘  └────────────────┘  │
│  │  AvailabilityOverr. │                                           │
│  │  AuditLog           │  ┌────────────────────────────────────┐  │
│  └─────────────────────┘  │   APPOINTMENT STATE MACHINE        │  │
│                            │   PENDING → CONFIRMED              │  │
│                            │   CONFIRMED → CANCELLED            │  │
│                            │   CONFIRMED → COMPLETED            │  │
│                            │   CONFIRMED → NO_SHOW              │  │
│                            └────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
              ▲ implements ports
┌─────────────┼───────────────────────────────────────────────────────┐
│      INFRASTRUCTURE LAYER (packages/infrastructure)                 │
│                                                                     │
│  ┌────────────────┐  ┌────────────┐  ┌─────────────────────────┐  │
│  │ TypeORM Repos  │  │Redis Cache │  │  BullMQ Job Queue       │  │
│  │ (implements    │  │ Adapter    │  │  Adapter                │  │
│  │  port ifaces)  │  └────────────┘  └─────────────────────────┘  │
│  └───────┬────────┘                                                │
│          │            ┌────────────┐  ┌─────────────────────────┐  │
│          │            │Email Svc   │  │  Google Calendar Sync   │  │
│          │            │ (Resend)   │  │  Adapter                │  │
│          ▼            └────────────┘  └─────────────────────────┘  │
│  ┌────────────────┐                                                │
│  │  PostgreSQL    │  ┌────────────┐                                │
│  │  (TypeORM)     │  │   Redis    │                                │
│  └────────────────┘  └────────────┘                                │
└────────────────────────────────────────────────────────────────────┘
```

### Request Flow Example: Patient Books an Appointment

```
1. POST /api/v1/appointments
       │
2. ────► Auth Middleware (verify JWT, extract userId + clinicId)
       │
3. ────► Tenant Middleware (attach clinicId to request context)
       │
4. ────► Validation Middleware (Zod schema validates request body)
       │
5. ────► AppointmentController.book()
       │
6. ────► BookAppointmentUseCase.execute(dto)
       │    ├─ Loads doctor via IUserRepository
       │    ├─ Validates slot availability via IAvailabilityRepository + ICachePort
       │    ├─ Checks business rules (no double-booking, slot within working hours)
       │    ├─ Creates Appointment entity (status = PENDING)
       │    ├─ Persists via IAppointmentRepository (transactional)
       │    ├─ Emits AppointmentCreatedEvent
       │    └─ Returns AppointmentResponseDTO
       │
7. ────► Event Handlers (async, via BullMQ)
       │    ├─ SendConfirmationEmailHandler
       │    ├─ ScheduleReminderHandler (24h before)
       │    ├─ InvalidateCacheHandler
       │    └─ CreateAuditLogHandler
       │
8. ◄──── 201 Created { appointment }
```

### Dependency Direction

```
Domain ◄── Application ◄── Infrastructure ◄── API
  (0 deps)   (depends on     (implements       (depends on
              domain only)    app ports,        application,
                              depends on        infrastructure
                              domain + app)     for DI wiring)
```

The API layer serves as the composition root where dependency injection wires everything together.

### Monorepo Package Dependency Graph

```
packages/shared        ◄── (all packages may import from shared)
    │
packages/domain        ◄── packages/application
    │                           │
    └───────────────────────────┴──── packages/infrastructure
                                              │
                                        apps/api (composition root)
                                        apps/web (independent, HTTP only)
```

---

## 2. Database Schema Design

### Entity-Relationship Overview

```
┌──────────┐       ┌──────────┐       ┌────────────────────┐
│  Clinic  │1─────*│   User   │       │  AvailabilityRule  │
└──────────┘       └──────────┘       └────────────────────┘
     │                  │ 1                     │ *
     │                  │                       │
     │             ┌────┴─────┐           ┌─────┴──────┐
     │             │          │           │            │
     │         ┌───▼──┐  ┌───▼───┐       │   (doctor) │
     │         │Doctor│  │Patient│       │            │
     │         └───┬──┘  └───┬───┘       │            │
     │             │         │           │            │
     │             │*       *│           │            │
     │         ┌───▼─────────▼───┐       │            │
     │         │   Appointment   │◄──────┘            │
     │         └───────┬─────────┘                    │
     │                 │                              │
     │            *    │                              │
     │         ┌───────▼─────────┐  ┌─────────────────────────┐
     │         │    AuditLog     │  │  AvailabilityOverride    │
     │         └─────────────────┘  └─────────────────────────┘
     │
     └──── clinic_id present on ALL tenant-scoped tables
```

### Table Definitions

#### `clinics`

| Column       | Type                    | Constraints                    |
|-------------|-------------------------|--------------------------------|
| id          | UUID                    | PK, DEFAULT gen_random_uuid()  |
| name        | VARCHAR(255)            | NOT NULL                       |
| slug        | VARCHAR(100)            | NOT NULL, UNIQUE               |
| address     | TEXT                    | NOT NULL                       |
| phone       | VARCHAR(50)             | NOT NULL                       |
| email       | VARCHAR(255)            | NOT NULL                       |
| timezone    | VARCHAR(50)             | NOT NULL, DEFAULT 'Europe/Berlin' |
| is_active   | BOOLEAN                 | NOT NULL, DEFAULT true         |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

#### `users`

| Column          | Type                    | Constraints                    |
|----------------|-------------------------|--------------------------------|
| id             | UUID                    | PK, DEFAULT gen_random_uuid()  |
| clinic_id      | UUID                    | NOT NULL, FK → clinics(id)     |
| email          | VARCHAR(255)            | NOT NULL                       |
| password_hash  | VARCHAR(255)            | NOT NULL                       |
| first_name     | VARCHAR(100)            | NOT NULL                       |
| last_name      | VARCHAR(100)            | NOT NULL                       |
| role           | ENUM('PATIENT','DOCTOR','CLINIC_ADMIN') | NOT NULL        |
| phone          | VARCHAR(50)             | NULL                           |
| is_active      | BOOLEAN                 | NOT NULL, DEFAULT true         |
| created_at     | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at     | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

**Unique constraint**: `(clinic_id, email)` -- same email can exist across different clinics.

#### `doctors`

Extended profile for users with role = DOCTOR.

| Column              | Type                    | Constraints                    |
|--------------------|-------------------------|--------------------------------|
| id                 | UUID                    | PK, DEFAULT gen_random_uuid()  |
| user_id            | UUID                    | NOT NULL, FK → users(id), UNIQUE |
| clinic_id          | UUID                    | NOT NULL, FK → clinics(id)     |
| specialization     | VARCHAR(255)            | NOT NULL                       |
| slot_duration_min  | INTEGER                 | NOT NULL, DEFAULT 30           |
| max_daily_appointments | INTEGER             | NULL                           |
| google_calendar_id | VARCHAR(255)            | NULL                           |
| created_at         | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at         | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

#### `patients`

Extended profile for users with role = PATIENT.

| Column             | Type                    | Constraints                    |
|-------------------|-------------------------|--------------------------------|
| id                | UUID                    | PK, DEFAULT gen_random_uuid()  |
| user_id           | UUID                    | NOT NULL, FK → users(id), UNIQUE |
| clinic_id         | UUID                    | NOT NULL, FK → clinics(id)     |
| date_of_birth     | DATE                    | NULL                           |
| insurance_number  | VARCHAR(100)            | NULL                           |
| notes             | TEXT                    | NULL                           |
| created_at        | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at        | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

#### `appointments`

| Column           | Type                    | Constraints                    |
|-----------------|-------------------------|--------------------------------|
| id              | UUID                    | PK, DEFAULT gen_random_uuid()  |
| clinic_id       | UUID                    | NOT NULL, FK → clinics(id)     |
| doctor_id       | UUID                    | NOT NULL, FK → doctors(id)     |
| patient_id      | UUID                    | NOT NULL, FK → patients(id)    |
| starts_at       | TIMESTAMP WITH TIME ZONE| NOT NULL                       |
| ends_at         | TIMESTAMP WITH TIME ZONE| NOT NULL                       |
| status          | ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW') | NOT NULL, DEFAULT 'PENDING' |
| reason          | TEXT                    | NULL                           |
| cancellation_reason | TEXT                | NULL                           |
| cancelled_by    | UUID                    | NULL, FK → users(id)           |
| created_at      | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at      | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

**Check constraint**: `ends_at > starts_at`

#### `availability_rules`

Weekly recurring schedule templates.

| Column       | Type                    | Constraints                    |
|-------------|-------------------------|--------------------------------|
| id          | UUID                    | PK, DEFAULT gen_random_uuid()  |
| clinic_id   | UUID                    | NOT NULL, FK → clinics(id)     |
| doctor_id   | UUID                    | NOT NULL, FK → doctors(id)     |
| day_of_week | SMALLINT                | NOT NULL, CHECK (0-6, 0=Sunday)|
| start_time  | TIME                    | NOT NULL                       |
| end_time    | TIME                    | NOT NULL                       |
| is_active   | BOOLEAN                 | NOT NULL, DEFAULT true         |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

**Check constraint**: `end_time > start_time`
**Unique constraint**: `(doctor_id, day_of_week, start_time)` -- prevents overlapping rules for the same time block.

#### `availability_overrides`

One-off overrides (day off, extra hours, holidays).

| Column       | Type                    | Constraints                    |
|-------------|-------------------------|--------------------------------|
| id          | UUID                    | PK, DEFAULT gen_random_uuid()  |
| clinic_id   | UUID                    | NOT NULL, FK → clinics(id)     |
| doctor_id   | UUID                    | NOT NULL, FK → doctors(id)     |
| date        | DATE                    | NOT NULL                       |
| start_time  | TIME                    | NULL (NULL = entire day off)   |
| end_time    | TIME                    | NULL                           |
| is_available| BOOLEAN                 | NOT NULL                       |
| reason      | VARCHAR(255)            | NULL                           |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

#### `audit_logs`

Immutable log of appointment state changes.

| Column         | Type                    | Constraints                    |
|---------------|-------------------------|--------------------------------|
| id            | UUID                    | PK, DEFAULT gen_random_uuid()  |
| clinic_id     | UUID                    | NOT NULL, FK → clinics(id)     |
| appointment_id| UUID                    | NOT NULL, FK → appointments(id)|
| actor_id      | UUID                    | NOT NULL, FK → users(id)       |
| action        | VARCHAR(50)             | NOT NULL                       |
| from_status   | VARCHAR(20)             | NULL                           |
| to_status     | VARCHAR(20)             | NOT NULL                       |
| metadata      | JSONB                   | NULL                           |
| created_at    | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

**No `updated_at`** -- audit logs are immutable, insert-only.

#### `refresh_tokens`

| Column       | Type                    | Constraints                    |
|-------------|-------------------------|--------------------------------|
| id          | UUID                    | PK, DEFAULT gen_random_uuid()  |
| user_id     | UUID                    | NOT NULL, FK → users(id)       |
| token_hash  | VARCHAR(255)            | NOT NULL, UNIQUE               |
| expires_at  | TIMESTAMP WITH TIME ZONE| NOT NULL                       |
| revoked_at  | TIMESTAMP WITH TIME ZONE| NULL                           |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()        |

### Index Strategy

```sql
-- Multi-tenant isolation (critical for query performance)
CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_availability_rules_clinic_id ON availability_rules(clinic_id);
CREATE INDEX idx_audit_logs_clinic_id ON audit_logs(clinic_id);

-- Appointment queries
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, starts_at);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(clinic_id, status);
CREATE INDEX idx_appointments_starts_at ON appointments(starts_at)
  WHERE status IN ('PENDING', 'CONFIRMED');

-- Availability lookups
CREATE INDEX idx_availability_rules_doctor ON availability_rules(doctor_id, day_of_week)
  WHERE is_active = true;
CREATE INDEX idx_availability_overrides_doctor_date ON availability_overrides(doctor_id, date);

-- Audit log queries
CREATE INDEX idx_audit_logs_appointment ON audit_logs(appointment_id, created_at);

-- Auth
CREATE UNIQUE INDEX idx_users_clinic_email ON users(clinic_id, email);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id)
  WHERE revoked_at IS NULL;
```

### TypeORM Entity Example

```typescript
// packages/infrastructure/src/database/entities/appointment.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  Index,
} from 'typeorm';
import { ClinicEntity } from './clinic.entity';
import { DoctorEntity } from './doctor.entity';
import { PatientEntity } from './patient.entity';

export enum AppointmentStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

@Entity('appointments')
@Check('"ends_at" > "starts_at"')
@Index('idx_appointments_doctor_date', ['doctor_id', 'starts_at'])
@Index('idx_appointments_clinic_id', ['clinic_id'])
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinic_id: string;

  @Column('uuid')
  doctor_id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'timestamptz' })
  starts_at: Date;

  @Column({ type: 'timestamptz' })
  ends_at: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatusEnum,
    default: AppointmentStatusEnum.PENDING,
  })
  status: AppointmentStatusEnum;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => ClinicEntity)
  @JoinColumn({ name: 'clinic_id' })
  clinic: ClinicEntity;

  @ManyToOne(() => DoctorEntity)
  @JoinColumn({ name: 'doctor_id' })
  doctor: DoctorEntity;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;
}
```

### Migration Strategy

TypeORM migrations are generated and run via CLI.

```bash
# Generate a migration from entity changes
pnpm --filter infrastructure typeorm migration:generate src/database/migrations/CreateInitialSchema

# Run migrations
pnpm --filter infrastructure typeorm migration:run

# Revert the last migration
pnpm --filter infrastructure typeorm migration:revert
```

Migrations live in `packages/infrastructure/src/database/migrations/`. They are committed to version control and run in order during deployment.

### Database Connection Configuration

```typescript
// packages/infrastructure/src/database/data-source.ts

import { DataSource } from 'typeorm';
import { config } from '../config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.DATABASE_URL, // same env var, different values per environment
  entities: [__dirname + '/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false, // NEVER true in production
  logging: config.NODE_ENV === 'development',
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20, // connection pool size
  },
});
```

**Local development**: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medical_scheduling`
**Production (Supabase)**: `DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

The application code is identical -- only the connection string changes between environments.

---

## 3. Domain Layer Design

The domain layer is the innermost ring. It has zero external dependencies -- no ORM imports, no framework imports, no infrastructure concerns. It defines pure business logic using plain TypeScript classes and interfaces.

### Directory Structure

```
packages/domain/src/
├── entities/
│   ├── appointment.entity.ts
│   ├── user.entity.ts
│   ├── clinic.entity.ts
│   ├── doctor.entity.ts
│   ├── patient.entity.ts
│   ├── availability-rule.entity.ts
│   ├── availability-override.entity.ts
│   └── audit-log.entity.ts
├── value-objects/
│   ├── appointment-status.vo.ts
│   ├── user-role.vo.ts
│   ├── email.vo.ts
│   ├── time-slot.vo.ts
│   └── date-range.vo.ts
├── events/
│   ├── domain-event.ts
│   ├── appointment-created.event.ts
│   ├── appointment-confirmed.event.ts
│   ├── appointment-cancelled.event.ts
│   ├── appointment-completed.event.ts
│   └── appointment-no-show.event.ts
├── state-machine/
│   └── appointment-state-machine.ts
├── errors/
│   ├── domain-error.ts
│   ├── invalid-state-transition.error.ts
│   ├── slot-not-available.error.ts
│   └── double-booking.error.ts
└── index.ts
```

### Value Objects

Value objects are immutable, compared by value, and encapsulate validation.

```typescript
// packages/domain/src/value-objects/email.vo.ts

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  static create(email: string): Email {
    if (!email || !email.includes('@') || email.length < 5) {
      throw new Error(`Invalid email address: ${email}`);
    }
    return new Email(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

```typescript
// packages/domain/src/value-objects/appointment-status.vo.ts

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}
```

```typescript
// packages/domain/src/value-objects/user-role.vo.ts

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
}
```

```typescript
// packages/domain/src/value-objects/time-slot.vo.ts

export class TimeSlot {
  constructor(
    public readonly startsAt: Date,
    public readonly endsAt: Date,
  ) {
    if (endsAt <= startsAt) {
      throw new Error('TimeSlot end must be after start');
    }
  }

  get durationMinutes(): number {
    return (this.endsAt.getTime() - this.startsAt.getTime()) / (1000 * 60);
  }

  overlapsWith(other: TimeSlot): boolean {
    return this.startsAt < other.endsAt && this.endsAt > other.startsAt;
  }

  equals(other: TimeSlot): boolean {
    return (
      this.startsAt.getTime() === other.startsAt.getTime() &&
      this.endsAt.getTime() === other.endsAt.getTime()
    );
  }
}
```

### Appointment State Machine

The state machine is a pure domain concept with no external dependencies. It defines which transitions are valid and rejects everything else.

```typescript
// packages/domain/src/state-machine/appointment-state-machine.ts

import { AppointmentStatus } from '../value-objects/appointment-status.vo';
import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';

type TransitionMap = Record<AppointmentStatus, AppointmentStatus[]>;

const VALID_TRANSITIONS: TransitionMap = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CANCELLED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export class AppointmentStateMachine {
  static canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    return VALID_TRANSITIONS[from].includes(to);
  }

  static transition(from: AppointmentStatus, to: AppointmentStatus): AppointmentStatus {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
    return to;
  }

  static getValidTransitions(from: AppointmentStatus): AppointmentStatus[] {
    return [...VALID_TRANSITIONS[from]];
  }
}
```

### Domain Entities

Domain entities are plain classes. They contain business logic and invariant enforcement. They are NOT TypeORM entities -- the infrastructure layer maps between domain entities and ORM entities.

```typescript
// packages/domain/src/entities/appointment.entity.ts

import { AppointmentStatus } from '../value-objects/appointment-status.vo';
import { AppointmentStateMachine } from '../state-machine/appointment-state-machine';
import { TimeSlot } from '../value-objects/time-slot.vo';
import { DomainEvent } from '../events/domain-event';
import { AppointmentCreatedEvent } from '../events/appointment-created.event';
import { AppointmentConfirmedEvent } from '../events/appointment-confirmed.event';
import { AppointmentCancelledEvent } from '../events/appointment-cancelled.event';
import { AppointmentCompletedEvent } from '../events/appointment-completed.event';
import { AppointmentNoShowEvent } from '../events/appointment-no-show.event';

export class Appointment {
  private domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly clinicId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly timeSlot: TimeSlot,
    private _status: AppointmentStatus,
    public readonly reason: string | null,
    private _cancellationReason: string | null,
    private _cancelledBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get status(): AppointmentStatus {
    return this._status;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason;
  }

  get cancelledBy(): string | null {
    return this._cancelledBy;
  }

  static create(params: {
    id: string;
    clinicId: string;
    doctorId: string;
    patientId: string;
    timeSlot: TimeSlot;
    reason?: string;
  }): Appointment {
    const now = new Date();
    const appointment = new Appointment(
      params.id,
      params.clinicId,
      params.doctorId,
      params.patientId,
      params.timeSlot,
      AppointmentStatus.PENDING,
      params.reason ?? null,
      null,
      null,
      now,
      now,
    );
    appointment.addEvent(new AppointmentCreatedEvent(appointment));
    return appointment;
  }

  confirm(): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.CONFIRMED,
    );
    this.addEvent(new AppointmentConfirmedEvent(this));
  }

  cancel(cancelledBy: string, reason?: string): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.CANCELLED,
    );
    this._cancelledBy = cancelledBy;
    this._cancellationReason = reason ?? null;
    this.addEvent(new AppointmentCancelledEvent(this));
  }

  complete(): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.COMPLETED,
    );
    this.addEvent(new AppointmentCompletedEvent(this));
  }

  markNoShow(): void {
    this._status = AppointmentStateMachine.transition(
      this._status,
      AppointmentStatus.NO_SHOW,
    );
    this.addEvent(new AppointmentNoShowEvent(this));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  private addEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
```

### Domain Events

```typescript
// packages/domain/src/events/domain-event.ts

export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor(public readonly eventName: string) {
    this.occurredAt = new Date();
  }

  abstract toPayload(): Record<string, unknown>;
}
```

```typescript
// packages/domain/src/events/appointment-created.event.ts

import { DomainEvent } from './domain-event';
import { Appointment } from '../entities/appointment.entity';

export class AppointmentCreatedEvent extends DomainEvent {
  constructor(public readonly appointment: Appointment) {
    super('APPOINTMENT_CREATED');
  }

  toPayload(): Record<string, unknown> {
    return {
      appointmentId: this.appointment.id,
      clinicId: this.appointment.clinicId,
      doctorId: this.appointment.doctorId,
      patientId: this.appointment.patientId,
      startsAt: this.appointment.timeSlot.startsAt.toISOString(),
      endsAt: this.appointment.timeSlot.endsAt.toISOString(),
      status: this.appointment.status,
    };
  }
}
```

### Domain Errors

```typescript
// packages/domain/src/errors/domain-error.ts

export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

```typescript
// packages/domain/src/errors/invalid-state-transition.error.ts

import { DomainError } from './domain-error';
import { AppointmentStatus } from '../value-objects/appointment-status.vo';

export class InvalidStateTransitionError extends DomainError {
  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(
      `Invalid appointment state transition from ${from} to ${to}`,
      'INVALID_STATE_TRANSITION',
    );
  }
}
```

### Business Rules and Invariants

The following invariants are enforced at the domain level:

1. **State machine integrity**: Only valid transitions are allowed (enforced by `AppointmentStateMachine`).
2. **Time slot validity**: `endsAt` must be strictly after `startsAt` (enforced by `TimeSlot` value object).
3. **No double-booking**: A doctor cannot have overlapping appointments (checked in use case, using `TimeSlot.overlapsWith`).
4. **Slot within availability**: An appointment slot must fall within a doctor's availability rules and not be blocked by an override (checked in use case).
5. **Cancellation metadata**: When an appointment is cancelled, `cancelledBy` and optionally `cancellationReason` must be provided.
6. **Email format**: All email addresses are validated on construction (enforced by `Email` value object).
7. **Future-only booking**: Appointments cannot be created in the past (checked in use case).
8. **Clinic scope**: All operations are scoped to a `clinicId` -- cross-clinic access is structurally impossible.

---

## 4. Application Layer Design

The application layer orchestrates domain objects and defines the boundary between the outside world and the domain. It contains use cases, port interfaces (that infrastructure implements), and DTOs.

### Directory Structure

```
packages/application/src/
├── use-cases/
│   ├── auth/
│   │   ├── login.use-case.ts
│   │   ├── register-patient.use-case.ts
│   │   └── refresh-token.use-case.ts
│   ├── appointments/
│   │   ├── book-appointment.use-case.ts
│   │   ├── confirm-appointment.use-case.ts
│   │   ├── cancel-appointment.use-case.ts
│   │   ├── complete-appointment.use-case.ts
│   │   ├── mark-no-show.use-case.ts
│   │   ├── get-appointment.use-case.ts
│   │   └── list-appointments.use-case.ts
│   ├── availability/
│   │   ├── get-available-slots.use-case.ts
│   │   ├── create-availability-rule.use-case.ts
│   │   ├── update-availability-rule.use-case.ts
│   │   ├── create-availability-override.use-case.ts
│   │   └── get-doctor-schedule.use-case.ts
│   ├── doctors/
│   │   ├── list-doctors.use-case.ts
│   │   └── get-doctor.use-case.ts
│   └── admin/
│       ├── create-doctor.use-case.ts
│       └── dashboard-stats.use-case.ts
├── ports/
│   ├── repositories/
│   │   ├── appointment.repository.port.ts
│   │   ├── user.repository.port.ts
│   │   ├── doctor.repository.port.ts
│   │   ├── patient.repository.port.ts
│   │   ├── availability-rule.repository.port.ts
│   │   ├── availability-override.repository.port.ts
│   │   ├── audit-log.repository.port.ts
│   │   └── refresh-token.repository.port.ts
│   ├── cache.port.ts
│   ├── email.port.ts
│   ├── job-queue.port.ts
│   ├── event-bus.port.ts
│   ├── password-hasher.port.ts
│   ├── token-provider.port.ts
│   └── calendar-sync.port.ts
├── dtos/
│   ├── auth/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── auth-response.dto.ts
│   ├── appointments/
│   │   ├── book-appointment.dto.ts
│   │   ├── cancel-appointment.dto.ts
│   │   └── appointment-response.dto.ts
│   ├── availability/
│   │   ├── create-rule.dto.ts
│   │   ├── create-override.dto.ts
│   │   └── slot-response.dto.ts
│   └── common/
│       ├── pagination.dto.ts
│       └── tenant-context.dto.ts
├── services/
│   ├── slot-generator.service.ts
│   └── event-dispatcher.service.ts
└── index.ts
```

### Port Interfaces

Ports define what the application layer needs from the outside world. Infrastructure implements these.

```typescript
// packages/application/src/ports/repositories/appointment.repository.port.ts

import { Appointment } from '@domain/entities/appointment.entity';
import { AppointmentStatus } from '@domain/value-objects/appointment-status.vo';
import { TimeSlot } from '@domain/value-objects/time-slot.vo';

export interface IAppointmentRepository {
  findById(id: string, clinicId: string): Promise<Appointment | null>;
  findByDoctorAndDateRange(
    doctorId: string,
    clinicId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]>;
  findByPatient(
    patientId: string,
    clinicId: string,
    options?: { status?: AppointmentStatus; limit?: number; offset?: number },
  ): Promise<Appointment[]>;
  findOverlapping(
    doctorId: string,
    clinicId: string,
    timeSlot: TimeSlot,
    excludeId?: string,
  ): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<Appointment>;
  countByDoctorAndDate(doctorId: string, clinicId: string, date: Date): Promise<number>;
}
```

```typescript
// packages/application/src/ports/cache.port.ts

export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}
```

```typescript
// packages/application/src/ports/email.port.ts

export interface EmailPayload {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string>;
}

export interface IEmailPort {
  send(payload: EmailPayload): Promise<void>;
}
```

```typescript
// packages/application/src/ports/job-queue.port.ts

export interface JobData {
  [key: string]: unknown;
}

export interface IJobQueuePort {
  enqueue(queueName: string, jobData: JobData, options?: JobOptions): Promise<void>;
  schedule(queueName: string, jobData: JobData, delayMs: number): Promise<void>;
}

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
}
```

```typescript
// packages/application/src/ports/event-bus.port.ts

import { DomainEvent } from '@domain/events/domain-event';

export interface IEventBusPort {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
```

```typescript
// packages/application/src/ports/password-hasher.port.ts

export interface IPasswordHasherPort {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}
```

```typescript
// packages/application/src/ports/token-provider.port.ts

export interface TokenPayload {
  userId: string;
  clinicId: string;
  role: string;
}

export interface ITokenProviderPort {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): TokenPayload;
}
```

### Use Case Example

```typescript
// packages/application/src/use-cases/appointments/book-appointment.use-case.ts

import { Appointment } from '@domain/entities/appointment.entity';
import { TimeSlot } from '@domain/value-objects/time-slot.vo';
import { SlotNotAvailableError } from '@domain/errors/slot-not-available.error';
import { DoubleBookingError } from '@domain/errors/double-booking.error';
import { IAppointmentRepository } from '../../ports/repositories/appointment.repository.port';
import { IDoctorRepository } from '../../ports/repositories/doctor.repository.port';
import { IEventBusPort } from '../../ports/event-bus.port';
import { ICachePort } from '../../ports/cache.port';
import { BookAppointmentDTO } from '../../dtos/appointments/book-appointment.dto';
import { AppointmentResponseDTO } from '../../dtos/appointments/appointment-response.dto';
import { SlotGeneratorService } from '../../services/slot-generator.service';

export class BookAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly doctorRepo: IDoctorRepository,
    private readonly slotGenerator: SlotGeneratorService,
    private readonly eventBus: IEventBusPort,
    private readonly cache: ICachePort,
  ) {}

  async execute(dto: BookAppointmentDTO): Promise<AppointmentResponseDTO> {
    // 1. Load doctor and validate existence
    const doctor = await this.doctorRepo.findById(dto.doctorId, dto.clinicId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // 2. Build the time slot
    const slotDurationMs = doctor.slotDurationMin * 60 * 1000;
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + slotDurationMs);
    const timeSlot = new TimeSlot(startsAt, endsAt);

    // 3. Validate the slot is in the future
    if (startsAt <= new Date()) {
      throw new Error('Cannot book appointments in the past');
    }

    // 4. Check slot is within doctor availability
    const isAvailable = await this.slotGenerator.isSlotAvailable(
      dto.doctorId,
      dto.clinicId,
      timeSlot,
    );
    if (!isAvailable) {
      throw new SlotNotAvailableError(startsAt);
    }

    // 5. Check no double-booking
    const overlapping = await this.appointmentRepo.findOverlapping(
      dto.doctorId,
      dto.clinicId,
      timeSlot,
    );
    if (overlapping.length > 0) {
      throw new DoubleBookingError(dto.doctorId, startsAt);
    }

    // 6. Create the appointment
    const appointment = Appointment.create({
      id: crypto.randomUUID(),
      clinicId: dto.clinicId,
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      timeSlot,
      reason: dto.reason,
    });

    // 7. Persist
    const saved = await this.appointmentRepo.save(appointment);

    // 8. Publish domain events (confirmation email, reminder scheduling, audit log)
    const events = saved.pullDomainEvents();
    await this.eventBus.publishAll(events);

    // 9. Invalidate slot cache for this doctor+date
    const dateKey = startsAt.toISOString().split('T')[0];
    await this.cache.delete(`slots:${dto.clinicId}:${dto.doctorId}:${dateKey}`);

    // 10. Return DTO
    return AppointmentResponseDTO.fromDomain(saved);
  }
}
```

### DTOs

```typescript
// packages/application/src/dtos/appointments/book-appointment.dto.ts

export interface BookAppointmentDTO {
  clinicId: string;
  doctorId: string;
  patientId: string;
  startsAt: string; // ISO 8601
  reason?: string;
}
```

```typescript
// packages/application/src/dtos/appointments/appointment-response.dto.ts

import { Appointment } from '@domain/entities/appointment.entity';

export class AppointmentResponseDTO {
  constructor(
    public readonly id: string,
    public readonly clinicId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly startsAt: string,
    public readonly endsAt: string,
    public readonly status: string,
    public readonly reason: string | null,
    public readonly createdAt: string,
  ) {}

  static fromDomain(appointment: Appointment): AppointmentResponseDTO {
    return new AppointmentResponseDTO(
      appointment.id,
      appointment.clinicId,
      appointment.doctorId,
      appointment.patientId,
      appointment.timeSlot.startsAt.toISOString(),
      appointment.timeSlot.endsAt.toISOString(),
      appointment.status,
      appointment.reason,
      appointment.createdAt.toISOString(),
    );
  }
}
```

### Slot Generator Service

This is an application service because it orchestrates multiple domain concepts (availability rules, overrides, existing appointments) to produce available slots.

```typescript
// packages/application/src/services/slot-generator.service.ts

import { TimeSlot } from '@domain/value-objects/time-slot.vo';
import { IAvailabilityRuleRepository } from '../ports/repositories/availability-rule.repository.port';
import { IAvailabilityOverrideRepository } from '../ports/repositories/availability-override.repository.port';
import { IAppointmentRepository } from '../ports/repositories/appointment.repository.port';
import { ICachePort } from '../ports/cache.port';

const SLOT_CACHE_TTL_SECONDS = 300; // 5 minutes

export class SlotGeneratorService {
  constructor(
    private readonly ruleRepo: IAvailabilityRuleRepository,
    private readonly overrideRepo: IAvailabilityOverrideRepository,
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly cache: ICachePort,
  ) {}

  async getAvailableSlots(
    doctorId: string,
    clinicId: string,
    date: Date,
    slotDurationMin: number,
  ): Promise<TimeSlot[]> {
    // 1. Check cache first
    const dateKey = date.toISOString().split('T')[0];
    const cacheKey = `slots:${clinicId}:${doctorId}:${dateKey}`;
    const cached = await this.cache.get<TimeSlot[]>(cacheKey);
    if (cached) {
      return cached.map((s) => new TimeSlot(new Date(s.startsAt), new Date(s.endsAt)));
    }

    // 2. Get the day-of-week rules for this doctor
    const dayOfWeek = date.getDay(); // 0=Sunday
    const rules = await this.ruleRepo.findByDoctorAndDay(doctorId, clinicId, dayOfWeek);

    // 3. Check for overrides on this specific date
    const overrides = await this.overrideRepo.findByDoctorAndDate(
      doctorId,
      clinicId,
      date,
    );

    // 4. If there is a "day off" override (is_available = false, no times), return empty
    const dayOffOverride = overrides.find((o) => !o.isAvailable && !o.startTime);
    if (dayOffOverride) {
      await this.cache.set(cacheKey, [], SLOT_CACHE_TTL_SECONDS);
      return [];
    }

    // 5. Generate raw slots from rules
    let slots: TimeSlot[] = [];
    for (const rule of rules) {
      const ruleSlots = this.generateSlotsFromRule(date, rule, slotDurationMin);
      slots.push(...ruleSlots);
    }

    // 6. Apply overrides (add extra availability or remove blocked times)
    slots = this.applyOverrides(slots, overrides, date, slotDurationMin);

    // 7. Remove slots that overlap with existing appointments
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentRepo.findByDoctorAndDateRange(
      doctorId,
      clinicId,
      dayStart,
      dayEnd,
    );

    const availableSlots = slots.filter((slot) => {
      return !existingAppointments.some((appt) => slot.overlapsWith(appt.timeSlot));
    });

    // 8. Cache and return
    await this.cache.set(cacheKey, availableSlots, SLOT_CACHE_TTL_SECONDS);
    return availableSlots;
  }

  async isSlotAvailable(
    doctorId: string,
    clinicId: string,
    requestedSlot: TimeSlot,
  ): Promise<boolean> {
    const date = requestedSlot.startsAt;
    // This reuses the same slot generation logic
    // A more optimized version could check just the specific slot
    const availableSlots = await this.getAvailableSlots(
      doctorId,
      clinicId,
      date,
      requestedSlot.durationMinutes,
    );
    return availableSlots.some((slot) => slot.equals(requestedSlot));
  }

  private generateSlotsFromRule(
    date: Date,
    rule: { startTime: string; endTime: string },
    slotDurationMin: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startH, startM] = rule.startTime.split(':').map(Number);
    const [endH, endM] = rule.endTime.split(':').map(Number);

    const current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    while (current.getTime() + slotDurationMin * 60 * 1000 <= end.getTime()) {
      const slotEnd = new Date(current.getTime() + slotDurationMin * 60 * 1000);
      slots.push(new TimeSlot(new Date(current), slotEnd));
      current.setTime(current.getTime() + slotDurationMin * 60 * 1000);
    }

    return slots;
  }

  private applyOverrides(
    slots: TimeSlot[],
    overrides: Array<{
      isAvailable: boolean;
      startTime: string | null;
      endTime: string | null;
    }>,
    date: Date,
    slotDurationMin: number,
  ): TimeSlot[] {
    let result = [...slots];

    for (const override of overrides) {
      if (!override.startTime || !override.endTime) continue;

      if (override.isAvailable) {
        // Add extra slots for this time range
        const extraSlots = this.generateSlotsFromRule(
          date,
          { startTime: override.startTime, endTime: override.endTime },
          slotDurationMin,
        );
        result.push(...extraSlots);
      } else {
        // Remove slots that fall within this blocked range
        const [blockStartH, blockStartM] = override.startTime.split(':').map(Number);
        const [blockEndH, blockEndM] = override.endTime.split(':').map(Number);

        const blockStart = new Date(date);
        blockStart.setHours(blockStartH, blockStartM, 0, 0);
        const blockEnd = new Date(date);
        blockEnd.setHours(blockEndH, blockEndM, 0, 0);

        const blockedSlot = new TimeSlot(blockStart, blockEnd);
        result = result.filter((slot) => !slot.overlapsWith(blockedSlot));
      }
    }

    return result;
  }
}
```

---

## 5. Infrastructure Layer Design

The infrastructure layer implements all port interfaces defined in the application layer. It depends on application and domain layers, but they never depend on it.

### Directory Structure

```
packages/infrastructure/src/
├── database/
│   ├── data-source.ts
│   ├── entities/                      # TypeORM entities (DB mapping)
│   │   ├── clinic.entity.ts
│   │   ├── user.entity.ts
│   │   ├── doctor.entity.ts
│   │   ├── patient.entity.ts
│   │   ├── appointment.entity.ts
│   │   ├── availability-rule.entity.ts
│   │   ├── availability-override.entity.ts
│   │   ├── audit-log.entity.ts
│   │   └── refresh-token.entity.ts
│   ├── repositories/                  # Implement application port interfaces
│   │   ├── typeorm-appointment.repository.ts
│   │   ├── typeorm-user.repository.ts
│   │   ├── typeorm-doctor.repository.ts
│   │   ├── typeorm-patient.repository.ts
│   │   ├── typeorm-availability-rule.repository.ts
│   │   ├── typeorm-availability-override.repository.ts
│   │   ├── typeorm-audit-log.repository.ts
│   │   └── typeorm-refresh-token.repository.ts
│   ├── mappers/                       # Map between domain entities and ORM entities
│   │   ├── appointment.mapper.ts
│   │   ├── user.mapper.ts
│   │   ├── doctor.mapper.ts
│   │   └── patient.mapper.ts
│   └── migrations/
│       └── (generated by TypeORM CLI)
├── cache/
│   └── redis-cache.adapter.ts         # Implements ICachePort
├── queue/
│   ├── bullmq-job-queue.adapter.ts    # Implements IJobQueuePort
│   └── workers/
│       ├── email.worker.ts
│       ├── reminder.worker.ts
│       ├── no-show.worker.ts
│       └── calendar-sync.worker.ts
├── email/
│   └── resend-email.adapter.ts        # Implements IEmailPort
├── auth/
│   ├── argon2-password-hasher.ts      # Implements IPasswordHasherPort
│   └── jwt-token-provider.ts          # Implements ITokenProviderPort
├── event-bus/
│   └── bullmq-event-bus.adapter.ts    # Implements IEventBusPort
├── calendar/
│   └── google-calendar-sync.adapter.ts # Implements ICalendarSyncPort
├── config/
│   └── index.ts                       # Environment config with validation
└── index.ts
```

### TypeORM Repository Example

```typescript
// packages/infrastructure/src/database/repositories/typeorm-appointment.repository.ts

import { Repository, LessThanOrEqual, MoreThanOrEqual, In, Not } from 'typeorm';
import { AppDataSource } from '../data-source';
import { AppointmentEntity, AppointmentStatusEnum } from '../entities/appointment.entity';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { IAppointmentRepository } from '@application/ports/repositories/appointment.repository.port';
import { Appointment } from '@domain/entities/appointment.entity';
import { AppointmentStatus } from '@domain/value-objects/appointment-status.vo';
import { TimeSlot } from '@domain/value-objects/time-slot.vo';

export class TypeormAppointmentRepository implements IAppointmentRepository {
  private readonly repo: Repository<AppointmentEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(AppointmentEntity);
  }

  async findById(id: string, clinicId: string): Promise<Appointment | null> {
    const entity = await this.repo.findOne({
      where: { id, clinic_id: clinicId },
    });
    return entity ? AppointmentMapper.toDomain(entity) : null;
  }

  async findByDoctorAndDateRange(
    doctorId: string,
    clinicId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]> {
    const entities = await this.repo.find({
      where: {
        doctor_id: doctorId,
        clinic_id: clinicId,
        starts_at: MoreThanOrEqual(from),
        ends_at: LessThanOrEqual(to),
        status: Not(In([AppointmentStatusEnum.CANCELLED])),
      },
      order: { starts_at: 'ASC' },
    });
    return entities.map(AppointmentMapper.toDomain);
  }

  async findOverlapping(
    doctorId: string,
    clinicId: string,
    timeSlot: TimeSlot,
    excludeId?: string,
  ): Promise<Appointment[]> {
    const qb = this.repo
      .createQueryBuilder('apt')
      .where('apt.doctor_id = :doctorId', { doctorId })
      .andWhere('apt.clinic_id = :clinicId', { clinicId })
      .andWhere('apt.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatusEnum.CANCELLED],
      })
      .andWhere('apt.starts_at < :endsAt', { endsAt: timeSlot.endsAt })
      .andWhere('apt.ends_at > :startsAt', { startsAt: timeSlot.startsAt });

    if (excludeId) {
      qb.andWhere('apt.id != :excludeId', { excludeId });
    }

    const entities = await qb.getMany();
    return entities.map(AppointmentMapper.toDomain);
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const entity = AppointmentMapper.toOrmEntity(appointment);
    const saved = await this.repo.save(entity);
    return AppointmentMapper.toDomain(saved);
  }

  async findByPatient(
    patientId: string,
    clinicId: string,
    options?: { status?: AppointmentStatus; limit?: number; offset?: number },
  ): Promise<Appointment[]> {
    const where: Record<string, unknown> = {
      patient_id: patientId,
      clinic_id: clinicId,
    };
    if (options?.status) {
      where.status = options.status;
    }

    const entities = await this.repo.find({
      where,
      order: { starts_at: 'DESC' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });
    return entities.map(AppointmentMapper.toDomain);
  }

  async countByDoctorAndDate(
    doctorId: string,
    clinicId: string,
    date: Date,
  ): Promise<number> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.repo.count({
      where: {
        doctor_id: doctorId,
        clinic_id: clinicId,
        starts_at: MoreThanOrEqual(dayStart),
        ends_at: LessThanOrEqual(dayEnd),
        status: Not(In([AppointmentStatusEnum.CANCELLED])),
      },
    });
  }
}
```

### Entity Mapper Example

```typescript
// packages/infrastructure/src/database/mappers/appointment.mapper.ts

import { AppointmentEntity, AppointmentStatusEnum } from '../entities/appointment.entity';
import { Appointment } from '@domain/entities/appointment.entity';
import { AppointmentStatus } from '@domain/value-objects/appointment-status.vo';
import { TimeSlot } from '@domain/value-objects/time-slot.vo';

export class AppointmentMapper {
  static toDomain(entity: AppointmentEntity): Appointment {
    return new Appointment(
      entity.id,
      entity.clinic_id,
      entity.doctor_id,
      entity.patient_id,
      new TimeSlot(entity.starts_at, entity.ends_at),
      entity.status as unknown as AppointmentStatus,
      entity.reason,
      entity.cancellation_reason,
      entity.cancelled_by,
      entity.created_at,
      entity.updated_at,
    );
  }

  static toOrmEntity(domain: Appointment): AppointmentEntity {
    const entity = new AppointmentEntity();
    entity.id = domain.id;
    entity.clinic_id = domain.clinicId;
    entity.doctor_id = domain.doctorId;
    entity.patient_id = domain.patientId;
    entity.starts_at = domain.timeSlot.startsAt;
    entity.ends_at = domain.timeSlot.endsAt;
    entity.status = domain.status as unknown as AppointmentStatusEnum;
    entity.reason = domain.reason;
    entity.cancellation_reason = domain.cancellationReason;
    entity.cancelled_by = domain.cancelledBy;
    return entity;
  }
}
```

### Redis Cache Adapter

```typescript
// packages/infrastructure/src/cache/redis-cache.adapter.ts

import { Redis } from 'ioredis';
import { ICachePort } from '@application/ports/cache.port';

const DEFAULT_TTL_SECONDS = 300;

export class RedisCacheAdapter implements ICachePort {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? DEFAULT_TTL_SECONDS;
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### BullMQ Job Queue Adapter

```typescript
// packages/infrastructure/src/queue/bullmq-job-queue.adapter.ts

import { Queue } from 'bullmq';
import { IJobQueuePort, JobData, JobOptions } from '@application/ports/job-queue.port';
import { Redis } from 'ioredis';

export class BullMQJobQueueAdapter implements IJobQueuePort {
  private queues: Map<string, Queue> = new Map();

  constructor(private readonly redisConnection: Redis) {}

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(
        name,
        new Queue(name, { connection: this.redisConnection }),
      );
    }
    return this.queues.get(name)!;
  }

  async enqueue(queueName: string, jobData: JobData, options?: JobOptions): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(queueName, jobData, {
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? { type: 'exponential', delay: 1000 },
      delay: options?.delay,
    });
  }

  async schedule(queueName: string, jobData: JobData, delayMs: number): Promise<void> {
    await this.enqueue(queueName, jobData, { delay: delayMs });
  }
}
```

### BullMQ Event Bus Adapter

The event bus translates domain events into BullMQ jobs, allowing asynchronous processing.

```typescript
// packages/infrastructure/src/event-bus/bullmq-event-bus.adapter.ts

import { IEventBusPort } from '@application/ports/event-bus.port';
import { IJobQueuePort } from '@application/ports/job-queue.port';
import { DomainEvent } from '@domain/events/domain-event';

const EVENT_QUEUE_NAME = 'domain-events';

export class BullMQEventBusAdapter implements IEventBusPort {
  constructor(private readonly jobQueue: IJobQueuePort) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.jobQueue.enqueue(EVENT_QUEUE_NAME, {
      eventName: event.eventName,
      payload: event.toPayload(),
      occurredAt: event.occurredAt.toISOString(),
    });
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}
```

### Email Adapter (Resend)

```typescript
// packages/infrastructure/src/email/resend-email.adapter.ts

import { Resend } from 'resend';
import { IEmailPort, EmailPayload } from '@application/ports/email.port';
import { config } from '../config';

export class ResendEmailAdapter implements IEmailPort {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(config.RESEND_API_KEY);
  }

  async send(payload: EmailPayload): Promise<void> {
    await this.client.emails.send({
      from: config.EMAIL_FROM_ADDRESS,
      to: payload.to,
      subject: payload.subject,
      html: this.renderTemplate(payload.templateId, payload.variables),
    });
  }

  private renderTemplate(templateId: string, variables: Record<string, string>): string {
    // Simple template rendering -- can be replaced with a proper template engine
    let template = TEMPLATES[templateId] ?? '';
    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return template;
  }
}

const TEMPLATES: Record<string, string> = {
  'appointment-confirmation': `
    <h2>Appointment Confirmed</h2>
    <p>Dear {{patientName}},</p>
    <p>Your appointment with Dr. {{doctorName}} has been confirmed.</p>
    <p>Date: {{date}}</p>
    <p>Time: {{time}}</p>
  `,
  'appointment-cancellation': `
    <h2>Appointment Cancelled</h2>
    <p>Dear {{patientName}},</p>
    <p>Your appointment with Dr. {{doctorName}} on {{date}} at {{time}} has been cancelled.</p>
  `,
  'appointment-reminder': `
    <h2>Appointment Reminder</h2>
    <p>Dear {{patientName}},</p>
    <p>This is a reminder that you have an appointment tomorrow with Dr. {{doctorName}} at {{time}}.</p>
  `,
};
```

### Google Calendar Sync Adapter

```typescript
// packages/infrastructure/src/calendar/google-calendar-sync.adapter.ts

import { google } from 'googleapis';
import { ICalendarSyncPort } from '@application/ports/calendar-sync.port';

export class GoogleCalendarSyncAdapter implements ICalendarSyncPort {
  private readonly calendar;

  constructor(credentials: { clientId: string; clientSecret: string; refreshToken: string }) {
    const auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
    );
    auth.setCredentials({ refresh_token: credentials.refreshToken });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async syncAppointment(params: {
    calendarId: string;
    appointmentId: string;
    summary: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
  }): Promise<string> {
    const response = await this.calendar.events.insert({
      calendarId: params.calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.startsAt.toISOString() },
        end: { dateTime: params.endsAt.toISOString() },
        extendedProperties: {
          private: { appointmentId: params.appointmentId },
        },
      },
    });
    return response.data.id!;
  }

  async removeAppointment(calendarId: string, googleEventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });
  }
}
```

### Infrastructure Config

```typescript
// packages/infrastructure/src/config/index.ts

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().default('noreply@medical-scheduling.local'),

  // Google Calendar (optional for MVP)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export type Config = z.infer<typeof envSchema>;

export const config: Config = envSchema.parse(process.env);
```

---

## 6. API Layer Design

The API layer is the outermost backend layer and serves as the composition root. Controllers are thin -- they validate input, call a use case, and return the response. All business logic lives in use cases.

### Directory Structure

```
apps/api/src/
├── server.ts                          # Express app setup, global middleware
├── container.ts                       # Dependency injection / composition root
├── routes/
│   ├── index.ts                       # Route aggregator under /api/v1
│   ├── auth.routes.ts
│   ├── appointment.routes.ts
│   ├── doctor.routes.ts
│   ├── availability.routes.ts
│   └── admin.routes.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── appointment.controller.ts
│   ├── doctor.controller.ts
│   ├── availability.controller.ts
│   └── admin.controller.ts
├── middleware/
│   ├── auth.middleware.ts             # JWT verification, attaches user to request
│   ├── tenant.middleware.ts           # Extracts clinicId from JWT, attaches to context
│   ├── rbac.middleware.ts             # Role-based access control checks
│   ├── validation.middleware.ts       # Generic Zod validation middleware factory
│   ├── rate-limit.middleware.ts       # Redis-backed rate limiting
│   ├── error-handler.middleware.ts    # Global error handler, maps domain errors to HTTP
│   └── request-logger.middleware.ts   # Structured request logging
├── validators/
│   ├── auth.validators.ts            # Zod schemas for auth endpoints
│   ├── appointment.validators.ts     # Zod schemas for appointment endpoints
│   └── availability.validators.ts    # Zod schemas for availability endpoints
└── types/
    └── express.d.ts                   # Extend Express Request with user/tenant context
```

### Express Route Structure

```
/api/v1
├── /auth
│   ├── POST   /register              # Register a patient (public)
│   ├── POST   /login                  # Login (public)
│   └── POST   /refresh                # Refresh access token (public, needs refresh token)
│
├── /doctors                           # Requires auth
│   ├── GET    /                       # List doctors for current clinic
│   └── GET    /:id                    # Get doctor profile
│
├── /doctors/:doctorId/slots           # Requires auth
│   └── GET    /?date=YYYY-MM-DD       # Get available slots for a doctor on a date
│
├── /appointments                      # Requires auth
│   ├── POST   /                       # Book an appointment (PATIENT)
│   ├── GET    /                       # List appointments (filtered by role)
│   ├── GET    /:id                    # Get appointment details
│   ├── PATCH  /:id/confirm            # Confirm appointment (DOCTOR, CLINIC_ADMIN)
│   ├── PATCH  /:id/cancel             # Cancel appointment (PATIENT, DOCTOR, CLINIC_ADMIN)
│   ├── PATCH  /:id/complete           # Mark completed (DOCTOR, CLINIC_ADMIN)
│   └── PATCH  /:id/no-show            # Mark no-show (DOCTOR, CLINIC_ADMIN)
│
├── /availability                      # Requires auth (DOCTOR, CLINIC_ADMIN)
│   ├── GET    /rules                  # List availability rules
│   ├── POST   /rules                  # Create availability rule
│   ├── PUT    /rules/:id              # Update availability rule
│   ├── DELETE /rules/:id              # Delete availability rule
│   ├── GET    /overrides              # List overrides
│   ├── POST   /overrides              # Create override (day off, extra hours)
│   └── DELETE /overrides/:id          # Delete override
│
└── /admin                             # Requires auth (CLINIC_ADMIN)
    ├── POST   /doctors                # Create doctor account
    └── GET    /dashboard              # Dashboard statistics
```

### Middleware Stack

The middleware is applied in a specific order. Here is the request processing pipeline:

```
Request
  │
  ▼
1. request-logger          (log method, path, timing)
  │
  ▼
2. rate-limit              (Redis-backed, per-IP)
  │
  ▼
3. CORS                    (configurable origins)
  │
  ▼
4. body-parser             (express.json())
  │
  ▼
5. auth (per-route)        (verify JWT, attach user to req)
  │
  ▼
6. tenant (per-route)      (extract clinicId from JWT, scope queries)
  │
  ▼
7. rbac (per-route)        (check role has permission for this action)
  │
  ▼
8. validation (per-route)  (Zod schema validates body/params/query)
  │
  ▼
9. controller              (call use case, return response)
  │
  ▼
10. error-handler          (catch errors, map to HTTP status + body)
```

### Thin Controller Example

```typescript
// apps/api/src/controllers/appointment.controller.ts

import { Request, Response, NextFunction } from 'express';
import { BookAppointmentUseCase } from '@application/use-cases/appointments/book-appointment.use-case';
import { CancelAppointmentUseCase } from '@application/use-cases/appointments/cancel-appointment.use-case';
import { ConfirmAppointmentUseCase } from '@application/use-cases/appointments/confirm-appointment.use-case';

export class AppointmentController {
  constructor(
    private readonly bookUseCase: BookAppointmentUseCase,
    private readonly cancelUseCase: CancelAppointmentUseCase,
    private readonly confirmUseCase: ConfirmAppointmentUseCase,
  ) {}

  book = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.bookUseCase.execute({
        clinicId: req.tenantContext.clinicId,
        patientId: req.userContext.patientId!,
        doctorId: req.body.doctorId,
        startsAt: req.body.startsAt,
        reason: req.body.reason,
      });
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.cancelUseCase.execute({
        clinicId: req.tenantContext.clinicId,
        appointmentId: req.params.id,
        cancelledBy: req.userContext.userId,
        reason: req.body.reason,
      });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.confirmUseCase.execute({
        clinicId: req.tenantContext.clinicId,
        appointmentId: req.params.id,
        confirmedBy: req.userContext.userId,
      });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
```

### Validation Middleware Factory

```typescript
// apps/api/src/middleware/validation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
```

### Error Handler Middleware

```typescript
// apps/api/src/middleware/error-handler.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@domain/errors/domain-error';
import { InvalidStateTransitionError } from '@domain/errors/invalid-state-transition.error';
import { SlotNotAvailableError } from '@domain/errors/slot-not-available.error';
import { DoubleBookingError } from '@domain/errors/double-booking.error';

const DOMAIN_ERROR_STATUS_MAP: Record<string, number> = {
  INVALID_STATE_TRANSITION: 409,
  SLOT_NOT_AVAILABLE: 409,
  DOUBLE_BOOKING: 409,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    const status = DOMAIN_ERROR_STATUS_MAP[err.code] ?? 400;
    res.status(status).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Log unexpected errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
}
```

### Composition Root (Dependency Injection)

```typescript
// apps/api/src/container.ts

import { Redis } from 'ioredis';
import { AppDataSource } from '@infrastructure/database/data-source';
import { config } from '@infrastructure/config';

// Repositories
import { TypeormAppointmentRepository } from '@infrastructure/database/repositories/typeorm-appointment.repository';
import { TypeormDoctorRepository } from '@infrastructure/database/repositories/typeorm-doctor.repository';
import { TypeormUserRepository } from '@infrastructure/database/repositories/typeorm-user.repository';

// Adapters
import { RedisCacheAdapter } from '@infrastructure/cache/redis-cache.adapter';
import { BullMQJobQueueAdapter } from '@infrastructure/queue/bullmq-job-queue.adapter';
import { BullMQEventBusAdapter } from '@infrastructure/event-bus/bullmq-event-bus.adapter';
import { ResendEmailAdapter } from '@infrastructure/email/resend-email.adapter';
import { Argon2PasswordHasher } from '@infrastructure/auth/argon2-password-hasher';
import { JwtTokenProvider } from '@infrastructure/auth/jwt-token-provider';

// Use Cases
import { BookAppointmentUseCase } from '@application/use-cases/appointments/book-appointment.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';

// Services
import { SlotGeneratorService } from '@application/services/slot-generator.service';

// Controllers
import { AppointmentController } from './controllers/appointment.controller';
import { AuthController } from './controllers/auth.controller';

export async function createContainer() {
  // Initialize connections
  await AppDataSource.initialize();
  const redis = new Redis(config.REDIS_URL);

  // Infrastructure adapters
  const cache = new RedisCacheAdapter(redis);
  const jobQueue = new BullMQJobQueueAdapter(redis);
  const eventBus = new BullMQEventBusAdapter(jobQueue);
  const emailAdapter = new ResendEmailAdapter();
  const passwordHasher = new Argon2PasswordHasher();
  const tokenProvider = new JwtTokenProvider();

  // Repositories
  const appointmentRepo = new TypeormAppointmentRepository();
  const doctorRepo = new TypeormDoctorRepository();
  const userRepo = new TypeormUserRepository();

  // Application services
  const slotGenerator = new SlotGeneratorService(
    /* ruleRepo */ null as any, // wire appropriately
    /* overrideRepo */ null as any,
    appointmentRepo,
    cache,
  );

  // Use cases
  const bookAppointment = new BookAppointmentUseCase(
    appointmentRepo,
    doctorRepo,
    slotGenerator,
    eventBus,
    cache,
  );

  const login = new LoginUseCase(userRepo, passwordHasher, tokenProvider);

  // Controllers
  const appointmentController = new AppointmentController(
    bookAppointment,
    /* cancelUseCase */ null as any,
    /* confirmUseCase */ null as any,
  );

  const authController = new AuthController(login);

  return {
    redis,
    appointmentController,
    authController,
    // ... all controllers
  };
}
```

### OpenAPI / Swagger Integration

The API is documented using `swagger-jsdoc` and `swagger-ui-express`, served at `/api/docs`.

```typescript
// apps/api/src/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical Scheduling Platform API',
      version: '1.0.0',
      description: 'Multi-tenant medical appointment scheduling API',
    },
    servers: [
      { url: '/api/v1', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

## 7. Frontend Architecture

### Page Structure and Routing

```
apps/web/src/
├── main.tsx                           # Entry point, providers setup
├── App.tsx                            # Root component with RouterProvider
├── router.tsx                         # React Router route definitions
├── api/
│   ├── client.ts                      # Axios/fetch wrapper with auth interceptors
│   ├── auth.api.ts                    # Auth API calls
│   ├── appointments.api.ts            # Appointment API calls
│   ├── doctors.api.ts                 # Doctor API calls
│   └── availability.api.ts            # Availability API calls
├── hooks/
│   ├── use-auth.ts                    # Auth state hook
│   ├── use-appointments.ts            # TanStack Query hooks for appointments
│   ├── use-doctors.ts                 # TanStack Query hooks for doctors
│   ├── use-slots.ts                   # TanStack Query hooks for available slots
│   └── use-availability.ts            # TanStack Query hooks for availability
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── patient/
│   │   ├── DashboardPage.tsx          # Upcoming appointments
│   │   ├── BookAppointmentPage.tsx    # Doctor selection + slot picker
│   │   └── AppointmentDetailPage.tsx  # View/cancel appointment
│   ├── doctor/
│   │   ├── DashboardPage.tsx          # Today's schedule
│   │   ├── SchedulePage.tsx           # Weekly calendar view
│   │   ├── AvailabilityPage.tsx       # Manage availability rules
│   │   └── AppointmentDetailPage.tsx  # View/confirm/complete/no-show
│   └── admin/
│       ├── DashboardPage.tsx          # Stats, overview
│       ├── DoctorsPage.tsx            # Manage doctors
│       └── CreateDoctorPage.tsx       # Create doctor account
├── components/
│   ├── ui/                            # shadcn/base-ui primitives (existing)
│   ├── layout/
│   │   ├── AppLayout.tsx              # Main layout with sidebar/nav
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── appointments/
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentList.tsx
│   │   ├── AppointmentStatusBadge.tsx
│   │   └── SlotPicker.tsx
│   ├── doctors/
│   │   ├── DoctorCard.tsx
│   │   └── DoctorList.tsx
│   ├── availability/
│   │   ├── WeeklyScheduleEditor.tsx
│   │   └── OverrideForm.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ProtectedRoute.tsx
├── contexts/
│   └── auth.context.tsx               # Auth context provider
├── lib/
│   ├── utils.ts                       # Existing utility functions
│   └── constants.ts                   # Shared frontend constants
├── types/
│   └── api.types.ts                   # TypeScript types mirroring API responses
└── index.css                          # Tailwind CSS entry
```

### Route Definitions

```typescript
// apps/web/src/router.tsx

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Patient routes
          { path: '/', element: <PatientDashboardPage /> },
          { path: '/book', element: <BookAppointmentPage /> },
          { path: '/appointments/:id', element: <AppointmentDetailPage /> },

          // Doctor routes
          { path: '/doctor', element: <DoctorDashboardPage /> },
          { path: '/doctor/schedule', element: <SchedulePage /> },
          { path: '/doctor/availability', element: <AvailabilityPage /> },
          { path: '/doctor/appointments/:id', element: <DoctorAppointmentDetailPage /> },

          // Admin routes
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/doctors', element: <DoctorsPage /> },
          { path: '/admin/doctors/new', element: <CreateDoctorPage /> },
        ],
      },
    ],
  },
]);
```

### TanStack Query Integration

```typescript
// apps/web/src/hooks/use-slots.ts

import { useQuery } from '@tanstack/react-query';
import { getAvailableSlots } from '../api/availability.api';

export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => getAvailableSlots(doctorId, date),
    enabled: !!doctorId && !!date,
    staleTime: 30 * 1000,       // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds to stay current
  });
}
```

```typescript
// apps/web/src/hooks/use-appointments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookAppointment, cancelAppointment, getAppointments } from '../api/appointments.api';

export function useAppointments(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => getAppointments(filters),
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}
```

### Authentication Flow

```
1. User logs in at /login
2. Server returns { accessToken, refreshToken }
3. accessToken stored in memory (React state/context)
4. refreshToken stored in HttpOnly cookie (set by server) OR localStorage
5. API client attaches accessToken as Bearer header on every request
6. When accessToken expires (401 response):
   a. API client interceptor catches the 401
   b. Calls POST /api/v1/auth/refresh with refreshToken
   c. Receives new accessToken
   d. Retries the original request
   e. If refresh fails, redirect to /login
```

```typescript
// apps/web/src/api/client.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && accessToken) {
    // Attempt token refresh
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        throw new ApiError(retryResponse.status, await retryResponse.json());
      }
      return retryResponse.json();
    }
    // Refresh failed, redirect to login
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}
```

### Role-Based UI Rendering

```typescript
// apps/web/src/components/common/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { UserRole } from '../../types/api.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
```

The default landing page after login is determined by user role:
- **PATIENT**: `/` (patient dashboard)
- **DOCTOR**: `/doctor` (doctor dashboard)
- **CLINIC_ADMIN**: `/admin` (admin dashboard)

---

## 8. Docker & DevOps

### Docker Compose for Local Development

```yaml
# docker-compose.yml (project root)

services:
  postgres:
    image: postgres:16-alpine
    container_name: msp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: medical_scheduling
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: msp-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### Environment Configuration

```bash
# .env.example

# App
NODE_ENV=development
PORT=3001

# Database (Local: Docker container / Production: Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medical_scheduling

# Redis (Local: Docker container / Production: managed Redis)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (optional for local dev)
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=noreply@medical-scheduling.local

# Google Calendar (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend
VITE_API_URL=http://localhost:3001/api/v1
```

### Production Dockerfile

```dockerfile
# Dockerfile (multi-stage build for API)

# ---- Build stage ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.0.0 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files for all workspaces
COPY apps/api/package.json apps/api/
COPY packages/domain/package.json packages/domain/
COPY packages/application/package.json packages/application/
COPY packages/infrastructure/package.json packages/infrastructure/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ packages/
COPY apps/api/ apps/api/

# Build all packages
RUN pnpm -r build

# ---- Production stage ----
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@8.0.0 --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/packages/domain/package.json packages/domain/
COPY --from=builder /app/packages/application/package.json packages/application/
COPY --from=builder /app/packages/infrastructure/package.json packages/infrastructure/
COPY --from=builder /app/packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/packages/domain/dist packages/domain/dist
COPY --from=builder /app/packages/application/dist packages/application/dist
COPY --from=builder /app/packages/infrastructure/dist packages/infrastructure/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
```

```dockerfile
# Dockerfile.web (multi-stage build for frontend)

FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web/ apps/web/

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter web build

# ---- Serve with nginx ----
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD Pipeline Outline (GitHub Actions)

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r lint
      - run: pnpm -r build   # Type-checking happens during build

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: medical_scheduling_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/medical_scheduling_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-minimum-32-characters-long

  deploy:
    needs: [lint-and-typecheck, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker images
        # Build API and Web Docker images, push to registry
        run: |
          docker build -t medical-scheduling-api .
          docker build -f Dockerfile.web -t medical-scheduling-web .
      - name: Deploy to VPS
        # SSH into VPS, pull images, restart containers
        run: echo "Deploy step - configure with your VPS details"
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml

services:
  api:
    image: medical-scheduling-api:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
    depends_on:
      - redis
    networks:
      - app-network

  web:
    image: medical-scheduling-web:latest
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - api
      - web
    networks:
      - app-network

volumes:
  redis_data:

networks:
  app-network:
    driver: bridge
```

Note: PostgreSQL is NOT in the production Docker Compose because production uses Supabase's hosted PostgreSQL, accessed via the `DATABASE_URL` connection string.

---

## 9. Security Considerations

### GDPR Compliance Approach

1. **Data Minimization**: Collect only necessary personal data. Patient records store only what is needed for scheduling (name, email, phone, date of birth, insurance number).

2. **Consent**: Patient registration includes explicit consent for data processing. Consent timestamp is stored.

3. **Right to Access**: API endpoint to export all personal data for a user (`GET /api/v1/users/me/data-export`).

4. **Right to Deletion**: API endpoint for account deletion with cascading anonymization (`DELETE /api/v1/users/me`). This anonymizes personal data in appointments and audit logs rather than deleting records, preserving referential integrity.

5. **Data Encryption**: All data encrypted in transit (HTTPS/TLS). Sensitive fields (insurance number) can be encrypted at rest using application-level encryption.

6. **Audit Trail**: All data access and modifications are logged. Audit logs are immutable.

7. **EU Hosting**: All infrastructure hosted in EU data centers (EU-central region).

### JWT Strategy

```
Access Token:
  - Algorithm: HS256
  - Expiry: 15 minutes
  - Payload: { userId, clinicId, role }
  - Stored: In-memory (React state)
  - Not stored in localStorage (XSS protection)

Refresh Token:
  - Opaque random string (64 bytes, base64url)
  - Expiry: 7 days
  - Stored: HttpOnly, Secure, SameSite=Strict cookie
  - Hashed (SHA-256) before database storage
  - One-time use: new refresh token issued on each refresh
  - Revocable: can be invalidated server-side
```

**Token Refresh Flow:**
1. Client sends request with expired access token.
2. Server returns 401.
3. Client sends `POST /api/v1/auth/refresh` with refresh token cookie.
4. Server validates refresh token hash against database.
5. Server issues new access token + new refresh token.
6. Old refresh token is revoked in database.

### Rate Limiting

```typescript
// Redis-backed rate limiting per IP address

// Global: 100 requests per minute
// Auth endpoints: 10 requests per minute (prevent brute force)
// Booking endpoint: 20 requests per minute (prevent slot hoarding)

// Implementation uses sliding window counter in Redis
// Key format: rate_limit:{ip}:{endpoint_group}
```

### Input Validation

- All request bodies validated with Zod schemas before reaching controllers.
- All path parameters validated (UUID format).
- All query parameters validated and sanitized.
- SQL injection prevented by TypeORM parameterized queries.
- XSS prevented by not rendering user input as HTML on the frontend.

### CORS Configuration

```typescript
// apps/api/src/server.ts

import cors from 'cors';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',       // Local Vite dev server
  'https://app.your-domain.com', // Production frontend
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,             // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Additional Security Measures

- **Argon2id** for password hashing (memory-hard, resistant to GPU attacks).
- **Helmet.js** for security headers (X-Content-Type-Options, X-Frame-Options, etc.).
- **Request size limits** (100KB body limit) to prevent DoS.
- **Dependency auditing** via `pnpm audit` in CI pipeline.
- **No secrets in code**: All credentials via environment variables.

---

## 10. Implementation Phases

### Phase 1: Foundation (Estimated: 1-2 weeks)

**Goal**: Establish the project skeleton, database, and authentication.

**Deliverables**:
- [ ] Docker Compose with PostgreSQL and Redis containers
- [ ] Environment configuration with Zod validation
- [ ] TypeORM DataSource configuration and connection
- [ ] Database migration: create `clinics`, `users`, `refresh_tokens` tables
- [ ] Domain layer: `User` entity, `Email` value object, `UserRole` enum
- [ ] Application layer: `LoginUseCase`, `RegisterPatientUseCase`, `RefreshTokenUseCase`
- [ ] Infrastructure layer: `TypeormUserRepository`, `Argon2PasswordHasher`, `JwtTokenProvider`
- [ ] API layer: Auth routes (`/auth/register`, `/auth/login`, `/auth/refresh`)
- [ ] Auth middleware (JWT verification)
- [ ] Tenant middleware (clinicId extraction)
- [ ] Validation middleware (Zod factory)
- [ ] Error handler middleware
- [ ] Seed script: create a default clinic
- [ ] Unit tests: password hashing, JWT generation/verification, user validation

**Independently testable**: You can register, log in, and receive a valid JWT. The health endpoint and auth endpoints work end-to-end.

---

### Phase 2: Doctor Profiles & Availability Engine (Estimated: 1-2 weeks)

**Goal**: Doctors and their weekly schedules exist. Available slots can be queried.

**Deliverables**:
- [ ] Database migration: create `doctors`, `availability_rules`, `availability_overrides` tables
- [ ] Domain layer: `Doctor` entity, `AvailabilityRule` entity, `AvailabilityOverride` entity, `TimeSlot` value object
- [ ] Application layer: `CreateAvailabilityRuleUseCase`, `CreateAvailabilityOverrideUseCase`, `GetAvailableSlotsUseCase`, `ListDoctorsUseCase`
- [ ] Application layer: `SlotGeneratorService` (generates time slots from rules, applies overrides, filters booked)
- [ ] Infrastructure layer: `TypeormDoctorRepository`, `TypeormAvailabilityRuleRepository`, `TypeormAvailabilityOverrideRepository`, `RedisCacheAdapter`
- [ ] API layer: Doctor routes (`/doctors`, `/doctors/:id`), Availability routes (`/doctors/:id/slots`, `/availability/rules`, `/availability/overrides`)
- [ ] RBAC middleware: enforce DOCTOR/CLINIC_ADMIN for availability management
- [ ] Redis caching for slot queries
- [ ] Unit tests: slot generation logic (various rule/override combinations)
- [ ] Integration tests: availability API endpoints

**Independently testable**: A clinic admin can create a doctor, the doctor can set weekly availability, patients can query available slots for a date.

---

### Phase 3: Appointment Booking & State Machine (Estimated: 1-2 weeks)

**Goal**: Full appointment lifecycle with deterministic state machine.

**Deliverables**:
- [ ] Database migration: create `patients`, `appointments`, `audit_logs` tables
- [ ] Domain layer: `Appointment` entity, `Patient` entity, `AuditLog` entity, `AppointmentStatus` enum, `AppointmentStateMachine`
- [ ] Domain layer: Domain events (`AppointmentCreated`, `AppointmentConfirmed`, `AppointmentCancelled`, `AppointmentCompleted`, `AppointmentNoShow`)
- [ ] Domain layer: Domain errors (`InvalidStateTransitionError`, `SlotNotAvailableError`, `DoubleBookingError`)
- [ ] Application layer: `BookAppointmentUseCase`, `ConfirmAppointmentUseCase`, `CancelAppointmentUseCase`, `CompleteAppointmentUseCase`, `MarkNoShowUseCase`, `GetAppointmentUseCase`, `ListAppointmentsUseCase`
- [ ] Infrastructure layer: `TypeormAppointmentRepository`, `TypeormPatientRepository`, `TypeormAuditLogRepository`
- [ ] Infrastructure layer: `BullMQEventBusAdapter` (publish domain events to job queue)
- [ ] API layer: Appointment routes (all CRUD + state transitions)
- [ ] Cache invalidation on booking/cancellation
- [ ] Unit tests: state machine transitions (all valid + all invalid), double-booking prevention, slot validation
- [ ] Integration tests: full booking flow (register -> login -> query slots -> book -> confirm -> complete)

**Independently testable**: A patient can book an appointment, a doctor can confirm/complete it, cancellation works, invalid transitions are rejected with proper errors.

---

### Phase 4: Background Jobs & Automated Communications (Estimated: 1 week)

**Goal**: Email notifications and automated NO_SHOW handling.

**Deliverables**:
- [ ] Infrastructure layer: `BullMQJobQueueAdapter`, BullMQ workers
- [ ] Email worker: processes email sending jobs
- [ ] Reminder worker: sends 24-hour reminder emails
- [ ] NO_SHOW worker: automatically transitions CONFIRMED appointments past their end time to NO_SHOW
- [ ] Infrastructure layer: `ResendEmailAdapter` (or Nodemailer for local dev)
- [ ] Event handlers wired to domain events:
  - `AppointmentCreated` -> schedule confirmation email
  - `AppointmentConfirmed` -> send confirmation email + schedule 24h reminder
  - `AppointmentCancelled` -> send cancellation email + cancel scheduled reminder
  - All state transitions -> create audit log entry
- [ ] Unit tests: event handler logic, email template rendering
- [ ] Integration tests: verify jobs are enqueued on domain events

**Independently testable**: Booking an appointment triggers a confirmation email (viewable in dev email tool). 24h before the appointment, a reminder is sent. Past appointments auto-transition to NO_SHOW.

---

### Phase 5: Frontend -- Authentication & Patient Flow (Estimated: 1-2 weeks)

**Goal**: Patients can register, log in, browse doctors, book appointments, and manage their bookings.

**Deliverables**:
- [ ] React Router setup with route definitions
- [ ] Auth context and protected route component
- [ ] API client with JWT interceptor and token refresh
- [ ] TanStack Query provider setup
- [ ] Login page
- [ ] Registration page
- [ ] Patient dashboard (upcoming appointments list)
- [ ] Book appointment page (doctor selection, date picker, slot picker)
- [ ] Appointment detail page (view details, cancel)
- [ ] Role-based redirect after login
- [ ] Loading states, error states, empty states
- [ ] Responsive layout (mobile-first)

**Independently testable**: A patient can go through the full flow in the browser: register, log in, see doctors, pick a slot, book, view their appointments, cancel.

---

### Phase 6: Frontend -- Doctor & Admin Views (Estimated: 1-2 weeks)

**Goal**: Doctors can manage their schedule and appointments. Admins can manage the clinic.

**Deliverables**:
- [ ] Doctor dashboard (today's appointments)
- [ ] Doctor schedule page (weekly calendar view)
- [ ] Availability management page (CRUD weekly rules, create overrides)
- [ ] Doctor appointment detail page (confirm, complete, mark no-show)
- [ ] Admin dashboard (stats: appointments today, this week, by status)
- [ ] Admin doctors page (list doctors)
- [ ] Admin create doctor page
- [ ] Sidebar navigation adapted per role
- [ ] Role-based route guards

**Independently testable**: A doctor can log in, see their schedule, manage availability, and handle appointments. An admin can view the dashboard and manage doctors.

---

### Phase 7: Google Calendar Sync & Polish (Estimated: 1 week)

**Goal**: One-way sync to Google Calendar and production hardening.

**Deliverables**:
- [ ] Google Calendar OAuth flow for doctors
- [ ] `GoogleCalendarSyncAdapter` implementation
- [ ] Calendar sync worker: syncs confirmed appointments to doctor's Google Calendar
- [ ] Cancellation removes the Google Calendar event
- [ ] Rate limiting (Redis-backed, per-IP, per-endpoint group)
- [ ] Request logging with structured JSON output
- [ ] Helmet.js security headers
- [ ] OpenAPI/Swagger documentation at `/api/docs`
- [ ] API response envelope standardization (`{ data, error, meta }`)

**Independently testable**: Confirmed appointments appear in the doctor's Google Calendar. API documentation is browsable.

---

### Phase 8: Testing, Optimization & Deployment (Estimated: 1-2 weeks)

**Goal**: Production-ready quality and deployment.

**Deliverables**:
- [ ] E2E tests with Playwright (critical paths: patient booking flow, doctor confirmation flow)
- [ ] Multi-tenant isolation tests (verify clinic A cannot see clinic B data)
- [ ] Performance testing: verify < 200ms slot fetch (cached), < 400ms booking
- [ ] Load testing: verify 300 concurrent users
- [ ] Production Dockerfiles (API + Web)
- [ ] Production docker-compose with nginx reverse proxy
- [ ] GitHub Actions CI/CD pipeline
- [ ] Database migration strategy for production (run before deploy)
- [ ] Environment-specific configuration validation
- [ ] Health check endpoint with dependency status (DB, Redis)
- [ ] Graceful shutdown handling
- [ ] Error monitoring setup (e.g., Sentry)
- [ ] Final security audit (dependency audit, CORS, rate limits, input validation)

**Independently testable**: The full application runs in Docker containers. CI pipeline passes. E2E tests pass. The system handles the target load.

---

## Appendix A: Shared Package

```
packages/shared/src/
├── constants/
│   ├── appointment-status.ts    # Re-exports from domain (for frontend use)
│   ├── user-roles.ts
│   └── http-status.ts
├── types/
│   ├── api-response.ts          # { data?: T; error?: string; meta?: object }
│   ├── pagination.ts            # { page: number; limit: number; total: number }
│   └── tenant-context.ts        # { clinicId: string }
├── utils/
│   ├── date.utils.ts            # Timezone-safe date helpers (Europe/Berlin)
│   └── id.utils.ts              # UUID generation wrapper
└── index.ts
```

## Appendix B: Testing Strategy Details

```
Unit Tests (Vitest):
  - packages/domain: State machine, value objects, entity business logic
    Target: 100% coverage on state machine, >90% on domain layer
  - packages/application: Use cases (mocked ports), slot generator service
  - packages/infrastructure: Repository queries (against test DB), adapters

Integration Tests (Vitest + Test DB):
  - Full API endpoint tests via supertest
  - Database operations through TypeORM
  - Redis caching behavior
  - BullMQ job enqueueing

E2E Tests (Playwright):
  - Patient registration and login
  - Slot browsing and appointment booking
  - Appointment cancellation
  - Doctor appointment management (confirm, complete, no-show)
  - Admin doctor creation
  - Multi-tenant isolation (cannot access other clinic's data)
```

## Appendix C: Key Technical Notes

1. **Timezone handling**: All timestamps stored as `TIMESTAMP WITH TIME ZONE` in UTC. The clinic entity has a `timezone` field (default: `Europe/Berlin`). Conversion to local time happens on the frontend using the clinic's timezone. The slot generator operates in the clinic's local timezone when interpreting availability rules.

2. **UUID generation**: Use `crypto.randomUUID()` (Node.js built-in) in the domain layer for ID generation. This keeps the domain free of external dependencies. In PostgreSQL, `gen_random_uuid()` is available as a default.

3. **TypeORM vs Domain entities**: TypeORM entities (in `packages/infrastructure`) are distinct from domain entities (in `packages/domain`). Mappers bridge the two. This keeps the domain layer pure and free of decorator metadata. The tradeoff is additional mapping code, but it preserves clean architecture boundaries.

4. **BullMQ as event bus**: Domain events are published to a BullMQ queue rather than an in-process event emitter. This provides durability (events survive process crashes), retry semantics, and the ability to scale workers independently.

5. **Cache key conventions**: All cache keys follow the pattern `{resource}:{clinicId}:{identifier}:{qualifier}`. Example: `slots:clinic-123:doctor-456:2026-03-15`. Cache invalidation uses pattern deletion: `slots:clinic-123:doctor-456:*`.
