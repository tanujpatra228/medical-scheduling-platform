import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTimeRange } from "@/lib/date-utils";
import type { Appointment } from "@/types/api.types";

const DEFAULT_PAGE_SIZE = 20;

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}\u2026` : id;
}

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todayStart, todayEnd] = useMemo(() => {
    const now = new Date();
    return [
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString(),
    ];
  }, []);

  const todayFormatted = useMemo(() => format(new Date(), "EEEE, MMMM d, yyyy"), []);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const { data, isLoading } = useAppointments({
    fromDate: todayStart,
    toDate: todayEnd,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const appointments = data?.data ?? [];
  const meta = data?.meta;
  const pageCount = meta?.totalPages ?? 0;

  const { pending, confirmed, completed } = useMemo(() => ({
    pending: appointments.filter((a) => a.status === "PENDING"),
    confirmed: appointments.filter((a) => a.status === "CONFIRMED"),
    completed: appointments.filter((a) => a.status === "COMPLETED"),
  }), [appointments]);

  const columns = useMemo<ColumnDef<Appointment, unknown>[]>(
    () => [
      {
        accessorKey: "patientId",
        header: "Patient",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs" title={getValue<string>()}>
            {truncateId(getValue<string>())}
          </span>
        ),
      },
      {
        id: "time",
        header: "Time",
        cell: ({ row }) =>
          formatTimeRange(row.original.startsAt, row.original.endsAt),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <AppointmentStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/doctor/appointments/${row.original.id}`)
            }
          >
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, Dr. {user?.lastName}
        </h1>
        <p className="text-muted-foreground">{todayFormatted}</p>
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
          Today&apos;s Appointments
        </h2>
        <DataTable
          columns={columns}
          data={appointments}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          emptyMessage="No appointments scheduled for today."
        />
      </section>
    </div>
  );
}
