import { useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { type PaginationState } from "@tanstack/react-table";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { useDoctors } from "@/hooks/use-doctors";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DataTable, type ColumnDef } from "@/components/common/DataTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import type { Appointment, AppointmentStatus } from "@/types/api.types";

const appointmentColumns: ColumnDef<Appointment, unknown>[] = [
  {
    accessorKey: "patientId",
    header: "Patient",
  },
  {
    accessorKey: "doctorId",
    header: "Doctor",
  },
  {
    accessorKey: "startsAt",
    header: "Date",
    cell: ({ getValue }) => format(new Date(getValue<string>()), "MMM d, yyyy"),
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => {
      const startsAt = new Date(row.original.startsAt);
      const endsAt = new Date(row.original.endsAt);
      return `${format(startsAt, "HH:mm")} \u2013 ${format(endsAt, "HH:mm")}`;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <AppointmentStatusBadge status={getValue<AppointmentStatus>()} />
    ),
  },
];

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

  // Recent appointments table with its own pagination
  const [recentPagination, setRecentPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: recentData, isLoading: recentLoading } = useAppointments({
    page: recentPagination.pageIndex + 1,
    limit: recentPagination.pageSize,
  });

  const recentAppointments = recentData?.data ?? [];
  const recentMeta = recentData?.meta;

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

          {/* Recent Appointments */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Recent Appointments
            </h2>
            <DataTable
              columns={appointmentColumns}
              data={recentAppointments}
              pageCount={recentMeta?.totalPages ?? 0}
              pagination={recentPagination}
              onPaginationChange={setRecentPagination}
              isLoading={recentLoading}
              emptyMessage="No appointments found."
            />
          </section>
        </>
      )}
    </div>
  );
}
