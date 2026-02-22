import type { AppointmentStatus, UserRole } from "@/types/api.types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export const DEFAULT_CLINIC_ID =
  import.meta.env.VITE_DEFAULT_CLINIC_ID ??
  "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CLINIC_ADMIN: "Admin",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
