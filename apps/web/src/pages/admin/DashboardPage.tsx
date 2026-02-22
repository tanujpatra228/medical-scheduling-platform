import { format, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { useDoctors } from "@/hooks/use-doctors";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";

export function AdminDashboardPage() {
  const { user } = useAuth();
  const today = new Date();

  const { data: todayApts, isLoading: aptsLoading } = useAppointments({
    fromDate: startOfDay(today).toISOString(),
    toDate: endOfDay(today).toISOString(),
    limit: 100,
  });

  const { data: docsData, isLoading: docsLoading } = useDoctors(1, 100);

  const appointments = todayApts?.data ?? [];
  const doctors = docsData?.data ?? [];

  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;

  const isLoading = aptsLoading || docsLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.firstName} &middot;{" "}
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{doctors.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{appointments.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{completed}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Today's Activity
            </h2>
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No appointments today.
              </p>
            ) : (
              <div className="space-y-2">
                {appointments
                  .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                  .slice(0, 10)
                  .map((apt) => {
                    const doc = doctors.find((d) => d.id === apt.doctorId);
                    return (
                      <Card key={apt.id}>
                        <CardContent className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              {format(new Date(apt.startsAt), "HH:mm")}
                            </span>
                            {doc && (
                              <span className="text-sm text-muted-foreground">
                                Dr. {doc.user.lastName}
                              </span>
                            )}
                            <AppointmentStatusBadge status={apt.status} />
                          </div>
                          {apt.reason && (
                            <span className="text-sm text-muted-foreground">
                              {apt.reason}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
