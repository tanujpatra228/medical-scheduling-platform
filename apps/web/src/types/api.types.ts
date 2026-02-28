// ── User & Auth ──────────────────────────────────────────────

export type UserRole = "CLINIC_ADMIN" | "DOCTOR" | "PATIENT";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clinicId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ── Clinic ───────────────────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
}

// ── Doctor ───────────────────────────────────────────────────

export interface DoctorUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  clinicId: string;
  specialization: string;
  slotDurationMin: number;
  maxDailyAppointments: number | null;
  user: DoctorUser;
}

// ── Patient ──────────────────────────────────────────────────

export interface Patient {
  id: string;
  userId: string;
  clinicId: string;
  dateOfBirth?: string;
  insuranceNumber?: string;
  notes?: string;
}

// ── Appointment ──────────────────────────────────────────────

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  reason?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  doctorName?: string;
}

// ── Availability / Slots ─────────────────────────────────────

export interface Slot {
  startsAt: string;
  endsAt: string;
  isAvailable: boolean;
}

// ── Pagination ───────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API Envelope ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── List response helper ─────────────────────────────────────

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}
