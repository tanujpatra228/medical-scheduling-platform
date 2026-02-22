import { format } from "date-fns";
import { Clock, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type { Appointment } from "@/types/api.types";

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  showDoctor?: boolean;
  doctorName?: string;
}

export function AppointmentCard({
  appointment,
  onClick,
  showDoctor,
  doctorName,
}: AppointmentCardProps) {
  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);

  return (
    <Card
      className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {format(start, "EEE, MMM d, yyyy")}
        </CardTitle>
        <AppointmentStatusBadge status={appointment.status} />
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {format(start, "HH:mm")} – {format(end, "HH:mm")}
        </div>
        {showDoctor && doctorName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Dr. {doctorName}
          </div>
        )}
        {appointment.reason && (
          <p className="text-sm text-muted-foreground">
            {appointment.reason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
