import { apiRequest } from "./client";
import type {
  ApiSuccess,
  Appointment,
  PaginationMeta,
} from "@/types/api.types";

interface ListAppointmentsParams {
  status?: string;
  doctorId?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export function listAppointments(params: ListAppointmentsParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.doctorId) search.set("doctorId", params.doctorId);
  if (params.patientId) search.set("patientId", params.patientId);
  if (params.fromDate) search.set("fromDate", params.fromDate);
  if (params.toDate) search.set("toDate", params.toDate);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiRequest<ApiSuccess<Appointment[]> & { meta: PaginationMeta }>(
    `/appointments${qs ? `?${qs}` : ""}`,
  );
}

export function getAppointment(id: string) {
  return apiRequest<ApiSuccess<Appointment>>(`/appointments/${id}`);
}

interface CreateAppointmentParams {
  doctorId: string;
  patientId?: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
}

export function createAppointment(params: CreateAppointmentParams) {
  return apiRequest<ApiSuccess<Appointment>>("/appointments", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function confirmAppointment(id: string) {
  return apiRequest<ApiSuccess<Appointment>>(`/appointments/${id}/confirm`, {
    method: "PATCH",
  });
}

export function cancelAppointment(id: string, reason?: string) {
  return apiRequest<ApiSuccess<Appointment>>(`/appointments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function completeAppointment(id: string) {
  return apiRequest<ApiSuccess<Appointment>>(`/appointments/${id}/complete`, {
    method: "PATCH",
  });
}
