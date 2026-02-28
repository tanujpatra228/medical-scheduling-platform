import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, CalendarCheck, CircleCheck } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { useAppointmentFilters } from "@/hooks/use-appointment-filters";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { StatCard } from "@/components/common/StatCard";
import { AppointmentFilterBar } from "@/components/common/AppointmentFilterBar";
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

  const todayDateStr = useMemo(() => {
    const now = new Date();
    return format(now, "yyyy-MM-dd");
  }, []);

  const todayFormatted = useMemo(() => format(new Date(), "EEEE, MMMM d, yyyy"), []);

  // Today's stats query (unaffected by filters)
  const { data: todayData } = useAppointments({
    fromDate: todayStart,
    toDate: todayEnd,
    limit: 100,
  });

  const { pending, confirmed, completed } = useMemo(() => {
    const apts = todayData?.data ?? [];
    return {
      pending: apts.filter((a) => a.status === "PENDING").length,
      confirmed: apts.filter((a) => a.status === "CONFIRMED").length,
      completed: apts.filter((a) => a.status === "COMPLETED").length,
    };
  }, [todayData]);

  // Filtered appointments table
  const { filters, setFilters, resetFilters, queryParams } = useAppointmentFilters({
    fromDate: todayDateStr,
    toDate: todayDateStr,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [queryParams.status, queryParams.fromDate, queryParams.toDate]);

  const { data, isLoading } = useAppointments({
    ...queryParams,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const appointments = data?.data ?? [];
  const meta = data?.meta;
  const pageCount = meta?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Appointment, unknown>[]>(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => row.original.patientName ?? row.original.patientId,
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
        <StatCard title="Pending" value={pending} icon={Clock} />
        <StatCard title="Confirmed" value={confirmed} icon={CalendarCheck} />
        <StatCard title="Completed" value={completed} icon={CircleCheck} />
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AppointmentFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
          />
          <DataTable
            columns={columns}
            data={appointments}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyMessage="No appointments scheduled for today."
          />
        </CardContent>
      </Card>
    </div>
  );
}
