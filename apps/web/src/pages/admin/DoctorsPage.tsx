import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type PaginationState } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/common/DataTable";
import { useDoctors } from "@/hooks/use-doctors";
import type { Doctor } from "@/types/api.types";

const columns: ColumnDef<Doctor, unknown>[] = [
  {
    accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
    id: "name",
    header: "Name",
  },
  {
    accessorFn: (row) => row.user.email,
    id: "email",
    header: "Email",
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
  },
  {
    accessorKey: "slotDurationMin",
    header: "Slot Duration",
    cell: ({ getValue }) => `${getValue<number>()} min`,
  },
];

export function AdminDoctorsPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useDoctors(
    pagination.pageIndex + 1,
    pagination.pageSize
  );

  const doctors = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <Button onClick={() => navigate("/admin/doctors/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={doctors}
        pageCount={meta?.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={isLoading}
        emptyMessage="No doctors registered yet."
      />
    </div>
  );
}
