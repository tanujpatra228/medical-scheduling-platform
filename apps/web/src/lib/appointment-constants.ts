import type { AppointmentStatus } from "@/types/api.types";

interface StatusOption {
  value: AppointmentStatus;
  label: string;
}

export const APPOINTMENT_STATUSES: StatusOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];
