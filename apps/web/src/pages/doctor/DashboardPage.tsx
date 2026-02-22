import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const { data, isLoading } = useAppointments({
    fromDate: startOfDay(today).toISOString(),
    toDate: endOfDay(today).toISOString(),
    limit: 50,
  });

  const appointments = (data?.data ?? []).sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );

  const pending = appointments.filter((a) => a.status === "PENDING");
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED");
  const completed = appointments.filter((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, Dr. {user?.lastName}
        </h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{confirmed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Today's Appointments ({appointments.length})
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : appointments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No appointments scheduled for today.
          </p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">
                      {format(new Date(apt.startsAt), "HH:mm")} –{" "}
                      {format(new Date(apt.endsAt), "HH:mm")}
                    </div>
                    <AppointmentStatusBadge status={apt.status} />
                    {apt.reason && (
                      <span className="text-sm text-muted-foreground">
                        {apt.reason}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/doctor/appointments/${apt.id}`)
                    }
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
