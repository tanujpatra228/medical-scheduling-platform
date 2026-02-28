import { apiRequest } from "./client";
import type { ApiSuccess, Doctor, PaginatedData } from "@/types/api.types";

interface ListDoctorsParams {
  page?: number;
  limit?: number;
}

export function listDoctors(params: ListDoctorsParams = {}) {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiRequest<ApiSuccess<Doctor[]> & { meta: PaginatedData<Doctor>["meta"] }>(
    `/doctors${qs ? `?${qs}` : ""}`,
  );
}

export function getDoctor(doctorId: string) {
  return apiRequest<ApiSuccess<Doctor>>(`/doctors/${doctorId}`);
}

interface CreateDoctorParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specialization: string;
  slotDurationMin: number;
  maxDailyAppointments?: number;
}

export function createDoctor(params: CreateDoctorParams) {
  return apiRequest<ApiSuccess<Doctor>>("/doctors", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface UpdateDoctorParams {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialization?: string;
  slotDurationMin?: number;
  maxDailyAppointments?: number;
}

export function updateDoctor(doctorId: string, params: UpdateDoctorParams) {
  return apiRequest<ApiSuccess<Doctor>>(`/doctors/${doctorId}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}
