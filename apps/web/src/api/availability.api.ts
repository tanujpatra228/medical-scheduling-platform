import { apiRequest } from "./client";
import type { ApiSuccess, Slot } from "@/types/api.types";

export function getAvailableSlots(
  doctorId: string,
  from: string,
  to: string,
) {
  const search = new URLSearchParams({ from, to });
  return apiRequest<ApiSuccess<Slot[]>>(
    `/doctors/${doctorId}/slots?${search.toString()}`,
  );
}
