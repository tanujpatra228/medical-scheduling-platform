import { useMemo, useState } from "react";
import { format } from "date-fns";
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
import { formatTimeRange } from "@/lib/date-utils";
import type { Appointment, AppointmentStatus } from "@/types/api.types";

const appointmentColumns: ColumnDef<Appointment, unknown>[] = [
  {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => row.original.patientName ?? row.original.patientId,
  },
  {
    id: "doctor",
    header: "Doctor",
    cell: ({ row }) => row.original.doctorName ?? row.original.doctorId,
  },
  {
    accessorKey: "startsAt",
    header: "Date",
    cell: ({ getValue }) => format(new Date(getValue<string>()), "MMM d, yyyy"),
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => formatTimeRange(row.original.startsAt, row.original.endsAt),
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

  const [todayStart, todayEnd] = useMemo(() => {
    const now = new Date();
    return [
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString(),
    ];
  }, []);

  const todayFormatted = useMemo(() => format(new Date(), "EEEE, MMMM d, yyyy"), []);

  const { data: todayApts, isLoading: aptsLoading } = useAppointments({
    fromDate: todayStart,
    toDate: todayEnd,
    limit: 100,
  });

  const { data: docsData, isLoading: docsLoading } = useDoctors(1, 1);

  const { todayTotal, pending, completed } = useMemo(() => {
    const apts = todayApts?.data ?? [];
    return {
      todayTotal: todayApts?.meta?.total ?? apts.length,
      pending: apts.filter((a) => a.status === "PENDING").length,
      completed: apts.filter((a) => a.status === "COMPLETED").length,
    };
  }, [todayApts]);

  const doctorCount = docsData?.meta?.total ?? 0;

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
          Welcome, {user?.firstName} &middot; {todayFormatted}
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
                <p className="text-3xl font-bold">{doctorCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{todayTotal}</p>
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
