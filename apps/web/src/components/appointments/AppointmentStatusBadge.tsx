import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/types/api.types";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants";

const STATUS_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  NO_SHOW: "destructive",
};

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
}

export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
