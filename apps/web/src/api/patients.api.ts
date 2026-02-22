import { apiRequest } from "./client";
import type { ApiSuccess, Patient } from "@/types/api.types";

export function getPatientProfile() {
  return apiRequest<ApiSuccess<Patient>>("/patients/me");
}

interface UpdatePatientParams {
  dateOfBirth?: string;
  insuranceNumber?: string;
  notes?: string;
}

export function updatePatientProfile(params: UpdatePatientParams) {
  return apiRequest<ApiSuccess<Patient>>("/patients/me", {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}
