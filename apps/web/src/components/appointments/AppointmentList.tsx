import type { Appointment } from "@/types/api.types";
import { AppointmentCard } from "./AppointmentCard";
import { Button } from "@/components/ui/button";

interface AppointmentListProps {
  appointments: Appointment[];
  onSelect?: (id: string) => void;
  doctorNames?: Record<string, string>;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function AppointmentList({
  appointments,
  onSelect,
  doctorNames,
  page,
  totalPages,
  onPageChange,
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No appointments found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {appointments.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            onClick={onSelect ? () => onSelect(apt.id) : undefined}
            showDoctor={!!doctorNames}
            doctorName={doctorNames?.[apt.doctorId]}
          />
        ))}
      </div>

      {page !== undefined &&
        totalPages !== undefined &&
        totalPages > 1 &&
        onPageChange && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
    </div>
  );
}
