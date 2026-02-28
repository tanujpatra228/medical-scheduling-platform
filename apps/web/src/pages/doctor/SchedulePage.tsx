import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { useAppointments } from "@/hooks/use-appointments";
import { formatTimeRange } from "@/lib/date-utils";
import { APPOINTMENT_STATUSES } from "@/lib/appointment-constants";
import type { Appointment } from "@/types/api.types";

const DEFAULT_PAGE_SIZE = 20;
const DAYS_IN_WEEK = 7;
const ALL_STATUSES_VALUE = "__all__";

export function DoctorSchedulePage() {
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const [statusFilter, setStatusFilter] = useState("");

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const { data, isLoading } = useAppointments({
    fromDate: weekStart.toISOString(),
    toDate: weekEnd.toISOString(),
    status: statusFilter || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const appointments = data?.data ?? [];
  const meta = data?.meta;
  const pageCount = meta?.totalPages ?? 0;

  const navigateToPreviousWeek = () => {
    setWeekStart((d) => addDays(d, -DAYS_IN_WEEK));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const navigateToNextWeek = () => {
    setWeekStart((d) => addDays(d, DAYS_IN_WEEK));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const columns = useMemo<ColumnDef<Appointment, unknown>[]>(
    () => [
      {
        id: "day",
        header: "Day",
        cell: ({ row }) =>
          format(new Date(row.original.startsAt), "EEE, MMM d"),
      },
      {
        id: "time",
        header: "Time",
        cell: ({ row }) =>
          formatTimeRange(row.original.startsAt, row.original.endsAt),
      },
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => row.original.patientName ?? row.original.patientId,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToPreviousWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, "MMM d")} &ndash;{" "}
            {format(weekEnd, "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToNextWeek}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Appointments</CardTitle>
          <Select
            value={statusFilter || ALL_STATUSES_VALUE}
            onValueChange={(v) => {
              setStatusFilter(v === ALL_STATUSES_VALUE ? "" : v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES_VALUE}>All Statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={appointments}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyMessage="No appointments scheduled for this week."
          />
        </CardContent>
      </Card>
    </div>
  );
}
