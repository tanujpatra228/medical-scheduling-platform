# Medical Scheduling Platform – MVP

A multi-tenant, event-driven medical appointment scheduling platform built for the German healthcare market.

This system delivers:

- A frictionless patient booking experience
- Operational efficiency for clinics and doctors
- Deterministic appointment lifecycle management
- GDPR-compliant data handling by design
- A scalable architecture ready for 10x growth

---

# Business Overview

This platform enables independent clinics to manage scheduling digitally while maintaining strict control, auditability, and operational clarity.

The system is built multi-tenant from day one, even if launched initially with a single pilot clinic.

---

# Core Business Features

## Appointment Management

- End-to-end booking workflow
- Deterministic appointment state machine
- Automatic NO_SHOW handling
- Manual state override (authorized roles only)
- Full audit logging of state transitions
- Timezone-safe scheduling (Europe/Berlin)

---

## Appointment Lifecycle States

- `PENDING`
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`

Invalid state transitions are programmatically blocked at the domain layer.

Every transition:

- Emits a domain event
- Persists an audit log entry
- Triggers asynchronous side effects
- Invalidates relevant cache entries

---

## Internal Calendar Engine

The platform includes a proprietary scheduling engine.

- Weekly recurring availability rules
- Custom availability overrides
- Configurable slot durations per doctor
- Real-time slot generation
- Redis-backed slot caching
- One-way Google Calendar sync for confirmed appointments only

The internal engine is the source of truth.

---

## Multi-Tenant Architecture

- Supports multiple independent clinics
- All relevant tables include `clinic_id`
- Logical data isolation
- Horizontally scalable design

---

## Role-Based Access Control

Static roles in MVP:

- `PATIENT`
- `DOCTOR`
- `CLINIC_ADMIN`

Permissions enforced at the application layer.

---

## Automated Communications

- Confirmation emails
- Cancellation emails
- 24-hour reminder emails
- Event-driven reminder scheduling

---

## Audit & Compliance

- Immutable audit logs for appointment state changes
- EU-based hosting
- Data encrypted in transit
- Secure password hashing (Argon2)
- GDPR-ready data structure

---

# Architecture Overview

The system follows strict Clean Architecture principles.

## Layer Separation

- **Domain Layer**  
  Entities, aggregates, state machine, business rules

- **Application Layer**  
  Use cases, DTOs, ports

- **Infrastructure Layer**  
  Database, Redis, email provider, Google sync, repositories

- **API Layer**  
  Thin Express controllers

- **Frontend**  
  Pure UI components, no business logic

No business logic exists in controllers or React components.

---

# Tech Stack

## Backend

- Node.js
- Express.js (TypeScript)
- PostgreSQL
- Redis
- JWT Authentication
- Zod (validation)
- BullMQ (background jobs)
- OpenAPI 3.0 specification

---

## Frontend

- Vite
- React
- React Router
- TanStack Query
- TailwindCSS
- Accessible UI components

Responsive across mobile, tablet, and desktop.

---

## Data Layer

### PostgreSQL

- Normalized schema
- Indexed foreign keys
- Multi-tenant design
- Strict constraints

### Redis

Used for:

- Slot caching
- Rate limiting
- Background job queues
- Session handling
- Reminder scheduling

---

# API Structure

Base path: /api/v1


Example endpoints:
POST /auth/login
GET /doctors/:id/slots
POST /appointments
PATCH /appointments/:id/cancel
PATCH /appointments/:id/complete


Controllers remain thin. All business logic resides in use cases.

---

# Appointment State Machine

Valid transitions:
PENDING → CONFIRMED
CONFIRMED → CANCELLED
CONFIRMED → COMPLETED
CONFIRMED → NO_SHOW


Invalid transitions are rejected at the domain level.

---

# Background Jobs

Redis-backed job queue handles:

- 24-hour reminder emails
- Automatic NO_SHOW transitions
- Email dispatching
- Event-based side effects

No polling-based cron scanning.

---

# Performance Targets

- 300 concurrent users
- 1,000 appointments per day
- < 200ms slot fetch (cached)
- < 400ms booking transaction
- Scalable to 10x without architectural changes

---

# Deployment

## Infrastructure

- EU-based VPS
- Dockerized services
- Nginx reverse proxy
- HTTPS via Let's Encrypt
- GitHub Actions CI/CD

---

## Containers

- `api`
- `web`
- `postgres`
- `redis`
- `nginx`

---

# CI/CD Flow

1. Push to main branch
2. Tests executed
3. Docker images built
4. Images deployed to VPS
5. Containers restarted automatically

No manual production changes.

---

# Testing Strategy

- Unit tests for domain logic
- 100% coverage for state machine transitions
- Integration tests for booking flow
- E2E critical path tests (Playwright)
- Multi-tenant isolation testing

---

# Local Development

## Prerequisites

- Node 20+
- Docker
- Docker Compose

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

## Project Structure
```bash
apps/
  api/
  web/

packages/
  domain/
  application/
  infrastructure/
  shared/
```
Strict layer boundaries must be respected.
