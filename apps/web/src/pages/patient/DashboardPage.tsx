import { useNavigate } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { useDoctors } from "@/hooks/use-doctors";

export function PatientDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // We need the patient profile to get patientId.
  // The user object has the userId, but appointments filter by patientId.
  // For now, fetch all appointments (the API scopes by clinic + auth).
  const { data: aptsData, isLoading: aptsLoading } = useAppointments({
    limit: 50,
  });

  const { data: docsData } = useDoctors(1, 100);

  const appointments = aptsData?.data ?? [];
  const doctors = docsData?.data ?? [];

  // Build doctor name lookup
  const doctorNames: Record<string, string> = {};
  for (const doc of doctors) {
    doctorNames[doc.id] = `${doc.user.firstName} ${doc.user.lastName}`;
  }

  // Split into upcoming vs past
  const now = new Date().toISOString();
  const upcoming = appointments
    .filter((a) => a.startsAt >= now && a.status !== "CANCELLED")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const past = appointments
    .filter((a) => a.startsAt < now || a.status === "CANCELLED")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user?.firstName}
          </h1>
          <p className="text-muted-foreground">Manage your appointments</p>
        </div>
        <Button onClick={() => navigate("/patient/book")}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {aptsLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Upcoming Appointments ({upcoming.length})
            </h2>
            <AppointmentList
              appointments={upcoming}
              onSelect={(id) => navigate(`/patient/appointments/${id}`)}
              doctorNames={doctorNames}
            />
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Past Appointments</h2>
              <AppointmentList
                appointments={past.slice(0, 6)}
                onSelect={(id) => navigate(`/patient/appointments/${id}`)}
                doctorNames={doctorNames}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
