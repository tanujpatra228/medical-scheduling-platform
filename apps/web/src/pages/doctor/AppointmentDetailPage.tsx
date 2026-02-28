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
import {
  useAppointment,
  useConfirmAppointment,
  useCancelAppointment,
  useCompleteAppointment,
} from "@/hooks/use-appointments";

export function DoctorAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAppointment(id!);
  const confirmMutation = useConfirmAppointment();
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();

  const appointment = data?.data;

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

  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const isPending = appointment.status === "PENDING";
  const isConfirmed = appointment.status === "CONFIRMED";
  const canCancel = isPending || isConfirmed;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
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
            <div>
              <span className="text-muted-foreground">Patient</span>
              <p className="font-medium">
                {appointment.patientName ?? appointment.patientId}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium">{appointment.status}</p>
            </div>
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

          <div className="flex gap-2">
            {isPending && (
              <Button
                onClick={() => confirmMutation.mutate(appointment.id)}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? "Confirming..." : "Confirm"}
              </Button>
            )}
            {isConfirmed && (
              <Button
                onClick={() => completeMutation.mutate(appointment.id)}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending
                  ? "Completing..."
                  : "Mark Complete"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() =>
                  cancelMutation.mutate({ id: appointment.id })
                }
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
