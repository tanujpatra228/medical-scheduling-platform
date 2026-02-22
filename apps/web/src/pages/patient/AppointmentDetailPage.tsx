import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAppointment, useCancelAppointment } from "@/hooks/use-appointments";
import { useDoctor } from "@/hooks/use-doctors";

export function PatientAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: aptData, isLoading } = useAppointment(id!);
  const cancelMutation = useCancelAppointment();

  const appointment = aptData?.data;
  const { data: docData } = useDoctor(appointment?.doctorId ?? "");
  const doctor = docData?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!appointment) {
    return <p className="py-12 text-center">Appointment not found.</p>;
  }

  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  async function handleCancel() {
    await cancelMutation.mutateAsync({ id: appointment!.id });
    navigate("/patient");
  }

  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/patient")}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appointment Details</CardTitle>
          <AppointmentStatusBadge status={appointment.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Date</span>
              <p className="font-medium">
                {format(start, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Time</span>
              <p className="font-medium">
                {format(start, "HH:mm")} – {format(end, "HH:mm")}
              </p>
            </div>
            {doctor && (
              <div>
                <span className="text-muted-foreground">Doctor</span>
                <p className="font-medium">
                  Dr. {doctor.user.firstName} {doctor.user.lastName}
                </p>
              </div>
            )}
            {doctor && (
              <div>
                <span className="text-muted-foreground">Specialization</span>
                <p className="font-medium">{doctor.specialization}</p>
              </div>
            )}
          </div>

          {appointment.reason && (
            <div className="text-sm">
              <span className="text-muted-foreground">Reason</span>
              <p>{appointment.reason}</p>
            </div>
          )}

          {appointment.cancellationReason && (
            <div className="text-sm">
              <span className="text-muted-foreground">
                Cancellation Reason
              </span>
              <p>{appointment.cancellationReason}</p>
            </div>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? "Cancelling..."
                : "Cancel Appointment"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
