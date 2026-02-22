import { apiRequest } from "./client";
import type { ApiSuccess, Clinic } from "@/types/api.types";

export function getClinic() {
  return apiRequest<ApiSuccess<Clinic>>("/clinics/me");
}

interface UpdateClinicParams {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
}

export function updateClinic(params: UpdateClinicParams) {
  return apiRequest<ApiSuccess<Clinic>>("/clinics/me", {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}
