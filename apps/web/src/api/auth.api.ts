import { apiRequest } from "./client";
import type { ApiSuccess, AuthResponse, RefreshResponse } from "@/types/api.types";

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  clinicId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  insuranceNumber?: string;
}

export function login(params: LoginParams) {
  return apiRequest<ApiSuccess<AuthResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function register(params: RegisterParams) {
  return apiRequest<ApiSuccess<AuthResponse>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function refreshToken(refreshToken: string) {
  return apiRequest<ApiSuccess<RefreshResponse>>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
