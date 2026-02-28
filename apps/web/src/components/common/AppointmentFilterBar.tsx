import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPOINTMENT_STATUSES } from "@/lib/appointment-constants";
import type { AppointmentFilters } from "@/hooks/use-appointment-filters";
import type { Doctor } from "@/types/api.types";

const ALL_STATUSES_VALUE = "__all__";

interface AppointmentFilterBarProps {
  filters: AppointmentFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<AppointmentFilters>>;
  onReset: () => void;
  showDoctorFilter?: boolean;
  doctors?: Doctor[];
}

export function AppointmentFilterBar({
  filters,
  onFiltersChange,
  onReset,
  showDoctorFilter = false,
  doctors = [],
}: AppointmentFilterBarProps) {
  const updateFilter = <K extends keyof AppointmentFilters>(
    key: K,
    value: AppointmentFilters[K],
  ) => {
    onFiltersChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        value={filters.status || ALL_STATUSES_VALUE}
        onValueChange={(v) =>
          updateFilter("status", v === ALL_STATUSES_VALUE ? "" : v)
        }
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

      <Input
        type="date"
        value={filters.fromDate}
        onChange={(e) => updateFilter("fromDate", e.target.value)}
        className="w-[160px]"
        aria-label="From date"
      />

      <Input
        type="date"
        value={filters.toDate}
        onChange={(e) => updateFilter("toDate", e.target.value)}
        className="w-[160px]"
        aria-label="To date"
      />

      {showDoctorFilter && (
        <Select
          value={filters.doctorId || ALL_STATUSES_VALUE}
          onValueChange={(v) =>
            updateFilter("doctorId", v === ALL_STATUSES_VALUE ? "" : v)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES_VALUE}>All Doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                Dr. {d.user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button variant="outline" size="sm" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
